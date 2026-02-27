import { useState } from 'react'
import './App.css'
import { Dumbbell, LineChart, LogOut, Calendar, Settings } from 'lucide-react'
import { WorkoutView } from './components/WorkoutView'
import { ProgressView } from './components/ProgressView'
import { LoginView } from './components/LoginView'
import { ProfileView } from './components/ProfileView'
import { AgendaView } from './components/AgendaView'
import { useStore } from './hooks/useStore'
import { Toaster } from 'sonner'

function App() {
  const { user, logout } = useStore();
  const [view, setView] = useState('workout');
  const [selectedAgendaRoutineId, setSelectedAgendaRoutineId] = useState(null);

  if (!user) {
    return <LoginView />;
  }

  return (
    <div className="app-container">
      <Toaster richColors position="top-center" theme="dark" />
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
        {view === 'workout' && <WorkoutView preselectedRoutineId={selectedAgendaRoutineId} />}
        {view === 'progress' && <ProgressView />}
        {view === 'agenda' && <AgendaView onNavigateToWorkout={(id) => { setSelectedAgendaRoutineId(id); setView('workout'); }} />}
        {view === 'profile' && <ProfileView />}
      </main>

      {/* Bottom Navigation */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        background: 'rgba(15, 23, 42, 0.95)',
        padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom))',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: 9999,
        transform: 'translate3d(0,0,100px)' // Force hardware acceleration and z-position
      }}>
        {/* ENTRENAR */}
        <button
          onClick={() => setView('workout')}
          style={{
            background: 'transparent',
            border: 'none',
            color: view === 'workout' ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem',
            flex: 1
          }}
        >
          <Dumbbell size={24} />
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>ENTRENAR</span>
        </button>

        {/* PROGRESO */}
        <button
          onClick={() => setView('progress')}
          style={{
            background: 'transparent',
            border: 'none',
            color: view === 'progress' ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem',
            flex: 1
          }}
        >
          <LineChart size={24} />
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>PROGRESO</span>
        </button>

        {/* AGENDA */}
        <button
          onClick={() => setView('agenda')}
          style={{
            background: 'transparent',
            border: 'none',
            color: view === 'agenda' ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem',
            flex: 1
          }}
        >
          <Calendar size={24} />
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>AGENDA</span>
        </button>

        {/* PERFIL */}
        <button
          onClick={() => setView('profile')}
          style={{
            background: 'transparent',
            border: 'none',
            color: view === 'profile' ? 'var(--primary)' : 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem',
            flex: 1
          }}
        >
          <Settings size={24} />
          <span style={{ fontSize: '0.65rem', fontWeight: 'bold', letterSpacing: '0.5px' }}>PERFIL</span>
        </button>
      </nav>
    </div>
  )
}

export default App
