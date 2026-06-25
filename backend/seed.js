const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskforce-ai';

const seedUsers = [
  { username: 'AlphaAchiever', totalPoints: 420 },
  { username: 'FocusMaster', totalPoints: 380 },
  { username: 'DeepWorker', totalPoints: 295 },
  { username: 'AntiDistractor', totalPoints: 210 },
  { username: 'ProductivePete', totalPoints: 155 },
  { username: 'TaskTitan', totalPoints: 95 },
  { username: 'CalmCoder', totalPoints: 40 }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected for seeding...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    for (let mockUser of seedUsers) {
      await User.findOneAndUpdate(
        { username: mockUser.username },
        {
          username: mockUser.username,
          password: hashedPassword,
          totalPoints: mockUser.totalPoints,
          createdAt: new Date()
        },
        { upsert: true, new: true }
      );
      console.log(`Seeded user: ${mockUser.username} with ${mockUser.totalPoints} points.`);
    }

    console.log('Database seeded successfully!');
    mongoose.connection.close();
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
}

seed();
