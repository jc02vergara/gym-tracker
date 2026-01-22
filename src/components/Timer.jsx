import { useState, useEffect } from 'react';
import { Timer as TimerIcon, X, Play, Pause, RotateCcw } from 'lucide-react';

export function Timer({ initialSeconds = 180, onComplete, onClose }) {
    const [seconds, setSeconds] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        let interval = null;
        if (isActive && seconds > 0) {
            interval = setInterval(() => {
                setSeconds(seconds => seconds - 1);
            }, 1000);
        } else if (seconds === 0) {
            setIsActive(false);
            if (onComplete) onComplete();
            // Optional: Play sound here
        }
        return () => clearInterval(interval);
    }, [isActive, seconds, onComplete]);

    const toggle = () => setIsActive(!isActive);
    const reset = () => {
        setSeconds(initialSeconds);
        setIsActive(false);
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = ((initialSeconds - seconds) / initialSeconds) * 100;

    return (
        <div style={{
            position: 'fixed',
            bottom: '5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '400px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--primary)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            zIndex: 100,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                    <TimerIcon size={20} />
                    <span style={{ fontWeight: 'bold' }}>Descanso</span>
                </div>
                <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)' }}>
                    <X size={20} />
                </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 'bold', fontFamily: 'monospace', margin: '0.5rem 0' }}>
                {formatTime(seconds)}
            </div>

            <div style={{ height: '4px', background: 'var(--bg-card-hover)', borderRadius: '2px', marginBottom: '1rem', overflow: 'hidden' }}>
                <div style={{ width: `${100 - progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 1s linear' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <button onClick={toggle} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    {isActive ? <><Pause size={16} /> Pausa</> : <><Play size={16} /> Reanudar</>}
                </button>
                <button onClick={reset} style={{
                    background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
                    color: 'var(--text-main)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
                    display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}>
                    <RotateCcw size={16} /> Reiniciar
                </button>
            </div>
        </div>
    );
}
