import { useState } from 'react';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function fmtTime(s) {
  const [h, m] = s.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function Confirmation({ a }) {
  if (a.confirmation_sent) return <span className="tag ok">Sent ✅</span>;
  return <span className="tag bad">Not sent ❌</span>;
}

function Reminder({ a }) {
  if (a.status === 'cancelled') return <span className="tag muted">—</span>;
  if (a.reminder_sent) return <span className="tag ok">Sent ✅</span>;
  return <span className="tag pending">Scheduled ⏰</span>;
}

export default function AppointmentTable({ appointments, loading, onChanged }) {
  const [error, setError] = useState('');

  async function act(id, method, path, confirmText) {
    if (confirmText && !window.confirm(confirmText)) return;
    setError('');
    try {
      const res = await fetch(`/api/appointments/${id}${path}`, { method });
      if (!res.ok) throw new Error();
      onChanged();
    } catch {
      setError('That action failed. Please try again.');
    }
  }

  if (loading) return <p className="empty">Loading…</p>;
  if (!appointments.length) {
    return <p className="empty">No appointments yet. Schedule the first one above.</p>;
  }

  return (
    <>
      {error && <div className="notice error">{error}</div>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>WhatsApp</th>
              <th>Date</th>
              <th>Time</th>
              <th>Confirmation</th>
              <th>Reminder</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((a) => (
              <tr key={a.id} className={a.status === 'cancelled' ? 'cancelled' : ''}>
                <td>{a.patient_name}</td>
                <td>{a.whatsapp_number}</td>
                <td>{fmtDate(a.appointment_date)}</td>
                <td>{fmtTime(a.appointment_time)}</td>
                <td><Confirmation a={a} /></td>
                <td><Reminder a={a} /></td>
                <td className="status">{a.status}</td>
                <td className="actions">
                  {a.status === 'scheduled' && (
                    <button
                      className="link"
                      onClick={() =>
                        act(a.id, 'PATCH', '/cancel', `Cancel ${a.patient_name}'s appointment? No reminder will be sent.`)
                      }
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    className="link danger"
                    onClick={() =>
                      act(a.id, 'DELETE', '', `Delete ${a.patient_name}'s appointment permanently?`)
                    }
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
