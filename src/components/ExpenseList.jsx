export default function ExpenseList({ expenses }) {
    if (expenses.length === 0) {
        return (
            <div className="card text-center text-muted">
                <p>Nog geen tankbonnetjes geregistreerd.</p>
            </div>
        );
    }

    const sortedExpenses = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date) || b.id - a.id);

    return (
        <div className="card">
            <h2 className="mb-4">Tanken Geschiedenis</h2>
            <div className="list-container">
                {sortedExpenses.map(item => (
                    <div key={item.id} className="list-item">
                        <div className="flex-between">
                            <div>
                                <span className="text-sm text-muted">{new Date(item.date).toLocaleDateString('nl-NL')}</span>
                                <div>{item.payer}</div>
                                {item.liters && (
                                    <div className="text-secondary text-sm" style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                                        {item.liters.toFixed(2)} L @ € {(item.amount / item.liters).toFixed(3)}/L
                                    </div>
                                )}
                                {item.odometer && (
                                    <div className="text-secondary text-sm" style={{ fontSize: '0.75rem', marginTop: '2px', color: '#9ca3af' }}>
                                        KM: {item.odometer.toFixed(1)}
                                    </div>
                                )}
                            </div>
                            <div className="text-right">
                                <div className="amount">€ {item.amount.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <style>{`
        .list-container {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        .list-item {
            padding: 0.75rem;
            background-color: rgba(255, 255, 255, 0.03);
            border-radius: var(--radius-md);
        }
        .amount {
            font-weight: 700;
            color: var(--success-color);
        }
      `}</style>
        </div>
    );
}
