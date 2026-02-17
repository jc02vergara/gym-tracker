import { toast } from 'sonner';

export const confirmAction = (message, onConfirm) => {
    toast.custom((t) => (
        <div style={{
            background: '#1e293b', // Concrete dark color ensuring visibility
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '1.25rem',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            minWidth: '300px'
        }}>
            <span style={{
                color: '#f8fafc', 
                fontSize: '1rem', 
                fontWeight: '500',
                textAlign: 'center'
            }}>
                {message}
            </span>
            <div style={{display: 'flex', gap: '0.75rem', justifyContent: 'center', width: '100%'}}>
                <button
                    onClick={() => toast.dismiss(t)}
                    style={{
                        flex: 1,
                        background: 'rgba(255,255,255,0.05)',
                        color: '#94a3b8',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        transition: 'background 0.2s'
                    }}
                >
                    Cancelar
                </button>
                <button
                    onClick={() => {
                        onConfirm();
                        toast.dismiss(t);
                    }}
                    style={{
                        flex: 1,
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        padding: '0.6rem 1rem',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        fontSize: '0.9rem',
                        boxShadow: '0 2px 10px rgba(239, 68, 68, 0.3)'
                    }}
                >
                    Confirmar
                </button>
            </div>
        </div>
    ), { duration: Infinity, position: 'top-center' }); // Keep until interacted
};
