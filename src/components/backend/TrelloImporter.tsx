import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
}

interface TrelloImporterProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cards: { title: string; description: string }[]) => void;
}

const TrelloImporter: React.FC<TrelloImporterProps> = ({ isOpen, onClose, onImport }) => {
  const [listId, setListId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');

  const { isLoading, isError, data, refetch } = useQuery({
    queryKey: ['trelloCards', listId],
    queryFn: async () => {
      if (!listId || !apiKey || !token) return null;
      
      const response = await fetch(
        `https://api.trello.com/1/lists/${listId}/cards?key=${apiKey}&token=${token}`,
        { method: 'GET' }
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch Trello cards');
      }
      
      return response.json() as Promise<TrelloCard[]>;
    },
    enabled: false,
  });

  const handleImport = () => {
    if (!data) return;
    
    const formattedCards = data.map(card => ({
      title: card.name,
      description: card.desc,
    }));
    
    onImport(formattedCards);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#161616] rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4 text-white">Import from Trello</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Trello List ID</label>
            <input
              type="text"
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full bg-[#111111] rounded px-3 py-2 text-white"
              placeholder="Enter Trello list ID"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-[#111111] rounded px-3 py-2 text-white"
              placeholder="Enter Trello API key"
            />
          </div>
          
          <div>
            <label className="block text-sm text-gray-400 mb-1">Token</label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-[#111111] rounded px-3 py-2 text-white"
              placeholder="Enter Trello token"
            />
          </div>
          
          {isError && (
            <div className="text-red-500 text-sm">
              Failed to fetch cards. Please check your credentials.
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => refetch()}
              disabled={!listId || !apiKey || !token || isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Fetch Cards'}
            </button>
            <button
              onClick={handleImport}
              disabled={!data || data.length === 0}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
            >
              Import {data?.length ?? 0} Cards
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrelloImporter;
