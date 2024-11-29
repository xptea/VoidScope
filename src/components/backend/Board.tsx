import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import List from './Task';
import { useDragDropSystem, CardType, TaskType } from '../../lib/DragDropSystem';

const Board: React.FC = () => {
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [cards, setCards] = useState<CardType[]>([]);
  const { user } = useAuth();
  
  // Use the drag drop system hook
  const { onDragEnd } = useDragDropSystem({
    cards,
    setCards,
    userId: user?.uid || '',
    boardId: 'default'
  });

  useEffect(() => {
    if (!user) return;
    const initializeUser = async () => {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { email: user.email }, { merge: true });
    };
    initializeUser();
    const cardsRef = collection(db, `users/${user.uid}/cards`);
    const q = query(cardsRef);
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cardsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as CardType[];
      
      setCards(cardsData.sort((a, b) => a.order - b.order));
    });
    return unsubscribe;
  }, [user]);

  const addCard = async () => {
    if (!user) return;
    
    try {
      const cardsRef = collection(db, `users/${user.uid}/cards`);
      
      const newCard = {
        title: 'New Card',
        tasks: [],
        order: cards.length || 0,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(cardsRef, newCard);
      console.log('Card created with ID:', docRef.id);
    } catch (error) {
      console.error("Error adding card:", error);
    }
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
  const addCardToList = async (cardId: string) => {
    if (!user) return;

    const cardRef = doc(db, `users/${user.uid}/cards`, cardId);
    const card = cards.find((c: CardType) => c.id === cardId);
    if (!card) return;

    const newTask: TaskType = {
      id: `task-${Date.now()}`,
      title: 'New Task',
      description: 'Description'
    };

    await updateDoc(cardRef, {
      tasks: [...card.tasks, newTask]
    });
  };
  const updateCard = async (cardId: string, taskId: string, updates: Partial<TaskType>) => {
    if (!user) return;
    const cardRef = doc(db, `users/${user.uid}/cards`, cardId);
    const card = cards.find((c: CardType) => c.id === cardId);
    if (!card) return;

    const updatedTasks = card.tasks.map((task: TaskType) => 
      task.id === taskId ? { ...task, ...updates } : task
    );

    await updateDoc(cardRef, { tasks: updatedTasks });
  };

  const deleteCard = async (cardId: string, taskId: string) => {
    if (!user) return;

    const cardRef = doc(db, `users/${user.uid}/cards`, cardId);
    const card = cards.find((c: CardType) => c.id === cardId);
    if (!card) return;

    const updatedTasks = card.tasks.filter((task: TaskType) => task.id !== taskId);
    await updateDoc(cardRef, { tasks: updatedTasks });
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable 
          droppableId="all-lists" 
          type="LIST" 
          direction={isHorizontal ? "horizontal" : "vertical"}
        >
          {(provided, snapshot) => (
            <div 
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`list-container relative ${
                isHorizontal 
                  ? 'flex gap-4 overflow-x-auto pb-4' 
                  : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              } ${snapshot.isDraggingOver ? 'bg-blue-500/5' : ''}`}
              style={{
                minHeight: isHorizontal ? '500px' : undefined,
                display: isHorizontal ? 'flex' : 'grid',
                alignItems: 'flex-start',
                width: isHorizontal ? 'max-content' : '100%'  // Add this line
              }}
            >
              {cards.map((card: CardType, index: number) => (
                <List 
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  index={index}
                  tasks={card.tasks}
                  onDelete={deleteList}
                  onUpdate={updateList}
                  onAdd={addCardToList}
                  onUpdateCard={updateCard}
                  onDeleteCard={deleteCard}
                  isHorizontal={isHorizontal} 
                />
              ))}
              {provided.placeholder}
              <button 
                className={`btn text-[#666666] hover:text-white text-center ${
                  isHorizontal 
                    ? 'min-w-[300px] h-[200px] flex items-center justify-center' 
                    : 'w-full py-4'
                }`} 
                onClick={addCard}
              >
                + Add List
              </button>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Board;

