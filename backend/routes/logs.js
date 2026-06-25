const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DailyLog = require('../models/DailyLog');
const Task = require('../models/Task');
const User = require('../models/User');

// @route   POST /api/logs/debrief
// @desc    Submit day's debrief, update task statuses, save DailyLog, and update user points
// @access  Protected
router.post('/debrief', auth, async (req, res) => {
  const { date, tasks } = req.body; // date: "YYYY-MM-DD", tasks: [{ id, status, distraction }]
  
  if (!date || !tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ message: 'Date and tasks array are required' });
  }

  try {
    let completedCount = 0;
    const distractionCounts = {};
    let totalPointsInc = 0;

    for (const t of tasks) {
      const dbTask = await Task.findById(t.id);
      if (!dbTask || dbTask.userId.toString() !== req.user.id) continue;

      const previousStatus = dbTask.status;
      const newStatus = t.status; // 'Completed' or 'Missed'

      dbTask.status = newStatus;
      
      if (newStatus === 'Completed') {
        completedCount++;
        if (previousStatus !== 'Completed') {
          dbTask.completedAt = new Date();
          let basePoints = 10;
          let isEarlyBird = false;

          // Calculate suggested deadline
          const [sHours, sMins] = dbTask.suggestedStartTime.split(':').map(Number);
          const taskDate = new Date(dbTask.createdAt);
          const deadline = new Date(taskDate);
          deadline.setHours(sHours, sMins, 0, 0);
          deadline.setMinutes(deadline.getMinutes() + dbTask.durationMinutes);

          // We assume debrief completes at the current time
          const completionTime = new Date();

          if (completionTime <= deadline) {
            basePoints += 5; // Early bird bonus
            isEarlyBird = true;
          }

          dbTask.set('earlyBird', isEarlyBird, { strict: false });
          totalPointsInc += basePoints;
        }
      } else if (newStatus === 'Missed') {
        if (previousStatus === 'Completed') {
          // Revert points if it was marked Completed before
          const wasEarlyBird = dbTask.get('earlyBird');
          totalPointsInc += wasEarlyBird ? -15 : -10;
          dbTask.completedAt = undefined;
          dbTask.set('earlyBird', undefined, { strict: false });
        }
        
        // Log distraction details
        const distraction = t.distraction || 'Other';
        distractionCounts[distraction] = (distractionCounts[distraction] || 0) + 1;
      }

      await dbTask.save();
    }

    const totalTasks = tasks.length;
    const efficiencyScore = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 100;

    // Determine primary distraction (highest occurrence)
    let primaryDistraction = 'None';
    let maxCount = 0;
    for (const [distraction, count] of Object.entries(distractionCounts)) {
      if (count > maxCount) {
        maxCount = count;
        primaryDistraction = distraction;
      }
    }

    // Upsert the daily log for this user & date
    const log = await DailyLog.findOneAndUpdate(
      { userId: req.user.id, date },
      { userId: req.user.id, date, efficiencyScore, primaryDistraction },
      { new: true, upsert: true }
    );

    // Commit user points changes
    if (totalPointsInc !== 0) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { totalPoints: totalPointsInc } });
    }

    const updatedUser = await User.findById(req.user.id).select('totalPoints');

    res.json({
      log,
      efficiencyScore,
      primaryDistraction,
      totalPoints: updatedUser ? updatedUser.totalPoints : 0
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error processing daily debrief' });
  }
});

// @route   GET /api/logs/analytics
// @desc    Get DailyLogs for the past 7 days (sorted by date ascending)
// @access  Protected
router.get('/analytics', auth, async (req, res) => {
  try {
    const logs = await DailyLog.find({ userId: req.user.id })
      .sort({ date: -1 })
      .limit(7);

    // Return in chronologically ascending order for the chart
    res.json(logs.reverse());
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving analytics logs' });
  }
});

// @route   GET /api/logs/latest-distraction
// @desc    Get the latest DailyLog distraction data for the AI Coach banner
// @access  Protected
router.get('/latest-distraction', auth, async (req, res) => {
  try {
    const latestLog = await DailyLog.findOne({ userId: req.user.id })
      .sort({ date: -1 });
      
    res.json(latestLog || { efficiencyScore: 100, primaryDistraction: 'None' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching latest distraction' });
  }
});

// @route   GET /api/logs/today
// @desc    Get today's DailyLog (which contains the realityCheck)
// @access  Protected
router.get('/today', auth, async (req, res) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    const log = await DailyLog.findOne({ userId: req.user.id, date: todayStr });
    res.json(log || { efficiencyScore: 0, primaryDistraction: 'None', realityCheck: '' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching today log' });
  }
});

module.exports = router;
