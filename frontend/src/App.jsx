import { useCallback, useEffect, useState } from 'react';
import AppointmentForm from './components/AppointmentForm.jsx';
import AppointmentTable from './components/AppointmentTable.jsx';

export default function App() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/appointments');
      if (!res.ok) throw new Error();
      setAppointments(await res.json());
      setLoadError('');
    } catch {
      setLoadError('Could not load appointments. Check that the server is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 30000); // keep reminder status fresh
    return () => clearInterval(t);
  }, [load]);

  return (
    <div className="page">
      <header className="masthead">
        <h1>Dr. Bhosale's Shree Dental Clinic</h1>
        <p>Appointment scheduling and WhatsApp reminders</p>
      </header>

      <main>
        <section className="panel">
          <h2>Schedule Appointment</h2>
          <AppointmentForm onSaved={load} />
        </section>

        <section className="panel">
          <h2>Upcoming Appointments</h2>
          {loadError && <div className="notice error">{loadError}</div>}
          <AppointmentTable
            appointments={appointments}
            loading={loading}
            onChanged={load}
          />
        </section>
      </main>
    </div>
  );
}
