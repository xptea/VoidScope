import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface TrelloImportViewProps {
  onBack: () => void;
  onSettings: () => void;
}

interface TrelloSettings {
  apiKey: string;
  token: string;
}

const TrelloImportView = ({ onBack }: TrelloImportViewProps) => {
  const [boards, setBoards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const { user } = useAuth();

  const fetchBoards = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);

    try {
      const settingsRef = doc(db, `users/${user.uid}/settings/trello`);
      const settingsDoc = await getDoc(settingsRef);
      
      if (!settingsDoc.exists()) {
        throw new Error('Please configure your Trello API credentials in Settings first');
      }

      const settings = settingsDoc.data() as TrelloSettings;
      
      if (!settings.apiKey || !settings.token) {
        throw new Error('Invalid Trello settings');
      }

      const response = await fetch(
        `https://api.trello.com/1/members/me/boards?key=${settings.apiKey}&token=${settings.token}`,
        { method: 'GET' }
      );
      
      if (!response.ok) throw new Error('Failed to fetch boards');
      
      const data = await response.json();
      setBoards(data);
    } catch (error) {
      console.error('Error fetching boards:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setBoards([]);
    } finally {
      setIsLoading(false);
    }
  };

  const importBoard = async (boardId: string, boardName: string) => {
    if (!user) return;
    setError(null);
    setIsImporting(true);

    try {
      const settingsRef = doc(db, `users/${user.uid}/settings/trello`);
      const settingsDoc = await getDoc(settingsRef);
      const settings = settingsDoc.data() as TrelloSettings;

      if (!settings.apiKey || !settings.token) {
        throw new Error('Invalid Trello settings');
      }

      const boardRef = await addDoc(collection(db, `users/${user.uid}/boards`), {
        title: `${boardName} (Imported)`,
        createdAt: new Date()
      });

      const listsResponse = await fetch(
        `https://api.trello.com/1/boards/${boardId}/lists?key=${settings.apiKey}&token=${settings.token}`
      );
      const lists = await listsResponse.json();

      for (const list of lists) {
        const cardsResponse = await fetch(
          `https://api.trello.com/1/lists/${list.id}/cards?key=${settings.apiKey}&token=${settings.token}`
        );
        const cards = await cardsResponse.json();

        await addDoc(collection(db, `users/${user.uid}/boards/${boardRef.id}/cards`), {
          title: list.name,
          cards: cards.map((card: any) => ({
            id: `card-${Date.now()}-${Math.random()}`,
            title: card.name,
            description: card.desc
          })),
          order: list.pos
        });
      }

      onBack();
    } catch (error) {
      console.error('Error importing board:', error);
      setError('Failed to import board');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="flex-1 bg-[#111111] p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Import from Trello</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 text-[#666666] hover:text-white transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </button>
      </div>
      
      <div className="max-w-2xl space-y-8">
        {error && (
          <div className="p-4 bg-red-500/10 text-red-500 rounded">
            {error}
          </div>
        )}

        <button
          onClick={fetchBoards}
          disabled={isLoading}
          className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Loading...' : 'Fetch Boards'}
        </button>

        {boards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="p-6 bg-[#161616] rounded-lg border border-[#222222] hover:border-[#333333] transition-colors"
              >
                <h3 className="text-white font-medium mb-4">{board.name}</h3>
                <button
                  onClick={() => importBoard(board.id, board.name)}
                  disabled={isImporting}
                  className="w-full px-4 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isImporting ? 'Importing...' : 'Import Board'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Show loading state for entire import process */}
      {isImporting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#161616] rounded-lg p-6 max-w-sm w-full mx-4">
            <p className="text-white text-center">Importing board...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrelloImportView;
