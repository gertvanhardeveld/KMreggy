import { useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

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

    // Reset fields, but maybe prepopulate next start? 
    // Usually user goes back to list, so full reset is fine.
    setEndKm('');
    setDescription('');
    // StartKm will be updated via parent re-render if we stay mounted, 
    // but usually we unmount.
  };

  const [isScanning, setIsScanning] = useState(false);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsScanning(true);

    Tesseract.recognize(
      file,
      'eng', // English is usually better for digits as well
      {
        logger: m => console.log(m)
      }
    ).then(({ data: { text } }) => {
      console.log('OCR Output:', text);

      // Attempt to find a number in the text
      // We look for a sequence of digits, optionally with a dot or comma
      const matches = text.match(/(\d+[.,]?\d*)/g);

      if (matches) {
        // Find the most likely candidate (e.g. largest number closer to startKm or just a valid number)
        // For simplicity, let's take the longest number string found, or the one that is logically > startKm

        let bestMatch = null;
        let maxVal = -1;

        const currentStart = parseFloat(startKm) || 0;

        for (const match of matches) {
          const val = parseFloat(match.replace(',', '.'));
          // It should be greater than startKm and reasonable (e.g. not 1000000 more)
          if (!isNaN(val) && val > currentStart) {
            // Heuristic: odometer usually increases.
            // If we find multiple, maybe pick the one closest to startKm but larger?
            // Or just pick the valid number encountered.
            // Let's pick the first valid one > startKm, or if none, just the largest number found.
            if (bestMatch === null || (val > currentStart && (bestMatch <= currentStart || val < bestMatch))) {
              bestMatch = val;
            }
          }
          // Fallback if no number > start is found: just pick largest number?
          if (maxVal < val) maxVal = val;
        }

        if (bestMatch !== null) {
          setEndKm(bestMatch.toString());
        } else if (maxVal > -1) {
          setEndKm(maxVal.toString());
        } else {
          alert("Geen duidelijke kilometerstand gevonden. Vul het handmatig in.");
        }
      } else {
        alert("Geen cijfers herkend in de foto.");
      }
      setIsScanning(false);
    }).catch(err => {
      console.error(err);
      alert("Fout bij het scannen van de foto.");
      setIsScanning(false);
    });
  };

  const calculatedDistance = (startKm && endKm) ? (endKm - startKm).toFixed(1) : '0.0';

  return (
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

      <div className="flex-between" style={{ gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <label>Beginstand (km)</label>
          <input
            type="number"
            step="0.1"
            placeholder="0.0"
            value={startKm}
            onChange={(e) => setStartKm(e.target.value)}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label>Eindstand (km)</label>
          <div style={{ display: 'flex', gap: '5px' }}>
            <input
              type="number"
              step="0.1"
              placeholder="0.0"
              value={endKm}
              onChange={(e) => setEndKm(e.target.value)}
              required
              style={{ flex: 1 }}
            />
            <label className="btn btn-secondary" style={{ padding: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              📷
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
                disabled={isScanning}
              />
            </label>
          </div>
          {isScanning && <small className="text-muted">Analyseren...</small>}
        </div>
      </div>

      <div className="mb-4 text-center">
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
  );
}
