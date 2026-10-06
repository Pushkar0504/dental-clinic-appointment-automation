const cron = require('node-cron');
const { getAppointmentsCollection } = require('./db');
const { sendWhatsAppMessage } = require('./evolution');
const { reminderMessage } = require('./messages');

const TZ = process.env.TIMEZONE || 'Asia/Kolkata';
let running = false;

function localAppointmentWindow() {
  const [date, time] = new Date().toLocaleString('sv-SE', { timeZone: TZ }).split(' ');
  const [hour, minute] = time.split(':').map(Number);
  const nowMinutes = hour * 60 + minute;
  const endMinutes = Math.min(nowMinutes + 120, 23 * 60 + 59);
  const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  return { date, time: time.slice(0, 5), endTime };
}

/**
 * Finds appointments that are due a reminder and sends it.
 *
 * Due = scheduled, reminder not sent, today (clinic timezone), the appointment is
 * still in the future, and we are within 2 hours of it.
 *
 * A conditional MongoDB update claims each appointment atomically
 * (reminder_sent = true) BEFORE sending. If sending fails, the flag is reset and
 * the next minute's run retries.
 *
 * Because it checks "within 2 hours" rather than "exactly 2 hours", a server restart
 * or short outage never makes a reminder get missed.
 */
async function sendDueReminders() {
  if (running) return;
  running = true;
  try {
    const collection = getAppointmentsCollection();
    const { date, time, endTime } = localAppointmentWindow();
    const dueAppointments = await collection.find({
      status: 'scheduled',
      reminder_sent: false,
      appointment_date: date,
      appointment_time: { $gt: time, $lte: endTime },
    }).toArray();

    for (const candidate of dueAppointments) {
      const appt = await collection.findOneAndUpdate(
        { _id: candidate._id, status: 'scheduled', reminder_sent: false },
        { $set: { reminder_sent: true } },
        { returnDocument: 'after' }
      );
      if (!appt) continue;
      try {
        await sendWhatsAppMessage(appt.whatsapp_number, reminderMessage(appt));
        console.log(`[scheduler] reminder sent for appointment ${appt._id}`);
      } catch (err) {
        console.error(`[scheduler] reminder failed for appointment ${appt._id}:`, err.message);
        await collection.updateOne({ _id: appt._id }, { $set: { reminder_sent: false } });
      }
    }
  } catch (err) {
    console.error('[scheduler] run failed:', err.message);
  } finally {
    running = false;
  }
}

function startScheduler() {
  cron.schedule('* * * * *', sendDueReminders, { timezone: TZ });
  sendDueReminders(); // catch up immediately after a restart
  console.log(`[scheduler] running every minute (${TZ})`);
}

module.exports = { startScheduler, sendDueReminders };
