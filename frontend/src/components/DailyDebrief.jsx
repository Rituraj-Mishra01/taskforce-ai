import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  X, Check, AlertCircle, Info, Zap, Smile, 
  HelpCircle, ShieldAlert, Sparkles
} from 'lucide-react';

const DailyDebrief = ({ tasks, onClose, onDebriefSuccess }) => {
  const { token, updatePoints } = useContext(AuthContext);
  const [submitting, setSubmitting] = useState(false);
  
  // Local list copy to store state during debrief
  const [wizardTasks, setWizardTasks] = useState(
    tasks.map(t => ({
      id: t._id,
      title: t.title,
      category: t.category,
      status: t.status, // 'Pending', 'Completed', 'Missed'
      distraction: '' // 'Social Media', 'Meetings', 'Fatigue', 'Gaming', 'Other'
    }))
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentTask = wizardTasks[currentIndex];

  const handleSetStatus = (status) => {
    const updated = [...wizardTasks];
    updated[currentIndex].status = status;
    
    if (status === 'Completed') {
      updated[currentIndex].distraction = '';
      setWizardTasks(updated);
      advanceWizard();
    } else {
      // For missed tasks, wait for distraction selection
      setWizardTasks(updated);
    }
  };

  const handleSetDistraction = (distraction) => {
    const updated = [...wizardTasks];
    updated[currentIndex].distraction = distraction;
    setWizardTasks(updated);
    advanceWizard();
  };

  const advanceWizard = () => {
    if (currentIndex < wizardTasks.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsFinished(true);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFinished(false);
    }
  };

  // Calculate local stats before submission
  const completedCount = wizardTasks.filter(t => t.status === 'Completed').length;
  const missedCount = wizardTasks.filter(t => t.status === 'Missed').length;
  const efficiencyScore = wizardTasks.length > 0 ? Math.round((completedCount / wizardTasks.length) * 100) : 100;

  // Find primary distraction locally
  const getLocalPrimaryDistraction = () => {
    const counts = {};
    wizardTasks.forEach(t => {
      if (t.status === 'Missed' && t.distraction) {
        counts[t.distraction] = (counts[t.distraction] || 0) + 1;
      }
    });

    let primary = 'None';
    let max = 0;
    for (const [dist, count] of Object.entries(counts)) {
      if (count > max) {
        max = count;
        primary = dist;
      }
    }
    return primary;
  };

  const primaryDistraction = getLocalPrimaryDistraction();

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/logs/debrief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
          tasks: wizardTasks
        })
      });
      const data = await res.json();
      if (res.ok) {
        updatePoints(data.totalPoints);
        onDebriefSuccess();
      } else {
        alert(data.message || 'Failed to submit debrief.');
      }
    } catch (err) {
      console.error('Error submitting debrief:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-darkBg/80 backdrop-blur-md">
      <div className="w-full max-w-lg glass rounded-2xl border border-darkBorder shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glowing gradient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-neonPurple opacity-10 blur-3xl pointer-events-none"></div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-darkBorder flex justify-between items-center relative z-10">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-neonPurple animate-pulse" />
            <h3 className="font-extrabold text-white text-lg">Daily Debrief Engine</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-300 hover:bg-darkBorder/40 rounded-lg transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 relative z-10">
          {!isFinished ? (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  <span>Task {currentIndex + 1} of {wizardTasks.length}</span>
                  <span>{Math.round(((currentIndex) / wizardTasks.length) * 100)}% Complete</span>
                </div>
                <div className="w-full bg-darkBg h-2 rounded-full overflow-hidden border border-darkBorder">
                  <div 
                    className="bg-gradient-to-r from-neonBlue to-neonPurple h-full transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / wizardTasks.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Task Details Card */}
              <div className="p-5 bg-darkBg/60 border border-darkBorder rounded-2xl space-y-3">
                <span className="text-[10px] bg-neonBlue/10 border border-neonBlue/20 text-neonBlue font-extrabold uppercase px-2 py-0.5 rounded-md">
                  {currentTask.category}
                </span>
                <h4 className="text-lg font-bold text-gray-100">{currentTask.title}</h4>
              </div>

              {/* Step 1: Complete/Missed selection */}
              <div className="space-y-3">
                <h5 className="text-sm font-semibold text-gray-300">Did you complete this task successfully?</h5>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleSetStatus('Completed')}
                    className={`py-4 px-4 rounded-xl border font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      currentTask.status === 'Completed'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                        : 'bg-darkBg border-darkBorder hover:border-gray-600 text-gray-300'
                    }`}
                  >
                    <Check size={18} />
                    <span>Yes, I did it</span>
                  </button>
                  <button
                    onClick={() => handleSetStatus('Missed')}
                    className={`py-4 px-4 rounded-xl border font-bold text-sm cursor-pointer transition-all flex items-center justify-center gap-2 ${
                      currentTask.status === 'Missed'
                        ? 'bg-red-500/10 border-red-500 text-red-400'
                        : 'bg-darkBg border-darkBorder hover:border-gray-600 text-gray-300'
                    }`}
                  >
                    <X size={18} />
                    <span>No, I missed it</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Distraction selection (only if marked Missed) */}
              {currentTask.status === 'Missed' && (
                <div className="space-y-3 animate-fadeIn">
                  <h5 className="text-sm font-semibold text-gray-300 flex items-center gap-1">
                    <ShieldAlert size={16} className="text-red-400" />
                    What distracted you?
                  </h5>
                  <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
                    {['Social Media', 'Meetings', 'Fatigue', 'Gaming', 'Other'].map((dist) => (
                      <button
                        key={dist}
                        onClick={() => handleSetDistraction(dist)}
                        className={`py-3 px-3 rounded-lg border text-left cursor-pointer transition-all ${
                          currentTask.distraction === dist
                            ? 'bg-red-500/20 border-red-500 text-red-200'
                            : 'bg-darkBg/60 border-darkBorder hover:border-gray-600 text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {dist}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Summary screen */
            <div className="space-y-6 animate-fadeIn">
              <div className="text-center py-4">
                <Smile size={48} className="text-neonPurple mx-auto mb-2 animate-bounce" />
                <h4 className="text-xl font-bold text-white">Daily Debrief Review</h4>
                <p className="text-xs text-gray-400">Here is your performance report for today</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-darkBg/60 border border-darkBorder rounded-xl text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Efficiency</span>
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-neonBlue to-neonPurple bg-clip-text text-transparent">
                    {efficiencyScore}%
                  </span>
                </div>
                <div className="p-4 bg-darkBg/60 border border-darkBorder rounded-xl text-center">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Top Distraction</span>
                  <span className={`text-base font-extrabold block truncate ${
                    primaryDistraction === 'None' ? 'text-emerald-400' : 'text-red-400'
                  }`}>
                    {primaryDistraction}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-darkBg/40 border border-darkBorder rounded-xl text-xs space-y-2">
                <div className="flex justify-between font-semibold text-gray-300">
                  <span>Total Tasks:</span>
                  <span>{wizardTasks.length}</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-semibold">
                  <span>Completed Tasks:</span>
                  <span>{completedCount}</span>
                </div>
                <div className="flex justify-between text-red-400 font-semibold">
                  <span>Missed Tasks:</span>
                  <span>{missedCount}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-darkBorder bg-darkBg/40 flex justify-between items-center relative z-10">
          <button
            onClick={handleBack}
            disabled={currentIndex === 0 && !isFinished}
            className="py-2.5 px-4 bg-darkBg hover:bg-darkBorder/30 border border-darkBorder text-gray-400 hover:text-white font-semibold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          
          {isFinished ? (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="py-2.5 px-5 bg-gradient-to-r from-neonBlue to-neonPurple hover:from-blue-600 hover:to-violet-600 text-white font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Zap size={12} className="fill-white" />
                  <span>Sync & Finalize</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={advanceWizard}
              className="py-2.5 px-5 bg-darkBorder hover:bg-gray-700 text-gray-200 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyDebrief;
