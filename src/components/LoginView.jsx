import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Mail, KeyRound, ArrowLeft } from 'lucide-react';

const labelStyle = { display: 'block', marginBottom: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' };
const fieldStyle = { position: 'relative', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', transition: 'all 0.3s' };
const iconStyle = { padding: '0 1rem', display: 'flex', color: 'var(--primary)' };
const inputStyle = {
    width: '100%',
    padding: '1.2rem 1rem 1.2rem 0',
    background: 'transparent',
    border: 'none',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '700',
    outline: 'none'
};
const submitStyle = {
    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
    border: 'none',
    borderRadius: '16px',
    color: 'var(--bg-app)',
    fontWeight: '900',
    letterSpacing: '1px',
    padding: '1.1rem',
    fontSize: '1.15rem',
    marginTop: '1rem',
    boxShadow: '0 8px 25px -5px rgba(34, 211, 238, 0.4)',
    cursor: 'pointer',
    transition: 'all 0.3s'
};
const linkButtonStyle = { background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem', padding: 0 };
const messageStyle = { margin: 0, fontSize: '0.9rem', textAlign: 'center' };

export function LoginView() {
    const { sendLoginCode, verifyLoginCode } = useStore();
    const [step, setStep] = useState('email'); // 'email' | 'code'
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const run = async (action) => {
        setLoading(true);
        setError('');
        try {
            await action();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = (e) => {
        e?.preventDefault();
        if (!email.trim()) return;
        run(async () => {
            await sendLoginCode(email);
            setCode('');
            setStep('code');
        });
    };

    const handleVerify = (e) => {
        e.preventDefault();
        if (!code.trim()) return;
        run(() => verifyLoginCode(email, code));
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '2rem',
            background: 'var(--bg-app)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background decorative elements */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '60vw',
                height: '60vw',
                minWidth: '400px',
                minHeight: '400px',
                maxWidth: '800px',
                maxHeight: '800px',
                background: 'radial-gradient(circle, rgba(34, 211, 238, 0.08) 0%, rgba(34, 211, 238, 0) 60%)',
                zIndex: 0,
                pointerEvents: 'none'
            }}></div>

            <div style={{
                textAlign: 'center',
                marginBottom: '3.5rem',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <h1 style={{
                    fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #ffffff 0%, var(--primary) 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '0.5rem',
                    letterSpacing: '-1px',
                    lineHeight: 1.1
                }}>
                    GYM TRACKER
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: 'clamp(0.9rem, 3vw, 1.1rem)', fontWeight: '500', letterSpacing: '0.5px' }}>Tu compañero de entrenamiento definitivo</p>
            </div>

            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'var(--bg-card)',
                padding: '2.5rem 2rem',
                borderRadius: '24px',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 1
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>

                <h2 style={{ marginBottom: '2rem', textAlign: 'center', color: 'white', fontWeight: '800', fontSize: '1.5rem', letterSpacing: '0.5px' }}>
                    Iniciar Sesión
                </h2>

                {step === 'email' ? (
                    <form onSubmit={handleSendCode} style={{ display: 'grid', gap: '1.5rem' }}>
                        <div>
                            <label style={labelStyle}>Correo electrónico</label>
                            <div style={fieldStyle}>
                                <div style={iconStyle}>
                                    <Mail size={20} />
                                </div>
                                <input
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="tu@correo.com"
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {error && <p style={{ ...messageStyle, color: '#f87171' }}>{error}</p>}

                        <button type="submit" disabled={loading} style={{ ...submitStyle, opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} style={{ display: 'grid', gap: '1.5rem' }}>
                        <p style={{ ...messageStyle, color: 'var(--text-muted)' }}>
                            Enviamos un código a <strong style={{ color: 'white' }}>{email.trim().toLowerCase()}</strong>
                        </p>
                        <div>
                            <label style={labelStyle}>Código de verificación</label>
                            <div style={fieldStyle}>
                                <div style={iconStyle}>
                                    <KeyRound size={20} />
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={10}
                                    required
                                    autoFocus
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    placeholder="123456"
                                    style={{ ...inputStyle, letterSpacing: '0.4em' }}
                                />
                            </div>
                        </div>

                        {error && <p style={{ ...messageStyle, color: '#f87171' }}>{error}</p>}

                        <button type="submit" disabled={loading} style={{ ...submitStyle, opacity: loading ? 0.6 : 1 }}>
                            {loading ? 'VERIFICANDO...' : 'ENTRAR'}
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button type="button" onClick={() => { setStep('email'); setError(''); }} style={linkButtonStyle}>
                                <ArrowLeft size={14} /> Cambiar correo
                            </button>
                            <button type="button" disabled={loading} onClick={handleSendCode} style={linkButtonStyle}>
                                Reenviar código
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
