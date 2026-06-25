const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   GET /api/leaderboard
// @desc    Get top 10 users ranked by totalPoints
// @access  Public
router.get('/', async (req, res) => {
  try {
    const rankings = await User.find({})
      .select('username totalPoints')
      .sort({ totalPoints: -1 })
      .limit(10);

    res.json(rankings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error retrieving leaderboard rankings' });
  }
});

module.exports = router;
