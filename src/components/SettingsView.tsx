import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SettingsViewProps {
  onBack: () => void;
}

const SettingsView = ({ onBack }: SettingsViewProps) => {
  const [apiKey, setApiKey] = useState('');
  const [token, setToken] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) return;
      
      const settingsRef = doc(db, `users/${user.uid}/settings/trello`);
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data();
        setApiKey(data.apiKey || '');
        setToken(data.token || '');
      }
    };

    loadSettings();
  }, [user]);

  const saveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    setMessage(null);

    try {
      // Validate credentials by making a test API call
      const response = await fetch(
        `https://api.trello.com/1/members/me?key=${apiKey}&token=${token}`
      );

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      // Save to Firestore
      const settingsRef = doc(db, `users/${user.uid}/settings/trello`);
      await setDoc(settingsRef, {
        apiKey,
        token,
        updatedAt: new Date()
      });

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please check your credentials.' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 bg-[#111111] p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
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

      <div className="max-w-2xl space-y-6">
        {/* Profile Section */}
        <div className="bg-[#161616] rounded-lg border border-[#222222] p-6">
          <h2 className="text-lg font-medium text-white mb-6">Profile Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Email</label>
              <div className="text-[#888888] px-3 py-2 bg-[#111111] border border-[#222222] rounded select-all">
                {user?.email}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">User ID</label>
              <div className="text-[#888888] px-3 py-2 bg-[#111111] border border-[#222222] rounded font-mono text-xs break-all select-all">
                {user?.uid}
              </div>
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Account Created</label>
              <div className="text-[#888888] px-3 py-2 bg-[#111111] border border-[#222222] rounded select-all">
                {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Existing Trello Integration Section */}
        <div className="bg-[#161616] rounded-lg border border-[#222222] p-6">
          <h2 className="text-lg font-medium text-white mb-6">Trello Integration</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                placeholder="Enter your Trello API key"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-400 mb-2">Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full bg-[#111111] border border-[#333333] rounded px-3 py-2 text-white focus:outline-none focus:border-[#444444]"
                placeholder="Enter your Trello token"
              />
            </div>

            {message && (
              <div className={`px-4 py-2 rounded ${
                message.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {message.text}
              </div>
            )}

            <button
              onClick={saveSettings}
              disabled={!apiKey || !token || isSaving}
              className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
