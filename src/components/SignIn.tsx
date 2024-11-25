import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'signin' | 'register';

const SignIn = () => {
  const { signInWithEmail, registerWithEmail } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const validateForm = () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return false;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        await registerWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#111111]">
      <div className="bg-[#111111] p-8 rounded-md border border-[#222222] max-w-md w-full">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">VOID WORKS</h1>
        
        {error && (
          <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded text-sm mb-4 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black border border-[#333333] rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-[#444444]"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black border border-[#333333] rounded-sm px-3 py-2 text-white text-sm focus:outline-none focus:border-[#444444]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#333333] text-white font-medium py-2 px-4 rounded-sm hover:bg-[#444444] transition-colors"
          >
            {isLoading ? 'Loading...' : mode === 'register' ? 'Register' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <button
            onClick={() => setMode(mode === 'signin' ? 'register' : 'signin')}
            className="text-[#666666] hover:text-white transition-colors"
          >
            {mode === 'signin' 
              ? "Don't have an account? Register" 
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
