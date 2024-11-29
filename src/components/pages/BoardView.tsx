import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import List from '../backend/Task';
import { v4 as uuidv4 } from 'uuid';
import { useDragDropSystem, CardType, TaskType } from '../../lib/DragDropSystem';


interface BoardViewProps {
  boardId: string;
  onTrelloImport?: () => void;
}

const BoardView = ({ boardId, onTrelloImport }: BoardViewProps) => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [board, setBoard] = useState<{ title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const [isHorizontal] = useState(false);

  useEffect(() => {
    if (!user || !boardId) return;

    const boardRef = doc(db, `users/${user.uid}/boards/${boardId}`);
    const unsubscribeBoard = onSnapshot(boardRef, (doc) => {
      if (doc.exists()) {
        setBoard(doc.data() as { title: string });
      }
    });

    const cardsRef = collection(db, `users/${user.uid}/boards/${boardId}/cards`);
    const q = query(cardsRef);
    
    const unsubscribeCards = onSnapshot(q, (snapshot) => {
      const cardsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CardType[];
      
      setCards(cardsData.sort((a, b) => a.order - b.order));
      setIsLoading(false);
    });

    return () => {
      unsubscribeBoard();
      unsubscribeCards();
    };
  }, [user, boardId]);

  const addCard = async () => {
    if (!user || !boardId) return;

    try {
      const cardsRef = collection(db, `users/${user.uid}/boards/${boardId}/cards`);
      
      const newCard = {
        title: 'New Card',
        tasks: [],
        order: cards.length || 0,
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(cardsRef, newCard);
      console.log('Card created with ID:', docRef.id); // Debug log
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user || !boardId) return;
    const taskRef = doc(db, `users/${user.uid}/boards/${boardId}/cards`, taskId);
    await deleteDoc(taskRef);
  };

  const updateTask = async (taskId: string, newTitle: string) => {
    if (!user || !boardId) return;
    const taskRef = doc(db, `users/${user.uid}/boards/${boardId}/cards`, taskId);
    await updateDoc(taskRef, { title: newTitle });
  };

  const addCardToTask = async (taskId: string) => {
    if (!user || !boardId) return;
    
    const taskRef = doc(db, `users/${user.uid}/boards/${boardId}/cards`, taskId);
    const card = cards.find(c => c.id === taskId);
    if (!card) return;

    const newTask: TaskType = {
      id: uuidv4(),
      title: 'New Task',
      description: ' ',
    };

    await updateDoc(taskRef, {
      tasks: [...(card.tasks || []), newTask],
    });
  };

  const updateCard = async (listId: string, cardId: string, updates: Partial<TaskType>) => {
    if (!user || !boardId) return;

    const cardRef = doc(db, `users/${user.uid}/boards/${boardId}/cards`, listId);
    const card = cards.find(c => c.id === listId);
    if (!card) return;

    const updatedTasks = card.tasks.map((task: TaskType) => 
      task.id === cardId ? { ...task, ...updates } : task
    );

    await updateDoc(cardRef, { tasks: updatedTasks });
  };

  const deleteCard = async (listId: string, cardId: string) => {
    if (!user || !boardId) return;

    const cardRef = doc(db, `users/${user.uid}/boards/${boardId}/cards`, listId);
    const card = cards.find(c => c.id === listId);
    if (!card) return;

    const updatedTasks = card.tasks.filter(task => task.id !== cardId);
    await updateDoc(cardRef, { tasks: updatedTasks });
  };

  const { onDragEnd } = useDragDropSystem({
    cards,
    setCards,
    userId: user?.uid || '',
    boardId,
  });

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#111111] p-4 flex items-center justify-center">
        <span className="text-[#666666]">Loading board...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#111111] p-4">
      <div className="flex items-center justify-between gap-2 mb-6 px-2">
        <h2 className="text-white font-medium">{board?.title || 'Loading...'}</h2>
        
        {onTrelloImport && (
          <button
            onClick={onTrelloImport}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-[#222222] hover:bg-[#333333] text-[#666666] hover:text-white transition-colors text-sm"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
            </svg>
            Import
          </button>
        )}
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" type="CARD" direction={isHorizontal ? 'horizontal' : 'vertical'}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`${
                isHorizontal 
                  ? 'flex gap-4 overflow-x-auto pb-4' 
                  : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
              } relative`}
              style={{
                minHeight: '100px',
                height: 'calc(100vh - 140px)',
              }}
            >
              {cards.map((card, index) => (
                <List
                  key={card.id}
                  id={card.id}
                  title={card.title}
                  tasks={card.tasks || []}
                  index={index}
                  onDelete={deleteTask}
                  onUpdate={updateTask}
                  onAdd={addCardToTask}
                  onUpdateCard={updateCard}
                  onDeleteCard={deleteCard}
                  isHorizontal={isHorizontal}
                />
              ))}
              {provided.placeholder}
              
              <button
                onClick={addCard}
                className="w-full py-2 px-4 bg-[#222222] hover:bg-[#333333] transition-colors rounded-sm text-[#666666] hover:text-white"
              >
                + Add Card
              </button>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>

  );
};

export default BoardView;

