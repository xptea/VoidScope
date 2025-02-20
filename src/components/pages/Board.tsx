import { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../backend/firebase';
import { useAuth } from '../backend/AuthContext';
import List from '../backend/Callum';
import { v4 as uuidv4 } from 'uuid';
import { useDragDropSystem, CardType, TaskType } from '../backend/DragDropSystem';
import VoiceIntegration from '../backend/VoiceIntegration';

interface BoardViewProps {
  boardId: string;
  onTrelloImport?: () => void;
}

const BoardView = ({ boardId, onTrelloImport }: BoardViewProps) => {
  const [cards, setCards] = useState<CardType[]>([]);
  const [board, setBoard] = useState<{ title: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const [isHorizontal, setIsHorizontal] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  useEffect(() => {
    const handleResize = () => {
      setIsHorizontal(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
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
      console.log('Card created with ID:', docRef.id); 
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

  const handleAddVoiceCard = async (title: string, listTitle?: string) => {
    if (!user || !boardId) return;

    try {
      // If a list title is provided, find the matching list
      if (listTitle) {
        const matchingList = cards.find(card => 
          card.title.toLowerCase() === listTitle.toLowerCase() ||
          card.title.toLowerCase().includes(listTitle.toLowerCase())
        );

        if (matchingList) {
          // Add the card as a task to the existing list
          const updatedTasks = [
            ...(matchingList.tasks || []),
            {
              id: uuidv4(),
              title: title,
              description: '',
            }
          ];

          const cardRef = doc(db, `users/${user.uid}/boards/${boardId}/cards`, matchingList.id);
          await updateDoc(cardRef, { tasks: updatedTasks });
          return;
        }
      }

      // If no list title or no matching list, create a new card
      const cardsRef = collection(db, `users/${user.uid}/boards/${boardId}/cards`);
      const newCard = {
        title,
        tasks: [],
        order: cards.length || 0,
        createdAt: new Date().toISOString()
      };

      await addDoc(cardsRef, newCard);
    } catch (error) {
      console.error("Error adding card:", error);
    }
  };

  const handleAddVoiceList = async (title: string) => {
    if (!user || !boardId) return;

    try {
      const cardsRef = collection(db, `users/${user.uid}/boards/${boardId}/cards`);
      const newCard = {
        title,
        tasks: [],
        order: cards.length || 0,
        createdAt: new Date().toISOString()
      };

      await addDoc(cardsRef, newCard);
    } catch (error) {
      console.error("Error adding list:", error);
    }
  };

  const { onDragEnd } = useDragDropSystem({
    cards,
    setCards,
    userId: user?.uid || '',
    boardId,
  });

  const handleMicClick = () => {
    if (isListening) {
      // If we're already listening, clicking again should process the current transcript
      const voiceIntegration = document.querySelector('voice-integration') as any;
      if (voiceIntegration?.processCurrentTranscript) {
        voiceIntegration.processCurrentTranscript();
      }
    }
    setIsListening(!isListening);
  };

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsHorizontal(prev => !prev)}
            className="px-2 py-1 border border-gray-500 text-sm rounded text-white hover:bg-gray-800"
          >
            {isHorizontal ? 'Horizontal' : 'Vertical'}
          </button>
          
          <div className="relative group">
            <button
              onClick={handleMicClick}
              className={`flex items-center justify-center w-8 h-8 rounded-full 
                ${isListening 
                  ? 'bg-red-500 animate-pulse' 
                  : 'bg-[#222222] hover:bg-[#333333]'} 
                transition-all duration-200`}
              title="Voice Commands"
            >
              <svg 
                className={`w-4 h-4 ${isListening ? 'text-white' : 'text-[#666666]'} transition-colors`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                />
              </svg>
            </button>
            <div className="absolute right-0 top-full mt-2 w-80 bg-[#1a1a1a] rounded-md shadow-lg p-3 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 text-sm z-50">
              <div className="text-white font-medium mb-2">Voice Commands:</div>
              <div className="text-[#999999] space-y-3">
                <div>
                  <div className="text-[#666666] text-xs uppercase mb-1">Adding Cards to Lists:</div>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>"Add a card called Bug Fix in Test column"</li>
                    <li>"Add card Meeting Notes in Planning"</li>
                    <li>"Create card Research in Todo list"</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[#666666] text-xs uppercase mb-1">Adding Cards (Column will be asked):</div>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>"Add card Meeting Notes"</li>
                    <li>"Create new card Research Topics"</li>
                    <li>"Make card Write Tests"</li>
                  </ul>
                </div>
                <div>
                  <div className="text-[#666666] text-xs uppercase mb-1">Creating New Columns:</div>
                  <ul className="space-y-1 list-disc pl-4">
                    <li>"Add column called Ideas"</li>
                    <li>"Create new column Testing"</li>
                    <li>"Make a column Backlog"</li>
                  </ul>
                </div>
                <div className="text-xs text-[#666666] mt-2 pt-2 border-t border-[#222222]">
                  Tip: Click the mic button to start/stop listening. Voice commands are processed automatically.
                </div>
              </div>
            </div>
          </div>

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
          {isHorizontal && (
            <button
              onClick={addCard}
              className="px-3 py-1.5 rounded bg-[#222222] hover:bg-[#333333] text-[#666666] hover:text-white transition-colors text-sm"
            >
              + Add Card
            </button>
          )}
        </div>
      </div>

      <VoiceIntegration
        onAddCard={handleAddVoiceCard}
        onAddList={handleAddVoiceList}
        isListening={isListening}
        setIsListening={setIsListening}
      />
      
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="all-lists" type={isHorizontal ? "LIST" : "LIST"} direction={isHorizontal ? 'horizontal' : 'vertical'}>
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
                ...(isHorizontal ? {} : { height: 'calc(100vh - 140px)' })
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
              {!isHorizontal && (
                <button
                  onClick={addCard}
                  className="w-full py-2 px-4 bg-[#222222] hover:bg-[#333333] transition-colors rounded-sm text-[#666666] hover:text-white"
                >
                  + Add Card
                </button>
              )}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>

  );
};

export default BoardView;

