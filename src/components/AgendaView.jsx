import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Info, CheckCircle, Plus } from 'lucide-react';
import { useStore } from '../hooks/useStore';

const DAYS_OF_WEEK = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export function AgendaView({ onNavigateToWorkout }) {
    const { routines, updateRoutine, logs } = useStore();
    const [viewMode, setViewMode] = useState('Semanal'); // 'Diario', 'Semanal', 'Mensual'
    const [currentDate, setCurrentDate] = useState(new Date());
    const [detailedDate, setDetailedDate] = useState(null);
    const [selectedRoutine, setSelectedRoutine] = useState(null);
    const [selectedDayToAdd, setSelectedDayToAdd] = useState(null);

    // Helpers
    const getActiveRoutines = () => routines.filter(r => r.is_active !== false);

    const toggleRoutineDay = (routineId, dayStr) => {
        const routine = routines.find(r => r.id === routineId);
        if (!routine) return;
        
        let currentDays = routine.scheduled_days || [];
        if (currentDays.includes(dayStr)) {
            currentDays = currentDays.filter(d => d !== dayStr);
        } else {
            currentDays = [...currentDays, dayStr];
        }
        
        updateRoutine(routineId, { scheduled_days: currentDays });
    };

    const navigateDay = (direction) => {
        const newDate = new Date(currentDate);
        if (viewMode === 'Diario') newDate.setDate(newDate.getDate() + direction);
        if (viewMode === 'Semanal') newDate.setDate(newDate.getDate() + (direction * 7));
        if (viewMode === 'Mensual') newDate.setMonth(newDate.getMonth() + direction);
        setCurrentDate(newDate);
    };

    const getDayName = (date) => {
        const day = date.getDay(); // 0 is Sunday
        return day === 0 ? "Domingo" : DAYS_OF_WEEK[day - 1];
    };

    const todayDayName = getDayName(new Date());

    // --- DIARIO VIEW ---
    const renderDaily = () => {
        const dayName = getDayName(currentDate);
        const dateStr = currentDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const isToday = currentDate.toDateString() === new Date().toDateString();
        
        const dayRoutines = getActiveRoutines().filter(r => (r.scheduled_days || []).includes(dayName));

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '1rem', borderRadius: '16px' }}>
                    <button onClick={() => navigateDay(-1)} style={navBtnStyle}><ChevronLeft /></button>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: 0, color: 'white', textTransform: 'capitalize' }}>{isToday ? 'Hoy' : dayName}</h3>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dateStr}</span>
                    </div>
                    <button onClick={() => navigateDay(1)} style={navBtnStyle}><ChevronRight /></button>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '24px', minHeight: '300px' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} /> Rutinas Programadas
                    </h4>
                    
                    {dayRoutines.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                            <p>No tienes rutinas asignadas para este día.</p>
                            <button onClick={() => setSelectedDayToAdd(dayName)} style={addBtnStyle}>Asignar Rutina</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {dayRoutines.map(routine => (
                                <div key={routine.id} style={{ 
                                    background: 'rgba(34, 211, 238, 0.05)', 
                                    border: '1px solid rgba(34, 211, 238, 0.2)', 
                                    padding: '1.25rem', 
                                    borderRadius: '16px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 0.25rem 0', color: 'white', fontSize: '1.1rem' }}>{routine.name}</h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{routine.exercises?.length || 0} ejercicios</span>
                                    </div>
                                    <button 
                                        onClick={() => onNavigateToWorkout(routine.id)}
                                        style={{ background: 'var(--primary)', color: 'var(--bg-app)', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Iniciar
                                    </button>
                                </div>
                            ))}
                            <button onClick={() => setSelectedDayToAdd(dayName)} style={{...addBtnStyle, width: '100%', marginTop: '1rem'}}>
                                <Plus size={16} /> Añadir otra rutina
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // --- SEMANAL VIEW ---
    const renderWeekly = () => {
        // Find start of week (Monday)
        const startOfWeek = new Date(currentDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        startOfWeek.setDate(diff);

        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '1rem', borderRadius: '16px' }}>
                    <button onClick={() => navigateDay(-1)} style={navBtnStyle}><ChevronLeft /></button>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: 0, color: 'white' }}>Semana del {startOfWeek.getDate()} {MONTHS[startOfWeek.getMonth()]}</h3>
                    </div>
                    <button onClick={() => navigateDay(1)} style={navBtnStyle}><ChevronRight /></button>
                </div>

                <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {DAYS_OF_WEEK.map((dayName, index) => {
                        const isToday = dayName === todayDayName;
                        const dayRoutines = getActiveRoutines().filter(r => (r.scheduled_days || []).includes(dayName));
                        
                        return (
                            <div key={dayName} style={{ 
                                background: isToday ? 'rgba(34, 211, 238, 0.05)' : 'var(--bg-card)', 
                                border: isToday ? '1px solid rgba(34, 211, 238, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                                padding: '1rem', 
                                borderRadius: '16px',
                                display: 'grid',
                                gridTemplateColumns: '100px 1fr',
                                alignItems: 'start',
                                gap: '1rem'
                            }}>
                                <div style={{ color: isToday ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isToday ? 'bold' : 'normal' }}>
                                    {dayName}
                                    {isToday && <span style={{display: 'block', fontSize: '0.7rem', marginTop: '4px'}}>HOY</span>}
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {dayRoutines.map(r => (
                                        <span key={r.id} style={{
                                            background: 'rgba(255,255,255,0.1)',
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '0.85rem',
                                            color: 'white',
                                            cursor: 'pointer',
                                            display: 'flex', alignItems: 'center', gap: '4px'
                                        }} onClick={() => toggleRoutineDay(r.id, dayName)}>
                                            {r.name} <span style={{fontSize: '10px', opacity: 0.5}}>×</span>
                                        </span>
                                    ))}
                                    <button 
                                        onClick={() => setSelectedDayToAdd(dayName)}
                                        style={{ background: 'transparent', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-muted)', padding: '4px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                                    >
                                        + Asignar
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- MENSUAL VIEW ---
    const renderMonthly = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1).getDay();
        const startingDay = firstDay === 0 ? 6 : firstDay - 1; // Map to 0-6 (Mon-Sun)
        const totalDays = new Date(year, month + 1, 0).getDate();
        
        const daysArray = Array.from({ length: 42 }); // 6 rows of 7 days
        
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '1rem', borderRadius: '16px' }}>
                    <button onClick={() => navigateDay(-1)} style={navBtnStyle}><ChevronLeft /></button>
                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ margin: 0, color: 'white', textTransform: 'uppercase' }}>{MONTHS[month]} {year}</h3>
                    </div>
                    <button onClick={() => navigateDay(1)} style={navBtnStyle}><ChevronRight /></button>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: '24px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '8px', textAlign: 'center' }}>
                        {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
                            <div key={d} style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>{d}</div>
                        ))}
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                        {daysArray.map((_, i) => {
                            const dayNumber = i - startingDay + 1;
                            const isCurrentMonth = dayNumber > 0 && dayNumber <= totalDays;
                            const currentDayName = DAYS_OF_WEEK[i % 7];
                            const dayRoutines = getActiveRoutines().filter(r => (r.scheduled_days || []).includes(currentDayName));
                            const isToday = isCurrentMonth && dayNumber === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();
                            
                            let dayLogs = [];
                            if (isCurrentMonth && logs) {
                                const startOfDay = new Date(year, month, dayNumber, 0, 0, 0);
                                const endOfDay = new Date(year, month, dayNumber, 23, 59, 59);
                                dayLogs = logs.filter(l => {
                                    const logDate = new Date(l.created_at || l.date);
                                    return logDate >= startOfDay && logDate <= endOfDay;
                                });
                            }
                            const hasTrained = dayLogs.length > 0;
                            const isSelected = detailedDate && isCurrentMonth && detailedDate.getDate() === dayNumber && detailedDate.getMonth() === month;

                            return (
                                <div 
                                    key={i} 
                                    onClick={() => {
                                        if (isCurrentMonth) setDetailedDate(new Date(year, month, dayNumber));
                                    }}
                                    style={{ 
                                    aspectRatio: '1', 
                                    background: isSelected ? 'rgba(255,255,255,0.1)' : (isToday ? 'rgba(34, 211, 238, 0.15)' : (isCurrentMonth ? 'rgba(255,255,255,0.03)' : 'transparent')),
                                    border: isToday ? '1px solid var(--primary)' : (isSelected ? '1px solid white' : '1px solid rgba(255,255,255,0.05)'),
                                    borderRadius: '8px',
                                    display: 'flex', flexDirection: 'column',
                                    padding: '4px',
                                    opacity: isCurrentMonth ? 1 : 0.2,
                                    cursor: isCurrentMonth ? 'pointer' : 'default'
                                }}>
                                    {isCurrentMonth && (
                                        <>
                                            <span style={{ fontSize: '0.8rem', color: isToday ? 'var(--primary)' : 'var(--text-muted)', fontWeight: isToday ? 'bold' : 'normal' }}>
                                                {dayNumber}
                                            </span>
                                            <div style={{ marginTop: 'auto', display: 'flex', gap: '2px', flexWrap: 'wrap' }}>
                                                {hasTrained ? (
                                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px rgba(74, 222, 128, 0.5)' }} />
                                                ) : dayRoutines.length > 0 ? (
                                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                                ) : null}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    
                    {detailedDate ? (() => {
                        const dayLogs = logs.filter(l => {
                            const logDate = new Date(l.created_at || l.date);
                            return logDate >= new Date(detailedDate.getFullYear(), detailedDate.getMonth(), detailedDate.getDate(), 0, 0, 0) &&
                                   logDate <= new Date(detailedDate.getFullYear(), detailedDate.getMonth(), detailedDate.getDate(), 23, 59, 59);
                        });
                        const currentDayName = DAYS_OF_WEEK[detailedDate.getDay() === 0 ? 6 : detailedDate.getDay() - 1];
                        const dayRoutines = getActiveRoutines().filter(r => (r.scheduled_days || []).includes(currentDayName));

                        return (
                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{detailedDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                    <button onClick={() => setDetailedDate(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }}>✕</button>
                                </h4>
                                
                                {dayLogs.length > 0 ? (
                                    <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.3)', padding: '0.75rem', borderRadius: '12px', marginBottom: '0.5rem' }}>
                                        <p style={{ margin: 0, color: '#4ade80', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}><CheckCircle size={14} /> Entrenaste este día</p>
                                        <p style={{ margin: '4px 0 0', color: 'white', fontSize: '0.8rem' }}>
                                            Realizaste {new Set(dayLogs.map(l => l.exerciseId)).size} ejercicios ({dayLogs.length} series en total).
                                        </p>
                                    </div>
                                ) : (
                                    <div style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '0.75rem', borderRadius: '12px', marginBottom: '0.5rem' }}>
                                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay registros de entrenamiento este día.</p>
                                    </div>
                                )}

                                {dayRoutines.length > 0 && (
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 'bold' }}>Rutina Programada:</span>
                                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '4px', flexWrap: 'wrap' }}>
                                            {dayRoutines.map(r => (
                                                <span key={r.id} style={{ fontSize: '0.8rem', background: 'rgba(34, 211, 238, 0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px' }}>{r.name}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })() : (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                            <h4 style={{ margin: '0 0 0.5rem 0', color: 'white', fontSize: '0.9rem' }}>Vista general del mes</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 5px rgba(74, 222, 128, 0.5)' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'white' }}>Día Entrenado</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Rutina Programada</span>
                                </div>
                            </div>
                            <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Toca cualquier día para ver el detalle de lo que entrenaste o lo que te tocaba hacer.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Modal to select routine for a day
    const RoutineSelectorModal = () => {
        if (!selectedDayToAdd) return null;
        const activeRoutineList = getActiveRoutines();
        
        return (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
                <div style={{ background: 'var(--bg-app)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '1.5rem', width: '100%', maxWidth: '400px' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: 'white' }}>Asignar rutina el {selectedDayToAdd}</h3>
                    
                    <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '50vh', overflowY: 'auto' }}>
                        {activeRoutineList.map(r => {
                            const isAssigned = (r.scheduled_days || []).includes(selectedDayToAdd);
                            return (
                                <div 
                                    key={r.id}
                                    onClick={() => toggleRoutineDay(r.id, selectedDayToAdd)}
                                    style={{ 
                                        padding: '1rem', background: isAssigned ? 'rgba(34, 211, 238, 0.1)' : 'var(--bg-card)', 
                                        border: isAssigned ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                    }}
                                >
                                    <span style={{ color: 'white', fontWeight: 'bold' }}>{r.name}</span>
                                    {isAssigned && <CheckCircle size={20} color="var(--primary)" />}
                                </div>
                            );
                        })}
                        {activeRoutineList.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>No tienes rutinas creadas. Ve a la pestaña de Entrenar para crear una.</p>
                        )}
                    </div>
                    
                    <button 
                        onClick={() => setSelectedDayToAdd(null)}
                        style={{ width: '100%', padding: '1rem', background: 'transparent', color: 'white', border: 'none', marginTop: '1rem', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        LISTO
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div style={{ paddingBottom: '90px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '16px', color: 'var(--primary)' }}>
                    <CalendarIcon size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>Agenda</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Planifica tus entrenamientos</p>
                </div>
            </div>

            {/* View Selector */}
            <div style={{ display: 'flex', background: 'var(--bg-card)', padding: '4px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {['Diario', 'Semanal', 'Mensual'].map(view => (
                    <button
                        key={view}
                        onClick={() => setViewMode(view)}
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            border: 'none',
                            background: viewMode === view ? 'rgba(255,255,255,0.1)' : 'transparent',
                            color: viewMode === view ? 'white' : 'var(--text-muted)',
                            borderRadius: '8px',
                            fontWeight: viewMode === view ? 'bold' : 'normal',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {view}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ marginTop: '0.5rem' }}>
                {viewMode === 'Diario' && renderDaily()}
                {viewMode === 'Semanal' && renderWeekly()}
                {viewMode === 'Mensual' && renderMonthly()}
            </div>

            <RoutineSelectorModal />
        </div>
    );
}

const navBtnStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: 'none',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
};

const addBtnStyle = {
    background: 'transparent',
    border: '1px dashed rgba(255,255,255,0.2)',
    color: 'white',
    padding: '0.75rem 1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 'bold'
};
