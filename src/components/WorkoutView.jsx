import { useState, useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { ChevronRight, Plus, History, Trash2, Edit2, Eye, EyeOff } from 'lucide-react';
import { Timer } from './Timer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';
import { confirmAction } from '../utils/ui';

export function WorkoutView() {
    const { 
        routines, logs, addLog, user, 
        addRoutine, updateRoutine, removeRoutine, reorderRoutines,
        addExerciseToRoutine, removeExerciseFromRoutine // Added missing functions
    } = useStore();
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
                                    padding: '1.25rem',
                                    paddingRight: isEditingRoutines && editingRoutineId !== routine.id ? '9rem' : '1.25rem', // Added padding to prevent overlap
                                    background: 'var(--bg-card)',
                                    backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.03), transparent)',
                                    border: isDoneThisWeek ? '1px solid var(--success)' : 'var(--glass-border)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--text-main)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    opacity: (routine.is_active === false) ? 0.4 : (isEditingRoutines ? 0.8 : 1),
                                    filter: (routine.is_active === false) ? 'grayscale(100%)' : 'none',
                                    cursor: isEditingRoutines ? 'default' : 'pointer',
                                    marginBottom: '0.75rem',
                                    transition: 'all 0.2s ease',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                }}
                            >
                                <div style={{display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
                                        <span style={{ 
                                            fontSize: '1.25rem', 
                                            fontWeight: '700', 
                                            letterSpacing: '-0.5px',
                                            textDecoration: (routine.is_active === false) ? 'line-through' : 'none',
                                            color: (routine.is_active === false) ? 'var(--text-muted)' : 'inherit'
                                        }}>
                                            {routine.name}
                                        </span>
                                        {isDoneThisWeek && (
                                            <span style={{ 
                                                fontSize: '0.7rem', 
                                                background: 'rgba(34, 197, 94, 0.15)', 
                                                color: 'var(--success)', 
                                                fontWeight: '600',
                                                padding: '3px 8px', 
                                                borderRadius: '9999px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '4px'
                                            }}>
                                                ✓ Completada
                                            </span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                        {routine.exercises?.filter(e => e.is_active !== false).length || 0} Ejercicios
                                    </span>
                                </div>
                                {!isEditingRoutines && (
                                    <div style={{ 
                                        width: '32px', height: '32px', 
                                        borderRadius: '50%', 
                                        background: 'var(--bg-card-hover)', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <ChevronRight size={18} color="var(--primary)" />
                                    </div>
                                )}
                            </button>
                        )}

                        {isEditingRoutines && editingRoutineId !== routine.id && (
                            <div style={{ 
                                position: 'absolute', 
                                right: '0.5rem', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                display: 'flex', 
                                gap: '0.25rem', 
                                alignItems: 'center',
                                background: 'rgba(0,0,0,0.5)', // Optional: Add background to confirm visibility? No, keep transparent
                                backdropFilter: 'blur(4px)', // Nice touch to ensure separation if overlap happened
                                borderRadius: '8px',
                                padding: '4px'
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
    const { addExerciseToRoutine, removeExerciseFromRoutine, updateExercise, updateLog, deleteLog, reorderExercises } = useStore();
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
    const [unit, setUnit] = useState('kg'); // 'kg' or 'lbs'

    // Timer State
    const [showTimer, setShowTimer] = useState(false);
    const [activeLogIdForTimer, setActiveLogIdForTimer] = useState(null);
    const [chartMetric, setChartMetric] = useState('weight'); // 'weight' or 'volume'

    const activeExercise = routine.exercises.find(e => e.id === activeExerciseId);
    const exerciseLogs = logs
        .filter(l => l.exerciseId === activeExerciseId)
        .sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date))
        .slice(0, 5);

    // Effect to prefill sets/reps when active exercise changes (User request)
    useEffect(() => {
        if (activeExercise) {
            setSets(activeExercise.target_sets || '4');
            // Extract the first number from reps string if possible, or just use it
            // If target_reps is "10-12", parseInt will take 10. Perfect.
            const targetReps = activeExercise.target_reps ? parseInt(activeExercise.target_reps) : '';
            setReps(targetReps || '');
        }
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
                unit: unit // Update unit if changed
            });
            setEditingLogId(null);
            setWeight('');
            setReps('');
            setSets('4');
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
            unit: unit // Store the unit
        };

        addLog(newLog);
        
        // Reset Inputs
        setWeight('');
        setReps('');
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
        // And only if we haven't finished all sets (optional, but usually you rest between sets, not after the last one?? 
        // User said "apenas registro... debe aparecer cada que marco un check". 
        // Usually you rest AFTER a set. So yes, start timer.
        if (newCompleted > (log.completedSets || 0)) {
             setActiveLogIdForTimer(logId);
             setShowTimer(true);
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

    // Prepare chart data (oldest to newest)
    const chartData = [...exerciseLogs]
        .sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date))
        .map(l => {
        // Display exactly what is stored (User request)
        let displayWeight = l.weight;
        
        const volume = (l.weight || 0) * (l.reps || 0) * (l.completedSets > 0 ? l.completedSets : (l.sets || 1)); 
        // If unit is 'kg' and log is 'lbs' (rare/legacy), convert? Assuming stored as KG always unless 'placas'.
        // If log unit is 'placas', displayWeight is just the number.
        // const volume = ... (removed duplicate)

        return {
            date: new Date(l.created_at || l.date).toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: '2-digit' }),
            weight: displayWeight,
            volume: Math.round(volume),
            reps: l.reps,
            sets: l.sets || 1,
            unit: l.unit || 'kg',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button 
                            onClick={onBack}
                            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                        >
                            <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                        </button>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            {routine.name}
                        </h2>
                    </div>
                    
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
                        {isEditing ? 'Terminar' : <><Edit2 size={14} /> Editar</>}
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
                                                    onChange={(e) => updateExercise(exercise.id, { target_sets: parseInt(e.target.value) || 4 })}
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
                                            padding: '1.25rem',
                                            paddingRight: isEditing && editingExerciseId !== exercise.id ? '9rem' : '1.25rem',
                                            background: 'var(--bg-card)',
                                            backgroundImage: 'linear-gradient(to bottom right, rgba(255,255,255,0.03), transparent)',
                                            border: isDone ? '1px solid var(--success)' : 'var(--glass-border)',
                                            borderRadius: 'var(--radius-md)',
                                            color: 'var(--text-main)',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            opacity: (exercise.is_active === false) ? 0.4 : (isEditing ? 0.8 : 1),
                                            filter: (exercise.is_active === false) ? 'grayscale(100%)' : 'none',
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                            marginBottom: '0.75rem',
                                            transition: 'all 0.2s ease',
                                            cursor: isEditing ? 'default' : 'pointer'
                                        }}
                                    >
                                        <div style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem'}}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ 
                                                    fontSize: '1.1rem', 
                                                    fontWeight: '600', 
                                                    letterSpacing: '-0.3px',
                                                    textDecoration: (exercise.is_active === false) ? 'line-through' : 'none',
                                                    color: (exercise.is_active === false) ? 'var(--text-muted)' : 'inherit'
                                                }}>
                                                    {exercise.name}
                                                </span>
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                    {exercise.target_sets || 4}x{exercise.target_reps || '10-12'}
                                                </span>
                                            </div>
                                            {isDone && (
                                                <span style={{ 
                                                    fontSize: '0.7rem', 
                                                    background: 'rgba(34, 197, 94, 0.15)', 
                                                    color: 'var(--success)', 
                                                    fontWeight: '600',
                                                    padding: '3px 8px', 
                                                    borderRadius: '9999px',
                                                    display: 'flex', alignItems: 'center', gap: '4px'
                                                }}>
                                                    ✓ Listo
                                                </span>
                                            )}
                                        </div>
                                        {!isEditing && (
                                            <div style={{ 
                                                width: '32px', height: '32px', 
                                                borderRadius: '50%', 
                                                background: 'var(--bg-card-hover)', 
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                <ChevronRight size={18} color="var(--primary)" />
                                            </div>
                                        )}
                                    </button>
                                 )}
                                 
                                {isEditing && editingExerciseId !== exercise.id && (
                                    <div style={{ 
                                        position: 'absolute', 
                                        right: '0.5rem', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        display: 'flex', 
                                        gap: '0.25rem', 
                                        alignItems: 'center',
                                        background: 'rgba(0,0,0,0.5)',
                                        backdropFilter: 'blur(4px)',
                                        borderRadius: '8px',
                                        padding: '4px'
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
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                             <input
                                 type="text"
                                 value={newExerciseName}
                                 onChange={(e) => setNewExerciseName(e.target.value)}
                                 placeholder="Nombre nuevo ejercicio..."
                                 style={{ flex: 1 }}
                             />
                             <button
                                 onClick={() => {
                                     if (newExerciseName.trim()) {
                                         addExerciseToRoutine(routine.id, newExerciseName);
                                         setNewExerciseName('');
                                     }
                                 }}
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
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '80px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem', gap: '0.5rem' }}>
                <button 
                    onClick={handleBack}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center' }}
                >
                    <ChevronRight size={24} style={{ transform: 'rotate(180deg)' }} />
                </button>
                <h3 style={{ margin: 0 }}>{activeExercise.name}</h3>
            </div>

            <div style={{
                background: 'var(--bg-card)',
                border: 'var(--glass-border)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                marginBottom: '2rem'
            }}>
                <form onSubmit={handleLogSet} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end'}}>
                        <div style={{display: 'flex', background: 'var(--bg-app)', borderRadius: 'var(--radius-sm)', padding: '2px', border: 'var(--glass-border)'}}>
                            <button
                                type="button"
                                onClick={() => setUnit('kg')}
                                style={{
                                    background: unit === 'kg' ? 'var(--primary)' : 'transparent',
                                    color: unit === 'kg' ? 'var(--bg-app)' : 'var(--text-muted)',
                                    border: 'none',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
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
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
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
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: 'var(--radius-sm)',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                PLACAS
                            </button>
                        </div>
                    </div>

                    
                    <div className="grid-inputs" style={{gridColumn: '1 / -1'}}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                {unit === 'placas' ? 'Nº Placas' : `Peso (${unit})`}
                            </label>
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Meta Sets</label>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={sets}
                                onChange={(e) => setSets(e.target.value)}
                                style={{ width: '100%', fontSize: '1.2rem' }}
                                placeholder="4"
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
                    </div>
                    <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem' }}>
                        <button
                            type="submit"
                            disabled={showTimer}
                            style={{
                                flex: 1,
                                background: showTimer ? 'var(--text-muted)' : 'linear-gradient(to right, var(--primary), var(--secondary))',
                                border: 'none',
                                borderRadius: 'var(--radius-sm)',
                                color: 'white',
                                fontWeight: 'bold',
                                padding: '1rem',
                                fontSize: '1.1rem',
                                boxShadow: showTimer ? 'none' : '0 4px 15px rgba(34, 211, 238, 0.3)',
                                cursor: showTimer ? 'not-allowed' : 'pointer',
                                opacity: showTimer ? 0.5 : 1
                            }}
                        >
                            {showTimer ? 'DESCANSANDO...' : (editingLogId ? 'GUARDAR CAMBIOS' : 'REGISTRAR SERIE')}
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

            {showTimer && (
                <Timer 
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
                    <div style={{ height: '220px', marginBottom: '1.5rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: 'var(--glass-border)' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                                <YAxis stroke="var(--text-muted)" fontSize={12} domain={['auto', 'auto']} />
                                <Tooltip
                                    content={({ active, payload, label }) => {
                                        if (active && payload && payload.length) {
                                            const data = payload[0].payload;
                                            // Determine unit label for tooltip
                                            let unitLabel = 'kg';
                                            if (data.unit === 'placas') unitLabel = 'Placas';
                                            else if (data.unit === 'lbs') unitLabel = 'lbs';

                                            return (
                                                <div style={{ backgroundColor: 'var(--bg-card)', padding: '0.5rem', border: '1px solid var(--glass-border)', borderRadius: '4px' }}>
                                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.25rem' }}>{data.fullDate}</p>
                                                    <p style={{ color: chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)', fontWeight: 'bold' }}>
                                                        {chartMetric === 'weight' ? `${data.weight} ${unitLabel}` : `${data.volume} ${data.unit === 'placas' ? 'Placas' : 'kg'}`}
                                                    </p>
                                                    <p style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{data.sets} Sets x {data.reps} Reps</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Line 
                                    type="monotone" 
                                    dataKey={chartMetric} 
                                    stroke={chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)'} 
                                    strokeWidth={3} 
                                    dot={{ r: 4, fill: chartMetric === 'weight' ? 'var(--primary)' : 'var(--secondary)' }} 
                                    activeDot={{ r: 6 }} 
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                )}
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {exerciseLogs.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin registros aún</p>
                    ) : (
                        exerciseLogs.map((log, index) => {
                            // ... (keep completed, target, isLatest, logVolume) ...
                            const completed = log.completedSets || 0;
                            const target = log.sets || 4;
                            const isLatest = index === 0;
                            const logVolume = (log.weight || 0) * (log.reps || 0) * (completed > 0 ? completed : target);

                            // Helper for unit label
                            const logUnitLabel = log.unit === 'placas' ? 'Placas' : (log.unit || 'kg');

                            // Comparison Logic (updated for unit safety)
                            const prevLog = exerciseLogs[index + 1];
                            let weightDiff = null;
                            let volumeDiff = null;

                            if (prevLog && prevLog.unit === log.unit) { // Only compare if units match? Or just compare numbers?
                                // If one is plates and other is kg, comparison is meaningless. 
                                // Let's simplify: compare raw numbers but maybe warn?
                                // Actually, if user switches units, the diff will be weird, but that's expected.
                                const prevVolume = (prevLog.weight || 0) * (prevLog.reps || 0) * (prevLog.completedSets || prevLog.sets || 1);
                                weightDiff = log.weight - prevLog.weight;
                                volumeDiff = logVolume - prevVolume;
                            }

                            return (
                                <div key={log.id} style={{
                                    padding: '1.25rem',
                                    background: 'var(--bg-card)',
                                    borderRadius: 'var(--radius-md)',
                                    border: 'var(--glass-border)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {/* Edit/Delete Actions - Absolute Top Right */}
                                    <div style={{ position: 'absolute', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={() => handleEditLog(log)}
                                            style={{ background: 'rgba(34, 211, 238, 0.1)', color: 'var(--primary)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteLog(log.id)}
                                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', display: 'flex' }}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    {/* Date Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <span style={{ 
                                            background: isLatest ? 'var(--primary)' : 'var(--glass-border)', 
                                            color: isLatest ? 'var(--bg-app)' : 'var(--text-muted)',
                                            fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 8px', borderRadius: '4px' 
                                        }}>
                                            {new Date(log.created_at || log.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                                        </span>
                                        {/* Time */}
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                            {new Date(log.created_at || log.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Main Metrics */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>
                                            {log.weight}
                                        </span>
                                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                                            {logUnitLabel}
                                        </span>
                                        <span style={{ fontSize: '1.25rem', color: 'var(--text-muted)', fontWeight: '300' }}>
                                            ×
                                        </span>
                                        <span style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-main)', lineHeight: 1 }}>
                                            {log.reps}
                                        </span>
                                        
                                        {/* Improvement Badges Inline */}
                                        {weightDiff !== null && Math.abs(weightDiff) > 0 && (
                                            <span 
                                                title={`Diferencia de peso con la sesión anterior (${weightDiff > 0 ? '+' : ''}${weightDiff} ${logUnitLabel})`}
                                                style={{ 
                                                marginLeft: 'auto',
                                                fontSize: '0.8rem', 
                                                color: weightDiff > 0 ? 'var(--success)' : '#f87171',
                                                fontWeight: 'bold',
                                                background: weightDiff > 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                cursor: 'help'
                                            }}>
                                                {weightDiff > 0 ? '▲' : '▼'}{Math.abs(weightDiff)}
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
                                        </div>

                                        {/* Completion Status / Sets Progress - ONLY ON LATEST */}
                                        {isLatest && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginRight: '4px' }}>Series:</span>
                                                {Array.from({ length: log.sets || 4 }).map((_, i) => {
                                                    const isCompleted = i < (log.completedSets || 0);
                                                    return (
                                                        <button
                                                            key={i}
                                                            onClick={() => handleProgressUpdate(log.id, i + 1)}
                                                            style={{
                                                                width: '30px', 
                                                                height: '12px', 
                                                                borderRadius: '2px',
                                                                background: isCompleted ? 'linear-gradient(to right, var(--primary), var(--secondary))' : 'rgba(255,255,255,0.1)',
                                                                border: isCompleted ? 'none' : '1px solid var(--glass-border)', 
                                                                cursor: 'pointer',
                                                                transition: 'all 0.2s',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center'
                                                            }}
                                                        >
                                                            {isCompleted && <span style={{fontSize: '8px', color: 'black'}}>✓</span>}
                                                        </button>
                                                    );
                                                })}
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
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
