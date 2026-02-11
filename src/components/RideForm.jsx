import { useState, useEffect } from 'react';
import OdometerScanner from './OdometerScanner';

export default function RideForm({ onAddRide, users, lastEndKm }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [driver, setDriver] = useState(users[0] || '');
  const [startKm, setStartKm] = useState(lastEndKm || '');
  const [endKm, setEndKm] = useState('');
  const [description, setDescription] = useState('');

  // Update startKm when lastEndKm prop changes (e.g. initial load)
  useEffect(() => {
    if (lastEndKm) {
      setStartKm(lastEndKm);
    }
  }, [lastEndKm]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const start = parseFloat(startKm);
    const end = parseFloat(endKm);

    if (isNaN(start) || isNaN(end) || !driver) return;

    if (end < start) {
      alert("Eindstand kan niet lager zijn dan beginstand!");
      return;
    }

    const distance = parseFloat((end - start).toFixed(1));

    onAddRide({
      id: Date.now(),
      date,
      driver,
      startkm: start,
      endkm: end,
      distance,
      description,
      timestamp: new Date().toISOString()
    });

    setEndKm('');
    setDescription('');
  };

  const calculatedDistance = (startKm && endKm) ? (endKm - startKm).toFixed(1) : '0.0';

  return (
    <>
      <form onSubmit={handleSubmit} className="card fade-in">
        <h2 className="mb-4">Nieuwe Rit</h2>

        <div>
          <label>Datum</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Bestuurder</label>
          <select value={driver} onChange={(e) => setDriver(e.target.value)}>
            {users.map(u => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div className="flex-between" style={{ gap: '1rem', alignItems: 'flex-start' }}>
          {/* Beginstand */}
          <div style={{ flex: 1 }}>
            <label>Beginstand (km)</label>
            <div className="km-input-group">
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={startKm}
                onChange={(e) => setStartKm(e.target.value)}
                required
                style={{ flex: 1, marginBottom: 0 }}
              />
              {/* Optional: Add scanner for start KM too if desired */}
            </div>
          </div>

          {/* Eindstand */}
          <div style={{ flex: 1 }}>
            <label>Eindstand (km)</label>
            <div className="km-input-group">
              <input
                type="number"
                step="0.1"
                placeholder="0"
                value={endKm}
                onChange={(e) => setEndKm(e.target.value)}
                required
                style={{ flex: 1, marginBottom: 0 }}
              />
              <OdometerScanner
                onResult={setEndKm}
                referenceValue={startKm}
              />
            </div>
          </div>
        </div>

        <div className="mb-4 text-center" style={{ marginTop: '0.5rem' }}>
          <span className="text-muted">Gereden afstand: </span>
          <strong style={{ fontSize: '1.2em', color: 'var(--primary-color)' }}>{calculatedDistance} km</strong>
        </div>

        <div>
          <label>Omschrijving (Optioneel)</label>
          <input
            type="text"
            placeholder="Bijv. Boodschappen"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary w-full">
          Rit Toevoegen
        </button>
      </form>

      <style>{`
        .km-input-group {
          display: flex;
          gap: 6px;
          align-items: stretch;
        }
      `}</style>
    </>
  );
}
