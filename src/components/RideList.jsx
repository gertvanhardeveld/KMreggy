export default function RideList({ rides }) {
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
                    <div key={ride.id} className="ride-item">
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
                    </div>
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
      `}</style>
        </div>
    );
}
