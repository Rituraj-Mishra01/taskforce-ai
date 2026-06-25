import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Trophy, Zap, Award, Sparkles, Crown } from 'lucide-react';

const Leaderboard = () => {
  const { user, token } = useContext(AuthContext);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [token]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/leaderboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setRankings(data);
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return (
          <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-600 dark:text-yellow-500 rounded-lg">
            <Crown size={16} className="fill-yellow-500 animate-pulse" />
          </div>
        );
      case 2:
        return (
          <div className="p-1.5 bg-gray-400/15 border border-gray-400/30 text-gray-500 dark:text-gray-400 rounded-lg">
            <Award size={16} className="fill-gray-400" />
          </div>
        );
      case 3:
        return (
          <div className="p-1.5 bg-amber-600/10 border border-amber-600/30 text-amber-700 dark:text-amber-600 rounded-lg">
            <Award size={16} className="fill-amber-600" />
          </div>
        );
      default:
        return (
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-darkBg border border-slate-200 dark:border-darkBorder flex items-center justify-center text-xs font-bold text-slate-500 dark:text-gray-500">
            {rank}
          </div>
        );
    }
  };

  const maxScore = rankings.length > 0 ? Math.max(...rankings.map(r => r.totalPoints), 1) : 1;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-slate-100 dark:bg-darkBorder rounded-lg border border-slate-200 dark:border-transparent">
            <Trophy size={18} className="text-yellow-600 dark:text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Global Leaderboard</h2>
            <p className="text-xs text-slate-500 dark:text-gray-400">Compete with TaskForce AI operatives worldwide</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-500 font-semibold bg-yellow-500/5 border border-yellow-500/20 px-3 py-1.5 rounded-xl">
            <Sparkles size={12} className="animate-spin" />
            <span>Active Agent: {user.username}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-3">
          <div className="w-10 h-10 border-3 border-t-neonBlue border-r-transparent border-b-neonPurple border-l-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">Fetching global standings...</p>
        </div>
      ) : rankings.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-slate-200 dark:border-darkBorder">
          <p className="text-sm text-slate-500 dark:text-gray-500">No agent profiles registered in global network.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-slate-200 dark:border-darkBorder overflow-hidden shadow-lg">
          <div className="p-4 bg-slate-50 dark:bg-darkCard/30 border-b border-slate-200 dark:border-darkBorder grid grid-cols-12 text-xs font-bold text-slate-500 dark:text-gray-500 uppercase tracking-wider">
            <div className="col-span-2 text-center">Rank</div>
            <div className="col-span-6">Operative Profile</div>
            <div className="col-span-4 text-right pr-6">Efficiency Capital</div>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-darkBorder">
            {rankings.map((operative, index) => {
              const rank = index + 1;
              const isCurrentUser = user && operative.username === user.username;
              const percentageOfMax = Math.round((operative.totalPoints / maxScore) * 100);

              return (
                <div 
                  key={operative._id || operative.username} 
                  className={`grid grid-cols-12 items-center py-4.5 px-4 transition-all relative ${
                    isCurrentUser 
                      ? 'bg-neonBlue/5 border-l-2 border-l-neonBlue' 
                      : 'hover:bg-slate-50 dark:hover:bg-darkCard/10'
                  }`}
                >
                  {/* Rank Column */}
                  <div className="col-span-2 flex justify-center">
                    {getRankBadge(rank)}
                  </div>

                  {/* Username and Progress Column */}
                  <div className="col-span-6 flex flex-col gap-1.5">
                    <span className={`text-sm font-bold flex items-center gap-1.5 ${
                      isCurrentUser ? 'text-neonBlue' : 'text-slate-800 dark:text-gray-100'
                    }`}>
                      {operative.username}
                      {isCurrentUser && (
                        <span className="text-[9px] bg-neonBlue/10 dark:bg-neonBlue/20 border border-neonBlue/20 dark:border-neonBlue/30 text-neonBlue px-1.5 py-0.5 rounded-full font-extrabold uppercase tracking-wide">
                          You
                        </span>
                      )}
                    </span>
                    
                    {/* Visual Points Capacity Bar */}
                    <div className="w-4/5 h-1.5 bg-slate-100 dark:bg-darkBg rounded-full overflow-hidden border border-slate-200 dark:border-darkBorder">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          rank === 1 
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-500' 
                            : isCurrentUser 
                            ? 'bg-neonBlue' 
                            : 'bg-gradient-to-r from-neonBlue to-neonPurple'
                        }`}
                        style={{ width: `${percentageOfMax}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Points Capital Column */}
                  <div className="col-span-4 text-right pr-6">
                    <div className="inline-flex items-center gap-1 font-extrabold text-sm text-yellow-600 dark:text-yellow-500">
                      <Zap size={14} className="fill-yellow-500" />
                      <span>{operative.totalPoints.toLocaleString()} pts</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;
