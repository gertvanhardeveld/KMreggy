export default function Dashboard({ rides, users, expenses, lastSettlement, onSettle }) {
  // Constants from request
  const kmPerLiter = 19;

  // 1. Calculate GLOBAL average fuel price (historical data provides better accuracy)
  let globalTotalPaid = 0;
  let globalTotalLiters = 0;

  expenses.forEach(exp => {
    globalTotalPaid += exp.amount;
    if (exp.liters) globalTotalLiters += exp.liters;
  });

  const averagePricePerLiter = globalTotalLiters > 0 ? (globalTotalPaid / globalTotalLiters) : 1.90;
  const costPerKm = averagePricePerLiter / kmPerLiter;

  // 2. Filter data for CURRENT PERIOD (since last settlement)
  const periodRides = lastSettlement
    ? rides.filter(r => new Date(r.timestamp || r.date) > new Date(lastSettlement))
    : rides;

  const periodExpenses = lastSettlement
    ? expenses.filter(e => new Date(e.timestamp || e.date) > new Date(lastSettlement))
    : expenses;

  // 3. Calculate stats for Current Period
  const stats = users.reduce((acc, user) => {
    acc[user] = { km: 0, paid: 0 };
    return acc;
  }, {});

  let periodTotalKm = 0;
  periodRides.forEach(ride => {
    if (stats[ride.driver]) {
      stats[ride.driver].km += ride.distance;
    }
    periodTotalKm += ride.distance;
  });

  let periodTotalPaid = 0;
  let periodTotalLiters = 0;
  periodExpenses.forEach(exp => {
    if (stats[exp.payer]) {
      stats[exp.payer].paid += exp.amount;
    }
    periodTotalPaid += exp.amount;
    if (exp.liters) periodTotalLiters += exp.liters;
  });

  const totalCalculatedCost = periodTotalKm * costPerKm;

  return (
    <div className="card dashboard">
      <h2 className="mb-4">Overzicht</h2>

      <div className="info-bar mb-4">
        <div className="info-item">
          <span className="label">Verbruik</span>
          <span className="val">1 op {kmPerLiter}</span>
        </div>
        <div className="info-item">
          <span className="label">Benzineprijs</span>
          <span className="val">€ {averagePricePerLiter.toFixed(3)}/L</span>
        </div>
        <div className="info-item">
          <span className="label">Km Prijs</span>
          <span className="val">€ {costPerKm.toFixed(3)}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box main">
          <label>Totaal {lastSettlement ? '(Deze periode)' : ''}</label>
          <div className="value">{periodTotalKm.toFixed(1)} km</div>
          <div className="sub-value">Kosten: € {totalCalculatedCost.toFixed(2)}</div>
          <div className="sub-value" style={{ color: periodTotalPaid < totalCalculatedCost ? 'var(--danger-color)' : 'var(--success-color)' }}>
            Getankt: € {periodTotalPaid.toFixed(2)} ({periodTotalLiters.toFixed(1)} L)
          </div>
        </div>

        {users.map(user => {
          const data = stats[user] || { km: 0, paid: 0 };
          const usageCost = data.km * costPerKm;
          const balance = data.paid - usageCost;

          return (
            <div key={user} className="stat-box">
              <label style={{ fontWeight: 'bold', marginBottom: '0.5rem', display: 'block' }}>{user}</label>

              <div className="flex-between text-sm mb-2">
                <span className="text-muted">Gereden:</span>
                <span>{data.km.toFixed(1)} km</span>
              </div>
              <div className="flex-between text-sm mb-2">
                <span className="text-muted">Verbruik:</span>
                <span>€ {usageCost.toFixed(2)}</span>
              </div>
              <div className="flex-between text-sm mb-2">
                <span className="text-muted">Betaald:</span>
                <span>€ {data.paid.toFixed(2)}</span>
              </div>

              <div className="balance-line">
                <span className="text-sm">Balans:</span>
                <span className={`balance-value ${balance >= 0 ? 'pos' : 'neg'}`}>
                  {balance >= 0 ? '+' : ''} € {balance.toFixed(2)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 text-center">
        {lastSettlement && (
          <div className="mb-2 text-xs text-muted">
            Periode vanaf: {new Date(lastSettlement).toLocaleDateString()} {new Date(lastSettlement).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
        <button
          onClick={onSettle}
          className="btn-text"
          style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textDecoration: 'underline' }}
        >
          🔄 Verrekenen / Balans Resetten
        </button>
      </div>

      <style>{`
        .info-bar {
            display: flex;
            justify-content: space-between;
            background: rgba(0,0,0,0.2);
            padding: 0.8rem;
            border-radius: var(--radius-md);
            margin-bottom: 1rem;
        }
        .info-item {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .info-item .label {
            font-size: 0.7rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .info-item .val {
            font-weight: 700;
            font-size: 0.9rem;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr; /* Mobile first stack */
          gap: 1rem;
        }
        @media(min-width: 500px) {
            .stats-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
        .stat-box {
          background: rgba(255,255,255,0.05);
          padding: 1rem;
          border-radius: var(--radius-md);
        }
        .stat-box.main {
          grid-column: 1 / -1; 
          background: rgba(56, 189, 248, 0.1);
          border: 1px solid rgba(56, 189, 248, 0.2);
          text-align: center;
        }
        .value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-color);
        }
        .sub-value {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        .balance-line {
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: 0.5rem;
            padding-top: 0.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .balance-value { font-weight: 700; }
        .balance-value.pos { color: var(--success-color); }
        .balance-value.neg { color: var(--danger-color); }
        .btn-text {
            background: none;
            border: none;
            cursor: pointer;
            padding: 5px;
        }
        .btn-text:hover { color: var(--primary-color) !important; }
      `}</style>
    </div>
  );
}
