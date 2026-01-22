import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Ruler, Scale, Calendar, Trash2, Edit2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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
        if (confirm('¿Estás seguro de eliminar este registro?')) {
            deleteMeasurement(id);
        }
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    // Prepare data for chart (reverse to show oldest to newest left to right)
    const chartData = [...measurements].reverse().map(m => ({
        date: new Date(m.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        weight: m.weight ? parseFloat(m.weight) : null,
        fullDate: new Date(m.date).toLocaleDateString('es-ES')
    })).filter(d => d.weight !== null);

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
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem' }}>
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
                            {/* Chart Section */}
                            {chartData.length > 1 && (
                                <div style={{ height: '250px', marginBottom: '1rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                            <YAxis stroke="var(--text-muted)" fontSize={12} domain={['auto', 'auto']} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }}
                                                labelStyle={{ color: 'var(--text-muted)' }}
                                            />
                                            <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            )}

                            {measurements.map(entry => (
                                <div key={entry.id} style={{
                                    background: 'var(--bg-card)',
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'var(--glass-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.5rem'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <Calendar size={14} /> {new Date(entry.date).toLocaleDateString('es-ES')}
                                        </span>
                                        <div style={{ display: 'flex', gap: '1rem' }}>
                                            <button
                                                onClick={() => handleEdit(entry)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)' }}
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(entry.id)}
                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-main)' }}>
                                            {entry.weight ? `${entry.weight} kg` : '-'}
                                        </div>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                            {entry.waist > 0 && <div>Glúteos: {entry.waist}cm</div>}
                                            {entry.chest > 0 && <div>Pecho: {entry.chest}cm</div>}
                                            {entry.arms > 0 && <div>Brazos: {entry.arms}cm</div>}
                                            {entry.legs > 0 && <div>Piernas: {entry.legs}cm</div>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
