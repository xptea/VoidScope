import React, { useState } from 'react';
import { DropResult, DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface TaskType {
  id: string;
  title: string;
  description: string;
}

export interface CardType {
  id: string;
  title: string;
  tasks: TaskType[];
  order: number;
}

interface UseDragDropSystemProps {
  cards: CardType[];
  setCards: (cards: CardType[] | ((prevCards: CardType[]) => CardType[])) => void;
  userId: string;
  boardId: string;
}

export const useDragDropSystem = ({ cards, setCards, userId, boardId }: UseDragDropSystemProps) => {
  const updateCardOrder = async (newCards: CardType[]) => {
    if (!userId) return;

    const batch = writeBatch(db);
    newCards.forEach((card, index) => {
      const cardRef = doc(db, `users/${userId}/boards/${boardId}/cards`, card.id);
      batch.update(cardRef, { order: index });
    });
    await batch.commit();
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    
    if (!destination || !userId) return;

    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) {
      return;
    }

    if (type === 'LIST') {
      const newCards = Array.from(cards);
      const [moved] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, moved);

      setCards(newCards);
      await updateCardOrder(newCards);
      return;
    }

    if (type === 'TASK') {
      const sourceCardIndex = cards.findIndex(c => c.id === source.droppableId);
      const destCardIndex = cards.findIndex(c => c.id === destination.droppableId);

      if (sourceCardIndex === -1 || destCardIndex === -1) return;

      const sourceCard = cards[sourceCardIndex];
      const destCard = cards[destCardIndex];

      const sourceTasks = Array.from(sourceCard.tasks || []);
      const [movedTask] = sourceTasks.splice(source.index, 1);

      const destTasks =
        source.droppableId === destination.droppableId
          ? sourceTasks
          : Array.from(destCard.tasks || []);
      
      destTasks.splice(destination.index, 0, movedTask);

      const batch = writeBatch(db);

      const sourceCardRef = doc(db, `users/${userId}/boards/${boardId}/cards`, sourceCard.id);
      batch.update(sourceCardRef, { tasks: sourceTasks });

      if (source.droppableId !== destination.droppableId) {
        const destCardRef = doc(db, `users/${userId}/boards/${boardId}/cards`, destCard.id);
        batch.update(destCardRef, { tasks: destTasks });
      }

      await batch.commit();

      setCards(prevCards => {
        const newCards = Array.from(prevCards);
        newCards[sourceCardIndex] = { ...sourceCard, tasks: sourceTasks };
        if (source.droppableId !== destination.droppableId) {
          newCards[destCardIndex] = { ...destCard, tasks: destTasks };
        }
        return newCards;
      });
    }
  };

  return {
    onDragEnd,
  };
};
interface Column {
  id: string;
  title: string;
}

const initialColumns: Column[] = [
  { id: 'col-1', title: 'Column 1' },
  { id: 'col-2', title: 'Column 2' },
  { id: 'col-3', title: 'Column 3' },
];

export const HorizontalDragDropColumns: React.FC = () => {
  const [columns, setColumns] = useState<Column[]>(initialColumns);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const newColumns = Array.from(columns);
    const [removed] = newColumns.splice(result.source.index, 1);
    newColumns.splice(result.destination.index, 0, removed);
    setColumns(newColumns);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="columns" direction="horizontal">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{ display: 'flex', padding: 8, overflow: 'auto' }}
          >
            {columns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      userSelect: 'none',
                      padding: 16,
                      margin: '0 8px 0 0',
                      minHeight: '50px',
                      flexShrink: 0,
                      backgroundColor: snapshot.isDragging ? '#263B4A' : '#456C86',
                      color: 'white',
                      ...provided.draggableProps.style,
                    }}
                  >
                    {column.title}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
