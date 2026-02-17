import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { User, Lock } from 'lucide-react';

export function LoginView() {
    const { login } = useStore();
    const [username, setUsername] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!username.trim()) return;
        login(username);
    };
console.log(username);
    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)'
        }}>
            <div style={{
                textAlign: 'center',
                marginBottom: '3rem'
            }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '900',
                    background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem'
                }}>
                    GYM TRACKER
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Tu compañero de entrenamiento definitivo</p>
            </div>

            <div style={{
                width: '100%',
                maxWidth: '400px',
                background: 'var(--bg-card)',
                padding: '2rem',
                borderRadius: 'var(--radius-lg)',
                border: 'var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                backdropFilter: 'var(--backdrop-blur)'
            }}>
                <h2 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
                    Iniciar Sesión
                </h2>

                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Usuario</label>
                        <div style={{ position: 'relative' }}>
                            <User size={20} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Ingresa tu nombre"
                                style={{ width: '100%', paddingLeft: '3rem' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            background: 'linear-gradient(to right, var(--primary), var(--secondary))',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            marginTop: '0.5rem',
                            boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)'
                        }}
                    >
                        Entrar
                    </button>
                </form>
            </div>
        </div>
    );
}
