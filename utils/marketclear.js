import cron from 'node-cron';
import Market from './models/marketModel.js';

// Function to clear results and save them to MarketResults
const clearMarketResults = async () => {
  try {
    const markets = await Market.find({});  // Fetch all markets
    markets.forEach(async (market) => {
      // Clear results in the original Market schema
      market.results = {};  // Reset the results object
      await market.save();
    });

    console.log("Market results cleared and saved to MarketResults at", new Date());
  } catch (error) {
    console.error("Error clearing market results:", error);
  }
};

// Schedule the task to run at 12 midnight every day
cron.schedule('0 0 * * *', clearMarketResults, {
  scheduled: true,
  timezone: "Asia/Kolkata"  // Set timezone to India
});
