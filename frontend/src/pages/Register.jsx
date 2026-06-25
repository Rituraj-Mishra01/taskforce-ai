import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, Lock, User, UserPlus } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, error, user, setError } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    setError(null);
    if (user) {
      navigate('/');
    }
  }, [user, navigate, setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!username || !password || !confirmPassword) {
      return;
    }

    if (username.length < 3) {
      setValidationError('Username must be at least 3 characters.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const success = await register(username, password);
    setLoading(false);
    
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-darkBg flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neonBlue opacity-10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-neonPurple opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md glass rounded-2xl p-8 relative z-10 shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-neonPurple/10 border border-neonPurple/30 rounded-xl mb-3 text-neonPurple">
            <UserPlus size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-neonBlue to-neonPurple bg-clip-text text-transparent">
            Join TaskForce
          </h1>
          <p className="text-gray-400 text-sm mt-1">Get scheduled, get productive, earn points</p>
        </div>

        {(error || validationError) && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/30 text-red-200 text-sm rounded-xl flex items-start gap-2">
            <Shield size={16} className="mt-0.5 shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full pl-11 pr-4 py-3 bg-darkBg/60 border border-darkBorder hover:border-gray-600 focus:border-neonPurple focus:outline-none rounded-xl text-gray-100 placeholder-gray-500 transition-all"
                placeholder="Choose username"
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
                className="w-full pl-11 pr-4 py-3 bg-darkBg/60 border border-darkBorder hover:border-gray-600 focus:border-neonPurple focus:outline-none rounded-xl text-gray-100 placeholder-gray-500 transition-all"
                placeholder="Create password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Lock size={18} />
              </span>
              <input
                type="password"
                required
                className="w-full pl-11 pr-4 py-3 bg-darkBg/60 border border-darkBorder hover:border-gray-600 focus:border-neonPurple focus:outline-none rounded-xl text-gray-100 placeholder-gray-500 transition-all"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-neonBlue to-neonPurple hover:from-blue-600 hover:to-violet-600 active:scale-[0.98] font-semibold text-white rounded-xl shadow-lg shadow-neonPurple/20 transition-all flex justify-center items-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              'Create Deployable Profile'
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-400">
          Already registered?{' '}
          <Link to="/login" className="text-neonPurple hover:underline hover:text-purple-400 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
