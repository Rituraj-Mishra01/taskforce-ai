import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Plus, Trash2, CheckCircle, XCircle, RefreshCw, 
  AlertTriangle, Calendar, Clock, Sparkles, BookOpen, 
  Heart, User, Briefcase, HelpCircle, Check, ArrowRight, Zap, Info
} from 'lucide-react';
import DailyDebrief from './DailyDebrief';

const Dashboard = () => {
  const { user, token, updatePoints } = useContext(AuthContext);
  const [tasks, setTasks] = useState([]);
  const [rawTasks, setRawTasks] = useState('');
  const [loading, setLoading] = useState(true);
  const [triageLoading, setTriageLoading] = useState(false);
  const [carryLoading, setCarryLoading] = useState(false);
  const [latestLog, setLatestLog] = useState(null);
  const [realityCheck, setRealityCheck] = useState('');
  
  // Debrief Wizard state
  const [isDebriefOpen, setIsDebriefOpen] = useState(false);

  useEffect(() => {
    fetchTodayTasks();
    fetchLatestDistraction();
    fetchTodayLog();
  }, [token]);

  const fetchTodayTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLatestDistraction = async () => {
    try {
      const res = await fetch('/api/logs/latest-distraction', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setLatestLog(data);
      }
    } catch (err) {
      console.error('Error fetching distraction:', err);
    }
  };

  const fetchTodayLog = async () => {
    try {
      const res = await fetch('/api/logs/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setRealityCheck(data.realityCheck || '');
      }
    } catch (err) {
      console.error('Error fetching today log:', err);
    }
  };

  const handleTriageSubmit = async (e) => {
    e.preventDefault();
    if (!rawTasks.trim()) return;

    setTriageLoading(true);
    try {
      const res = await fetch('/api/tasks/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ rawTasks })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(data.tasks);
        setRealityCheck(data.realityCheck);
        setRawTasks('');
      } else {
        alert(data.message || 'Failed to triage tasks.');
      }
    } catch (err) {
      console.error('Error triaging tasks:', err);
    } finally {
      setTriageLoading(false);
    }
  };

  const handleToggleComplete = async (task) => {
    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    try {
      const res = await fetch(`/api/tasks/${task._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: newStatus,
          clientTime: new Date().toISOString()
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(tasks.map(t => t._id === task._id ? data.task : t));
        updatePoints(data.totalPoints);
      }
    } catch (err) {
      console.error('Error toggling complete:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setTasks(tasks.filter(t => t._id !== taskId));
        updatePoints(data.totalPoints);
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleCarryover = async () => {
    setCarryLoading(true);
    try {
      const res = await fetch('/api/tasks/carryover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.count > 0) {
          fetchTodayTasks();
          fetchTodayLog();
          alert(`Carried over ${data.count} tasks!`);
        } else {
          alert('No pending tasks from previous days to carry over.');
        }
      }
    } catch (err) {
      console.error('Error during carryover:', err);
    } finally {
      setCarryLoading(false);
    }
  };

  const getCoachWarning = () => {
    if (!latestLog || latestLog.primaryDistraction === 'None' || latestLog.efficiencyScore === 100) {
      return {
        type: 'info',
        title: 'AI Coach Tip',
        message: 'Welcome back! Type your raw tasks below, and I will schedule them. Keep up the high efficiency today!'
      };
    }

    const { primaryDistraction, efficiencyScore } = latestLog;
    const loss = 100 - efficiencyScore;
    
    let advice = 'Distractions reduced your completion rate yesterday. Use Pomodoro timers to stay locked in!';
    if (primaryDistraction.toLowerCase().includes('social')) {
      advice = 'Social media reduced your efficiency yesterday. Set your phone to Do Not Disturb and block distracting sites!';
    } else if (primaryDistraction.toLowerCase().includes('meeting')) {
      advice = 'Meetings fragmented your deep work hours. Try blocking out "No Meeting" time slots to prioritize implementation!';
    } else if (primaryDistraction.toLowerCase().includes('fatigue')) {
      advice = 'Fatigue caused schedule slippage. Take 5-minute hydration breaks and review your sleep cycles!';
    } else if (primaryDistraction.toLowerCase().includes('gaming')) {
      advice = 'Gaming cut into your focus. Reward yourself with play time only after completing your scheduled items!';
    }

    return {
      type: 'warning',
      title: `AI Coach Warning (${primaryDistraction} Threat Detected)`,
      message: `Warning: ${primaryDistraction} reduced your efficiency by ${loss}% yesterday. Keep notifications muted! ${advice}`
    };
  };

  const coachMessage = getCoachWarning();

  const getCategoryIcon = (category) => {
    switch (category.toLowerCase()) {
      case 'work': return <Briefcase size={16} className="text-blue-500 dark:text-blue-400" />;
      case 'learning': return <BookOpen size={16} className="text-purple-500 dark:text-purple-400" />;
      case 'health': return <Heart size={16} className="text-emerald-500 dark:text-emerald-400" />;
      case 'personal': return <User size={16} className="text-yellow-600 dark:text-yellow-400" />;
      default: return <HelpCircle size={16} className="text-slate-500 dark:text-gray-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* AI Coach Banner */}
      <div className={`mb-8 p-5 rounded-2xl border flex gap-4 items-start transition-colors duration-300 relative overflow-hidden ${
        coachMessage.type === 'warning' 
          ? 'bg-red-500/5 dark:bg-red-950/20 border-red-500/20 dark:border-red-500/30 text-red-950 dark:text-red-200' 
          : 'bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20 dark:border-blue-500/30 text-blue-950 dark:text-blue-200'
      }`}>
        <div className={`absolute top-0 right-0 w-32 h-32 opacity-5 pointer-events-none rounded-full blur-xl ${
          coachMessage.type === 'warning' ? 'bg-red-500' : 'bg-blue-500'
        }`}></div>
        
        <div className={`p-2.5 rounded-xl shrink-0 ${
          coachMessage.type === 'warning' 
            ? 'bg-red-500/10 border border-red-500/20 text-red-500' 
            : 'bg-blue-500/10 border border-blue-500/20 text-blue-500'
        }`}>
          <AlertTriangle size={24} className={coachMessage.type === 'warning' ? 'animate-bounce' : ''} />
        </div>
        <div>
          <h4 className="font-extrabold text-base tracking-wide flex items-center gap-1.5">
            {coachMessage.title}
            {coachMessage.type !== 'warning' && <Sparkles size={16} className="text-yellow-500 dark:text-yellow-400 animate-pulse" />}
          </h4>
          <p className="text-sm text-slate-600 dark:text-gray-300 mt-1 leading-relaxed">{coachMessage.message}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Smart Triage input */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-darkBorder">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-neonBlue" />
              Smart AI Triage
            </h3>
            <p className="text-xs text-slate-500 dark:text-gray-400 mb-4 leading-relaxed">
              Dump your raw, unorganized task lists below (e.g. "Go to college from 9 to 5, gym workout for 1 hour at 6 PM").
            </p>
            <form onSubmit={handleTriageSubmit} className="space-y-4">
              <textarea
                required
                rows={6}
                value={rawTasks}
                onChange={(e) => setRawTasks(e.target.value)}
                placeholder="9 to 5 College&#10;5 to 6 rest&#10;6 to 7 dsa&#10;workout for 1h at 8 PM"
                className="w-full p-4 bg-white/80 dark:bg-darkBg/60 border border-slate-200 dark:border-darkBorder focus:border-neonBlue focus:outline-none rounded-xl text-slate-800 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-600 text-sm font-semibold resize-none transition-all"
              ></textarea>
              <button
                type="submit"
                disabled={triageLoading || !rawTasks.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-neonBlue to-neonPurple hover:from-blue-600 hover:to-violet-600 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {triageLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Triaging schedule...</span>
                  </>
                ) : (
                  <>
                    <span>Generate AI Schedule</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="glass rounded-2xl p-6 border border-slate-200 dark:border-darkBorder space-y-4">
            <h4 className="text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-wider">Controls</h4>
            <div className="flex gap-4">
              <button
                onClick={handleCarryover}
                disabled={carryLoading}
                className="flex-1 py-3 px-3 border border-slate-200 dark:border-darkBorder hover:border-slate-400 dark:hover:border-gray-600 bg-white dark:bg-darkBg/30 text-slate-700 dark:text-gray-300 hover:text-slate-950 dark:hover:text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw size={14} className={carryLoading ? 'animate-spin' : ''} />
                <span>Carry Over Pending</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Daily Tasks Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-slate-100 dark:bg-darkBorder rounded-lg border border-slate-200 dark:border-transparent">
                <Calendar size={18} className="text-slate-600 dark:text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Today's Schedule</h2>
                <p className="text-xs text-slate-500 dark:text-gray-400">Chronological execution blocks</p>
              </div>
            </div>

            {tasks.length > 0 && (
              <button
                onClick={() => setIsDebriefOpen(true)}
                className="py-2.5 px-4 bg-neonPurple/10 dark:bg-neonPurple/20 hover:bg-neonPurple/20 dark:hover:bg-neonPurple/30 border border-neonPurple/20 dark:border-neonPurple/40 text-neonPurple font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Zap size={14} className="fill-neonPurple animate-pulse" />
                <span>End-of-Day Debrief</span>
              </button>
            )}
          </div>

          {/* AI Schedule Reality Check Card */}
          {tasks.length > 0 && realityCheck && (
            <div className={`p-5 rounded-2xl border transition-all animate-fadeIn relative overflow-hidden ${
              realityCheck.toLowerCase().includes('warning') 
                ? 'bg-amber-500/5 border-amber-500/25 text-amber-900 dark:text-amber-200' 
                : 'bg-emerald-500/5 border-emerald-500/25 text-emerald-950 dark:text-emerald-200'
            }`}>
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none rounded-full blur-xl ${
                realityCheck.toLowerCase().includes('warning') ? 'bg-amber-500' : 'bg-emerald-500'
              }"></div>
              <div className="flex gap-3 items-start relative z-10">
                <div className={`p-2 rounded-xl shrink-0 ${
                  realityCheck.toLowerCase().includes('warning') 
                    ? 'bg-amber-500/10 text-amber-500' 
                    : 'bg-emerald-500/10 text-emerald-500'
                }`}>
                  {realityCheck.toLowerCase().includes('warning') ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
                </div>
                <div>
                  <h5 className="font-extrabold text-xs uppercase tracking-wider">AI Scheduler Reality Check</h5>
                  <p className="text-xs mt-1.5 leading-relaxed text-slate-600 dark:text-gray-300 font-medium">
                    {realityCheck}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-10 h-10 border-3 border-t-neonBlue border-r-transparent border-b-neonPurple border-l-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Loading daily schedule...</p>
            </div>
          ) : tasks.length === 0 ? (
            <div className="glass rounded-2xl p-12 border border-slate-200 dark:border-darkBorder text-center flex flex-col items-center justify-center">
              <div className="p-4 bg-slate-100 dark:bg-darkBg border border-slate-200 dark:border-darkBorder rounded-2xl mb-4 text-slate-400 dark:text-gray-600">
                <Plus size={32} />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-gray-200">No scheduled tasks yet</h3>
              <p className="text-sm text-slate-500 dark:text-gray-500 mt-2 max-w-sm">
                Enter your raw task list in the AI Triage panel to structure your productive day.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div 
                  key={task._id} 
                  className={`glass rounded-2xl p-5 border transition-all duration-200 flex items-center justify-between relative overflow-hidden group ${
                    task.status === 'Completed' 
                      ? 'border-emerald-500/25 bg-emerald-500/5 dark:bg-emerald-950/5' 
                      : task.status === 'Missed' 
                      ? 'border-red-500/25 bg-red-500/5 dark:bg-red-950/5 opacity-60' 
                      : 'border-slate-200 dark:border-darkBorder bg-white/40 dark:bg-darkCard/40'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Interactive Completion Circle */}
                    <button
                      onClick={() => handleToggleComplete(task)}
                      className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                        task.status === 'Completed'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                          : task.status === 'Missed'
                          ? 'bg-red-500/10 border-red-500/30 text-red-500'
                          : 'border-slate-300 dark:border-darkBorder hover:border-slate-500 dark:hover:border-gray-500 text-transparent hover:text-slate-400 dark:hover:text-gray-500'
                      }`}
                    >
                      <Check size={16} className={task.status === 'Completed' ? 'stroke-[3px]' : ''} />
                    </button>

                    <div>
                      <h4 className={`text-base font-bold transition-all ${
                        task.status === 'Completed' 
                          ? 'line-through text-slate-400 dark:text-gray-500' 
                          : 'text-slate-800 dark:text-gray-100'
                      }`}>
                        {task.title}
                      </h4>
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 font-semibold">
                          {getCategoryIcon(task.category)}
                          {task.category}
                        </span>
                        <span className="w-1 h-1 bg-slate-300 dark:bg-darkBorder rounded-full"></span>
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-gray-400 font-semibold">
                          <Clock size={12} className="text-neonBlue" />
                          {task.suggestedStartTime} ({task.durationMinutes >= 60 ? `${Math.round(task.durationMinutes / 60 * 10) / 10}h` : `${task.durationMinutes}m`})
                        </span>
                        {task.earlyBird && (
                          <>
                            <span className="w-1 h-1 bg-slate-300 dark:bg-darkBorder rounded-full"></span>
                            <span className="text-[10px] bg-yellow-500/10 border border-yellow-500/20 text-yellow-600 dark:text-yellow-500 px-1.5 py-0.5 rounded-md font-extrabold flex items-center gap-0.5">
                              <Zap size={10} className="fill-yellow-500" />
                              Early Bird +5
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeleteTask(task._id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/5 rounded-lg border border-transparent hover:border-red-200 dark:hover:border-red-500/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                      title="Delete Task"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Debrief Wizard overlay */}
      {isDebriefOpen && (
        <DailyDebrief 
          tasks={tasks}
          onClose={() => setIsDebriefOpen(false)}
          onDebriefSuccess={() => {
            setIsDebriefOpen(false);
            fetchTodayTasks();
            fetchLatestDistraction();
            fetchTodayLog();
          }}
        />
      )}
    </div>
  );
};

export default Dashboard;
