import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { ChevronRight, Plus, History, Trash2, Edit2, Eye, EyeOff, Play, Square, Clock } from 'lucide-react';
import { Timer } from './Timer';
import { ExercisePicker } from './ExercisePicker';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { confirmAction } from '../utils/ui';

    const fmtElapsed = (sec) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    };

    const parseRepsRange = (rangeStr) => {
        if (!rangeStr) return [];
        // If it's a range like "8-10"
        if (rangeStr.includes('-')) {
            const parts = rangeStr.split('-').map(s => parseInt(s.trim()));
            if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                const options = [];
                const start = Math.min(parts[0], parts[1]);
                const end = Math.max(parts[0], parts[1]);
                // Limit to 20 options to prevent UI breakage
                for (let i = start; i <= Math.min(end, start + 20); i++) {
                    options.push(i.toString());
                }
                return options;
            }
        }
        // If it's just a number or something else, return it as a single option if it's numeric
        const singleVal = parseInt(rangeStr);
        if (!isNaN(singleVal)) return [singleVal.toString()];
        return [];
    };

export function WorkoutView({ preselectedRoutineId }) {
    const { 
        routines, logs, addLog, user,
        activeSession, startSession, endSession,
        addRoutine, updateRoutine, removeRoutine, reorderRoutines,
        addExerciseToRoutine, removeExerciseFromRoutine
    } = useStore();
    const [activeRoutineId, setActiveRoutineId] = useState(preselectedRoutineId || '');
    const [isEditingRoutines, setIsEditingRoutines] = useState(false);
    const [newRoutineName, setNewRoutineName] = useState('');
    const [editingRoutineId, setEditingRoutineId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [elapsed, setElapsed] = useState(0); // seconds

    // Live timer tick for active session
    useEffect(() => {
        if (!activeSession) { setElapsed(0); return; }
        const update = () => setElapsed(Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [activeSession]);

    useEffect(() => {
        if (preselectedRoutineId) {
            setActiveRoutineId(preselectedRoutineId);
        }
    }, [preselectedRoutineId]);

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

    const handleMoveRoutine = (index, direction) => {
        const newRoutines = [...routines];
        const targetIndex = index + direction;
        
        if (targetIndex < 0 || targetIndex >= newRoutines.length) return;

        // Swap
        const temp = newRoutines[index];
        newRoutines[index] = newRoutines[targetIndex];
        newRoutines[targetIndex] = temp;

        reorderRoutines(newRoutines);
    };

    const checkRoutineCompletion = (routine) => {
        if (!routine.exercises) return false;
        
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay() || 7; 
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); 
        else startOfWeek.setHours(0,0,0,0);
        
        startOfWeek.setDate(now.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        const activeExercises = routine.exercises.filter(e => e.is_active !== false);

        if (activeExercises.length === 0) return false;

        return activeExercises.every(exercise => {
             return logs.some(log => {
                 if (log.exerciseId !== exercise.id) return false;
                 const logDate = new Date(log.created_at || log.date);
                 return logDate >= startOfWeek;
             });
        });
    };


    if (!activeRoutine) {
        return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '2rem' }}>
            {/* Active session global banner */}
            {activeSession && (
                <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(249,115,22,0.15) 100%)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171', animation: 'pulse 1.5s ease-in-out infinite', boxShadow: '0 0 8px #f87171' }} />
                        <span style={{ color: '#f87171', fontWeight: '700', fontSize: '0.85rem' }}>Sesión en curso</span>
                        <span style={{ color: 'white', fontWeight: '900', fontSize: '1rem', fontFamily: 'monospace' }}>{fmtElapsed(elapsed)}</span>
                    </div>
                    <button
                        onClick={async () => { const mins = await endSession(); toast.success(`¡Sesión terminada! ${mins} min registrados.`); }}
                        style={{ background: '#f87171', border: 'none', borderRadius: '10px', padding: '0.4rem 0.9rem', color: 'white', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                        <Square size={12} /> Terminar
                    </button>
                </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0' }}>
                <div>
                     <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Bienvenido de vuelta</p>
                     <h2 style={{ margin: 0, fontSize: '2.2rem', fontWeight: '900', background: 'linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-1px' }}>
                         {user?.name || 'Vikingo'}!
                     </h2>
                </div>
                <button
                    onClick={() => setIsEditingRoutines(!isEditingRoutines)}
                    style={{
                        background: isEditingRoutines ? 'var(--danger)' : 'rgba(255,255,255,0.05)',
                        border: '1px solid',
                        borderColor: isEditingRoutines ? 'var(--danger)' : 'rgba(255,255,255,0.1)',
                        color: isEditingRoutines ? 'white' : 'var(--text-main)',
                        padding: '0.6rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        boxShadow: isEditingRoutines ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                        cursor: 'pointer'
                    }}
                >
                    {isEditingRoutines ? 'Hecho' : <><Edit2 size={16} /> Editar</>}
                </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '-0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                     <span style={{ width: '4px', height: '18px', background: 'var(--primary)', borderRadius: '4px', display: 'inline-block', boxShadow: '0 0 10px var(--primary-glow)' }}></span>
                     Tus Rutinas
                </h3>
                <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)' }}>
                    {routines.filter(r => r.is_active !== false).length} ACTIVAS
                </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {routines
                .filter(r => isEditingRoutines || r.is_active !== false)
                .map((routine, index) => {
                const isDoneThisWeek = checkRoutineCompletion(routine);
                return (
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
                                    paddingRight: isEditingRoutines && editingRoutineId !== routine.id ? '9.5rem' : '1.5rem',
                                    background: isDoneThisWeek ? 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.05) 100%)' : 'var(--bg-card)',
                                    border: '1px solid',
                                    borderColor: isDoneThisWeek ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                                    borderRadius: '20px',
                                    color: 'var(--text-main)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: (routine.is_active === false) ? 0.4 : (isEditingRoutines ? 0.9 : 1),
                                    filter: (routine.is_active === false) ? 'grayscale(100%)' : 'none',
                                    cursor: isEditingRoutines ? 'default' : 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isDoneThisWeek ? '0 8px 25px -5px rgba(34, 197, 94, 0.15)' : '0 8px 20px -8px rgba(0, 0, 0, 0.5)',
                                    transform: isEditingRoutines ? 'scale(0.98)' : 'scale(1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isDoneThisWeek ? 'var(--success)' : 'var(--primary)', opacity: isDoneThisWeek ? 0.8 : 0.5 }}></div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '8px' }}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ 
                                            fontSize: '1.35rem', 
                                            fontWeight: '800', 
                                            letterSpacing: '-0.5px',
                                            textDecoration: (routine.is_active === false) ? 'line-through' : 'none',
                                            color: (routine.is_active === false) ? 'var(--text-muted)' : 'white',
                                            textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                                        }}>
                                            {routine.name}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {/* Session button */}
                                        {!isEditingRoutines && (
                                            activeSession?.routineId === routine.id ? (
                                                <button
                                                    onClick={async (e) => { e.stopPropagation(); const mins = await endSession(); toast.success(`¡Sesión terminada! ${mins} min registrados.`); }}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '12px', padding: '4px 10px', color: '#f87171', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                >
                                                    <Square size={10} /> {fmtElapsed(elapsed)}
                                                </button>
                                            ) : (
                                                !activeSession && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); startSession(routine.id); toast.success('¡Sesión iniciada!'); }}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '12px', padding: '4px 10px', color: 'var(--success)', fontWeight: '800', fontSize: '0.75rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
                                                    >
                                                        <Play size={10} /> Iniciar
                                                    </button>
                                                )
                                            )
                                        )}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--secondary)' }} />
                                            <span style={{ fontWeight: '600' }}>{routine.exercises?.filter(e => e.is_active !== false).length || 0}</span> Ej.
                                        </span>
                                        {isDoneThisWeek && (
                                            <span style={{ 
                                                fontSize: '0.75rem', 
                                                background: 'rgba(34, 197, 94, 0.1)', 
                                                color: 'var(--success)', 
                                                fontWeight: '700',
                                                padding: '4px 10px', 
                                                borderRadius: '20px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px',
                                                border: '1px solid rgba(34, 197, 94, 0.2)'
                                            }}>
                                                ✓ Completada
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {!isEditingRoutines && (
                                    <div style={{ 
                                        width: '44px', height: '44px', 
                                        borderRadius: '14px', 
                                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0,
                                        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.2)',
                                        transition: 'all 0.2s',
                                        transform: 'translateX(-4px)'
                                    }}>
                                        <ChevronRight size={22} color={isDoneThisWeek ? 'var(--success)' : 'var(--primary)'} />
                                    </div>
                                )}
                            </button>
                        )}

                        {isEditingRoutines && editingRoutineId !== routine.id && (
                            <div style={{ 
                                position: 'absolute', 
                                right: '0.75rem', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                display: 'flex', 
                                gap: '0.35rem', 
                                alignItems: 'center',
                                background: 'rgba(15, 23, 42, 0.7)', 
                                backdropFilter: 'blur(8px)', 
                                borderRadius: '12px',
                                padding: '6px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                zIndex: 10
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '0.25rem' }}>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveRoutine(index, -1);
                                        }}
                                        disabled={index === 0}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: index === 0 ? 'default' : 'pointer',
                                            opacity: index === 0 ? 0.3 : 1,
                                            padding: '4px', // increased padding slightly for touch
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            height: '24px'
                                        }}
                                    >
                                        <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} color="var(--text-muted)" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleMoveRoutine(index, 1);
                                        }}
                                        disabled={index === routines.length - 1}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: 'none',
                                            borderRadius: '2px',
                                            cursor: index === routines.length - 1 ? 'default' : 'pointer',
                                            opacity: index === routines.length - 1 ? 0.3 : 1,
                                            padding: '4px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                             height: '24px'
                                        }}
                                    >
                                        <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} color="var(--text-muted)" />
                                    </button>
                                </div>

                                <button
                                    onClick={() => {
                                        const newStatus = routine.is_active === false ? true : false;
                                        updateRoutine(routine.id, { is_active: newStatus });
                                        toast.success(newStatus ? 'Rutina habilitada' : 'Rutina deshabilitada');
                                    }}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        color: 'var(--text-main)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        height: '36px',
                                        width: '36px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                    title={routine.is_active === false ? "Habilitar" : "Deshabilitar"}
                                >
                                    {routine.is_active === false ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                                <button
                                    onClick={() => startEditing(routine)}
                                    style={{
                                        background: 'rgba(34, 211, 238, 0.2)',
                                        color: 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '0.5rem',
                                        cursor: 'pointer',
                                        height: '36px',
                                        width: '36px',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}
                                >
                                    <Edit2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}

            </div>

            {isEditingRoutines && (
                <form onSubmit={handleAddRoutine} style={{ 
                    marginTop: '1.5rem', 
                    display: 'flex', 
                    gap: '0.5rem', 
                    background: 'rgba(0,0,0,0.2)', 
                    padding: '8px', 
                    borderRadius: '16px', 
                    border: '1px dashed rgba(255,255,255,0.15)',
                    alignItems: 'center'
                }}>
                        <input
                            type="text"
                            value={newRoutineName}
                            onChange={(e) => setNewRoutineName(e.target.value)}
                            placeholder="Nombre de la nueva rutina..."
                            style={{ flex: 1, border: 'none', background: 'transparent', padding: '0.5rem 1rem', fontSize: '1.05rem', color: 'white', outline: 'none', fontWeight: '500' }}
                        />
                        <button
                            type="submit"
                            style={{
                                background: 'var(--primary)',
                                color: 'var(--bg-app)',
                                border: 'none',
                                borderRadius: '12px',
                                padding: '0.75rem 1.25rem',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(34, 211, 238, 0.3)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
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
    const { 
        addExerciseToRoutine, 
        removeExerciseFromRoutine, 
        updateExercise, 
        updateLog, 
        deleteLog, 
        reorderExercises, 
        user,
        activeSession,
        startSession,
        endSession
    } = useStore();
    const [activeExerciseId, setActiveExerciseId] = useState('');

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false);
    const [newExerciseName, setNewExerciseName] = useState('');
    const [editingExerciseId, setEditingExerciseId] = useState(null);
    const [editingLogId, setEditingLogId] = useState(null);

    // Form State
    const [weight, setWeight] = useState('');
    const [sets, setSets] = useState('4');
    const [reps, setReps] = useState('');
    const [isCustomReps, setIsCustomReps] = useState(false);
    const [unit, setUnit] = useState('kg'); // 'kg' or 'lbs'
    const [notes, setNotes] = useState('');

    // Timer logic in details view
    const [elapsed, setElapsed] = useState(0);
    useEffect(() => {
        if (!activeSession) { setElapsed(0); return; }
        const update = () => setElapsed(Math.floor((Date.now() - new Date(activeSession.startedAt).getTime()) / 1000));
        update();
        const id = setInterval(update, 1000);
        return () => clearInterval(id);
    }, [activeSession]);

    // Timer State
    const [showTimer, setShowTimer] = useState(false);
    const [activeLogIdForTimer, setActiveLogIdForTimer] = useState(null);
    const [chartMetric, setChartMetric] = useState('weight'); // 'weight' or 'volume'
    const [logsVisible, setLogsVisible] = useState(5);

    const activeExercise = routine.exercises.find(e => e.id === activeExerciseId);
    const exerciseLogs = logs
        .filter(l => l.exerciseId === activeExerciseId)
        .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
    const visibleLogs = exerciseLogs.slice(0, logsVisible);

    // Effect to prefill sets/reps when active exercise changes (User request)
    useEffect(() => {
        if (activeExercise) {
            setSets(activeExercise.target_sets || '4');
            // Check if target reps is a range or a number
            const rangeOptions = parseRepsRange(activeExercise.target_reps);
            if (rangeOptions.length > 0) {
                // Pre-fill with the first option of the range or the last log if available
                const lastLog = exerciseLogs[0];
                if (lastLog) {
                    setReps(lastLog.reps.toString());
                    // If last log reps is not in the range options, it's custom
                    setIsCustomReps(!rangeOptions.includes(lastLog.reps.toString()));
                } else {
                    setReps(rangeOptions[0]);
                    setIsCustomReps(false);
                }
            } else {
                setReps('');
                setIsCustomReps(true);
            }
        }
        setLogsVisible(5); // Reset pagination when switching exercises
    }, [activeExerciseId, activeExercise]); // activeExercise depends on routine.exercises

    const handleLogSet = (e) => {
        if (e && e.preventDefault) e.preventDefault();
        if (!weight || !reps) return;

        // NO CONVERSION - Store as entered (User request)
        let finalWeight = parseFloat(weight);
        // Round to 2 decimal places to clean up input if needed
        finalWeight = Math.round(finalWeight * 100) / 100;

        if (editingLogId) {
            updateLog(editingLogId, {
                weight: finalWeight,
                reps: parseInt(reps),
                sets: parseInt(sets || 4),
                unit: unit, // Update unit if changed
                notes: notes.trim() || null
            });
            setEditingLogId(null);
            setWeight('');
            setReps('');
            setSets('4');
            setNotes('');
            return;
        }

        const newLog = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            exerciseId: activeExerciseId,
            weight: finalWeight,
            reps: parseInt(reps),
            sets: parseInt(sets || 4),
            completedSets: 0,
            unit: unit, // Store the unit
            notes: notes.trim() || null
        };

        addLog(newLog);

        // Auto-start session if not active
        if (!activeSession) {
            startSession(routine.id);
            toast.success('¡Sesión de entrenamiento iniciada automáticamente!');
        }
        
        // Reset Inputs
        setWeight('');
        setReps('');
        setNotes('');
        // sets remains 4 or whatever
        
        // Timer removed from here (User request: only on check)
    };

    const handleProgressUpdate = (logId, targetSetIndex) => {
        const log = logs.find(l => l.id === logId);
        if (!log) return;

        let newCompleted = targetSetIndex;

        // Toggle logic: If clicking the exact number of sets already completed, uncheck it (go back one step)
        // Example: completed=1, click index 1 (1st box) -> targetSetIndex=1. 
        // If we want to toggle off, we set to 0.
        // But wait, the UI calls with i+1. So button 1 passes 1.
        // If log.completedSets is 1, and I click 1, I want to go to 0.
        if (log.completedSets === targetSetIndex) {
            newCompleted = targetSetIndex - 1;
        }

        updateLog(logId, { completedSets: newCompleted });

        // Only start timer if we are PROGRESSING (increasing sets)
        // And only if we haven't finished all sets (User request)
        if (newCompleted > (log.completedSets || 0) && newCompleted < (log.sets || 4)) {
             setActiveLogIdForTimer(logId);
             setShowTimer(true);
        }

        // Auto-end session logic
        if (newCompleted === (log.sets || 4) && activeSession && activeSession.routineId === routine.id) {
            const today = new Date().toDateString();
            const activeExercises = routine.exercises.filter(e => e.is_active !== false);
            const isEveryExcCompletedToday = activeExercises.every(ex => {
                const exLogs = logs.filter(l => l.exerciseId === ex.id && new Date(l.created_at || l.date).toDateString() === today);
                if (exLogs.length === 0) return false;
                // Check if any of today's logs for this exercise are finished
                // or if the one we just updated makes it finished
                return exLogs.some(l => {
                    const comp = l.id === logId ? newCompleted : (l.completedSets || 0);
                    return comp >= (l.sets || 4);
                });
            });

            if (isEveryExcCompletedToday) {
                setTimeout(async () => {
                    const mins = await endSession();
                    toast.success(`¡Misión cumplida! Entrenamiento terminado automáticamente: ${mins} min registrados.`);
                }, 500); // Small delay for UX
            }
        }

        if (newCompleted === (log.sets || 4)) {
            toast.success('¡Serie completada!');
        }
    };

    const handleEditLog = (log) => {
        setEditingLogId(log.id);
        setWeight(log.weight);
        setReps(log.reps);
        setSets(log.sets || 4);
        setUnit(log.unit || 'kg');
        setNotes(log.notes || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteLog = (id) => {
        confirmAction('¿Eliminar este registro?', () => {
            deleteLog(id);
            toast.success('Registro eliminado');
        });
    };

    const handleMoveExercise = (index, direction) => {
         const newExercises = [...(routine.exercises || [])];
         const targetIndex = index + direction;
         
         if (targetIndex < 0 || targetIndex >= newExercises.length) return;
 
         // Swap
         const temp = newExercises[index];
         newExercises[index] = newExercises[targetIndex];
         newExercises[targetIndex] = temp;
 
         reorderExercises(routine.id, newExercises);
    };
 
    const handleBack = () => {
        // Check for unfinished sets in TODAY's log
        if (exerciseLogs.length > 0) {
            const latestLog = exerciseLogs[0];
            const isToday = new Date(latestLog.created_at).toDateString() === new Date().toDateString();
            
            if (isToday && (latestLog.completedSets || 0) < (latestLog.sets || 4)) {
                confirmAction('Tienes series pendientes. ¿Seguro que quieres terminar?', () => {
                   setActiveExerciseId(null); 
                });
                return;
            }
        }
        setActiveExerciseId(null);
    };

    // Helper function for unit conversion (only used for consistent comparison now)
    const getNormalizedWeight = (weight, fromUnit, toUnit) => {
        if (fromUnit === toUnit || fromUnit === 'placas' || toUnit === 'placas') return weight;
        if (fromUnit === 'kg' && toUnit === 'lbs') return weight * 2.20462;
        if (fromUnit === 'lbs' && toUnit === 'kg') return weight / 2.20462;
        return weight;
    };

    // Prepare chart data (oldest to newest)
    const chartData = [...exerciseLogs]
        .sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date))
        .map(l => {
        // Normalize chart values to the CURRENTLY selected unit so the line doesn't jump
        // but let cards display their original values
        let chartWeight = getNormalizedWeight(l.weight, l.unit || 'kg', unit);
        chartWeight = Math.round(chartWeight * 100) / 100;
        
        const volume = chartWeight * (l.reps || 0) * (l.completedSets > 0 ? l.completedSets : (l.sets || 1)); 

        return {
            date: new Date(l.created_at || l.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' }),
            weight: chartWeight,
            volume: Math.round(volume),
            reps: l.reps,
            sets: l.sets || 1,
            unit: unit !== 'placas' && l.unit === 'placas' ? 'placas' : unit, // Keep placas as placas
            fullDate: new Date(l.created_at || l.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        };
    });

    const checkExerciseCompletion = (exerciseId) => {
        const now = new Date();
        const startOfWeek = new Date(now);
        const day = startOfWeek.getDay() || 7; 
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1)); 
        else startOfWeek.setHours(0,0,0,0);
        
        startOfWeek.setDate(now.getDate() - day + 1);
        startOfWeek.setHours(0, 0, 0, 0);

        return logs.some(log => {
            if (log.exerciseId !== exerciseId) return false;
            const logDate = new Date(log.created_at || log.date);
            return logDate >= startOfWeek;
        });
    };

    if (!activeExercise) {
        return (
            <div>
                {/* Active session global banner */}
                {activeSession && (
                    <div style={{ background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(249,115,22,0.15) 100%)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '16px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171', animation: 'pulse 1.5s ease-in-out infinite', boxShadow: '0 0 8px #f87171' }} />
                            <span style={{ color: '#f87171', fontWeight: '700', fontSize: '0.85rem' }}>Sesión en curso</span>
                            <span style={{ color: 'white', fontWeight: '900', fontSize: '1rem', fontFamily: 'monospace' }}>{fmtElapsed(elapsed)}</span>
                        </div>
                        <button
                            onClick={async () => { const mins = await endSession(); toast.success(`¡Sesión terminada! ${mins} min registrados.`); }}
                            style={{ background: '#f87171', border: 'none', borderRadius: '10px', padding: '0.4rem 0.9rem', color: 'white', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                            <Square size={12} /> Terminar
                        </button>
                    </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', padding: '0.5rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <button 
                            onClick={onBack}
                            style={{ 
                                background: 'rgba(255,255,255,0.05)', 
                                border: '1px solid rgba(255,255,255,0.1)', 
                                color: 'var(--text-main)', 
                                cursor: 'pointer', 
                                padding: '0.5rem', 
                                borderRadius: '12px',
                                display: 'flex', 
                                alignItems: 'center',
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                            }}
                        >
                            <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Rutina</p>
                            <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', background: 'linear-gradient(135deg, #ffffff 0%, var(--primary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', lineHeight: 1 }}>
                                {routine.name}
                            </h2>
                        </div>
                    </div>
                    
                    <button
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            background: isEditing ? 'var(--danger)' : 'rgba(255,255,255,0.05)',
                            border: '1px solid',
                            borderColor: isEditing ? 'var(--danger)' : 'rgba(255,255,255,0.1)',
                            color: isEditing ? 'white' : 'var(--text-main)',
                            padding: '0.6rem 1rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: isEditing ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 2px 8px rgba(0,0,0,0.2)',
                            cursor: 'pointer'
                        }}
                    >
                        {isEditing ? 'Hecho' : <><Edit2 size={16} /> Editar</>}
                    </button>
                </div>

                <div style={{ display: 'grid', gap: '1rem' }}>
                    {routine.exercises
                        ?.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                        .filter(e => isEditing || e.is_active !== false) // Default to true if undefined
                        .map((exercise, index) => {
                        const isDone = checkExerciseCompletion(exercise.id);
                        return (
                            <div key={exercise.id} style={{ position: 'relative' }}>
                                 {isEditing && editingExerciseId === exercise.id ? (
                                    <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)', alignItems: 'center' }}>
                                        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1}}>
                                            <input 
                                                value={newExerciseName}
                                                onChange={(e) => setNewExerciseName(e.target.value)}
                                                style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                placeholder="Nombre del ejercicio"
                                                autoFocus
                                            />
                                            <div style={{display: 'flex', gap: '0.5rem'}}>
                                                <input 
                                                    type="number"
                                                    value={exercise.target_sets || ''}
                                                    onChange={(e) => updateExercise(exercise.id, { target_sets: e.target.value === '' ? '' : parseInt(e.target.value) })}
                                                    style={{ width: '60px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                    placeholder="Sets"
                                                />
                                                <input 
                                                    type="text"
                                                    value={exercise.target_reps || ''}
                                                    onChange={(e) => updateExercise(exercise.id, { target_reps: e.target.value })}
                                                    style={{ flex: 1, padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                    placeholder="Reps (ej: 10-12)"
                                                />
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                if (newExerciseName.trim()) {
                                                    updateExercise(exercise.id, { name: newExerciseName });
                                                }
                                                setEditingExerciseId(null);
                                            }}
                                            style={{ background: 'var(--success)', border: 'none', borderRadius: '4px', padding: '0 1rem', color: 'white', height: '36px', display: 'flex', alignItems: 'center' }}
                                        >
                                            OK
                                        </button>
                                    </div>
                                 ) : (
                                    <button
                                        onClick={() => !isEditing && setActiveExerciseId(exercise.id)}
                                        style={{
                                            width: '100%',
                                            textAlign: 'left',
                                            padding: '1.5rem',
                                            paddingRight: isEditing && editingExerciseId !== exercise.id ? '9.5rem' : '1.5rem',
                                            background: isDone ? 'linear-gradient(135deg, var(--bg-card) 0%, rgba(34, 197, 94, 0.05) 100%)' : 'var(--bg-card)',
                                            border: '1px solid',
                                            borderColor: isDone ? 'rgba(34, 197, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)',
                                            borderRadius: '20px',
                                            color: 'var(--text-main)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: (exercise.is_active === false) ? 0.4 : (isEditing ? 0.9 : 1),
                                            filter: (exercise.is_active === false) ? 'grayscale(100%)' : 'none',
                                            boxShadow: isDone ? '0 8px 25px -5px rgba(34, 197, 94, 0.15)' : '0 8px 20px -8px rgba(0, 0, 0, 0.5)',
                                            marginBottom: '0.85rem',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            transform: isEditing ? 'scale(0.98)' : 'scale(1)',
                                            cursor: isEditing ? 'default' : 'pointer',
                                            position: 'relative',
                                            overflow: 'hidden'
                                        }}
                                    >
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: isDone ? 'var(--success)' : 'var(--secondary)', opacity: isDone ? 0.8 : 0.5 }}></div>
                                        <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem', paddingLeft: '8px'}}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <span style={{ 
                                                    fontSize: '1.25rem', 
                                                    fontWeight: '800', 
                                                    letterSpacing: '-0.3px',
                                                    textDecoration: (exercise.is_active === false) ? 'line-through' : 'none',
                                                    color: (exercise.is_active === false) ? 'var(--text-muted)' : 'white',
                                                    textShadow: '0 2px 8px rgba(0,0,0,0.4)'
                                                }}>
                                                    {exercise.name}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.2)', padding: '2px 10px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.03)' }}>
                                                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{exercise.target_sets || 4}</span>
                                                        <span>sets ×</span>
                                                        <span style={{ fontWeight: '600', color: 'var(--primary)' }}>{exercise.target_reps || '10-12'}</span>
                                                        <span>reps</span>
                                                    </span>
                                                    {isDone && (
                                                        <span style={{ 
                                                            fontSize: '0.7rem', 
                                                            background: 'rgba(34, 197, 94, 0.1)', 
                                                            color: 'var(--success)', 
                                                            fontWeight: '700',
                                                            padding: '3px 8px', 
                                                            borderRadius: '12px',
                                                            display: 'flex', alignItems: 'center', gap: '4px',
                                                            border: '1px solid rgba(34, 197, 94, 0.2)'
                                                        }}>
                                                            ✓ Listo
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {!isEditing && (
                                            <div style={{ 
                                                width: '40px', height: '40px', 
                                                borderRadius: '12px', 
                                                background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)', 
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0,
                                                boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.05), 0 4px 10px rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s',
                                                transform: 'translateX(-2px)'
                                            }}>
                                                <ChevronRight size={20} color={isDone ? 'var(--success)' : 'var(--secondary)'} />
                                            </div>
                                        )}
                                    </button>
                                 )}
                                 
                                {isEditing && editingExerciseId !== exercise.id && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        right: '0.75rem', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        display: 'flex', 
                                        gap: '0.35rem', 
                                        alignItems: 'center',
                                        background: 'rgba(15, 23, 42, 0.7)',
                                        backdropFilter: 'blur(8px)',
                                        borderRadius: '12px',
                                        padding: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                                        zIndex: 10
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '0.25rem' }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMoveExercise(index, -1);
                                                }}
                                                disabled={index === 0}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    borderRadius: '2px',
                                                    cursor: index === 0 ? 'default' : 'pointer',
                                                    opacity: index === 0 ? 0.3 : 1,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <ChevronRight size={14} style={{ transform: 'rotate(-90deg)' }} color="var(--text-muted)" />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleMoveExercise(index, 1);
                                                }}
                                                disabled={index === (routine.exercises?.length || 0) - 1}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    borderRadius: '2px',
                                                    cursor: index === (routine.exercises?.length || 0) - 1 ? 'default' : 'pointer',
                                                    opacity: index === (routine.exercises?.length || 0) - 1 ? 0.3 : 1,
                                                    padding: '2px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                <ChevronRight size={14} style={{ transform: 'rotate(90deg)' }} color="var(--text-muted)" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newStatus = exercise.is_active === false ? true : false;
                                                updateExercise(exercise.id, { is_active: newStatus });
                                                toast.success(newStatus ? 'Ejercicio habilitado' : 'Ejercicio deshabilitado');
                                            }}
                                            style={{
                                                background: 'rgba(255, 255, 255, 0.1)',
                                                color: 'var(--text-main)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                padding: '0.5rem',
                                                cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}
                                            title={exercise.is_active === false ? "Habilitar" : "Deshabilitar"}
                                        >
                                            {exercise.is_active === false ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditingExerciseId(exercise.id);
                                                setNewExerciseName(exercise.name);
                                            }}
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
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {isEditing && (
                        <div style={{ marginTop: '1.5rem' }}>
                            <ExercisePicker
                                existingNames={(routine.exercises || []).map((e) => e.name)}
                                onSelect={(name) => {
                                    addExerciseToRoutine(routine.id, name);
                                    toast.success('Ejercicio añadido');
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0.5rem 0', gap: '0.75rem' }}>
                <button 
                    onClick={handleBack}
                    style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        border: '1px solid rgba(255,255,255,0.1)', 
                        color: 'var(--text-main)', 
                        cursor: 'pointer', 
                        padding: '0.5rem', 
                        borderRadius: '12px',
                        display: 'flex', 
                        alignItems: 'center',
                        transition: 'all 0.2s',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                    }}
                >
                    <ChevronRight size={20} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <div>
                     <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>REGISTRO DE</p>
                     <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: '900', background: 'linear-gradient(135deg, #ffffff 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.5px', lineHeight: 1 }}>
                         {activeExercise.name}
                     </h2>
                </div>
            </div>

            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: '1.5rem',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, var(--primary), var(--secondary))' }}></div>
                <form onSubmit={handleLogSet} style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.25rem' }}>
                    
                    <div style={{gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'white' }}>Nueva Serie</span>
                        <div style={{display: 'flex', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '4px', border: '1px solid rgba(255,255,255,0.05)'}}>
                            <button
                                type="button"
                                onClick={() => setUnit('kg')}
                                style={{
                                    background: unit === 'kg' ? 'var(--primary)' : 'transparent',
                                    color: unit === 'kg' ? 'var(--bg-app)' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '8px',
                                    fontWeight: '800',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: unit === 'kg' ? '0 2px 8px rgba(34, 211, 238, 0.4)' : 'none'
                                }}
                            >
                                KG
                            </button>
                            <button
                                type="button"
                                onClick={() => setUnit('lbs')}
                                style={{
                                    background: unit === 'lbs' ? 'var(--primary)' : 'transparent',
                                    color: unit === 'lbs' ? 'var(--bg-app)' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '8px',
                                    fontWeight: '800',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: unit === 'lbs' ? '0 2px 8px rgba(34, 211, 238, 0.4)' : 'none'
                                }}
                            >
                                LBS
                            </button>
                            <button
                                type="button"
                                onClick={() => setUnit('placas')}
                                style={{
                                    background: unit === 'placas' ? 'var(--primary)' : 'transparent',
                                    color: unit === 'placas' ? 'var(--bg-app)' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '0.35rem 0.75rem',
                                    borderRadius: '8px',
                                    fontWeight: '800',
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    boxShadow: unit === 'placas' ? '0 2px 8px rgba(34, 211, 238, 0.4)' : 'none'
                                }}
                            >
                                PLACAS
                            </button>
                        </div>
                    </div>

                    <div className="grid-inputs" style={{gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', alignItems: 'stretch' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                {unit === 'placas' ? 'Nº Placas' : `Peso (${unit})`}
                            </label>
                            <input
                                type="number"
                                inputMode="decimal"
                                value={weight}
                                onChange={(e) => setWeight(e.target.value)}
                                style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', textAlign: 'center', outline: 'none' }}
                                placeholder="0"
                            />
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                                Sets
                            </label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={sets}
                                onChange={(e) => setSets(e.target.value)}
                                style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', textAlign: 'center', outline: 'none' }}
                                placeholder="4"
                            />
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>
                                Reps
                            </label>
                            {!isCustomReps ? (
                                <select
                                    value={reps}
                                    onChange={(e) => {
                                        if (e.target.value === 'custom') {
                                            setIsCustomReps(true);
                                            setReps('');
                                        } else {
                                            setReps(e.target.value);
                                        }
                                    }}
                                    style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', textAlign: 'center', outline: 'none', appearance: 'none', cursor: 'pointer' }}
                                >
                                    {parseRepsRange(activeExercise?.target_reps).map(opt => (
                                        <option key={opt} value={opt} style={{background: 'var(--bg-card)', color: 'white'}}>{opt}</option>
                                    ))}
                                    <option value="custom" style={{background: 'var(--bg-card)', color: 'var(--secondary)'}}>Otro...</option>
                                </select>
                             ) : (
                                <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
                                    <input
                                        type="number"
                                        inputMode="numeric"
                                        value={reps}
                                        onChange={(e) => setReps(e.target.value)}
                                        style={{ width: '100%', fontSize: '1.5rem', fontWeight: '800', background: 'transparent', border: 'none', color: 'white', textAlign: 'center', outline: 'none' }}
                                        placeholder="0"
                                        autoFocus
                                    />
                                    {parseRepsRange(activeExercise?.target_reps).length > 0 && (
                                        <button 
                                            type="button"
                                            onClick={() => setIsCustomReps(false)}
                                            style={{position: 'absolute', right: '-5px', background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer'}}
                                        >
                                            LISTA
                                        </button>
                                    )}
                                </div>
                             )}
                        </div>
                    </div>
                    
                    <div style={{ gridColumn: '1 / -1' }}>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observaciones de la serie (Opcional)"
                            rows="2"
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '12px',
                                padding: '12px',
                                color: 'white',
                                fontSize: '0.9rem',
                                outline: 'none',
                                resize: 'none',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={showTimer}
                            style={{
                                flex: 1,
                                background: showTimer ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                border: showTimer ? '1px dashed rgba(255,255,255,0.2)' : 'none',
                                borderRadius: '16px',
                                color: showTimer ? 'var(--text-muted)' : 'var(--bg-app)',
                                fontWeight: '900',
                                letterSpacing: '1px',
                                padding: '1.1rem',
                                fontSize: '1.1rem',
                                boxShadow: showTimer ? 'none' : '0 8px 25px -5px rgba(34, 211, 238, 0.4)',
                                cursor: showTimer ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                transform: showTimer ? 'scale(0.98)' : 'scale(1)'
                            }}
                        >
                            {showTimer ? '⏱ DESCANSANDO...' : (editingLogId ? 'GUARDAR CAMBIOS' : 'REGISTRAR SERIE')}
                        </button>
                        {editingLogId && (
                            <button
                                type="button"
                                onClick={() => {
                                    setEditingLogId(null);
                                    setWeight('');
                                    setReps('');
                                    setNotes('');
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

            {showTimer && (
                <Timer 
                    initialSeconds={user?.rest_time || 180}
                    onClose={() => setShowTimer(false)} 
                    onComplete={() => setShowTimer(false)} 
                    isLastSet={logs.find(l => l.id === activeLogIdForTimer)?.completedSets === (logs.find(l => l.id === activeLogIdForTimer)?.sets || 4)}
                />
            )}

            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', margin: 0 }}>
                        <History size={18} /> Historial
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => toast('Peso: Intensidad (Carga máxima)\nVolumen: Trabajo Total (Peso x Reps x Series)', { duration: 4000 })}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                        >
                            <span style={{border: '1px solid var(--text-muted)', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem'}}>?</span>
                             Info
                        </button>
                        <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg-card)', padding: '2px', borderRadius: 'var(--radius-sm)', border: 'var(--glass-border)' }}>
                            <button
                                onClick={() => setChartMetric('weight')}
                                style={{
                                    background: chartMetric === 'weight' ? 'var(--primary)' : 'transparent',
                                    color: chartMetric === 'weight' ? 'var(--bg-app)' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Peso
                            </button>
                            <button
                                onClick={() => setChartMetric('volume')}
                                style={{
                                    background: chartMetric === 'volume' ? 'var(--secondary)' : 'transparent',
                                    color: chartMetric === 'volume' ? 'white' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontSize: '0.7rem',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Volumen
                            </button>
                        </div>
                    </div>
                </div>

                {chartData.length > 1 && (
                    <div style={{ height: '240px', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)'} stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor={chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)'} stopOpacity={0}/>
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
                                            // Determine unit label for tooltip
                                            let unitLabel = 'kg';
                                            if (data.unit === 'placas') unitLabel = 'Placas';
                                            else if (data.unit === 'lbs') unitLabel = 'lbs';

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
                                                        <span style={{ fontSize: '1.25rem', color: chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)', fontWeight: 'bold' }}>
                                                            {chartMetric === 'weight' ? data.weight : data.volume}
                                                        </span>
                                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                            {chartMetric === 'weight' ? unitLabel : (data.unit === 'placas' ? 'Placas' : data.unit)}
                                                        </span>
                                                    </div>
                                                    <div style={{ alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex' }}>
                                                        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '500' }}>{data.sets} Sets</span>
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>×</span>
                                                        <span style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '500' }}>{data.reps} Reps</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey={chartMetric} 
                                    stroke={chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)'} 
                                    strokeWidth={3} 
                                    fillOpacity={1} 
                                    fill="url(#colorMetric)"
                                    dot={{ r: 4, fill: 'var(--bg-card)', stroke: chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)', strokeWidth: 2 }} 
                                    activeDot={{ r: 6, fill: chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)', stroke: 'white', strokeWidth: 2 }} 
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {exerciseLogs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin registros aún</p>
                    ) : (
                        visibleLogs.map((log, index) => {
                            const completed = log.completedSets || 0;
                            const target = log.sets || 4;
                            const isLatest = index === 0;
                            
                            // Convert to kg if lbs, and keep original lbs for display
                            let displayWeight = log.weight;
                            let displayUnit = log.unit || 'kg';
                            let originalLbs = null;

                            if (displayUnit === 'lbs') {
                                originalLbs = displayWeight;
                                displayWeight = Math.round(displayWeight / 2.20462 * 100) / 100;
                                displayUnit = 'kg';
                            }

                            const logVolume = (displayWeight || 0) * (log.reps || 0) * (completed > 0 ? completed : target);

                            // Helper for unit label
                            const logUnitLabel = displayUnit === 'placas' ? 'Placas' : displayUnit;

                            // Comparison Logic (updated for unit safety, convert previous log to CURRENT log's unit)
                            const prevLog = exerciseLogs[index + 1];
                            let weightDiff = null;
                            let volumeDiff = null;

                            if (prevLog) {
                                const prevUnit = prevLog.unit || 'kg';
                                // Calculate normalized previous weight in current log's unit
                                const prevDisplayWeight = getNormalizedWeight(prevLog.weight, prevUnit, displayUnit);
                                
                                const isMixedPlacas = (displayUnit === 'placas' && prevUnit !== 'placas') || (displayUnit !== 'placas' && prevUnit === 'placas');
                                
                                if (!isMixedPlacas) {
                                    const prevVolume = prevDisplayWeight * (prevLog.reps || 0) * (prevLog.completedSets || prevLog.sets || 1);
                                    weightDiff = Math.round((displayWeight - prevDisplayWeight) * 100) / 100;
                                    volumeDiff = logVolume - prevVolume;
                                }
                            }

                            return (
                                <div key={log.id} style={{
                                    padding: '1.5rem',
                                    background: isLatest ? 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(34, 211, 238, 0.05) 100%)' : 'var(--bg-card)',
                                    borderRadius: '24px',
                                    border: '1px solid',
                                    borderColor: isLatest ? 'rgba(34, 211, 238, 0.2)' : 'rgba(255,255,255,0.05)',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: isLatest ? '0 8px 30px rgba(0,0,0,0.4)' : '0 4px 15px rgba(0,0,0,0.2)'
                                }}>
                                    {/* Edit/Delete Actions - Absolute Top Right */}
                                    <div style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                                        <button
                                            onClick={() => handleEditLog(log)}
                                            style={{ background: 'rgba(34, 211, 238, 0.15)', color: 'var(--primary)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLog(log.id)}
                                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex', transition: 'all 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    {/* Date Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <span style={{ 
                                            background: isLatest ? 'var(--primary)' : 'rgba(255,255,255,0.08)', 
                                            color: isLatest ? 'var(--bg-app)' : 'var(--text-muted)',
                                            fontSize: '0.75rem', fontWeight: '800', padding: '4px 12px', borderRadius: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' 
                                        }}>
                                            {new Date(log.created_at || log.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        {/* Time */}
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {new Date(log.created_at || log.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Main Metrics */}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>
                                                {displayWeight}
                                            </span>
                                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                                                {logUnitLabel}
                                            </span>
                                        </div>
                                        <span style={{ fontSize: '1.5rem', color: 'rgba(255,255,255,0.2)', fontWeight: '300', alignSelf: 'center' }}>×</span>
                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                            <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'white', lineHeight: 1, letterSpacing: '-1px' }}>
                                                {log.reps}
                                            </span>
                                            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>
                                                Reps
                                            </span>
                                        </div>
                                        
                                        {/* Original Unit Badge (LBS) */}
                                        {originalLbs !== null && (
                                            <span style={{ 
                                                fontSize: '0.8rem', 
                                                color: 'var(--text-muted)', 
                                                background: 'rgba(255, 255, 255, 0.05)', 
                                                padding: '4px 10px', 
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                fontWeight: '600',
                                                alignSelf: 'center'
                                            }} title="Valor original en libras">
                                                (Orig: {originalLbs} lbs)
                                            </span>
                                        )}
                                        
                                        {/* Improvement Badges Inline */}
                                        {weightDiff !== null && Math.abs(weightDiff) > 0 && (
                                            <span 
                                                title={`Diferencia de peso con la sesión anterior (${weightDiff > 0 ? '+' : ''}${Number(weightDiff.toFixed(2))} ${logUnitLabel})`}
                                                style={{ 
                                                marginLeft: 'auto',
                                                fontSize: '0.85rem', 
                                                color: weightDiff > 0 ? 'var(--success)' : '#f87171',
                                                fontWeight: '800',
                                                background: weightDiff > 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(248, 113, 113, 0.15)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                cursor: 'help',
                                                border: `1px solid ${weightDiff > 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
                                                alignSelf: 'center'
                                            }}>
                                                {weightDiff > 0 ? '▲' : '▼'}{Number(Math.abs(weightDiff).toFixed(2))}
                                            </span>
                                        )}
                                    </div>

                                    {/* Secondary Metrics & Progress */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--secondary)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                Vol: {Math.round(logVolume)}
                                                {volumeDiff !== null && Math.abs(volumeDiff) > 0 && (
                                                    <span style={{ 
                                                        fontSize: '0.7rem', 
                                                        color: volumeDiff > 0 ? 'var(--success)' : '#f87171'
                                                    }}>
                                                        ({volumeDiff > 0 ? '+' : ''}{Math.round(volumeDiff)})
                                                    </span>
                                                )}
                                            </div>
                                            {(log.difficulty || log.feeling) && (
                                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '6px' }}>
                                                    {log.difficulty && (
                                                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-muted)', textTransform: 'capitalize', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            {log.difficulty}
                                                        </span>
                                                    )}
                                                    {log.feeling && (
                                                        <span style={{ fontSize: '0.7rem', padding: '3px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', color: 'var(--text-muted)', textTransform: 'capitalize', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            {log.feeling}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Completion Status / Sets Progress */}
                                        {isLatest ? (
                                            /* Latest record: interactive checkboxes */
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: '700', marginRight: '4px', letterSpacing: '0.5px' }}>
                                                    {completed}/{target} <span style={{color: 'var(--text-muted)', fontWeight: '500'}}>series</span>
                                                </span>
                                                <div style={{ display: 'flex', gap: '6px', padding: '6px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                    {Array.from({ length: log.sets || 4 }).map((_, i) => {
                                                        const isCompleted = i < (log.completedSets || 0);
                                                        return (
                                                            <button
                                                                key={i}
                                                                onClick={() => handleProgressUpdate(log.id, i + 1)}
                                                                style={{
                                                                    width: '32px', 
                                                                    height: '32px', 
                                                                    borderRadius: '8px',
                                                                    background: isCompleted ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'rgba(255,255,255,0.03)',
                                                                    border: isCompleted ? 'none' : '1px solid rgba(255,255,255,0.1)', 
                                                                    cursor: 'pointer',
                                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    boxShadow: isCompleted ? '0 2px 10px rgba(34, 211, 238, 0.3)' : 'none',
                                                                    transform: isCompleted ? 'scale(1.05)' : 'scale(1)'
                                                                }}
                                                            >
                                                                {isCompleted && <span style={{fontSize: '14px', color: 'var(--bg-app)', fontWeight: '900'}}>✓</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            /* Older records: informational text only */
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{
                                                    fontSize: '0.85rem',
                                                    color: completed >= target ? 'var(--success)' : 'var(--text-muted)',
                                                    fontWeight: '700',
                                                    background: completed >= target ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                                    padding: '4px 12px',
                                                    borderRadius: '8px',
                                                    border: `1px solid ${completed >= target ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.05)'}`
                                                }}>
                                                    {completed >= target ? '✓ ' : ''}{completed}/{target} series
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {completed >= target && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            bottom: '-15px', 
                                            right: '-15px', 
                                            width: '60px', 
                                            height: '60px', 
                                            background: 'linear-gradient(135deg, transparent 50%, rgba(34, 197, 94, 0.2) 50%)',
                                            display: 'flex',
                                            alignItems: 'flex-end',
                                            justifyContent: 'flex-end',
                                            padding: '8px',
                                            pointerEvents: 'none'
                                        }}>
                                           <span style={{ color: 'var(--success)', fontSize: '0.8rem', fontWeight: 'bold' }}>✓</span>
                                        </div>
                                    )}

                                    {/* Observation Notes */}
                                    {log.notes && (
                                        <div style={{ 
                                            marginTop: '1rem', 
                                            padding: '0.75rem', 
                                            background: 'rgba(255,255,255,0.02)', 
                                            borderRadius: '12px',
                                            borderLeft: '2px solid var(--primary)',
                                            fontSize: '0.85rem',
                                            color: 'var(--text-muted)'
                                        }}>
                                            <span style={{ fontWeight: 'bold', marginRight: '0.5rem', opacity: 0.7 }}>Obs:</span>
                                            {log.notes}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    {exerciseLogs.length > logsVisible && (
                        <button
                            onClick={() => setLogsVisible(v => v + 5)}
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
                            ↓ Mostrar más ({exerciseLogs.length - logsVisible} restantes)
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
