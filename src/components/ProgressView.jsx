import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Ruler, Scale, Calendar, Trash2, Edit2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { confirmAction } from '../utils/ui';

export function ProgressView() {
    const { measurements, addMeasurement, updateMeasurement, deleteMeasurement } = useStore();
    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'history'

    const [formData, setFormData] = useState({
        weight: '',
        chest: '',
        waist: '',
        arms: '',
        legs: ''
    });

    const [editingId, setEditingId] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.weight && !formData.waist) return; // Basic validation

        if (editingId) {
            updateMeasurement(editingId, formData);
            setEditingId(null);
            setActiveTab('history');
        } else {
            const newEntry = {
                id: crypto.randomUUID(),
                date: new Date().toISOString(),
                ...formData
            };
            addMeasurement(newEntry);
            setActiveTab('history');
        }

        setFormData({ weight: '', chest: '', waist: '', arms: '', legs: '' });
    };

    const handleEdit = (entry) => {
        setFormData({
            weight: entry.weight || '',
            chest: entry.chest || '',
            waist: entry.waist || '',
            arms: entry.arms || '',
            legs: entry.legs || ''
        });
        setEditingId(entry.id);
        setActiveTab('add');
    };

    const handleDelete = (id) => {
        confirmAction('¿Estás seguro de eliminar este registro?', () => {
            deleteMeasurement(id);
             // toast.success('Registro eliminado'); // deleteMeasurement might trigger something, but safe to add toast here or assume store handles it? Store doesn't seem to return promise or toast.
        });
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Prepare data for chart (sort oldest to newest)
    const chartData = [...measurements]
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .map(m => ({
            date: new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
            weight: m.weight ? parseFloat(m.weight) : null,
            chest: m.chest ? parseFloat(m.chest) : null,
            waist: m.waist ? parseFloat(m.waist) : null,
            arms: m.arms ? parseFloat(m.arms) : null,
            legs: m.legs ? parseFloat(m.legs) : null,
            fullDate: new Date(m.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        }))
        .filter(d => d.weight !== null || d.chest !== null || d.waist !== null || d.arms !== null || d.legs !== null);

    const chartConfigs = [
        { key: 'weight', title: 'Peso Corporal', color: 'var(--primary)', unit: 'kg' },
        { key: 'chest', title: 'Pecho', color: '#facc15', unit: 'cm' },
        { key: 'waist', title: 'Glúteos', color: '#f472b6', unit: 'cm' },
        { key: 'arms', title: 'Brazos', color: '#60a5fa', unit: 'cm' },
        { key: 'legs', title: 'Piernas', color: '#4ade80', unit: 'cm' }
    ];

    const [activeChart, setActiveChart] = useState('weight');

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', background: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius-md)' }}>
                <button
                    onClick={() => { setActiveTab('add'); setEditingId(null); setFormData({ weight: '', chest: '', waist: '', arms: '', legs: '' }); }}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: activeTab === 'add' ? 'var(--primary-glow)' : 'transparent',
                        color: activeTab === 'add' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'add' ? 'bold' : 'normal'
                    }}
                >
                    {editingId ? 'Editar Registro' : 'Actualizar'}
                </button>
                <button
                    onClick={() => { setActiveTab('history'); setEditingId(null); }}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        background: activeTab === 'history' ? 'var(--primary-glow)' : 'transparent',
                        color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: activeTab === 'history' ? 'bold' : 'normal'
                    }}
                >
                    Historial
                </button>
            </div>

            {activeTab === 'add' ? (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                            <Scale size={20} /> Peso Corporal
                        </h3>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Peso (kg)</label>
                        <input
                            name="weight"
                            type="number"
                            inputMode="decimal"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="ej. 75.5"
                            style={{ width: '100%', fontSize: '1.2rem' }}
                        />
                    </div>

                    <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--secondary)' }}>
                            <Ruler size={20} /> Medidas (cm)
                        </h3>
                        <div className="measurements-grid">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Pecho</label>
                                <input name="chest" type="number" inputMode="decimal" value={formData.chest} onChange={handleChange} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Glúteos</label>
                                <input name="waist" type="number" inputMode="decimal" value={formData.waist} onChange={handleChange} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Brazos</label>
                                <input name="arms" type="number" inputMode="decimal" value={formData.arms} onChange={handleChange} style={{ width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Piernas</label>
                                <input name="legs" type="number" inputMode="decimal" value={formData.legs} onChange={handleChange} style={{ width: '100%' }} />
                            </div>
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
                            boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)'
                        }}
                    >
                        {editingId ? 'GUARDAR CAMBIOS' : 'GUARDAR PROGRESO'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={() => { setEditingId(null); setActiveTab('history'); }}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--text-muted)',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--text-muted)',
                                padding: '0.75rem',
                                marginTop: '-1rem'
                            }}
                        >
                            CANCELAR
                        </button>
                    )}
                </form>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {measurements.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                            Sin registros aún.
                        </div>
                    ) : (
                        <>
                            {/* Centered Toggles */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '1rem' }}>
                                {chartConfigs.map(config => {
                                    const isActive = activeChart === config.key;
                                    return (
                                        <button
                                            key={config.key}
                                            onClick={() => setActiveChart(config.key)}
                                            style={{
                                                background: isActive ? config.color : 'transparent',
                                                border: `1px solid ${config.color}`,
                                                color: isActive ? 'var(--bg-app)' : config.color,
                                                padding: '0.4rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.9rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: isActive ? 'bold' : 'normal'
                                            }}
                                        >
                                            {config.title}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Single Chart Section */}
                            <div style={{ height: '300px', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)', display: 'flex', flexDirection: 'column', marginBottom: '1rem' }}>
                                {(() => {
                                    const config = chartConfigs.find(c => c.key === activeChart);
                                    if (!config) return null;
                                    
                                    const validData = chartData.filter(d => d[config.key] !== null && d[config.key] !== undefined && !isNaN(d[config.key]));
                                    
                                    if (validData.length < 2) {
                                        return (
                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                Insuficientes datos para esta gráfica
                                            </div>
                                        );
                                    }

                                    return (
                                        <>
                                            <h4 style={{ margin: '0 0 1rem 0', color: config.color, display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '0 0 auto' }}>
                                                {config.title} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>({config.unit})</span>
                                            </h4>
                                            <div style={{ flex: 1, minHeight: 0 }}>
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <LineChart data={validData}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                                        <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                                        <YAxis stroke="var(--text-muted)" fontSize={12} domain={['auto', 'auto']} />
                                                        <Tooltip
                                                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }}
                                                            labelStyle={{ color: 'var(--text-muted)' }}
                                                            itemStyle={{ color: config.color }}
                                                        />
                                                        <Line 
                                                            type="monotone" 
                                                            dataKey={config.key} 
                                                            stroke={config.color} 
                                                            strokeWidth={3} 
                                                            dot={{ r: 4, fill: config.color }} 
                                                            activeDot={{ r: 7 }} 
                                                        />
                                                    </LineChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {measurements
                                .sort((a, b) => new Date(b.date) - new Date(a.date))
                                .map((entry, index) => {
                                const prev = measurements[index + 1];
                                const getDelta = (current, previous) => {
                                    if (!current || !previous) return null;
                                    const diff = (parseFloat(current) - parseFloat(previous)).toFixed(1);
                                    if (diff == 0.0) return null;
                                    const isPositive = diff > 0;
                                    return (
                                        <span style={{ 
                                            fontSize: '0.8rem', 
                                            color: isPositive ? 'var(--success)' : '#f87171',
                                            fontWeight: 'bold',
                                            marginLeft: '0.5rem',
                                            background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                            padding: '2px 6px',
                                            borderRadius: '4px'
                                        }}>
                                            {isPositive ? '+' : ''}{diff}
                                        </span>
                                    );
                                };

                                return (
                                    <div key={entry.id} style={{
                                        background: 'var(--bg-card)',
                                        padding: '1.25rem',
                                        borderRadius: 'var(--radius-md)',
                                        border: 'var(--glass-border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '0.75rem'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.5rem' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                                                <Calendar size={16} /> {new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div style={{ display: 'flex', gap: '1rem' }}>
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#f87171', padding: 0 }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'start' }}>
                                            <div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Peso</div>
                                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)', display: 'flex', alignItems: 'center' }}>
                                                    {entry.weight ? `${entry.weight} kg` : '-'}
                                                    {getDelta(entry.weight, prev?.weight)}
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                                                {entry.chest > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Pecho:</span>
                                                        <span style={{ color: 'var(--text-main)' }}>{entry.chest} cm {getDelta(entry.chest, prev?.chest)}</span>
                                                    </div>
                                                )}
                                                {entry.waist > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Glúteos:</span>
                                                        <span style={{ color: 'var(--text-main)' }}>{entry.waist} cm {getDelta(entry.waist, prev?.waist)}</span>
                                                    </div>
                                                )}
                                                {entry.arms > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Brazos:</span>
                                                        <span style={{ color: 'var(--text-main)' }}>{entry.arms} cm {getDelta(entry.arms, prev?.arms)}</span>
                                                    </div>
                                                )}
                                                {entry.legs > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: 'var(--text-muted)' }}>Piernas:</span>
                                                        <span style={{ color: 'var(--text-main)' }}>{entry.legs} cm {getDelta(entry.legs, prev?.legs)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
