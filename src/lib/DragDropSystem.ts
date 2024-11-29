import { DropResult } from 'react-beautiful-dnd';
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

    if (type === 'CARD') {
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

      // Update source card
      const sourceCardRef = doc(db, `users/${userId}/boards/${boardId}/cards`, sourceCard.id);
      batch.update(sourceCardRef, { tasks: sourceTasks });

      // Update destination card if different from source
      if (source.droppableId !== destination.droppableId) {
        const destCardRef = doc(db, `users/${userId}/boards/${boardId}/cards`, destCard.id);
        batch.update(destCardRef, { tasks: destTasks });
      }

      await batch.commit();

      // Update local state
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
