import { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { ChevronRight, Plus, History, Trash2, Edit2 } from 'lucide-react';
import { Timer } from './Timer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function WorkoutView() {
    const { routines, logs, addLog, user, addRoutine, updateRoutine, removeRoutine } = useStore();
    const [activeRoutineId, setActiveRoutineId] = useState('');
    const [isEditingRoutines, setIsEditingRoutines] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');
    const [editingRoutineId, setEditingRoutineId] = useState(null);
    const [editingName, setEditingName] = useState('');

    const activeRoutine = routines.find(r => r.id === activeRoutineId);

    const handleAddRoutine = (e) => {
        e.preventDefault();
        if (!newRoutineName.trim()) return;
        addRoutine(newRoutineName);
        setNewRoutineName('');
    };

    const startEditing = (routine) => {
        setEditingRoutineId(routine.id);
        setEditingName(routine.name);
    };

    const saveEditing = () => {
        if (editingName.trim()) {
            updateRoutine(editingRoutineId, { name: editingName });
        }
        setEditingRoutineId(null);
    };

    if (!activeRoutine) {
        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>Hola, {user?.name || 'Vikingo'}!</h2>
                    <button
                        onClick={() => setIsEditingRoutines(!isEditingRoutines)}
                        style={{
                            background: isEditingRoutines ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            border: '1px solid ' + (isEditingRoutines ? 'var(--danger)' : 'var(--primary)'),
                            color: isEditingRoutines ? 'var(--danger)' : 'var(--primary)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        {isEditingRoutines ? 'Terminar' : <><Edit2 size={14} /> Editar</>}
                    </button>
                </div>

                <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Selecciona Rutina</h3>

                {routines.map(routine => (
                    <div key={routine.id} style={{ position: 'relative' }}>
                        {isEditingRoutines && editingRoutineId === routine.id ? (
                            <div style={{
                                display: 'flex',
                                gap: '0.5rem',
                                marginBottom: '1rem',
                                padding: '1.5rem',
                                background: 'var(--bg-card)',
                                borderRadius: 'var(--radius-md)',
                                border: 'var(--glass-border)'
                            }}>
                                <input
                                    value={editingName}
                                    onChange={(e) => setEditingName(e.target.value)}
                                    style={{ flex: 1 }}
                                    autoFocus
                                />
                                <button onClick={saveEditing} style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '0 1rem', color: 'white' }}>OK</button>
                            </div>
                        ) : (
                            <button
                                onClick={() => !isEditingRoutines && setActiveRoutineId(routine.id)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '1.5rem',
                                    background: 'var(--bg-card)',
                                    border: 'var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-main)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: isEditingRoutines ? 0.8 : 1
                                }}
                            >
                                <span style={{ fontSize: '1.1rem', fontWeight: '600' }}>{routine.name}</span>
                                {!isEditingRoutines && <ChevronRight size={20} color="var(--primary)" />}
                            </button>
                        )}

                        {isEditingRoutines && editingRoutineId !== routine.id && (
                            <div style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={() => startEditing(routine)}
                                    style={{
                                        background: 'rgba(34, 211, 238, 0.2)',
                                        color: 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        if (confirm('¿Eliminar esta rutina?')) {
                                            removeRoutine(routine.id);
                                        }
                                    }}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        color: '#f87171',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {isEditingRoutines && (
                    <form onSubmit={handleAddRoutine} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={newRoutineName}
                            onChange={(e) => setNewRoutineName(e.target.value)}
                            placeholder="Nombre nueva rutina..."
                            style={{ flex: 1 }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'var(--primary)',
                                color: 'var(--bg-app)',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                padding: '0.5rem 1rem',
                                fontWeight: 'bold'
                            }}
                        >
                            <Plus size={20} />
                        </button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <WorkoutDetails
            routine={activeRoutine}
            onBack={() => setActiveRoutineId('')}
            addLog={addLog}
            logs={logs}
        />
    );
}

function WorkoutDetails({ routine, onBack, addLog, logs }) {
    const { addExerciseToRoutine, removeExerciseFromRoutine, updateLog, deleteLog } = useStore();
    const [activeExerciseId, setActiveExerciseId] = useState('');

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [editingLogId, setEditingLogId] = useState(null);

    // Form State
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');

    // Timer State
    const [showTimer, setShowTimer] = useState(false);

    const activeExercise = routine.exercises.find(e => e.id === activeExerciseId);
    const exerciseLogs = logs.filter(l => l.exerciseId === activeExerciseId).slice(0, 5);

    const handleLogSet = (e) => {
        e.preventDefault();
        if (!weight || !reps) return;

        if (editingLogId) {
            updateLog(editingLogId, {
                weight: parseFloat(weight),
                reps: parseInt(reps)
            });
            setEditingLogId(null);
            setWeight('');
            setReps('');
            return;
        }

        const newLog = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            exerciseId: activeExerciseId,
            weight: parseFloat(weight),
            reps: parseInt(reps),
        };

        addLog(newLog);
        setShowTimer(true);
        setWeight('');
        setReps('');
    };

    const handleEditLog = (log) => {
        setWeight(log.weight);
        setReps(log.reps);
        setEditingLogId(log.id);
    };

    const handleDeleteLog = (id) => {
        if (confirm('¿Eliminar este registro?')) {
            deleteLog(id);
        }
    };

    const handleAddExercise = (e) => {
        e.preventDefault();
        if (!newExerciseName.trim()) return;
        addExerciseToRoutine(routine.id, newExerciseName);
        setNewExerciseName('');
    };

    // Prepare chart data (oldest to newest)
    const chartData = [...exerciseLogs].reverse().map(l => ({
        date: new Date(l.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }),
        weight: l.weight,
        reps: l.reps,
        fullDate: new Date(l.date).toLocaleDateString('es-ES')
    }));

    if (!activeExercise) {
        return (
            <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <button
                        onClick={onBack}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', padding: 0 }}
                    >
                        &larr; Volver
                    </button>
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            background: isEditing ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                            border: '1px solid ' + (isEditing ? 'var(--danger)' : 'var(--primary)'),
                            color: isEditing ? 'var(--danger)' : 'var(--primary)',
                            padding: '0.25rem 0.75rem',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem'
                        }}
                    >
                        {isEditing ? 'Terminar Edición' : <><Edit2 size={14} /> Editar Rutina</>}
                    </button>
                </div>

                <h2 style={{ marginBottom: '1rem' }}>{routine.name}</h2>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {routine.exercises.map(exercise => (
                        <div key={exercise.id} style={{ position: 'relative' }}>
                            <button
                                onClick={() => !isEditing && setActiveExerciseId(exercise.id)}
                                style={{
                                    width: '100%',
                                    textAlign: 'left',
                                    padding: '1.25rem',
                                    background: 'var(--bg-card)',
                                    border: 'var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-main)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: isEditing ? 0.7 : 1
                                }}
                            >
                                <span>{exercise.name}</span>
                                {!isEditing && <Plus size={20} color="var(--success)" />}
                            </button>
                            {isEditing && (
                                <button
                                    onClick={() => removeExerciseFromRoutine(routine.id, exercise.id)}
                                    style={{
                                        position: 'absolute',
                                        right: '1rem',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        color: '#f87171',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        zIndex: 2,
                                        cursor: 'pointer'
                                    }}
                                    title="Eliminar ejercicio"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}

                    {isEditing && (
                        <form onSubmit={handleAddExercise} style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="text"
                                value={newExerciseName}
                                onChange={(e) => setNewExerciseName(e.target.value)}
                                placeholder="Nombre del nuevo ejercicio"
                                style={{ flex: 1 }}
                            />
                            <button
                                type="submit"
                                style={{
                                    background: 'var(--primary)',
                                    color: 'var(--bg-app)',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '0.5rem 1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                Añadir
                            </button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveExerciseId('')}
                    style={{ background: 'var(--bg-card)', border: 'none', color: 'var(--text-main)', padding: '0.5rem', borderRadius: '50%' }}
                >
                    &larr;
                </button>
                <h2 style={{ fontSize: '1.25rem' }}>{activeExercise.name}</h2>
            </div>

            <div style={{
                background: 'var(--bg-card)',
                border: 'var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                marginBottom: '2rem'
            }}>
                <form onSubmit={handleLogSet} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Peso (kg)</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            value={weight}
                            onChange={(e) => setWeight(e.target.value)}
                            style={{ width: '100%', fontSize: '1.2rem' }}
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Reps</label>
                        <input
                            type="number"
                            inputMode="numeric"
                            value={reps}
                            onChange={(e) => setReps(e.target.value)}
                            style={{ width: '100%', fontSize: '1.2rem' }}
                            placeholder="0"
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
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
                            {editingLogId ? 'GUARDAR CAMBIOS' : 'REGISTRAR SERIE'}
                        </button>
                        {editingLogId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingLogId(null);
                                    setWeight('');
                                    setReps('');
                                }}
                                style={{
                                    background: 'transparent',
                                    border: '1px solid var(--text-muted)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-muted)',
                                    padding: '0 1rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                CANCELAR
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {showTimer && <Timer onClose={() => setShowTimer(false)} />}

            <div style={{ marginTop: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <History size={18} /> Historial Reciente
                </h3>

                {chartData.length > 1 && (
                    <div style={{ height: '200px', marginBottom: '1rem', background: 'var(--bg-card)', padding: '0.5rem', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} domain={['auto', 'auto']} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--glass-border)', color: 'var(--text-main)' }}
                                    labelStyle={{ color: 'var(--text-muted)' }}
                                />
                                <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {exerciseLogs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin registros aún</p>
                    ) : (
                        exerciseLogs.map(log => (
                            <div key={log.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <span style={{ color: 'var(--text-muted)' }}>{new Date(log.date).toLocaleDateString('es-ES')}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>{log.weight}kg x {log.reps}</span>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEditLog(log)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: 0 }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLog(log.id)}
                                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
