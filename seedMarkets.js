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

// Seed markets (original logic untouched)
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

// Inserts markets (this was your original logic)
const seedMarkets = async () => {
  try {
    await Market.deleteMany(); // optional: reset collection
    const createdMarkets = await Market.insertMany(markets);
    console.log('Markets seeded successfully:', createdMarkets);
  } catch (error) {
    console.error('Error seeding markets:', error);
    process.exit(1);
  }
};

// ✅ Additional: Add 30 days results for "Milan Morning"
const chartData = [
  { date: '2025-06-01', open: '218', close: '458' },
  { date: '2025-06-02', open: '307', close: '258' },
  { date: '2025-06-03', open: '168', close: '439' },
  { date: '2025-06-04', open: '746', close: '195' },
  { date: '2025-06-05', open: '326', close: '703' },
  { date: '2025-06-06', open: '942', close: '067' },
  { date: '2025-06-07', open: '319', close: '254' },
  { date: '2025-06-08', open: '285', close: '707' },
  { date: '2025-06-09', open: '468', close: '184' },
  { date: '2025-06-10', open: '011', close: '502' },
  { date: '2025-06-11', open: '390', close: '246' },
  { date: '2025-06-12', open: '314', close: '105' },
  { date: '2025-06-13', open: '204', close: '370' },
  { date: '2025-06-14', open: '238', close: '431' },
  { date: '2025-06-15', open: '526', close: '603' },
  { date: '2025-06-16', open: '789', close: '167' },
  { date: '2025-06-17', open: '325', close: '741' },
  { date: '2025-06-18', open: '603', close: '902' },
  { date: '2025-06-19', open: '157', close: '821' },
  { date: '2025-06-20', open: '410', close: '663' },
  { date: '2025-06-21', open: '457', close: '058' },
  { date: '2025-06-22', open: '308', close: '599' },
  { date: '2025-06-23', open: '349', close: '670' },
  { date: '2025-06-24', open: '199', close: '285' },
  { date: '2025-06-25', open: '217', close: '461' },
  { date: '2025-06-26', open: '288', close: '248' },
  { date: '2025-06-27', open: '359', close: '804' },
  { date: '2025-06-28', open: '619', close: '172' },
  { date: '2025-06-29', open: '231', close: '603' },
  { date: '2025-06-30', open: '389', close: '740' }
];

// Logic to append results
const seedChartResults = async () => {
  const marketName = 'Milan Morning';

  const market = await Market.findOne({ name: marketName });
  if (!market) {
    console.log(`❌ Market "${marketName}" not found`);
    return;
  }

  for (const { date, open, close } of chartData) {
    const sum = (str) => str.split('').reduce((a, b) => a + Number(b), 0);
    const jodi = `${sum(open) % 10}${sum(close) % 10}`;

    market.results = {
      openNumber: open,
      closeNumber: close,
      openSingleDigit: sum(open) % 10,
      closeSingleDigit: sum(close) % 10,
      jodiResult: jodi,
      openSinglePanna: open,
      closeSinglePanna: close
    };

    market.updatedAt = new Date(date);
    await market.save();
    console.log(`✅ Seeded ${date} for ${marketName} → JODI: ${jodi}`);
  }
};

// Run both
const runSeed = async () => {
  await connectDB();
  await seedMarkets();         // original logic ✅
  await seedChartResults();    // new chart results ✅
  process.exit(0);
};

runSeed();
