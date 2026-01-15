import { useState } from 'react';

function RideItem({ ride, onDelete, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...ride });

    const handleSave = () => {
        // Recalculate distance if needed
        const start = parseFloat(editData.startkm);
        const end = parseFloat(editData.endkm);
        const dist = (end - start).toFixed(1);

        onUpdate({
            ...editData,
            startkm: start,
            endkm: end,
            distance: parseFloat(dist)
        });
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="ride-item editing">
                <div className="edit-grid">
                    <label>Datum</label>
                    <input
                        type="date"
                        value={editData.date}
                        onChange={e => setEditData({ ...editData, date: e.target.value })}
                    />

                    <label>Bestuurder</label>
                    <select
                        value={editData.driver}
                        onChange={e => setEditData({ ...editData, driver: e.target.value })}
                    >
                        {['Roos', 'Meggy', 'Puck', 'Pien', 'Gert'].map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>

                    <label>Begin</label>
                    <input
                        type="number"
                        value={editData.startkm}
                        onChange={e => setEditData({ ...editData, startkm: e.target.value })}
                    />

                    <label>Eind</label>
                    <input
                        type="number"
                        value={editData.endkm}
                        onChange={e => setEditData({ ...editData, endkm: e.target.value })}
                    />

                    <label>Omschrijving</label>
                    <input
                        type="text"
                        value={editData.description}
                        onChange={e => setEditData({ ...editData, description: e.target.value })}
                    />
                </div>
                <div className="edit-actions">
                    <button onClick={() => setIsEditing(false)} className="btn-cancel">Annuleren</button>
                    <button onClick={handleSave} className="btn-save">Opslaan</button>
                </div>
            </div>
        );
    }

    return (
        <div className="ride-item">
            <div className="flex-between">
                <div>
                    <span className="ride-date text-sm text-muted">{new Date(ride.date).toLocaleDateString('nl-NL')}</span>
                    <div className="ride-desc">{ride.description || 'Geen omschrijving'}</div>
                    {ride.startkm && ride.endkm && (
                        <div className="text-secondary text-sm" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                            {ride.startkm} → {ride.endkm}
                        </div>
                    )}
                </div>
                <div className="text-right">
                    <div className="ride-km">{ride.distance} km</div>
                    <div className="ride-driver text-sm text-primary">{ride.driver}</div>
                </div>
            </div>
            <div className="item-actions">
                <button onClick={() => setIsEditing(true)} aria-label="Aanpassen">✏️</button>
                <button onClick={() => onDelete(ride.id)} aria-label="Verwijderen" style={{ color: 'var(--danger-color)' }}>🗑️</button>
            </div>
        </div>
    );
}

export default function RideList({ rides, onDelete, onUpdate }) {
    if (rides.length === 0) {
        return (
            <div className="card text-center text-muted">
                <p>Nog geen ritten geregistreerd.</p>
            </div>
        );
    }

    // Sort by date desc
    const sortedRides = [...rides].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

    return (
        <div className="card">
            <h2 className="mb-4">Rit Geschiedenis</h2>
            <div className="ride-list">
                {sortedRides.map(ride => (
                    <RideItem
                        key={ride.id}
                        ride={ride}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                    />
                ))}
            </div>
            <style>{`
        .ride-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .ride-item {
          padding: 0.75rem;
          background-color: rgba(255, 255, 255, 0.03);
          border-radius: var(--radius-md);
          border: 1px solid transparent;
          transition: border-color 0.2s;
          position: relative;
        }
        .ride-item:hover {
          border-color: var(--border-color);
        }
        .ride-km {
          font-weight: 700;
          font-size: 1.1em;
        }
        .text-right { text-align: right; }
        .text-primary { color: var(--primary-color); }

        .item-actions {
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            border-top: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
        .item-actions button {
            background: none;
            border: none;
            cursor: pointer;
            font-size: 1.1rem;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        .item-actions button:hover { opacity: 1; }

        .edit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }
        .edit-grid label {
            font-size: 0.75rem;
            color: var(--text-secondary);
            grid-column: span 2;
            margin-bottom: -0.2rem;
        }
        .edit-grid input, .edit-grid select {
            width: 100%;
            padding: 0.4rem;
            background: rgba(0,0,0,0.2);
            border: 1px solid var(--border-color);
            border-radius: 4px;
            color: white;
            grid-column: span 2; /* Mobile default */
        }
        /* Make start/end km side by side */
        .edit-grid input[type="number"] { grid-column: auto; }
        
        .edit-actions {
            display: flex;
            gap: 0.5rem;
        }
        .btn-save, .btn-cancel {
            flex: 1;
            padding: 0.5rem;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        .btn-save { background: var(--primary-color); color: white; }
        .btn-cancel { background: rgba(255,255,255,0.1); color: var(--text-color); }
      `}</style>
        </div>
    );
}
