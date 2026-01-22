import { useState } from 'react'
import './App.css'
import { Dumbbell, LineChart, LogOut } from 'lucide-react'
import { WorkoutView } from './components/WorkoutView'
import { ProgressView } from './components/ProgressView'
import { LoginView } from './components/LoginView'
import { useStore } from './hooks/useStore'

function App() {
  const { user, logout } = useStore();
  const [view, setView] = useState('workout')

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>
          GYM TRACKER
        </h1>
        <button
          onClick={logout}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--bg-card)',
            border: 'var(--glass-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer'
          }}
          title="Cerrar Sesión"
        >
          <LogOut size={16} />
        </button>
      </header>

      <main style={{ paddingBottom: '5rem' }}>
        {view === 'workout' ? (
          <WorkoutView />
        ) : (
          <ProgressView />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: '1.5rem',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '1rem',
        background: 'rgba(15, 23, 42, 0.8)',
        padding: '0.75rem 1.5rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
      }}>
        <button
          onClick={() => setView('workout')}
          style={{
            background: view === 'workout' ? 'var(--primary-glow)' : 'transparent',
            border: 'none',
            color: view === 'workout' ? 'var(--primary)' : 'var(--text-muted)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <Dumbbell size={24} />
          {view === 'workout' && <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Entrenar</span>}
        </button>
        <button
          onClick={() => setView('progress')}
          style={{
            background: view === 'progress' ? 'rgba(244, 114, 182, 0.2)' : 'transparent',
            border: 'none',
            color: view === 'progress' ? 'var(--secondary)' : 'var(--text-muted)',
            padding: '0.75rem',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
        >
          <LineChart size={24} />
          {view === 'progress' && <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Progreso</span>}
        </button>
      </nav>
    </div>
  )
}

export default App
