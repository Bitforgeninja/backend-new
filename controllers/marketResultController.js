import MarketResult from "../models/marketResultModel.js";
import moment from "moment-timezone";

export const storeMarketResult = async (market, date, openResult, closeResult) => {
  try {
    // ✅ Use passed date if available, else fallback to today's IST
    const istDate = date
      ? moment(date).tz("Asia/Kolkata").format("YYYY-MM-DD")
      : moment().tz("Asia/Kolkata").format("YYYY-MM-DD");

    console.log("📢 Storing Market Result for:", market.name, istDate);

    const openDigits = openResult.split("").map(Number);
    const closeDigits = closeResult.split("").map(Number);

    const openSingleDigit = openDigits.reduce((sum, digit) => sum + digit, 0) % 10;
    const closeSingleDigit = closeDigits.reduce((sum, digit) => sum + digit, 0) % 10;

    const jodiResult = `${openSingleDigit}${closeSingleDigit}`;

    await MarketResult.create({
      marketId: market.marketId,
      marketName: market.name,
      date: istDate, // ✅ Now dynamic based on input
      openNumber: openResult,
      closeNumber: closeResult,
      openSingleDigit,
      closeSingleDigit,
      jodiResult,
      openSinglePanna: openResult,
      closeSinglePanna: closeResult,
    });

    console.log("✅ Market Result Stored Successfully for date:", istDate);
  } catch (error) {
    console.error("❌ Error storing market result:", error.message);
  }
};
