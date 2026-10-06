const CLINIC = "Dr. Bhosale's Shree Dental Clinic";
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

// "2026-10-10" -> "10 October 2026"
function formatDate(dateStr) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

// "17:30" or "17:30:00" -> "5:30 PM"
function formatTime(timeStr) {
  const [h, m] = String(timeStr).split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function confirmationMessage(a) {
  return `Hello ${a.patient_name} 👋

Your appointment has been successfully confirmed at ${CLINIC}. 🦷

👨‍⚕️ Doctor: Dr. Archana Bhosale
📅 Date: ${formatDate(a.appointment_date)}
⏰ Time: ${formatTime(a.appointment_time)}

📍 Please arrive 10 minutes before your scheduled appointment.

📞 Contact: 9823305021

Thank you for choosing ${CLINIC}! 🦷`;
}

function reminderMessage(a) {
  return `Hello ${a.patient_name} 👋

This is a reminder for your dental appointment. 🦷

👨‍⚕️ Doctor: Dr. Archana Bhosale
📅 Date: ${formatDate(a.appointment_date)}
⏰ Time: ${formatTime(a.appointment_time)}

📞 Contact: 9823305021

We look forward to seeing you! 😊

Thank you,
${CLINIC}`;
}

module.exports = { confirmationMessage, reminderMessage };
