export default function Dashboard({ rides, users, expenses }) {
  // Constants from request
  const kmPerLiter = 19;

  // Calculate average fuel price from expenses
  let totalPaid = 0;
  let totalLiters = 0;

  expenses.forEach(exp => {
    totalPaid += exp.amount;
    // Handle older records that might not have liters
    if (exp.liters) {
      totalLiters += exp.liters;
    }
  });

  // Default to a sane price if no data yet (e.g. €1.90)
  // If we have data, price per liter = total paid / total liters
  const averagePricePerLiter = totalLiters > 0 ? (totalPaid / totalLiters) : 1.90;

  // Cost per km = Price per liter / km per liter
  const costPerKm = averagePricePerLiter / kmPerLiter;

  const stats = users.reduce((acc, user) => {
    acc[user] = { km: 0, paid: 0 };
    return acc;
  }, {});

  let totalKm = 0;

  rides.forEach(ride => {
    if (stats[ride.driver]) {
      stats[ride.driver].km += ride.distance;
    }
    totalKm += ride.distance;
  });

  expenses.forEach(exp => {
    if (stats[exp.payer]) {
      stats[exp.payer].paid += exp.amount;
    }
  });

  const totalCalculatedCost = totalKm * costPerKm;

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
          <label>Totaal</label>
          <div className="value">{totalKm.toFixed(1)} km</div>
          <div className="sub-value">Kosten: € {totalCalculatedCost.toFixed(2)}</div>
          <div className="sub-value" style={{ color: totalPaid < totalCalculatedCost ? 'var(--danger-color)' : 'var(--success-color)' }}>
            Getankt: € {totalPaid.toFixed(2)} ({totalLiters.toFixed(1)} L)
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
      `}</style>
    </div>
  );
}
