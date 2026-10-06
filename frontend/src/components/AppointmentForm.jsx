import { useState } from 'react';

const empty = { patient_name: '', whatsapp_number: '', appointment_date: '', appointment_time: '' };

// Today's date in India, as YYYY-MM-DD, so past dates can't be picked.
const todayIST = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Kolkata' });

export default function AppointmentForm({ onSaved }) {
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'warning'|'error', text }

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || 'Something went wrong' });
        return;
      }
      setForm(empty);
      setMessage(
        data.warning
          ? { type: 'warning', text: data.warning }
          : { type: 'success', text: 'Appointment scheduled. WhatsApp confirmation sent.' }
      );
      onSaved();
    } catch {
      setMessage({ type: 'error', text: 'Could not reach the server' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="form">
      <label>
        Patient Name
        <input
          type="text"
          value={form.patient_name}
          onChange={set('patient_name')}
          placeholder="Rahul"
          required
        />
      </label>

      <label>
        WhatsApp Number
        <div className="phone">
          <span>+91</span>
          <input
            type="tel"
            inputMode="numeric"
            value={form.whatsapp_number}
            onChange={set('whatsapp_number')}
            placeholder="9876543210"
            maxLength={13}
            required
          />
        </div>
      </label>

      <label>
        Date
        <input
          type="date"
          value={form.appointment_date}
          onChange={set('appointment_date')}
          min={todayIST()}
          required
        />
      </label>

      <label>
        Time
        <input
          type="time"
          value={form.appointment_time}
          onChange={set('appointment_time')}
          required
        />
      </label>

      <button type="submit" disabled={busy}>
        {busy ? 'Scheduling…' : 'Schedule Appointment'}
      </button>

      {message && <div className={`notice ${message.type}`}>{message.text}</div>}
    </form>
  );
}
