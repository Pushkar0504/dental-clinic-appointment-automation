const express = require('express');
const { ObjectId } = require('mongodb');
const { getAppointmentsCollection } = require('../db');
const { sendWhatsAppMessage, toLocalNumber } = require('../evolution');
const { confirmationMessage } = require('../messages');

const router = express.Router();
const TZ = process.env.TIMEZONE || 'Asia/Kolkata';

// Current local time in the clinic timezone as "YYYY-MM-DD HH:mm:ss"
function nowLocal() {
  return new Date().toLocaleString('sv-SE', { timeZone: TZ });
}

function toApiAppointment({ _id, ...appointment }) {
  return { ...appointment, id: _id.toString() };
}

function parseAppointmentId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    const appointments = await getAppointmentsCollection()
      .find({}, {
        projection: {
          patient_name: 1,
          whatsapp_number: 1,
          appointment_date: 1,
          appointment_time: 1,
          confirmation_sent: 1,
          reminder_sent: 1,
          status: 1,
          created_at: 1,
        },
      })
      .sort({ appointment_date: 1, appointment_time: 1, _id: 1 })
      .toArray();
    res.json(appointments.map(toApiAppointment));
  } catch (err) {
    console.error('[api] list failed:', err.message);
    res.status(500).json({ error: 'Could not load appointments' });
  }
});

// POST /api/appointments  -> save, then send WhatsApp confirmation
router.post('/', async (req, res) => {
  const { patient_name, whatsapp_number, appointment_date, appointment_time } = req.body || {};

  const name = String(patient_name || '').trim();
  const phone = toLocalNumber(whatsapp_number);
  const date = String(appointment_date || '');
  const time = String(appointment_time || '').slice(0, 5);

  if (!name) return res.status(400).json({ error: 'Patient name is required' });
  if (!phone) return res.status(400).json({ error: 'Enter a valid 10-digit Indian WhatsApp number' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Appointment date is required' });
  if (!/^\d{2}:\d{2}$/.test(time)) return res.status(400).json({ error: 'Appointment time is required' });
  if (`${date} ${time}:00` <= nowLocal()) {
    return res.status(400).json({ error: 'Appointment must be in the future' });
  }

  try {
    // Step 1: save
    const collection = getAppointmentsCollection();
    const appt = {
      patient_name: name,
      whatsapp_number: phone,
      appointment_date: date,
      appointment_time: time,
      confirmation_sent: false,
      reminder_sent: false,
      status: 'scheduled',
      created_at: new Date(),
    };
    const { insertedId } = await collection.insertOne(appt);
    appt._id = insertedId;

    // Step 2: send confirmation
    let warning = null;
    try {
      await sendWhatsAppMessage(appt.whatsapp_number, confirmationMessage(appt));
      await collection.updateOne({ _id: appt._id }, { $set: { confirmation_sent: true } });
      appt.confirmation_sent = true;
    } catch (err) {
      console.error(`[whatsapp] confirmation failed for appointment ${appt._id}:`, err.message);
      warning = 'Appointment saved, but the WhatsApp confirmation could not be sent.';
    }

    res.status(201).json({ appointment: toApiAppointment(appt), warning });
  } catch (err) {
    console.error('[api] create failed:', err.message);
    res.status(500).json({ error: 'Could not save appointment' });
  }
});

// PATCH /api/appointments/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const id = parseAppointmentId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Scheduled appointment not found' });
    const appointment = await getAppointmentsCollection().findOneAndUpdate(
      { _id: id, status: 'scheduled' },
      { $set: { status: 'cancelled' } },
      { returnDocument: 'after' }
    );
    if (!appointment) return res.status(404).json({ error: 'Scheduled appointment not found' });
    res.json(toApiAppointment(appointment));
  } catch (err) {
    console.error('[api] cancel failed:', err.message);
    res.status(500).json({ error: 'Could not cancel appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseAppointmentId(req.params.id);
    if (!id) return res.status(404).json({ error: 'Appointment not found' });
    const { deletedCount } = await getAppointmentsCollection().deleteOne({ _id: id });
    if (!deletedCount) return res.status(404).json({ error: 'Appointment not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error('[api] delete failed:', err.message);
    res.status(500).json({ error: 'Could not delete appointment' });
  }
});

module.exports = router;
