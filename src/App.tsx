import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import RepairForm from './components/RepairForm';
import AdminDashboard from './components/AdminDashboard';
import './App.css';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'user' | 'admin'>('user');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAdmin(!!user);
      setIsLoading(false);
      if (user) {
        setView('admin');
      }
    });

    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <h1>🔧 Repair Portal</h1>
        </div>
        <div className="nav-links">
          <button
            className={view === 'user' ? 'nav-link active' : 'nav-link'}
            onClick={() => setView('user')}
          >
            Submit Request
          </button>
          <button
            className={view === 'admin' ? 'nav-link active' : 'nav-link'}
            onClick={() => setView('admin')}
          >
            Admin Panel
          </button>
        </div>
      </nav>

      <main className="main-content">
        {view === 'user' ? (
          <RepairForm />
        ) : isAdmin ? (
          <AdminDashboard />
        ) : (
          <Login onLoginSuccess={() => setView('admin')} />
        )}
      </main>

      <footer className="footer">
        <p>© 2026 Repair Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
