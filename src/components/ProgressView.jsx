import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Ruler, Scale, Calendar, Trash2, Edit2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
    const [measVisible, setMeasVisible] = useState(5);

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
        <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '16px', padding: '0.35rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                    onClick={() => { setActiveTab('add'); setEditingId(null); setFormData({ weight: '', chest: '', waist: '', arms: '', legs: '' }); }}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'add' ? 'var(--bg-card)' : 'transparent',
                        color: activeTab === 'add' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        boxShadow: activeTab === 'add' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    {editingId ? 'Editar Registro' : 'Nueva Medición'}
                </button>
                <button
                    onClick={() => { setActiveTab('history'); setEditingId(null); setMeasVisible(5); }}
                    style={{
                        flex: 1,
                        padding: '0.75rem',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'history' ? 'var(--bg-card)' : 'transparent',
                        color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s',
                        boxShadow: activeTab === 'history' ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                        cursor: 'pointer'
                    }}
                >
                    Evolución
                </button>
            </div>

            {activeTab === 'add' ? (
                <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ 
                        background: 'var(--bg-card)', 
                        padding: '1.5rem', 
                        borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>
                        <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>
                            <span style={{ color: 'var(--primary)', display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '10px' }}>
                                <Scale size={20} />
                            </span>
                            Peso Corporal
                        </h3>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Peso (kg)</label>
                            <input
                                name="weight"
                                type="number"
                                inputMode="decimal"
                                value={formData.weight}
                                onChange={handleChange}
                                placeholder="ej. 75.5"
                                style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', outline: 'none' }}
                            />
                        </div>
                    </div>

                    <div style={{ 
                        background: 'var(--bg-card)', 
                        padding: '1.5rem', 
                        borderRadius: '24px', 
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #facc15, #f472b6, #60a5fa, #4ade80)' }}></div>
                        <h3 style={{ margin: '0 0 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white', fontSize: '1.1rem', fontWeight: '800' }}>
                            <span style={{ color: 'var(--secondary)', display: 'flex', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '10px' }}>
                                <Ruler size={20} />
                            </span>
                            Medidas (cm)
                        </h3>
                        <div className="measurements-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Pecho</label>
                                <input name="chest" type="number" inputMode="decimal" value={formData.chest} onChange={handleChange} placeholder="0" style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Glúteos</label>
                                <input name="waist" type="number" inputMode="decimal" value={formData.waist} onChange={handleChange} placeholder="0" style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Brazos</label>
                                <input name="arms" type="number" inputMode="decimal" value={formData.arms} onChange={handleChange} placeholder="0" style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Piernas</label>
                                <input name="legs" type="number" inputMode="decimal" value={formData.legs} onChange={handleChange} placeholder="0" style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', outline: 'none' }} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={{
                            background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                            border: 'none',
                            borderRadius: '16px',
                            color: 'var(--bg-app)',
                            fontWeight: '900',
                            letterSpacing: '1px',
                            padding: '1.1rem',
                            fontSize: '1.1rem',
                            boxShadow: '0 8px 25px -5px rgba(34, 211, 238, 0.4)',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
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
                                border: '1px dashed rgba(255,255,255,0.2)',
                                borderRadius: '16px',
                                color: 'var(--text-muted)',
                                padding: '1.1rem',
                                marginTop: '-0.5rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            CANCELAR EDICIÓN
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
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: '0.5rem', margin: '0 -1rem 1rem -1rem', padding: '4px 1rem', scrollbarWidth: 'none' }}>
                                {chartConfigs.map(config => {
                                    const isActive = activeChart === config.key;
                                    return (
                                        <button
                                            key={config.key}
                                            onClick={() => setActiveChart(config.key)}
                                            style={{
                                                background: isActive ? config.color : 'rgba(255,255,255,0.05)',
                                                border: `1px solid ${isActive ? config.color : 'rgba(255,255,255,0.05)'}`,
                                                color: isActive ? 'var(--bg-app)' : 'var(--text-main)',
                                                padding: '0.4rem 1rem',
                                                borderRadius: '20px',
                                                fontSize: '0.85rem',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                fontWeight: isActive ? '800' : '600',
                                                whiteSpace: 'nowrap',
                                                boxShadow: isActive ? `0 4px 12px ${config.color}40` : 'none'
                                            }}
                                        >
                                            {config.title}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Single Chart Section */}
                            <div style={{ height: '320px', background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', boxShadow: '0 8px 30px rgba(0,0,0,0.3)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', marginBottom: '1.5rem' }}>
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
                                                    <AreaChart data={validData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                        <defs>
                                                            <linearGradient id={`color${config.key}`} x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor={config.color} stopOpacity={0.3}/>
                                                                <stop offset="95%" stopColor={config.color} stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                        <XAxis 
                                                            dataKey="date" 
                                                            stroke="var(--text-muted)" 
                                                            fontSize={11} 
                                                            tickLine={false}
                                                            axisLine={false}
                                                            dy={10}
                                                        />
                                                        <YAxis 
                                                            stroke="var(--text-muted)" 
                                                            fontSize={11} 
                                                            domain={['auto', 'auto']} 
                                                            tickLine={false}
                                                            axisLine={false}
                                                            dx={-10}
                                                            tickFormatter={(val) => Math.round(val)}
                                                        />
                                                        <Tooltip
                                                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
                                                            content={({ active, payload, label }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div style={{ 
                                                                            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                                                            padding: '0.75rem', 
                                                                            border: '1px solid var(--glass-border)', 
                                                                            borderRadius: '8px',
                                                                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                                                                            backdropFilter: 'blur(4px)'
                                                                        }}>
                                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{data.fullDate}</p>
                                                                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                                                                <span style={{ fontSize: '1.25rem', color: config.color, fontWeight: 'bold' }}>
                                                                                    {data[config.key]}
                                                                                </span>
                                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                                                    {config.unit}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Area 
                                                            type="monotone" 
                                                            dataKey={config.key} 
                                                            stroke={config.color} 
                                                            strokeWidth={3} 
                                                            fillOpacity={1} 
                                                            fill={`url(#color${config.key})`}
                                                            dot={{ r: 4, fill: 'var(--bg-card)', stroke: config.color, strokeWidth: 2 }} 
                                                            activeDot={{ r: 6, fill: config.color, stroke: 'white', strokeWidth: 2 }} 
                                                        />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {(() => {
                            const sortedMeasurements = [...measurements].sort((a, b) => new Date(b.date) - new Date(a.date));
                            const visibleMeasurements = sortedMeasurements.slice(0, measVisible);
                            return (
                                <>
                                    {visibleMeasurements.map((entry, index) => {
                                    const isFirst = index === 0;
                                    const prev = sortedMeasurements[index + 1];
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
                                        background: isFirst ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(34, 211, 238, 0.05) 100%)' : 'var(--bg-card)',
                                        padding: '1.5rem',
                                        borderRadius: '24px',
                                        border: '1px solid',
                                        borderColor: isFirst ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255,255,255,0.08)',
                                        boxShadow: isFirst ? '0 8px 30px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.2)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '1rem',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.9rem', borderBottom: '1px dashed rgba(255,255,255,0.1)', paddingBottom: '0.75rem' }}>
                                            <span style={{ 
                                                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                                                background: isFirst ? 'var(--primary)' : 'rgba(255,255,255,0.08)', 
                                                color: isFirst ? 'var(--bg-app)' : 'var(--text-muted)',
                                                fontSize: '0.75rem', fontWeight: '800', padding: '4px 12px', borderRadius: '8px', letterSpacing: '0.5px' 
                                            }}>
                                                <Calendar size={14} /> {new Date(entry.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => handleEdit(entry)}
                                                    style={{ background: 'rgba(34, 211, 238, 0.15)', color: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }}
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(entry.id)}
                                                    style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', transition: 'all 0.2s' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1.25rem', alignItems: 'start' }}>
                                            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem' }}>Peso Corporal</div>
                                                <div style={{ fontSize: '2rem', fontWeight: '900', color: 'white', display: 'flex', alignItems: 'baseline', gap: '0.25rem', lineHeight: '1' }}>
                                                    {entry.weight ? entry.weight : '-'}
                                                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>kg</span>
                                                </div>
                                                <div style={{ marginTop: '0.5rem' }}>
                                                    {getDelta(entry.weight, prev?.weight)}
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                                {entry.chest > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Pecho:</span>
                                                        <span style={{ color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {entry.chest} <span style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:'normal'}}>cm</span> {getDelta(entry.chest, prev?.chest)}
                                                        </span>
                                                    </div>
                                                )}
                                                {entry.waist > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Glúteos:</span>
                                                        <span style={{ color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {entry.waist} <span style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:'normal'}}>cm</span> {getDelta(entry.waist, prev?.waist)}
                                                        </span>
                                                    </div>
                                                )}
                                                {entry.arms > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Brazos:</span>
                                                        <span style={{ color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {entry.arms} <span style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:'normal'}}>cm</span> {getDelta(entry.arms, prev?.arms)}
                                                        </span>
                                                    </div>
                                                )}
                                                {entry.legs > 0 && (
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600' }}>Piernas:</span>
                                                        <span style={{ color: 'white', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            {entry.legs} <span style={{fontSize:'0.75rem', color:'var(--text-muted)', fontWeight:'normal'}}>cm</span> {getDelta(entry.legs, prev?.legs)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                                    {sortedMeasurements.length > measVisible && (
                                        <button
                                            onClick={() => setMeasVisible(v => v + 5)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                background: 'transparent',
                                                border: '1px dashed rgba(255,255,255,0.15)',
                                                borderRadius: 'var(--radius-md)',
                                                color: 'var(--primary)',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem',
                                                fontWeight: '600',
                                                letterSpacing: '0.3px',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            ↓ Mostrar más ({sortedMeasurements.length - measVisible} restantes)
                                        </button>
                                    )}
                                </>
                            );
                        })()}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
