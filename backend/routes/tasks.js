const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const User = require('../models/User');
const DailyLog = require('../models/DailyLog');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Helper to get start and end of today in local/server time
const getTodayRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// @route   GET /api/tasks
// @desc    Get all tasks for today
// @access  Protected
router.get('/', auth, async (req, res) => {
  try {
    const { start, end } = getTodayRange();
    const tasks = await Task.find({
      userId: req.user.id,
      createdAt: { $gte: start, $lte: end }
    }).sort({ executionOrder: 1 });
    
    res.json(tasks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching tasks' });
  }
});

// @route   POST /api/tasks/triage
// @desc    Submit raw list, run Gemini AI scheduling or fallback, save and return tasks with reality check
// @access  Protected
router.post('/triage', auth, async (req, res) => {
  const { rawTasks } = req.body;
  if (!rawTasks || typeof rawTasks !== 'string') {
    return res.status(400).json({ message: 'rawTasks text is required' });
  }

  try {
    let parsedTasks = [];
    let realityCheck = '';
    let successUsingGemini = false;

    // Try calling the Gemini API
    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: "OBJECT",
              properties: {
                tasks: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      title: { type: "STRING", description: "Clean title of the task (remove time references or list bullet numbers from the title itself)" },
                      category: { type: "STRING", enum: ["Work", "Learning", "Health", "Personal", "Chores"] },
                      suggestedStartTime: { type: "STRING", description: "Estimated start time in HH:MM format (24-hour style)" },
                      durationMinutes: { type: "INTEGER", description: "Estimated duration of the task in minutes. E.g. '9 to 5' is 480 minutes, '1 hour' is 60, 'from 5 to 6 rest' is 60" }
                    },
                    required: ["title", "category", "suggestedStartTime", "durationMinutes"]
                  }
                },
                realityCheck: { type: "STRING", description: "Feasibility summary. Give a reality check: is it physically possible to complete all these tasks in 24 hours, leaving time for sleep and rest? Limit to 2-3 sentences." }
              },
              required: ["tasks", "realityCheck"]
            }
          }
        });

        const prompt = `You are a high-performance productivity planner. Analyze the user's raw daily task list.
        Task list:
        """
        ${rawTasks}
        """

        Requirements:
        1. Break the input text down into individual task items.
        2. Clean up each task title (e.g. "Go to college from 9 to 5" -> "Go to college", "from 5 to 6 rest" -> "Rest", "form 5 to 6 rest" -> "Rest").
        3. Assign each task a category: "Work", "Learning", "Health", "Personal", "Chores".
        4. Calculate the start time (suggestedStartTime) in "HH:MM" 24-hour format and duration (durationMinutes) in minutes. If they specify absolute time bounds (like "9 to 5" or "8 to 5"), set start time to 09:00 (or 08:00) and duration to 480 (or 540) minutes.
        5. Write a "realityCheck" summary. Assess if their tasks fit in a typical day (12-16 active hours max). Warn them if they are trying to cram too much or if tasks overlap impossibly.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const data = JSON.parse(responseText);
        
        if (data && Array.isArray(data.tasks)) {
          parsedTasks = data.tasks;
          realityCheck = data.realityCheck;
          successUsingGemini = true;
        }
      } catch (geminiError) {
        console.error('Gemini API execution failed, utilizing fallback parser:', geminiError.message);
      }
    }

    // Heuristic Fallback if Gemini is not set up or fails
    if (!successUsingGemini) {
      const lines = rawTasks
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .map(l => l.replace(/^[-*•\d.\s]+/, ''));

      let scheduleTime = new Date();
      scheduleTime.setHours(9, 0, 0, 0);

      lines.forEach((line, index) => {
        let duration = 45;
        let cleanTitle = line;
        
        // Match start and end range bounds like "from 9 to 5" or "9 to 5" or "5 to 6 rest"
        const rangeMatch = line.match(/(?:(?:from|form)\s+)?(\d+)\s+to\s+(\d+)\s*(?::\d+)?\s*(.*)/i);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1], 10);
          const end = parseInt(rangeMatch[2], 10);
          let extra = (rangeMatch[3] || '').trim();
          
          let startHr = start;
          let endHr = end;
          if (startHr < 7 && startHr > 0) startHr += 12; // assumed PM
          if (endHr < 12 && endHr > 0 && endHr < startHr) endHr += 12; // assumed PM/next day
          duration = (endHr - startHr) * 60;
          if (duration < 0) duration = 60;

          const tempTime = new Date();
          tempTime.setHours(start, 0, 0, 0);
          const hours = String(tempTime.getHours()).padStart(2, '0');
          const minutes = String(tempTime.getMinutes()).padStart(2, '0');

          cleanTitle = extra || line;
          // Capitalize cleanTitle
          cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

          let category = 'Work';
          const lower = cleanTitle.toLowerCase();
          if (lower.includes('gym') || lower.includes('workout') || lower.includes('run') || lower.includes('walk') || lower.includes('exercise')) {
            category = 'Health';
          } else if (lower.includes('eat') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('break') || lower.includes('rest')) {
            category = 'Personal';
          } else if (lower.includes('read') || lower.includes('study') || lower.includes('learn') || lower.includes('dsa')) {
            category = 'Learning';
          }

          parsedTasks.push({
            title: cleanTitle,
            category,
            suggestedStartTime: `${hours}:${minutes}`,
            durationMinutes: duration
          });
        } else {
          // Parse relative durations like "2 hours" or "45 mins"
          const hourMatch = line.match(/(\d+(?:\.\d+)?)\s*h(?:our)?s?/i);
          const minMatch = line.match(/(\d+)\s*m(?:in)?s?/i);
          if (hourMatch) {
            duration = Math.round(parseFloat(hourMatch[1]) * 60);
          } else if (minMatch) {
            duration = parseInt(minMatch[1], 10);
          }

          let category = 'Work';
          const lower = line.toLowerCase();
          if (lower.includes('gym') || lower.includes('workout') || lower.includes('run') || lower.includes('walk') || lower.includes('exercise')) {
            category = 'Health';
          } else if (lower.includes('eat') || lower.includes('lunch') || lower.includes('dinner') || lower.includes('break') || lower.includes('rest')) {
            category = 'Personal';
          } else if (lower.includes('read') || lower.includes('study') || lower.includes('learn') || lower.includes('dsa')) {
            category = 'Learning';
          }

          const hours = String(scheduleTime.getHours()).padStart(2, '0');
          const minutes = String(scheduleTime.getMinutes()).padStart(2, '0');

          parsedTasks.push({
            title: line,
            category,
            suggestedStartTime: `${hours}:${minutes}`,
            durationMinutes: duration
          });

          scheduleTime.setMinutes(scheduleTime.getMinutes() + duration + 15);
        }
      });

      const totalMins = parsedTasks.reduce((sum, t) => sum + t.durationMinutes, 0);
      const totalHrs = Math.round((totalMins / 60) * 10) / 10;
      if (totalHrs > 10) {
        realityCheck = `Local Heuristic Warning: Your tasks require ${totalHrs} hours today. This exceeds normal daily limits. Please streamline your workload.`;
      } else {
        realityCheck = `Local Heuristic Check: Total duration is ${totalHrs} hours. Your schedule fits nicely within a productive day!`;
      }
      
      if (!process.env.GEMINI_API_KEY) {
        realityCheck += " (Configure GEMINI_API_KEY in .env to enable semantic AI reality checks).";
      }
    }

    // 2. Format and Save Tasks to Database
    const tasksToInsert = parsedTasks.map((t, index) => ({
      userId: req.user.id,
      title: t.title,
      category: t.category || 'Work',
      suggestedStartTime: t.suggestedStartTime,
      durationMinutes: t.durationMinutes,
      executionOrder: index + 1,
      status: 'Pending',
      createdAt: new Date()
    }));

    const savedTasks = await Task.insertMany(tasksToInsert);

    // 3. Persist realityCheck to DailyLog for today
    const todayStr = new Date().toISOString().split('T')[0];
    await DailyLog.findOneAndUpdate(
      { userId: req.user.id, date: todayStr },
      { $set: { realityCheck } },
      { upsert: true, new: true }
    );

    res.status(201).json({ tasks: savedTasks, realityCheck });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during task triaging' });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task details or status (handles points calculation)
// @access  Protected
router.put('/:id', auth, async (req, res) => {
  const { title, category, suggestedStartTime, durationMinutes, executionOrder, status, clientTime } = req.body;
  
  try {
    let task = await Task.findById(req.id || req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    const previousStatus = task.status;
    
    // Update fields
    if (title !== undefined) task.title = title;
    if (category !== undefined) task.category = category;
    if (suggestedStartTime !== undefined) task.suggestedStartTime = suggestedStartTime;
    if (durationMinutes !== undefined) task.durationMinutes = durationMinutes;
    if (executionOrder !== undefined) task.executionOrder = executionOrder;
    
    // Handle Gamification logic on status change
    let pointsChange = 0;
    
    if (status !== undefined && status !== previousStatus) {
      task.status = status;

      // 1. Transitioning to Completed
      if (status === 'Completed') {
        task.completedAt = new Date();
        let basePoints = 10;
        let isEarlyBird = false;
        
        // Calculate deadline
        const [sHours, sMins] = task.suggestedStartTime.split(':').map(Number);
        const taskDate = new Date(task.createdAt);
        const deadline = new Date(taskDate);
        deadline.setHours(sHours, sMins, 0, 0);
        deadline.setMinutes(deadline.getMinutes() + task.durationMinutes);
        
        // Compare with client completion time (or fallback to server current time)
        const completionTime = clientTime ? new Date(clientTime) : new Date();
        
        if (completionTime <= deadline) {
          basePoints += 5; // Early bird bonus
          isEarlyBird = true;
        }

        // Store points calculation on task
        task.set('earlyBird', isEarlyBird, { strict: false });
        pointsChange = basePoints;
      }
      // 2. Transitioning AWAY from Completed (deduct points to prevent exploit)
      else if (previousStatus === 'Completed') {
        const wasEarlyBird = task.get('earlyBird');
        pointsChange = wasEarlyBird ? -15 : -10;
        task.completedAt = undefined;
        task.set('earlyBird', undefined, { strict: false });
      }
    }

    await task.save();

    if (pointsChange !== 0) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { totalPoints: pointsChange } });
    }

    // Return the updated task and current user points for convenience
    const updatedUser = await User.findById(req.user.id).select('totalPoints');
    res.json({ task, totalPoints: updatedUser.totalPoints });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating task' });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task (reverts points if task was Completed)
// @access  Protected
router.delete('/:id', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.userId.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // If it was completed, deduct points first
    if (task.status === 'Completed') {
      const wasEarlyBird = task.get('earlyBird');
      const pointsDeduction = wasEarlyBird ? -15 : -10;
      await User.findByIdAndUpdate(req.user.id, { $inc: { totalPoints: pointsDeduction } });
    }

    await task.deleteOne();
    const updatedUser = await User.findById(req.user.id).select('totalPoints');
    res.json({ message: 'Task removed', totalPoints: updatedUser ? updatedUser.totalPoints : 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting task' });
  }
});

// @route   POST /api/tasks/carryover
// @desc    Clone pending tasks from previous days to today, marking old ones as Missed
// @access  Protected
router.post('/carryover', auth, async (req, res) => {
  try {
    const { start: todayStart } = getTodayRange();
    
    // Find incomplete/pending tasks from before today
    const pendingTasks = await Task.find({
      userId: req.user.id,
      status: 'Pending',
      createdAt: { $lt: todayStart }
    });

    if (pendingTasks.length === 0) {
      return res.json({ message: 'No pending tasks to carry over', count: 0 });
    }

    const carriedOverTasks = [];
    
    for (let task of pendingTasks) {
      // 1. Mark old task as Missed
      task.status = 'Missed';
      await task.save();

      // 2. Create new clone for today
      carriedOverTasks.push({
        userId: req.user.id,
        title: task.title,
        category: task.category,
        suggestedStartTime: task.suggestedStartTime,
        durationMinutes: task.durationMinutes,
        executionOrder: task.executionOrder,
        status: 'Pending',
        createdAt: new Date()
      });
    }

    const savedClones = await Task.insertMany(carriedOverTasks);
    res.json({ message: 'Successfully carried over tasks', count: savedClones.length, tasks: savedClones });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error carrying over tasks' });
  }
});

module.exports = router;
