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

  // ✅ Market open/close task – runs every minute
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
        console.log(`   🕛 Open Time: ${market.openTime} → Stop open at: ${openDeadline.format('hh:mm A')}`);
        console.log(`   🕖 Close Time: ${market.closeTime} → Stop full at: ${closeDeadline.format('hh:mm A')}`);
        console.log(`   ⏱ Now: ${nowIST.format('hh:mm A')}  | 🟢 isOpen: ${market.isBettingOpen}, 🔓 openBetting: ${market.openBetting}`);

        const updates = {};

        // 🔁 Auto-reset open markets between 12:00 AM and 2:00 AM IST
        const hour = nowIST.hour();
        if (hour >= 0 && hour < 2) {
          if (!market.isBettingOpen || !market.openBetting) {
            updates.isBettingOpen = true;
            updates.openBetting = true;
            console.log("   🌙 Auto-reset: Re-opening betting for new day");
          }
        }

        // ❌ Close open bets 10 mins before open time
        if (nowIST.isAfter(openDeadline) && market.openBetting) {
          updates.openBetting = false;
          console.log("   ⛔ Closing open betting (10 mins before open)");
        }

        // ❌ Close full betting 10 mins before close time
        if (nowIST.isAfter(closeDeadline) && market.isBettingOpen) {
          updates.isBettingOpen = false;
          console.log("   ❌ Closing full market");
        }

        // Apply updates if any
        if (Object.keys(updates).length > 0) {
          await Market.findByIdAndUpdate(market._id, { $set: updates });
          console.log("   🔄 Updated flags:", updates);
        } else {
          console.log("   ✅ No update needed.");
        }
      }

    } catch (err) {
      console.error('❌ Error in market scheduler:', err);
    }
  });

  console.log('✅ Betting open/close task running every minute...');

  // ✅ DAILY RESULT RESET – Runs every day at 5:00 AM IST to clear results
  cron.schedule('0 5 * * *', async () => {
    const nowIST = dayjs().tz('Asia/Kolkata');
    console.log(`\n🕛 [${nowIST.format('YYYY-MM-DD HH:mm:ss')} IST] Resetting all market results...`);

    try {
      await Market.updateMany({}, {
        $set: {
          results: {
            openNumber: 'xxx',
            closeNumber: 'xxx',
            openSingleDigit: 'x',
            closeSingleDigit: 'x',
            jodiResult: 'xx',
            openSinglePanna: 'xxx',
            closeSinglePanna: 'xxx',
          },
          isBettingOpen: false,
          openBetting: false
        }
      });

      console.log('✅ All market results reset to default');
    } catch (error) {
      console.error('❌ Failed to reset results:', error);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('✅ Result reset task scheduled at 5:00 AM IST daily✔');
}
