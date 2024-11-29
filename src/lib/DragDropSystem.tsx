import { DropResult } from 'react-beautiful-dnd';
import { doc, updateDoc } from 'firebase/firestore';
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

interface DragDropSystemProps {
  cards: CardType[];
  setCards: React.Dispatch<React.SetStateAction<CardType[]>>;
  userId: string;
  boardId: string;
}

export const useDragDropSystem = ({ cards, setCards, userId }: DragDropSystemProps) => {
  const reorder = (list: any[], startIndex: number, endIndex: number) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, type } = result;

    if (!destination) return;

    // If dropped in the same position
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // Handle list (column) reordering
    if (type === 'LIST') {
      const reorderedCards = reorder(
        cards,
        source.index,
        destination.index
      );

      // Update all affected cards with new order
      const updates = reorderedCards.map((card, index) => {
        const cardRef = doc(db, `users/${userId}/cards`, card.id);
        return updateDoc(cardRef, { order: index });
      });

      // Update state immediately for smooth UI
      setCards(reorderedCards);

      // Update database
      try {
        await Promise.all(updates);
      } catch (error) {
        console.error('Error updating card orders:', error);
        // Optionally revert the state if database update fails
      }
      return;
    }

    // Handle task reordering within a list
    if (type === 'TASK') {
      const sourceCard = cards.find(card => card.id === source.droppableId);
      const destCard = cards.find(card => card.id === destination.droppableId);

      if (!sourceCard || !destCard) return;

      const newCards = Array.from(cards);
      const sourceCardIndex = cards.findIndex(card => card.id === source.droppableId);
      const destCardIndex = cards.findIndex(card => card.id === destination.droppableId);

      if (source.droppableId === destination.droppableId) {
        // Reordering within the same list
        const reorderedTasks = reorder(
          sourceCard.tasks,
          source.index,
          destination.index
        );
        newCards[sourceCardIndex] = {
          ...sourceCard,
          tasks: reorderedTasks
        };
      } else {
        // Moving task between lists
        const [movedTask] = sourceCard.tasks.splice(source.index, 1);
        destCard.tasks.splice(destination.index, 0, movedTask);
        newCards[sourceCardIndex] = sourceCard;
        newCards[destCardIndex] = destCard;
      }

      // Update state
      setCards(newCards);

      // Update database
      try {
        if (source.droppableId === destination.droppableId) {
          const cardRef = doc(db, `users/${userId}/cards`, sourceCard.id);
          await updateDoc(cardRef, { tasks: newCards[sourceCardIndex].tasks });
        } else {
          const sourceRef = doc(db, `users/${userId}/cards`, sourceCard.id);
          const destRef = doc(db, `users/${userId}/cards`, destCard.id);
          await Promise.all([
            updateDoc(sourceRef, { tasks: sourceCard.tasks }),
            updateDoc(destRef, { tasks: destCard.tasks })
          ]);
        }
      } catch (error) {
        console.error('Error updating tasks:', error);
      }
    }
  };

  return { onDragEnd };
};
