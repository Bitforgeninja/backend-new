import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Market from './models/marketModel.js'; // Adjust the path to your Market model

// Load environment variables
dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

// Seed data
const markets = [
  {
    marketId: 'MKT001',
    name: 'Milan Day',
    openTime: '10:00 AM',
    closeTime: '5:00 PM',
    isBettingOpen: true,
  },
  {
    marketId: 'MKT002',
    name: 'Rajdhani Night',
    openTime: '9:00 PM',
    closeTime: '11:00 PM',
    isBettingOpen: true,
  },
  {
    marketId: 'MKT003',
    name: 'Kalyan',
    openTime: '12:00 PM',
    closeTime: '1:30 PM',
    isBettingOpen: false,
  },
];

// Insert markets into the database
const seedMarkets = async () => {
  try {
    await Market.deleteMany(); // Clear existing markets (optional)
    const createdMarkets = await Market.insertMany(markets);

    console.log('Markets seeded successfully:', createdMarkets);
    process.exit(0); // Exit process with success
  } catch (error) {
    console.error('Error seeding markets:', error);
    process.exit(1); // Exit process with failure
  }
};

// Run the seed script
const runSeed = async () => {
  await connectDB();
  await seedMarkets();
};

runSeed();
