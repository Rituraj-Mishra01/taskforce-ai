import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, Lock, User, Terminal } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error, user, setError } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any previous auth errors
    setError(null);
    if (user) {
      navigate('/');
    }
  }, [user, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;

    setLoading(true);
    const success = await login(username, password);
    setLoading(false);
    
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative gradient glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonBlue opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonPurple opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md glass rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-neonBlue/10 border border-neonBlue/30 rounded-xl mb-3 text-neonBlue">
            <Terminal size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-neonBlue to-neonPurple bg-clip-text text-transparent">
            TaskForce AI
          </h1>
          <p className="text-gray-400 text-sm mt-1">Deploy productivity with AI scheduling</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-start gap-2">
            <Shield size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <User size={18} />
              </span>
              <input
                type="text"
                required
                className="w-full pl-11 pr-4 py-3 bg-darkBg/60 border border-darkBorder hover:border-gray-600 focus:border-neonBlue focus:outline-none rounded-xl text-gray-100 placeholder-gray-500 transition-all"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3 bg-darkBg/60 border border-darkBorder hover:border-gray-600 focus:border-neonBlue focus:outline-none rounded-xl text-gray-100 placeholder-gray-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-neonBlue to-neonPurple hover:from-blue-600 hover:to-violet-600 active:scale-[0.98] font-semibold text-white rounded-xl shadow-lg shadow-neonBlue/20 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Authenticate'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          First deployment?{' '}
          <Link to="/register" className="text-neonBlue hover:underline hover:text-blue-400 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
