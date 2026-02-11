import { useState } from 'react';
import OdometerScanner from './OdometerScanner';

export default function ExpenseForm({ onAddExpense, users }) {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payer, setPayer] = useState(users[0] || '');
    const [amount, setAmount] = useState('');
    const [liters, setLiters] = useState('');
    const [odometer, setOdometer] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!amount || !payer || !liters) return;

        onAddExpense({
            id: Date.now(),
            date,
            payer,
            amount: parseFloat(amount),
            liters: parseFloat(liters),
            odometer: odometer ? parseFloat(odometer) : null,
            timestamp: new Date().toISOString()
        });

        setAmount('');
        setLiters('');
        setOdometer('');
    };

    return (
        <form onSubmit={handleSubmit} className="card fade-in">
            <h2 className="mb-4">Tanken Registreren</h2>

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
                <label>Betaald door</label>
                <select value={payer} onChange={(e) => setPayer(e.target.value)}>
                    {users.map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            </div>

            <div className="flex-between" style={{ gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                    <label>Bedrag (€)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </div>
                <div style={{ flex: 1 }}>
                    <label>Liters (L)</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={liters}
                        onChange={(e) => setLiters(e.target.value)}
                        required
                    />
                </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
                <label>Kilometerstand (Optioneel)</label>
                <div className="km-input-group">
                    <input
                        type="number"
                        step="0.1"
                        placeholder="Huidige stand"
                        value={odometer}
                        onChange={(e) => setOdometer(e.target.value)}
                        style={{ marginBottom: 0 }}
                    />
                    <OdometerScanner
                        onResult={setOdometer}
                    />
                </div>
            </div>

            <button type="submit" className="btn btn-primary w-full">
                Bonnetje Toevoegen
            </button>

            <style>{`
                .km-input-group {
                    display: flex;
                    gap: 6px;
                    align-items: stretch;
                }
            `}</style>
        </form>
    );
}
