import React, { useContext, useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogOut, LayoutDashboard, Trophy, BarChart2, Zap, Terminal, Sun, Moon } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Theme Triage State
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="glass sticky top-0 z-50 border-b border-slate-200 dark:border-darkBorder px-6 py-4 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-neonBlue/10 border border-neonBlue/30 rounded-lg text-neonBlue">
          <Terminal size={20} />
        </div>
        <span className="font-bold text-lg tracking-wider bg-gradient-to-r from-neonBlue to-neonPurple bg-clip-text text-transparent">
          TaskForce AI
        </span>
      </div>

      <div className="flex items-center gap-6 text-sm">
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-1.5 font-semibold transition-all py-1.5 px-3 rounded-lg ${
              isActive 
                ? 'text-neonBlue bg-neonBlue/5 border border-neonBlue/15 shadow-sm' 
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 border border-transparent'
            }`
          }
        >
          <LayoutDashboard size={16} />
          Dashboard
        </NavLink>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            `flex items-center gap-1.5 font-semibold transition-all py-1.5 px-3 rounded-lg ${
              isActive 
                ? 'text-neonBlue bg-neonBlue/5 border border-neonBlue/15 shadow-sm' 
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 border border-transparent'
            }`
          }
        >
          <BarChart2 size={16} />
          Analytics
        </NavLink>

        <NavLink
          to="/leaderboard"
          className={({ isActive }) =>
            `flex items-center gap-1.5 font-semibold transition-all py-1.5 px-3 rounded-lg ${
              isActive 
                ? 'text-neonBlue bg-neonBlue/5 border border-neonBlue/15 shadow-sm' 
                : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 border border-transparent'
            }`
          }
        >
          <Trophy size={16} />
          Leaderboard
        </NavLink>
      </div>

      <div className="flex items-center gap-4">
        {/* User points score */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/25 rounded-full text-yellow-600 dark:text-yellow-500 text-xs font-bold">
          <Zap size={14} className="fill-yellow-500 animate-bounce" />
          <span>{user.totalPoints} pts</span>
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-gray-400 hover:text-neonBlue dark:hover:text-neonPurple hover:bg-slate-100 dark:hover:bg-darkCard/60 border border-transparent hover:border-slate-200 dark:hover:border-darkBorder rounded-xl transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <span className="w-px h-6 bg-slate-200 dark:bg-darkBorder"></span>

        <div className="text-slate-700 dark:text-gray-300 text-sm font-semibold mr-2">
          {user.username}
        </div>

        <button
          onClick={handleLogout}
          className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-lg transition-all cursor-pointer"
          title="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
