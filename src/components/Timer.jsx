import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Timer as TimerIcon } from 'lucide-react';
import { scheduleNotification, cancelNotification } from '../utils/notifications';

export function Timer({ initialSeconds = 180, onComplete, onClose, isLastSet }) {
    const [endTime, setEndTime] = useState(() => Date.now() + initialSeconds * 1000);
    const [timeLeft, setTimeLeft] = useState(initialSeconds);
    const [isActive, setIsActive] = useState(true);

    const TIMER_ID = 100; // Constant ID for the timer notification

    // Effect to handle scheduling/canceling notifications on state change
    useEffect(() => {
        if (isActive) {
            // Schedule notification for the remaining time
            const secondsRemaining = Math.ceil((endTime - Date.now()) / 1000);
            if (secondsRemaining > 0) {
                const title = isLastSet ? '¡Ejercicio Completado!' : '¡Tiempo Terminado!';
                const body = isLastSet ? 'Has terminado todos los sets. ¡Buen trabajo!' : 'Prepárate para el siguiente set.';
                scheduleNotification(title, body, TIMER_ID, secondsRemaining);
            }
        } else {
            // Cancel if paused or inactive
            cancelNotification(TIMER_ID);
        }

        return () => {
             // Cleanup: cancel if component unmounts (e.g. user closes timer manually)
             // But valid case: user closes app? No, component unmounts only on close.
             // If user backgrounds app, component is still mounted.
             // If user Closes timer with X button, we should cancel.
        };
    }, [isActive, endTime, isLastSet]);

    // Handle close button specifically to cancel
    const handleClose = () => {
        cancelNotification(TIMER_ID);
        if (onClose) onClose();
    };

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            const now = Date.now();
            const diff = Math.ceil((endTime - now) / 1000);

            if (diff <= 0) {
                setTimeLeft(0);
                setIsActive(false);
                
                // Notification already scheduled natively!
                // But for web or if app is open, we might want to play sound or something?
                // The native notification will handle sound.
                // We don't need to call scheduleNotification here anymore for Native.
                // However, for Web fallback, scheduleNotification was just a setTimeout so it might have triggered?
                // Actually, let's leave it to the native scheduler.
                
                if (onComplete) onComplete();
                clearInterval(interval);
            } else {
                setTimeLeft(diff);
            }
        }, 200);

        return () => clearInterval(interval);
    }, [isActive, endTime, onComplete]);

    const toggle = () => {
        if (isActive) {
            // Pause
            setIsActive(false);
            // Notification canceled by useEffect
        } else {
            // Resume
            setEndTime(Date.now() + timeLeft * 1000);
            setIsActive(true);
            // Notification scheduled by useEffect
        }
    };

    const reset = () => {
        const newSeconds = initialSeconds;
        setEndTime(Date.now() + newSeconds * 1000);
        setTimeLeft(newSeconds);
        setIsActive(true);
    };

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const progress = ((initialSeconds - timeLeft) / initialSeconds) * 100;

    return (
        <div style={{
            position: 'fixed',
            top: '4rem',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'auto',
            minWidth: '300px',
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid var(--primary)',
            borderRadius: '9999px',
            padding: '0.5rem 1.5rem',
            zIndex: 1000,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <TimerIcon size={20} color="var(--primary)" />
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', color: 'white', lineHeight: 1, letterSpacing: '2px' }}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button onClick={toggle} style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    color: 'white', padding: '0.5rem', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                }}>
                    {isActive ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button onClick={reset} style={{
                    background: 'rgba(255,255,255,0.1)', border: 'none',
                    color: 'white', padding: '0.5rem', borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer'
                }}>
                    <RotateCcw size={16} />
                </button>
                <button onClick={handleClose} style={{
                    background: 'transparent', border: 'none',
                    color: 'var(--text-muted)', padding: '0.25rem',
                    marginLeft: '0.5rem', cursor: 'pointer'
                }}>
                    <X size={18} />
                </button>
            </div>
            
            {/* Minimal Progress Bar at bottom of pill */}
            <div style={{ 
                position: 'absolute', 
                bottom: '0', 
                left: '20px', 
                right: '20px', 
                height: '2px', 
                background: 'rgba(255,255,255,0.1)', 
                overflow: 'hidden' 
            }}>
                <div style={{ width: `${100 - progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.2s linear' }} />
            </div>
        </div>
    );
}
