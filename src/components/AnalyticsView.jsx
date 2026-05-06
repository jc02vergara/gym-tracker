import React, { useMemo, useState } from 'react';
import { useStore } from '../hooks/useStore';
import { Activity, TrendingUp, Flame, Trophy, BarChart2, Calculator, X, Info } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, AreaChart, Area, CartesianGrid } from 'recharts';

export function AnalyticsView() {
    const { logs, routines, sessions } = useStore();

    // 1RM Calculator State
    const [show1RMModal, setShow1RMModal] = useState(false);
    const [rmWeight, setRmWeight] = useState('');
    const [rmReps, setRmReps] = useState('');
    const [activeInfo, setActiveInfo] = useState(null);
    const [selectedCalDay, setSelectedCalDay] = useState(null);

    const calculated1RM = useMemo(() => {
        const w = parseFloat(rmWeight) || 0;
        const r = parseInt(rmReps) || 0;
        if (w === 0 || r === 0) return 0;
        if (r === 1) return w;
        return w * (1 + (r / 30));
    }, [rmWeight, rmReps]);

    const userExercises = useMemo(() => {
        const list = [];
        routines.forEach(r => {
            r.exercises?.forEach(e => {
                // Solo si tiene logs
                if (logs.some(l => l.exerciseId === e.id && (l.completedSets || l.sets) > 0)) {
                    list.push({ id: e.id, name: e.name, routineName: r.name });
                }
            });
        });
        const unique = [];
        const seen = new Set();
        list.forEach(item => {
            if (!seen.has(item.id)) {
                seen.add(item.id);
                unique.push(item);
            }
        });
        // Sort alphabetically
        return unique.sort((a,b) => a.name.localeCompare(b.name));
    }, [routines, logs]);

    const handleSelectHistoricalExercise = (e) => {
        const exerciseId = e.target.value;
        if (!exerciseId) return;
        
        const exerciseLogs = logs.filter(l => l.exerciseId === exerciseId && (l.completedSets || l.sets) > 0);
        if (exerciseLogs.length === 0) return;
        
        // Find best log (Max weight)
        const bestLog = exerciseLogs.reduce((max, log) => {
           const logWeightKg = log.unit === 'lbs' ? (log.weight || 0) / 2.20462 : (log.weight || 0);
           const maxWeightKg = max.unit === 'lbs' ? (max.weight || 0) / 2.20462 : (max.weight || 0);
           if (logWeightKg > maxWeightKg) return log;
           return max;
        }, exerciseLogs[0]);
        
        if (bestLog) {
            setRmWeight(bestLog.weight);
            setRmReps(bestLog.reps);
        }
    };

    // 1. Process data for stats
    const stats = useMemo(() => {
        if (!logs || logs.length === 0) return { totalWorkouts: 0, totalVolume: 0, totalSets: 0, maxWeight: 0, estimatedTimeHrs: 0, currentStreak: 0, bestStreak: 0, heatmap: [], topExercises: [], weeklyDistribution: [], monthlyProgress: [] };

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Sort logs by date ascending
        const sortedLogs = [...logs].sort((a, b) => new Date(a.created_at || a.date) - new Date(b.created_at || b.date));

        const daysMap = new Map();
        let totalVolume = 0;
        let totalSets = 0;
        let maxWeight = 0;
        const exerciseCounts = new Map(); // exerciseId -> count of sets

        const weekDaysCount = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
        const monthsVolume = new Map(); // YYYY-MM -> volume

        sortedLogs.forEach(log => {
            const date = new Date(log.created_at || log.date);
            // Local date string YYYY-MM-DD
            const dateStr = date.toLocaleDateString('sv-SE'); 

            if (!daysMap.has(dateStr)) {
                daysMap.set(dateStr, { count: 0, volume: 0, logs: [] });
            }

            const dayData = daysMap.get(dateStr);
            dayData.count += 1;
            dayData.logs.push(log);
            
            // Calculate Volume & Sets
            const weight = (log.unit === 'lbs') ? (log.weight / 2.20462) : (log.weight || 0);
            const setsCompleted = log.completedSets ?? log.sets ?? 0;
            const volume = weight * (log.reps || 0) * setsCompleted;
            
            dayData.volume += volume;
            totalVolume += volume;
            totalSets += setsCompleted;

            if (weight > maxWeight && setsCompleted > 0) {
                maxWeight = weight;
            }

            // Weekly
            weekDaysCount[date.getDay()] += setsCompleted;

            // Monthly
            const monthStr = dateStr.substring(0, 7); // YYYY-MM
            if (!monthsVolume.has(monthStr)) monthsVolume.set(monthStr, 0);
            monthsVolume.set(monthStr, monthsVolume.get(monthStr) + volume);

            // Count exercises
            if (log.exerciseId) {
                const currentCount = exerciseCounts.get(log.exerciseId) || 0;
                exerciseCounts.set(log.exerciseId, currentCount + setsCompleted);
            }
        });

        // Weekly Array (Mon-Sun)
        const weeklyDistribution = [
            { day: 'Lun', sets: weekDaysCount[1] },
            { day: 'Mar', sets: weekDaysCount[2] },
            { day: 'Mié', sets: weekDaysCount[3] },
            { day: 'Jue', sets: weekDaysCount[4] },
            { day: 'Vie', sets: weekDaysCount[5] },
            { day: 'Sáb', sets: weekDaysCount[6] },
            { day: 'Dom', sets: weekDaysCount[0] }
        ];

        // Monthly Array
        const monthNamesMap = { '01':'Ene', '02':'Feb', '03':'Mar', '04':'Abr', '05':'May', '06':'Jun', '07':'Jul', '08':'Ago', '09':'Sep', '10':'Oct', '11':'Nov', '12':'Dic' };
        const monthlyProgress = Array.from(monthsVolume.entries())
            .map(([month, vol]) => ({ 
                month: monthNamesMap[month.substring(5)], 
                fullMonth: month, 
                volume: Math.round(vol) 
            }))
            .sort((a, b) => a.fullMonth.localeCompare(b.fullMonth))
            .slice(-6); // Last 6 months

        // Calculate Streaks
        const trainedDays = Array.from(daysMap.keys()).sort();
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        let lastDate = null;

        for (let i = 0; i < trainedDays.length; i++) {
            const currentDate = new Date(trainedDays[i] + 'T00:00:00');
            currentDate.setHours(0, 0, 0, 0);

            if (!lastDate) {
                tempStreak = 1;
            } else {
                const diffTime = Math.abs(currentDate - lastDate);
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    tempStreak += 1;
                } else if (diffDays > 1) {
                    tempStreak = 1;
                }
            }

            if (tempStreak > bestStreak) {
                bestStreak = tempStreak;
            }

            lastDate = currentDate;
        }

        // Current streak logic: check if the streak is still alive (trained today or yesterday)
        if (lastDate) {
            const diffTime = Math.abs(today - lastDate);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays === 0 || diffDays === 1) {
                currentStreak = tempStreak;
            } else {
                currentStreak = 0;
            }
        }

        // Top Exercises
        const topExercisesArray = Array.from(exerciseCounts.entries())
            .map(([id, sets]) => {
                let name = 'Ejercicio Desconocido';
                if (routines) {
                    for (const routine of routines) {
                        const exercise = routine.exercises?.find(e => e.id === id);
                        if (exercise) {
                            name = exercise.name;
                            break;
                        }
                    }
                }
                return { id, name, sets };
            })
            .sort((a, b) => b.sets - a.sets)
            .slice(0, 5);

        // Heatmap for last 90 days
        const heatmap = [];
        for (let i = 89; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dStr = d.toLocaleDateString('sv-SE');
            heatmap.push({
                date: d,
                dateStr: dStr,
                trained: daysMap.has(dStr),
                volume: daysMap.get(dStr)?.volume || 0
            });
        }

        // Year Calendar Map (current year)
        const currentYear = today.getFullYear();
        const yearCalendarMap = new Map();
        sortedLogs.forEach(log => {
            const date = new Date(log.created_at || log.date);
            if (date.getFullYear() !== currentYear) return;
            const dateStr = date.toLocaleDateString('sv-SE');
            if (!yearCalendarMap.has(dateStr)) yearCalendarMap.set(dateStr, { volume: 0, logs: [] });
            const entry = yearCalendarMap.get(dateStr);
            const weight = (log.unit === 'lbs') ? (log.weight / 2.20462) : (log.weight || 0);
            const setsCompleted = log.completedSets ?? log.sets ?? 0;
            entry.volume += weight * (log.reps || 0) * setsCompleted;
            entry.logs.push(log);
        });
        return {
            totalWorkouts: trainedDays.length,
            totalVolume: Math.round(totalVolume),
            totalSets,
            maxWeight: Math.round(maxWeight * 10) / 10,
            estimatedTimeHrs: Math.round((totalSets * 2.5) / 60),
            currentStreak,
            bestStreak,
            heatmap,
            topExercises: topExercisesArray,
            weeklyDistribution,
            monthlyProgress,
            yearCalendarMap,
            currentYear
        };
    }, [logs, routines]);

    // Real session hours (null when no sessions tracked yet)
    const totalSessionHrs = useMemo(() => {
        if (!sessions || sessions.length === 0) return null;
        const totalMins = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
        return (totalMins / 60).toFixed(1);
    }, [sessions]);


    // Helpers
    const TooltipInfo = ({ id, text, side = 'left' }) => {
        const popupStyle = {
            position: 'absolute',
            top: '100%',
            marginTop: '8px',
            background: 'var(--bg-app)',
            border: '1px solid var(--primary)',
            padding: '0.75rem',
            borderRadius: '12px',
            zIndex: 1000,
            width: '220px',
            fontSize: '0.8rem',
            color: 'white',
            boxShadow: '0 10px 25px rgba(0,0,0,0.8)',
            fontWeight: 'normal',
            lineHeight: '1.4',
            textAlign: 'left',
            wordBreak: 'break-word',
            ...(side === 'left' ? { right: 0 } : { left: 0 })
        };
        return (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveInfo(activeInfo === id ? null : id); }}
                    style={{ display: 'flex', cursor: 'pointer', padding: '4px', background: activeInfo === id ? 'rgba(255,255,255,0.1)' : 'transparent', borderRadius: '50%', transition: 'all 0.2s' }}
                >
                    <Info size={14} style={{ opacity: activeInfo === id ? 1 : 0.5 }} color={activeInfo === id ? 'var(--primary)' : 'currentColor'} />
                </span>
                {activeInfo === id && (
                    <div style={popupStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                            <strong style={{ color: 'var(--primary)' }}>Información</strong>
                            <X size={14} style={{ cursor: 'pointer', opacity: 0.7 }} onClick={(e) => { e.stopPropagation(); setActiveInfo(null); }} />
                        </div>
                        {text}
                    </div>
                )}
            </div>
        );
    };


    const getIntensityColor = (volume) => {
        if (volume === 0) return 'rgba(255,255,255,0.05)';
        if (volume < 5000) return 'rgba(34, 211, 238, 0.4)';
        if (volume < 10000) return 'rgba(34, 211, 238, 0.7)';
        return 'var(--primary)';
    };

    return (
        <div style={{ paddingBottom: '90px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '16px', color: 'var(--primary)' }}>
                    <BarChart2 size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>Estadísticas</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Tu progreso en números</p>
                </div>
            </div>

            {/* Impact Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
                        <Activity size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold', flex: 1 }}>Días Entrenados</span>
                        <TooltipInfo id="workouts" side="right" text="Días distintos en los que has registrado al menos un ejercicio" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: 'white' }}>
                        {stats.totalWorkouts} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>días</span>
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary)' }}>
                        <TrendingUp size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold', flex: 1 }}>Volumen Total</span>
                        <TooltipInfo id="volume" side="left" text="Suma total del peso que has levantado en toda tu historia (Series × Repes × Peso)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>
                        {(stats.totalVolume / 1000).toFixed(1)}<span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>k kg</span>
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--secondary)' }}>
                        <BarChart2 size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold', flex: 1 }}>Total Series</span>
                        <TooltipInfo id="sets" side="right" text="Cantidad total de series individuales que has completado" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>
                        {stats.totalSets} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>series</span>
                    </div>
                </div>
                <div style={cardStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#a855f7' }}>
                        <TrendingUp size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold', flex: 1 }}>Peso Máximo</span>
                        <TooltipInfo id="maxWeight" side="left" text="El peso más alto absoluto que has levantado en un único ejercicio (convertido a kg)" />
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>
                        {stats.maxWeight} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>kg</span>
                    </div>
                </div>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(249, 115, 22, 0.1) 100%)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#f87171' }}>
                        <Flame size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold', flex: 1 }}>Racha Actual</span>
                        <TooltipInfo id="currentStreak" side="right" text="Días consecutivos que llevas entrenando. La racha se pierde si pasan 2 días completos sin entrenar." />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#f87171' }}>
                        {stats.currentStreak} <span style={{ fontSize: '0.9rem', color: 'rgba(248, 113, 113, 0.7)', fontWeight: 'normal' }}>días</span>
                    </div>
                </div>
                <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.1) 0%, rgba(250, 204, 21, 0.1) 100%)', borderColor: 'rgba(234, 179, 8, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#fbbf24' }}>
                        <Trophy size={16} /> <span style={{ fontSize: '0.8rem', fontWeight: 'bold', flex: 1 }}>Mejor Racha</span>
                        <TooltipInfo id="bestStreak" side="left" text="Tu récord máximo histórico de más días consecutivos entrenados sin fallar." />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: '900', color: '#fbbf24' }}>
                        {stats.bestStreak} <span style={{ fontSize: '0.9rem', color: 'rgba(251, 191, 36, 0.7)', fontWeight: 'normal' }}>días</span>
                    </div>
                </div>
                <div style={{ ...cardStyle, gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                     <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                         {totalSessionHrs !== null ? '⏱ Tiempo Entrenado' : 'Tiempo Estimado'}
                         <TooltipInfo id="time" text={totalSessionHrs !== null ? `Suma real de todas tus sesiones de entrenamiento registradas (${sessions?.length || 0} sesiones).` : "Estimación asumiendo un promedio de 2.5 minutos por serie completada. Registra sesiones con el botón Iniciar para ver tiempo real."} />
                     </div>
                     <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'white' }}>
                         {totalSessionHrs !== null ? totalSessionHrs : stats.estimatedTimeHrs} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>horas</span>
                     </div>
                     {totalSessionHrs !== null && (
                         <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{sessions?.length} sesiones registradas</div>
                     )}
                </div>
            </div>


            {/* Monthly Progress Chart */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Progreso Mensual (Volumen)</h3>
                {stats.monthlyProgress.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No hay datos aún.</p>
                ) : (
                    <div style={{ height: '200px', marginTop: '1.5rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.monthlyProgress} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorMonth" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4}/>
                                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-10} tickFormatter={(val) => Math.round(val/1000) + 'k'} />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2, strokeDasharray: '4 4' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{ background: 'rgba(15,23,42,0.95)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{payload[0].payload.fullMonth}</p>
                                                    <p style={{ margin: 0, color: 'var(--primary)', fontSize: '1.1rem', fontWeight: '900' }}>
                                                        {Math.round(payload[0].value).toLocaleString()} <span style={{fontSize: '0.8rem', fontWeight: 'normal'}}>kg</span>
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="volume" stroke="var(--primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorMonth)" dot={{ r: 4, fill: 'var(--bg-card)', stroke: 'var(--primary)', strokeWidth: 2 }} activeDot={{ r: 6, fill: 'var(--primary)', stroke: 'white', strokeWidth: 2 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Weekly Distribution Chart */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Distribución Semanal</h3>
                <p style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Qué días eres más constante (Series completadas)</p>
                <div style={{ height: '180px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.weeklyDistribution} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        return (
                                            <div style={{ background: 'rgba(15,23,42,0.95)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                <p style={{ margin: 0, color: 'white', fontWeight: 'bold' }}>{payload[0].payload.day}</p>
                                                <p style={{ margin: 0, color: 'var(--secondary)', fontSize: '0.9rem' }}>{payload[0].value} series históricas</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar dataKey="sets" fill="var(--secondary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Heatmap */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Consistencia (Últimos 90 días)</h3>
                <div style={{ display: 'flex', gap: '2px', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {stats.heatmap.map((day, i) => (
                        <div 
                            key={day.dateStr}
                            title={`${day.dateStr}: ${day.trained ? 'Entrenado' : 'Descanso'} ${day.volume > 0 ? `(${Math.round(day.volume)} kg volume)` : ''}`}
                            style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '3px',
                                background: getIntensityColor(day.volume),
                                transition: 'all 0.2s',
                                border: '1px solid rgba(0,0,0,0.2)'
                            }}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    <span>Menos</span>
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.05)' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(34, 211, 238, 0.4)' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(34, 211, 238, 0.7)' }} />
                    <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary)' }} />
                    <span>Más</span>
                </div>
            </div>

            {/* Top Exercises */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Ejercicios con Más Series Completadas</h3>
                {stats.topExercises.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>No hay datos suficientes aún.</p>
                ) : (
                    <div style={{ height: '250px', marginTop: '1rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.topExercises} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                                <XAxis type="number" hide />
                                <YAxis 
                                    dataKey="name" 
                                    type="category" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    width={120} 
                                    tick={{ fill: 'white', fontSize: 11 }} 
                                />
                                <Tooltip 
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div style={{ background: 'rgba(15,23,42,0.95)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
                                                    <p style={{ margin: 0, color: 'white', fontWeight: 'bold' }}>{payload[0].payload.name}</p>
                                                    <p style={{ margin: 0, color: 'var(--primary)', fontSize: '0.9rem' }}>{payload[0].value} series realizadas</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Bar dataKey="sets" radius={[0, 4, 4, 0]} maxBarSize={30}>
                                    {stats.topExercises.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--primary)' : 'rgba(34, 211, 238, 0.5)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* Year Calendar */}
            {(() => {
                const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
                const DAY_NAMES = ['L','M','X','J','V','S','D'];
                const { yearCalendarMap, currentYear } = stats;

                const getCalColor = (volume) => {
                    if (!volume || volume === 0) return 'rgba(255,255,255,0.06)';
                    if (volume < 3000) return 'rgba(34,211,238,0.35)';
                    if (volume < 8000) return 'rgba(34,211,238,0.65)';
                    return 'var(--primary)';
                };

                const months = Array.from({ length: 12 }, (_, mi) => {
                    const firstDay = new Date(currentYear, mi, 1);
                    const lastDay = new Date(currentYear, mi + 1, 0);
                    // Monday-first offset
                    const startOffset = (firstDay.getDay() + 6) % 7;
                    const days = [];
                    for (let i = 0; i < startOffset; i++) days.push(null);
                    for (let d = 1; d <= lastDay.getDate(); d++) {
                        const dateObj = new Date(currentYear, mi, d);
                        const dateStr = dateObj.toLocaleDateString('sv-SE');
                        const data = yearCalendarMap.get(dateStr);
                        days.push({ d, dateStr, data });
                    }
                    return { name: MONTH_NAMES[mi], days };
                });

                // Resolve exercise name helper
                const resolveExName = (exId) => {
                    if (!exId) return 'Ejercicio';
                    for (const r of routines) {
                        const ex = r.exercises?.find(e => e.id === exId);
                        if (ex) return ex.name;
                    }
                    return 'Ejercicio';
                };

                return (
                    <>
                    <div style={sectionStyle}>
                        <h3 style={sectionTitleStyle}>Calendario {currentYear}</h3>
                        <p style={{ margin: '0.25rem 0 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Toca un día entrenado para ver el detalle</p>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            {months.map((month) => (
                                <div key={month.name}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>{month.name}</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                                        {DAY_NAMES.map(dn => (
                                            <div key={dn} style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', paddingBottom: '2px' }}>{dn}</div>
                                        ))}
                                        {month.days.map((cell, ci) => {
                                            if (!cell) return <div key={`e-${ci}`} />;
                                            const trained = !!cell.data;
                                            return (
                                                <div
                                                    key={cell.dateStr}
                                                    onClick={() => trained && setSelectedCalDay({ dateStr: cell.dateStr, data: cell.data })}
                                                    style={{
                                                        aspectRatio: '1',
                                                        borderRadius: '3px',
                                                        background: getCalColor(cell.data?.volume),
                                                        cursor: trained ? 'pointer' : 'default',
                                                        border: trained ? '1px solid rgba(34,211,238,0.3)' : '1px solid transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.5rem', color: trained ? 'white' : 'rgba(255,255,255,0.2)',
                                                        fontWeight: trained ? '700' : '400',
                                                        transition: 'all 0.15s',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {cell.d}
                                                    {cell.data?.logs?.some(l => l.notes) && (
                                                        <div style={{ position: 'absolute', top: '1px', right: '1px', width: '3px', height: '3px', borderRadius: '50%', background: '#fbbf24' }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(255,255,255,0.06)' }} /> Descanso
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(34,211,238,0.35)' }} /> Ligero
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'var(--primary)' }} /> Intenso
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <div style={{ width: '3px', height: '3px', borderRadius: '50%', background: '#fbbf24' }} /> Nota
                            </div>
                        </div>
                    </div>

                    {/* Day Detail Modal */}
                    {selectedCalDay && (() => {
                        const { dateStr, data } = selectedCalDay;
                        const dayLogs = data.logs || [];
                        // Group by exercise
                        const byExercise = new Map();
                        dayLogs.forEach(log => {
                            const key = log.exerciseId || 'unknown';
                            if (!byExercise.has(key)) byExercise.set(key, { name: resolveExName(log.exerciseId), entries: [] });
                            byExercise.get(key).entries.push(log);
                        });
                        const notes = dayLogs.find(l => l.notes)?.notes;
                        const [, month, day] = dateStr.split('-');
                        const displayDate = `${parseInt(day)} de ${MONTH_NAMES[parseInt(month)-1]} de ${currentYear}`;

                        return (
                            <div style={modalOverlayStyle} onClick={() => setSelectedCalDay(null)}>
                                <div style={{ ...modalContentStyle, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                                        <div>
                                            <h3 style={{ margin: 0, color: 'white', fontSize: '1.1rem' }}>🏋️ Entrenamiento</h3>
                                            <p style={{ margin: '2px 0 0', color: 'var(--primary)', fontSize: '0.82rem' }}>{displayDate}</p>
                                        </div>
                                        <button onClick={() => setSelectedCalDay(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><X size={22} /></button>
                                    </div>

                                    {/* Exercises */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '60vh', overflowY: 'auto' }}>
                                        {Array.from(byExercise.values()).map((ex, ei) => (
                                            <div key={ei} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '0.75rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                                                <div style={{ fontSize: '0.875rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>{ex.name}</div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>
                                                    <span>Peso</span><span>Reps</span><span>Series</span>
                                                </div>
                                                {ex.entries.map((log, li) => {
                                                    const displayWeight = log.weight ? `${log.weight} ${log.unit || 'kg'}` : '—';
                                                    const setsCompleted = log.completedSets ?? log.sets ?? '—';
                                                    return (
                                                        <div key={li} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', fontSize: '0.85rem', color: 'white', padding: '4px 0', borderTop: li > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                                                            <span style={{ fontWeight: '700' }}>{displayWeight}</span>
                                                            <span>{log.reps || '—'}</span>
                                                            <span>{setsCompleted}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ))}

                                        {/* Notes */}
                                        {notes && (
                                            <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: '12px', padding: '0.75rem' }}>
                                                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: '700', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📝 Observaciones</div>
                                                <p style={{ margin: 0, color: 'white', fontSize: '0.875rem', lineHeight: '1.5' }}>{notes}</p>
                                            </div>
                                        )}

                                        {/* Volume summary */}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.75rem', background: 'rgba(34,211,238,0.06)', borderRadius: '10px', fontSize: '0.8rem' }}>
                                            <span style={{ color: 'var(--text-muted)' }}>Volumen total del día</span>
                                            <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{Math.round(data.volume).toLocaleString()} kg</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                    </>
                );
            })()}

            {/* Tools Section */}
            <div style={sectionStyle}>
                <h3 style={sectionTitleStyle}>Herramientas</h3>
                <p style={{ margin: '0.5rem 0 1rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Calcula tu repetición máxima y porcentajes de entrenamiento.</p>
                <button 
                    onClick={() => setShow1RMModal(true)}
                    style={{
                        background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1) 0%, rgba(34, 211, 238, 0.2) 100%)',
                        color: 'var(--primary)',
                        border: '1px solid rgba(34, 211, 238, 0.3)',
                        padding: '1rem',
                        borderRadius: '16px',
                        width: '100%',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    <Calculator size={20} /> CALCULADORA DE 1RM
                </button>
            </div>

            {/* Modal de 1RM */}
            {show1RMModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calculator size={20} color="var(--primary)" /> Calculadora 1RM
                            </h2>
                            <button onClick={() => setShow1RMModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}>
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Cargar del Historial</label>
                            <select 
                                onChange={handleSelectHistoricalExercise} 
                                defaultValue="" 
                                style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
                            >
                                <option value="" disabled>Selecciona un ejercicio...</option>
                                {userExercises.map(ex => (
                                    <option key={ex.id} value={ex.id}>{ex.name}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.5rem 0 0 0' }}>Buscará automáticamente el peso máximo registrado que hayas levantado.</p>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.5rem' }}>PESO</label>
                                <input 
                                    type="number" 
                                    value={rmWeight} 
                                    onChange={(e) => setRmWeight(e.target.value)} 
                                    placeholder="Ej. 100" 
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} 
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'bold', marginBottom: '0.5rem' }}>REPETICIONES</label>
                                <input 
                                    type="number" 
                                    value={rmReps} 
                                    onChange={(e) => setRmReps(e.target.value)} 
                                    placeholder="Ej. 5" 
                                    style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold' }} 
                                />
                            </div>
                        </div>

                        <div style={{ background: 'linear-gradient(to right, rgba(15, 23, 42, 0.4), rgba(34, 211, 238, 0.1), rgba(15, 23, 42, 0.4))', padding: '1.5rem', borderRadius: '16px', textAlign: 'center', border: '1px solid rgba(34, 211, 238, 0.3)', marginBottom: '1.5rem' }}>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem', letterSpacing: '1px' }}>1 Repetición Máxima (Estimada)</div>
                            <div style={{ fontSize: '3rem', fontWeight: '900', color: 'white', textShadow: '0 0 20px rgba(34, 211, 238, 0.4)' }}>
                                {calculated1RM > 0 ? calculated1RM.toFixed(1) : '---'} <span style={{ fontSize: '1.25rem', color: 'var(--primary)', fontWeight: 'bold' }}>kg/lbs</span>
                            </div>
                        </div>

                        {calculated1RM > 0 && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 1rem 0', color: 'white', fontSize: '0.9rem', textAlign: 'center' }}>Porcentajes de Entrenamiento</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                                    {[90, 80, 75, 70].map(pct => (
                                        <div key={pct} style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: '8px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>{pct}%</div>
                                            <div style={{ fontSize: '1rem', color: 'white', fontWeight: 'bold' }}>{(calculated1RM * (pct/100)).toFixed(1)}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '20px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
};

const sectionStyle = {
    background: 'var(--bg-card)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '24px',
    padding: '1.5rem',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
};

const sectionTitleStyle = {
    margin: '0',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: '800'
};

const modalOverlayStyle = {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '1rem'
};

const modalContentStyle = {
    background: 'var(--bg-app)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '24px',
    padding: '1.5rem',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
    maxHeight: '90vh',
    overflowY: 'auto'
};
