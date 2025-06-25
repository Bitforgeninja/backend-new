import cron from 'node-cron';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import Market from '../models/marketModel.js';

// Extend dayjs with required plugins
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);

export function scheduleMarketTasks() {
  console.log('🕐 Initializing market betting scheduler...');

  // 📍 Runs every minute to check market status like open/close
  cron.schedule('* * * * *', async () => {
    try {
      const now = dayjs();
      const nowIST = now.tz('Asia/Kolkata');
      const todayDateStr = nowIST.format('YYYY-MM-DD');

      console.log(`\n📅 [${nowIST.format('YYYY-MM-DD HH:mm:ss')} IST] Running market scheduler...`);

      const markets = await Market.find();
      console.log(`🔍 Found ${markets.length} markets to check...`);

      for (let market of markets) {
        const openDeadline = dayjs.tz(`${todayDateStr} ${market.openTime}`, 'YYYY-MM-DD hh:mm A', 'Asia/Kolkata').subtract(10, 'minute');
        const closeDeadline = dayjs.tz(`${todayDateStr} ${market.closeTime}`, 'YYYY-MM-DD hh:mm A', 'Asia/Kolkata').subtract(10, 'minute');

        console.log(`\n📍 Market: ${market.name}`);
        console.log(`   🔓 Starts At: 00:00 AM`);
        console.log(`   🕛 Open Time: ${market.openTime} → Close Open Betting At: ${openDeadline.format('hh:mm A')}`);
        console.log(`   🕖 Close Time: ${market.closeTime} → Close Market At: ${closeDeadline.format('hh:mm A')}`);
        console.log(`   ⏱ Current Time: ${nowIST.format('hh:mm A')}`);
        console.log(`   🔐 isBettingOpen: ${market.isBettingOpen} | 🟢 openBetting: ${market.openBetting}`);

        const updates = {};

        // ✅ Auto-reset: Reopen markets between 12:00 AM and 2:00 AM IST
        const hour = nowIST.hour();
        if (hour >= 0 && hour < 2) {
          if (!market.isBettingOpen || !market.openBetting) {
            updates.isBettingOpen = true;
            updates.openBetting = true;
            console.log(`   🌙 Auto-reset: Reopening betting window (00:00–02:00 IST)`);
          }
        }

        // ✅ Close open betting (10 minutes before open time)
        if (nowIST.isAfter(openDeadline) && market.openBetting) {
          updates.openBetting = false;
          console.log(`   🚫 Closing open betting`);
        }

        // ✅ Close full market (10 minutes before close time)
        if (nowIST.isAfter(closeDeadline) && market.isBettingOpen) {
          updates.isBettingOpen = false;
          console.log(`   ❌ Closing full market betting`);
        }

        // ✅ Save updates if any
        if (Object.keys(updates).length > 0) {
          await Market.findByIdAndUpdate(market._id, { $set: updates });
          console.log(`   🔄 Updated market flags:`, updates);
        } else {
          console.log(`   ✅ No updates needed`);
        }
      }

    } catch (err) {
      console.error('❌ Error in market scheduler:', err);
    }
  });

  console.log('✅ Market scheduler running every minute...');

  // 🔄 RESULT RESET TASK – runs every night at 12:00 AM IST to reset results
  cron.schedule('30 18 * * *', async () => {
    const nowIST = dayjs().tz('Asia/Kolkata');
    console.log(`\n🕛 [${nowIST.format('YYYY-MM-DD HH:mm:ss')} IST] Running daily result reset...`);

    try {
      await Market.updateMany({}, { $set: { result: "xxx-xx-xxx" } });
      console.log('✅ All market results reset to default (xxx-xx-xxx)');
    } catch (error) {
      console.error('❌ Error resetting market results:', error);
    }
  });

  console.log('✅ Result reset scheduler running every night at 12:00 AM IST...');
}
