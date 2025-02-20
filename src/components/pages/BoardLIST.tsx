import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../backend/firebase';
import { useAuth } from '../backend/AuthContext';

interface Board {
  id: string;
  title: string;
  createdAt: Timestamp;
}

interface DeleteModalProps {
  board: Board;
  onCancel: () => void;
  onConfirm: () => void;
}

const DeleteModal = ({ board, onCancel, onConfirm }: DeleteModalProps) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-[#111111] border border-[#222222] p-6 rounded-sm max-w-md w-full mx-4">
      <h3 className="text-white text-lg font-medium mb-2">Delete Board</h3>
      <p className="text-[#666666] mb-6">
        Are you sure you want to delete "{board.title}"? This action cannot be undone.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 py-2 px-4 bg-[#222222] text-white rounded-sm hover:bg-[#333333] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 py-2 px-4 bg-red-500 text-white rounded-sm hover:bg-red-600 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  </div>
);

interface EditModalProps {
  board: Board;
  onCancel: () => void;
  onSave: (title: string) => void;
}

const EditModal = ({ board, onCancel, onSave }: EditModalProps) => {
  const [title, setTitle] = useState(board.title);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#111111] border border-[#222222] p-6 rounded-sm max-w-md w-full mx-4">
        <h3 className="text-white text-lg font-medium mb-4">Edit Board</h3>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-[#222222] text-white px-3 py-2 rounded-sm mb-4 focus:outline-none focus:ring-1 focus:ring-[#444444]"
          placeholder="Board Title"
          autoFocus
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 bg-[#222222] text-white rounded-sm hover:bg-[#333333] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(title)}
            className="flex-1 py-2 px-4 bg-[#444444] text-white rounded-sm hover:bg-[#555555] transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const BoardsList = ({ onSelectBoard }: { onSelectBoard: (boardId: string) => void }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [boardToDelete, setBoardToDelete] = useState<Board | null>(null);
  const [boardToEdit, setBoardToEdit] = useState<Board | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const initUser = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        
        // Create user document if it doesn't exist
        await setDoc(userRef, {
          email: user.email,
          updatedAt: new Date()
        }, { merge: true });

        // Listen to boards collection
        const boardsRef = collection(db, `users/${user.uid}/boards`);
        const q = query(boardsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const boardsData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Board[];
            setBoards(boardsData);
            setIsLoading(false);
            setError(null);
          },
          (err) => {
            console.error('Error fetching boards:', err);
            setError('Failed to load boards. Please check your connection.');
            setIsLoading(false);
          }
        );

        return unsubscribe;
      } catch (err) {
        console.error('Error initializing user:', err);
        setError('Failed to initialize user data. Please try again.');
        setIsLoading(false);
      }
    };

    initUser();
  }, [user]);

  const createBoard = async () => {
    if (!user) return;
    setError(null);

    try {
      const boardsRef = collection(db, `users/${user.uid}/boards`);
      
      const newBoard = await addDoc(boardsRef, {
        title: 'New Board',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      const cardsRef = collection(db, `users/${user.uid}/boards/${newBoard.id}/cards`);
      
      const defaultCards = [
        { title: 'To Do', cards: [{
          title: 'Add your first task',
          description: 'Click the + button to add more tasks',
          createdAt: Timestamp.now(),
          order: 0
        }], order: 0 },
        { title: 'In Progress', cards: [{
          title: 'Task in progress',
          description: 'Drag tasks here when you start working on them',
          createdAt: Timestamp.now(),
          order: 0
        }], order: 1 },
        { title: 'Done', cards: [{
          title: 'Completed task',
          description: 'Drag tasks here when they are finished',
          createdAt: Timestamp.now(),
          order: 0
        }], order: 2 }
      ];

      for (const card of defaultCards) {
        await addDoc(cardsRef, card);
      }

      setBoardToEdit({
        id: newBoard.id,
        title: 'New Board',
        createdAt: Timestamp.now()
      });

      onSelectBoard(newBoard.id);
    } catch (err) {
      console.error('Error creating board:', err);
      setError('Error creating board. Please try again.');
    }
  };

  const updateBoard = async (boardId: string, title: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, `users/${user.uid}/boards`, boardId), {
        title,
        updatedAt: Timestamp.now()
      });
      setBoardToEdit(null);
    } catch (err) {
      console.error('Error updating board:', err);
      setError('Error updating board. Please try again.');
    }
  };

  const deleteBoard = async (board: Board) => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, `users/${user.uid}/boards`, board.id));
      setBoardToDelete(null);
    } catch (error) {
      console.error('Error deleting board:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-[#111111] p-4 flex items-center justify-center">
        <span className="text-[#666666]">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-[#111111] p-4 flex flex-col items-center justify-center">
        <p className="text-red-500 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#222222] text-white rounded-sm hover:bg-[#333333] transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#111111] p-4 overflow-y-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-bold text-white mb-6">Your Boards</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {boards.map(board => (
            <div
              key={board.id}
              className="group relative p-4 bg-[#222222] rounded-sm hover:bg-[#333333] transition-colors"
            >
              <button
                onClick={() => onSelectBoard(board.id)}
                className="w-full text-left"
              >
                <h2 className="text-white font-medium pr-8">{board.title}</h2>
                <p className="text-[#666666] text-sm mt-1">
                  Created {board.createdAt.toDate().toLocaleDateString()}
                </p>
              </button>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBoardToEdit(board);
                  }}
                  className="text-[#666666] hover:text-white p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setBoardToDelete(board);
                  }}
                  className="text-[#666666] hover:text-red-500 p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={createBoard}
            className="p-4 bg-[#222222] rounded-sm hover:bg-[#333333] transition-colors border-2 border-dashed border-[#444444] flex items-center justify-center"
          >
            <span className="text-[#666666]">+ Create New Board</span>
          </button>
        </div>
      </div>

      {boardToDelete && (
        <DeleteModal
          board={boardToDelete}
          onCancel={() => setBoardToDelete(null)}
          onConfirm={() => deleteBoard(boardToDelete)}
        />
      )}

      {boardToEdit && (
        <EditModal
          board={boardToEdit}
          onCancel={() => setBoardToEdit(null)}
          onSave={(title) => updateBoard(boardToEdit.id, title)}
        />
      )}
    </div>
  );
};

export default BoardsList;
