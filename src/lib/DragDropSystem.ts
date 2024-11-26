import { DropResult } from 'react-beautiful-dnd';
import { doc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export interface CardType {
  id: string;
  title: string;
  description: string;
}

export interface ListType {
  id: string;
  title: string;
  cards: CardType[];
  order: number;
}

interface UseDragDropSystemProps {
  lists: ListType[];
  setLists: (lists: ListType[] | ((prevLists: ListType[]) => ListType[])) => void;
  userId: string;
  boardId: string;
}

export const useDragDropSystem = ({ lists, setLists, userId, boardId }: UseDragDropSystemProps) => {
  const updateListOrder = async (newLists: ListType[]) => {
    if (!userId) return;

    const batch = writeBatch(db);
    newLists.forEach((list, index) => {
      const listRef = doc(db, `users/${userId}/boards/${boardId}/cards`, list.id);
      batch.update(listRef, { order: index });
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
      const newLists = Array.from(lists);
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);

      setLists(newLists);
      await updateListOrder(newLists);
      return;
    }

    const sourceListIndex = lists.findIndex(l => l.id === source.droppableId);
    const destListIndex = lists.findIndex(l => l.id === destination.droppableId);

    if (sourceListIndex === -1 || destListIndex === -1) return;

    const sourceList = lists[sourceListIndex];
    const destList = lists[destListIndex];

    const sourceCards = Array.from(sourceList.cards);
    const [movedCard] = sourceCards.splice(source.index, 1);

    const destCards =
      source.droppableId === destination.droppableId
        ? sourceCards
        : Array.from(destList.cards);
    destCards.splice(destination.index, 0, movedCard);

    const batch = writeBatch(db);
    batch.update(
      doc(db, `users/${userId}/boards/${boardId}/cards`, sourceList.id),
      { cards: sourceCards }
    );
    if (source.droppableId !== destination.droppableId) {
      batch.update(
        doc(db, `users/${userId}/boards/${boardId}/cards`, destList.id),
        { cards: destCards }
      );
    }
    await batch.commit();

    setLists((prevLists: ListType[]) => {
      const newLists = Array.from(prevLists);
      newLists[sourceListIndex] = { ...sourceList, cards: sourceCards };
      if (source.droppableId !== destination.droppableId) {
        newLists[destListIndex] = { ...destList, cards: destCards };
      }
      return newLists;
    });
  };

  return {
    onDragEnd,
  };
};
