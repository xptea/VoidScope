import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, DropResult } from 'react-beautiful-dnd';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import List from './List';

interface CardType {
  id: string;
  title: string;
  description: string;
}

interface ListType {
  id: string;
  title: string;
  cards: CardType[];
  order: number;
}

const Board: React.FC = () => {
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [lists, setLists] = useState<ListType[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const initializeUser = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { email: user.email }, { merge: true });
    };
    initializeUser();
    const listsRef = collection(db, `users/${user.uid}/lists`);
    const q = query(listsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const listsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as ListType[];
      
      setLists(listsData.sort((a, b) => a.order - b.order));
    });
    return unsubscribe;
  }, [user]);

  const addList = async () => {
    if (!user) return;
    const listsRef = collection(db, `users/${user.uid}/lists`);
    await addDoc(listsRef, {
      title: 'New List',
      cards: [],
      order: lists.length
    });
  };
  const deleteList = async (listId: string) => {
    if (!user) return;
    const listRef = doc(db, `users/${user.uid}/lists`, listId);
    await deleteDoc(listRef);
  };
  const updateList = async (listId: string, newTitle: string) => {
    if (!user) return;
    const listRef = doc(db, `users/${user.uid}/lists`, listId);
    await updateDoc(listRef, { title: newTitle });
  };
  const addCard = async (listId: string) => {
    if (!user) return;

    const listRef = doc(db, `users/${user.uid}/lists`, listId);
    const list = lists.find(l => l.id === listId);
    if (!list) return;
    const newCard = {
      id: `card-${Date.now()}`,
      title: 'New Card',
      description: 'Description'
    };
    await updateDoc(listRef, {
      cards: [...list.cards, newCard]
    });
  };
  const updateCard = async (listId: string, cardId: string, updates: Partial<CardType>) => {
    if (!user) return;
    const listRef = doc(db, `users/${user.uid}/lists`, listId);
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const updatedCards = list.cards.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    );

    await updateDoc(listRef, { cards: updatedCards });
  };

  const deleteCard = async (listId: string, cardId: string) => {
    if (!user) return;

    const listRef = doc(db, `users/${user.uid}/lists`, listId);
    const list = lists.find(l => l.id === listId);
    if (!list) return;

    const updatedCards = list.cards.filter(card => card.id !== cardId);
    await updateDoc(listRef, { cards: updatedCards });
  };

  const updateListOrder = async (newLists: ListType[]) => {
    if (!user) return;

    const batch = writeBatch(db);
    newLists.forEach((list, index) => {
      const listRef = doc(db, `users/${user.uid}/lists`, list.id);
      batch.update(listRef, { order: index });
    });
    await batch.commit();
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    
    if (!destination) return;

    if (destination.droppableId === source.droppableId && 
        destination.index === source.index) {
      return;
    }

    if (type === 'LIST') {
      const items = Array.from(lists);
      const [reorderedItem] = items.splice(source.index, 1);
      items.splice(destination.index, 0, reorderedItem);
      setLists(items);
      await updateListOrder(items);
      return;
    }

    const sourceList = lists.find(list => list.id === source.droppableId);
    const destList = lists.find(list => list.id === destination.droppableId);

    if (!sourceList || !destList) return;

    if (source.droppableId === destination.droppableId) {
      const newCards = Array.from(sourceList.cards);
      const [removedCard] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, removedCard);

      const newList = {
        ...sourceList,
        cards: newCards
      };

      const newLists = lists.map(list => 
        list.id === sourceList.id ? newList : list
      );

      setLists(newLists);
    } else {
      // Moving card to another list
      const sourceCards = Array.from(sourceList.cards);
      const [removedCard] = sourceCards.splice(source.index, 1);
      const destinationCards = Array.from(destList.cards);
      destinationCards.splice(destination.index, 0, removedCard);

      const newLists = lists.map(list => {
        if (list.id === source.droppableId) {
          return { ...list, cards: sourceCards };
        }
        if (list.id === destination.droppableId) {
          return { ...list, cards: destinationCards };
        }
        return list;
      });

      setLists(newLists);
    }
  };

  return (
    <div className="flex-1 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-medium text-white">Board Name</h2>
          <button
            onClick={() => setIsHorizontal(!isHorizontal)}
            className="text-[#666666] hover:text-white w-8 h-8 flex items-center justify-center transition-all duration-200 rounded-md hover:bg-[#1a1a1a]"
          >
            {isHorizontal ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M3 8h18M3 12h18M3 16h18M3 20h18" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className={`${
        isHorizontal ? 'flex overflow-x-auto pb-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
      }`}>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="all-lists" type="LIST" direction="vertical">
            {(provided) => (
              <div 
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="list-container"
              >
                {lists.map((list, index) => (
                  <List 
                    key={list.id}
                    id={list.id}
                    title={list.title}
                    index={index}
                    cards={list.cards}
                    onDelete={deleteList}
                    onUpdate={updateList}
                    onAdd={addCard}
                    onUpdateCard={updateCard}
                    onDeleteCard={deleteCard}
                    isHorizontal={isHorizontal} />
                ))}
                {provided.placeholder}
                <button className="btn w-full text-[#666666] hover:text-white text-center" onClick={addList}>
                  + Add List
                </button>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
};

export default Board;
