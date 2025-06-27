import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Market from './models/marketModel.js'; // Adjust path if needed

// Load environment variables (like MONGO_URI)
dotenv.config();

// 1. Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error(`❌ DB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

// 2. Define markets (safe seed — no duplicate market names)
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
  {
    marketId: 'MKT004',
    name: 'Milan Morning',
    openTime: '10:20 AM',
    closeTime: '11:20 AM',
    isBettingOpen: true,
  }
];

// 3. Insert markets safely without deleting existing (you can clear if needed)
const seedMarkets = async () => {
  try {
    for (const entry of markets) {
      const exists = await Market.findOne({ name: entry.name });

      if (exists) {
        console.log(`⚠️  Market "${entry.name}" already exists - skipping`);
        continue;
      }

      const newMarket = new Market(entry);
      await newMarket.save();
      console.log(`✅ Market "${entry.name}" inserted`);
    }

    console.log('🎉 Market seeding finished');
    process.exit(0); // Exit success
  } catch (error) {
    console.error('❌ Error inserting markets:', error);
    process.exit(1);
  }
};

// Run Script
const run = async () => {
  await connectDB();
  await seedMarkets();
};

run();
