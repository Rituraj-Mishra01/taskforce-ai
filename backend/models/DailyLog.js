const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: String, // format "YYYY-MM-DD"
    required: true
  },
  efficiencyScore: {
    type: Number,
    required: true,
    default: 0
  },
  primaryDistraction: {
    type: String,
    required: true,
    default: 'None'
  },
  realityCheck: {
    type: String,
    default: ''
  }
});

// Ensure a user can only have one daily log per date
DailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('DailyLog', DailyLogSchema);
