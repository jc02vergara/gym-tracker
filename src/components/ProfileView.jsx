import React, { useState } from 'react';
import { useStore } from '../hooks/useStore';
import { User, FileText, Target, Activity, Calendar as CalendarIcon, Download, Info } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';

export function ProfileView() {
    const { user, updateUser, logs, routines, measurements } = useStore();
    const [isGenerating, setIsGenerating] = useState(false);
    const [reportTimeframe, setReportTimeframe] = useState('todo'); // 'todo', 'dia', 'semana', 'mes', 'año'
    const [pdfUrl, setPdfUrl] = useState(null);
    
    // Default values from user or empty
    const [profileData, setProfileData] = useState({
        age: user?.age || '',
        height: user?.height || '',
        weight: user?.weight || '',
        start_date: user?.start_date || new Date().toISOString().split('T')[0],
        goal: user?.goal || 'hipertrofia',
        observations: user?.observations || '',
        rest_time: user?.rest_time || 180,
    });

    const handleProfileChange = (e) => {
        setProfileData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const saveProfile = async (e) => {
        e.preventDefault();
        try {
            await updateUser(profileData);
            toast.success('Perfil actualizado correctamente');
        } catch (error) {
            toast.error('Error al actualizar el perfil');
        }
    };

    const generatePdfReport = async () => {
        setIsGenerating(true);
        setPdfUrl(null);
        try {
            const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                const date = new Date(dateStr);
                const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
                const formatted = date.toLocaleDateString('es-ES', options);
                return formatted.charAt(0).toUpperCase() + formatted.slice(1);
            };

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            
            // Título
            doc.setFontSize(22);
            doc.setTextColor(34, 211, 238); // Cyan
            doc.text('REPORTE DE PROGRESO - GYM TRACKER', pageWidth / 2, 20, { align: 'center' });
            
            let yPos = 35;
            
            // 1. Datos personales y contexto
            doc.setFontSize(14);
            doc.setTextColor(255, 255, 255);
            doc.setFillColor(15, 23, 42);
            doc.rect(14, yPos - 6, pageWidth - 28, 8, 'F');
            doc.text('1. Datos Personales y Contexto', 16, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40);
            doc.text(`Nombre: ${user?.name || 'Usuario'}`, 14, yPos);
            doc.text(`Edad: ${profileData.age || 'No especificada'}`, 100, yPos);
            yPos += 6;
            doc.text(`Estatura: ${profileData.height ? profileData.height + ' cm' : 'No especificada'}`, 14, yPos);
            doc.text(`Peso Inicial/Actual: ${profileData.weight ? profileData.weight + ' kg' : 'No especificado'}`, 100, yPos);
            yPos += 6;
            doc.text(`Fecha de inicio: ${formatDate(profileData.start_date)}`, 14, yPos);
            doc.text(`Objetivo Principal: ${profileData.goal.toUpperCase()}`, 100, yPos);
            yPos += 6;
            doc.text(`Observaciones generales: ${profileData.observations || 'Ninguna'}`, 14, yPos);
            
            yPos += 15;

            // Filter data based on timeframe
            const now = new Date();
            let startDate = new Date(0); // Default 'todo' (1970)

            if (reportTimeframe === 'dia') {
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            } else if (reportTimeframe === 'semana') {
                startDate = new Date(now);
                const day = startDate.getDay() || 7; 
                if (day !== 1) startDate.setHours(-24 * (day - 1)); 
                else startDate.setHours(0,0,0,0);
            } else if (reportTimeframe === 'mes') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            } else if (reportTimeframe === 'año') {
                startDate = new Date(now.getFullYear(), 0, 1);
            }

            const filteredMeasurements = measurements.filter(m => new Date(m.date) >= startDate);
            const filteredLogs = logs.filter(l => new Date(l.created_at || l.date) >= startDate);

            // 3. Indicadores Físicos Dinámicos
            const recentMeasurements = [...filteredMeasurements].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
            
            doc.setFontSize(14);
            doc.setFillColor(15, 23, 42);
            doc.rect(14, yPos - 6, pageWidth - 28, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text('2. Indicadores Físicos (Historial de Progreso)', 16, yPos);
            yPos += 5;
            
            if (recentMeasurements.length > 0) {
                // Determine all unique keys in 'data'
                const measureKeys = new Set();
                recentMeasurements.forEach(m => {
                    const mData = m.data || { Pecho: m.chest, Glúteos: m.waist, Brazos: m.arms, Piernas: m.legs };
                    Object.keys(mData).forEach(k => { if(mData[k]) measureKeys.add(k); });
                });
                const sortedKeys = Array.from(measureKeys).sort();

                const measHead = [['Fecha', 'Peso (kg)', ...sortedKeys]];
                const measBody = recentMeasurements.map(m => {
                    const mData = m.data || { Pecho: m.chest, Glúteos: m.waist, Brazos: m.arms, Piernas: m.legs };
                    return [
                        formatDate(m.date),
                        m.weight ? `${m.weight} kg` : '-',
                        ...sortedKeys.map(k => mData[k] ? `${mData[k]} cm` : '-')
                    ];
                });
                
                autoTable(doc, {
                    startY: yPos,
                    head: measHead,
                    body: measBody,
                    theme: 'grid',
                    headStyles: { fillColor: [34, 211, 238], textColor: 255, fontSize: 8 },
                    styles: { fontSize: 7, cellPadding: 2 }
                });
                yPos = doc.lastAutoTable.finalY + 15;
            } else {
                yPos += 5;
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('No hay registros de medidas corporales.', 14, yPos);
                yPos += 15;
            }

            // 4. Registro de Entrenamiento (Últimos entrenamientos)
            doc.setFontSize(14);
            doc.setFillColor(15, 23, 42);
            doc.rect(14, yPos - 6, pageWidth - 28, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text(`3. Registro de Entrenamiento (${reportTimeframe.toUpperCase()})`, 16, yPos);
            yPos += 5;

            const recentLogs = [...filteredLogs].sort((a,b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
            
            if (recentLogs.length > 0) {
                const groupedLogs = new Map(); // Week -> Map(Routine -> Logs)
                const getWeekLabel = (d) => {
                    const logDate = new Date(d);
                    const day = logDate.getDay() || 7; 
                    const monday = new Date(logDate);
                    monday.setDate(logDate.getDate() - day + 1);
                    const sunday = new Date(monday);
                    sunday.setDate(monday.getDate() + 6);
                    return `Semana del ${formatDate(monday)} al ${formatDate(sunday)}`;
                };

                recentLogs.forEach(l => {
                    const logDate = new Date(l.created_at || l.date);
                    const weekStr = getWeekLabel(logDate);
                    
                    let routineName = 'Rutina General';
                    let exName = 'Ejercicio Desconocido';
                    routines.forEach(r => {
                        const ex = r.exercises?.find(e => e.id === l.exerciseId);
                        if (ex) {
                            routineName = r.name || 'Rutina General';
                            exName = ex.name;
                        }
                    });

                    if (!groupedLogs.has(weekStr)) groupedLogs.set(weekStr, new Map());
                    const weekGroup = groupedLogs.get(weekStr);
                    if (!weekGroup.has(routineName)) weekGroup.set(routineName, []);
                    
                    weekGroup.get(routineName).push([
                        formatDate(logDate),
                        exName,
                        `${l.completedSets || l.sets} x ${l.reps}`,
                        `${l.weight} ${l.unit}`
                    ]);
                });

                groupedLogs.forEach((routinesMap, weekLabel) => {
                    if (yPos > 250) { doc.addPage(); yPos = 20; }
                    
                    doc.setFontSize(12);
                    doc.setTextColor(34, 211, 238);
                    doc.text(weekLabel, 14, yPos);
                    yPos += 8;

                    routinesMap.forEach((logsBody, routineName) => {
                        if (yPos > 260) { doc.addPage(); yPos = 20; }
                        
                        doc.setFontSize(10);
                        doc.setTextColor(255, 255, 255);
                        doc.setFillColor(30, 41, 59);
                        doc.rect(14, yPos - 5, pageWidth - 28, 7, 'F');
                        doc.text(`Rutina: ${routineName}`, 16, yPos);
                        yPos += 4;

                        autoTable(doc, {
                            startY: yPos,
                            head: [['Fecha', 'Ejercicio', 'SeriesxReps', 'Peso']],
                            body: logsBody,
                            theme: 'grid',
                            headStyles: { fillColor: [50, 60, 80], textColor: 255 },
                            styles: { fontSize: 8 }
                        });
                        yPos = doc.lastAutoTable.finalY + 10;
                    });
                    yPos += 5; // Extra space between weeks
                });

            } else {
                yPos += 5;
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text('No hay registros de entrenamiento recientes.', 14, yPos);
                yPos += 15;
            }
            
            // 5. Análisis y Rendimiento
            if (yPos > 240) { doc.addPage(); yPos = 20; }
            doc.setFontSize(14);
            doc.setFillColor(15, 23, 42);
            doc.rect(14, yPos - 6, pageWidth - 28, 8, 'F');
            doc.setTextColor(255, 255, 255);
            doc.text('4. Análisis y Observaciones', 16, yPos);
            yPos += 10;
            
            doc.setFontSize(10);
            doc.setTextColor(40, 40, 40);
            
            // Calculate total workouts, volume, etc. based on filter
            const totalWorkouts = filteredLogs.length;
            const uniqueExercises = new Set(filteredLogs.map(l => l.exerciseId)).size;
            
            doc.text(`Total de series registradas en este periodo: ${totalWorkouts}`, 14, yPos);
            yPos += 6;
            doc.text(`Ejercicios distintos practicados: ${uniqueExercises}`, 14, yPos);
            yPos += 10;
            
            doc.setFont(undefined, 'bold');
            doc.text('Recomendaciones generadas:', 14, yPos);
            doc.setFont(undefined, 'normal');
            yPos += 6;
            
            const lines = doc.splitTextToSize(
                "• Mantener el registro constante para evaluar la progresión de cargas en ejercicios compuestos.\n" +
                "• Comparar el incremento de medidas versus el peso para verificar la composición corporal.", 
                pageWidth - 28
            );
            doc.text(lines, 14, yPos);
            
            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generado el ${new Date().toLocaleString()} por Gym Tracker App`, pageWidth / 2, 290, { align: 'center' });

            const fileName = `Reporte_Gym_${new Date().toISOString().split('T')[0]}.pdf`;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
            
            if (isMobile) {
                const blob = doc.output('blob');
                const file = new File([blob], fileName, { type: 'application/pdf' });

                try {
                    // Web Share API (compartir archivo desde el navegador móvil)
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'Reporte de Gimnasio',
                            text: 'Aquí está mi reporte de progreso',
                            files: [file],
                        });
                    } else {
                        doc.save(fileName);
                    }
                    toast.success('Reporte listo. Revisa tu visor de PDF o menú de compartir.');
                } catch (err) {
                    if (err?.name === 'AbortError') return; // el usuario canceló el menú de compartir
                    console.error('Share error', err);
                    const url = URL.createObjectURL(blob);
                    setPdfUrl(url);
                    window.open(url, '_blank');
                    toast.error('No se pudo compartir, abriendo el PDF en una pestaña...');
                }
            } else {
                doc.save(fileName);
                toast.success('Reporte PDF generado exitosamente');
            }
        } catch (error) {
            console.error('PDF error', error);
            toast.error('Error al generar el PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{ paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <div style={{ padding: '0.75rem', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '16px', color: 'var(--primary)' }}>
                    <User size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', fontWeight: '900', color: 'white' }}>Perfil y Reporte</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Gestiona tus datos y descarga tu progreso</p>
                </div>
            </div>

            <div style={{ 
                background: 'var(--bg-card)', 
                padding: '1.5rem', 
                borderRadius: '24px', 
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
                display: 'flex', flexDirection: 'column', gap: '1.5rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}>
                        <Info size={18} color="var(--primary)" /> Contexto Inicial
                    </h3>
                </div>

                <form onSubmit={saveProfile} style={{ display: 'grid', gap: '1rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        <div>
                            <label style={labelStyle}>Edad</label>
                            <input type="number" name="age" value={profileData.age} onChange={handleProfileChange} style={inputStyle} placeholder="Ej. 25" />
                        </div>
                        <div>
                            <label style={labelStyle}>Estatura (cm)</label>
                            <input type="number" name="height" value={profileData.height} onChange={handleProfileChange} style={inputStyle} placeholder="Ej. 175" />
                        </div>
                        <div>
                            <label style={labelStyle}>Peso Inicial (kg)</label>
                            <input type="number" name="weight" value={profileData.weight} onChange={handleProfileChange} style={inputStyle} placeholder="Ej. 70.5" />
                        </div>
                    </div>
                    
                    <div>
                        <label style={labelStyle}>Fecha de Inicio</label>
                        <input type="date" name="start_date" value={profileData.start_date} onChange={handleProfileChange} style={inputStyle} />
                    </div>

                    <div>
                        <label style={labelStyle}>Tiempo de Descanso Automático (Segundos)</label>
                        <input type="number" name="rest_time" value={profileData.rest_time} onChange={handleProfileChange} style={inputStyle} placeholder="Ej. 180 (3 min), 90 (1.5 min)" />
                    </div>

                    <div>
                        <label style={labelStyle}>Objetivo Principal</label>
                        <select name="goal" value={profileData.goal} onChange={handleProfileChange} style={{...inputStyle, WebkitAppearance: 'none'}}>
                            <option value="hipertrofia">Hipertrofia</option>
                            <option value="mejora estética">Mejora Estética</option>
                            <option value="fuerza">Ganancia de Fuerza</option>
                            <option value="pérdida de peso">Pérdida de Peso</option>
                            <option value="salud">Salud General</option>
                        </select>
                    </div>

                    <div>
                        <label style={labelStyle}>Observaciones iniciales (Lesiones, experiencia)</label>
                        <textarea name="observations" value={profileData.observations} onChange={handleProfileChange} style={{...inputStyle, minHeight: '80px', resize: 'vertical'}} placeholder="Ej. Principiante, lesión en hombro derecho..." />
                    </div>

                    <button type="submit" style={{
                        background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)',
                        padding: '0.8rem', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '0.5rem'
                    }}>
                        Guardar Perfil
                    </button>
                </form>
            </div>
            
            <div style={{ background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={18} color="var(--primary)" /> Generar Reporte PDF
                </h3>
                
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={labelStyle}>Rango de Tiempo</label>
                    <select 
                        value={reportTimeframe} 
                        onChange={(e) => setReportTimeframe(e.target.value)}
                        style={{...inputStyle, WebkitAppearance: 'none'}}
                    >
                        <option value="todo">Todo el historial</option>
                        <option value="dia">Día de hoy</option>
                        <option value="semana">Esta semana</option>
                        <option value="mes">Este mes</option>
                        <option value="año">Este año</option>
                    </select>
                </div>

                <button
                    onClick={generatePdfReport}
                    disabled={isGenerating}
                style={{
                    background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
                    color: '#0f172a',
                    border: 'none',
                    padding: '1.25rem',
                    borderRadius: '20px',
                    fontWeight: '900',
                    fontSize: '1.1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 8px 25px -5px rgba(34, 211, 238, 0.5)',
                    cursor: isGenerating ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s',
                    marginTop: '1rem',
                    width: '100%'
                }}
            >
                <FileText size={24} />
                {isGenerating ? 'GENERANDO...' : 'GENERAR REPORTE PDF'}
                </button>

                {pdfUrl && !isGenerating && (
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                            background: 'rgba(34, 211, 238, 0.1)',
                            color: 'var(--primary)',
                            border: '1px solid var(--primary)',
                            padding: '1rem',
                            borderRadius: '20px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            marginTop: '1rem',
                            textDecoration: 'none',
                            width: '100%',
                            boxShadow: '0 4px 15px rgba(34, 211, 238, 0.2)'
                        }}
                    >
                        <Download size={20} /> VER REPORTE LISTO
                    </a>
                )}
            </div>
        </div>
    );
}

const labelStyle = {
    display: 'block', 
    marginBottom: '0.5rem', 
    color: 'var(--text-muted)', 
    fontSize: '0.8rem', 
    fontWeight: 'bold', 
    textTransform: 'uppercase', 
    letterSpacing: '0.5px'
};

const inputStyle = {
    width: '100%', 
    padding: '0.75rem', 
    borderRadius: '12px', 
    border: '1px solid rgba(255,255,255,0.1)', 
    background: 'rgba(0,0,0,0.2)', 
    color: 'white', 
    outline: 'none',
    fontFamily: 'inherit'
};
