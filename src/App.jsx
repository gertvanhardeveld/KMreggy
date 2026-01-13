import { useState, useEffect } from 'react';
import RideForm from './components/RideForm';
import RideList from './components/RideList';
import Dashboard from './components/Dashboard';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import { supabase } from './supabaseClient';

function App() {
  const [rides, setRides] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [users] = useState(['Roos', 'Meggy', 'Puck', 'Pien', 'Gert']);
  const [view, setView] = useState('add');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    if (!supabase) return;

    // Fetch rides
    const { data: ridesData, error: ridesError } = await supabase
      .from('rides')
      .select('*')
      .order('date', { ascending: false });

    if (ridesData) setRides(ridesData);

    // Fetch expenses
    const { data: expensesData, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (expensesData) setExpenses(expensesData);
  };

  const addRide = async (ride) => {
    // Optimistic update
    setRides([ride, ...rides]);
    setView('list');

    const { error } = await supabase
      .from('rides')
      .insert([ride]);

    if (error) console.error('Error adding ride:', error);
    else fetchData();
  };

  const addExpense = async (expense) => {
    setExpenses([expense, ...expenses]);
    setView('dash'); // Changed to view dash to see balance immediately as per user flow usually

    const { error } = await supabase
      .from('expenses')
      .insert([expense]);

    if (error) console.error('Error adding expense:', error);
    else fetchData();
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>KM Reggy</h1>
      </header>

      <main className="app-content">
        {view === 'add' && (
          <RideForm
            onAddRide={addRide}
            users={users}
            lastEndKm={rides.length > 0 ? Math.max(...rides.map(r => r.endkm || 0)) : 0}
          />
        )}
        {view === 'list' && <RideList rides={rides} />}
        {view === 'expense' && (
          <>
            <ExpenseForm onAddExpense={addExpense} users={users} />
            <div style={{ marginTop: '2rem' }}>
              <ExpenseList expenses={expenses} />
            </div>
          </>
        )}

        {view === 'dash' && <Dashboard rides={rides} users={users} expenses={expenses} />}
      </main>

      <nav className="bottom-nav">
        <button
          className={`nav-item ${view === 'add' ? 'active' : ''}`}
          onClick={() => setView('add')}
        >
          <span>🚗</span>
          <span className="nav-label">Nieuw</span>
        </button>
        <button
          className={`nav-item ${view === 'list' ? 'active' : ''}`}
          onClick={() => setView('list')}
        >
          <span>📋</span>
          <span className="nav-label">Ritten</span>
        </button>
        <button
          className={`nav-item ${view === 'expense' ? 'active' : ''}`}
          onClick={() => setView('expense')}
        >
          <span>⛽</span>
          <span className="nav-label">Tanken</span>
        </button>
        <button
          className={`nav-item ${view === 'dash' ? 'active' : ''}`}
          onClick={() => setView('dash')}
        >
          <span>📊</span>
          <span className="nav-label">Stats</span>
        </button>
      </nav>

      <style>{`
        .app-container {
          padding-bottom: 80px; /* Space for bottom nav */
          max-width: 600px;
          margin: 0 auto;
        }
        .app-header {
          text-align: center;
          margin-bottom: 1.5rem;
          padding-top: 1rem;
        }
        .app-header h1 {
          font-size: 1.8rem;
          margin-bottom: 0.2rem;
          background: linear-gradient(to right, #38bdf8, #818cf8);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: rgba(30, 41, 59, 0.9);
          backdrop-filter: blur(10px);
          border-top: 1px solid var(--border-color);
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 100;
        }
        .nav-item {
          background: none;
          border: none;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          align-items: center;
          font-size: 1.2rem;
          cursor: pointer;
          padding: 0.5rem;
          flex: 1;
        }
        .nav-item.active {
          color: var(--primary-color);
        }
        .nav-label {
          font-size: 0.7rem;
          margin-top: 2px;
        }
        /* Desktop styles adjustments if needed */
        @media (min-width: 601px) {
           .bottom-nav {
             max-width: 600px;
             margin: 0 auto;
             bottom: 1rem;
             border-radius: var(--radius-lg);
             border: 1px solid var(--border-color);
           }
        }
      `}</style>
    </div>
  );
}

export default App;
