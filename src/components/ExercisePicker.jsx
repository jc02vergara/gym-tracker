import { useState, useMemo } from 'react';
import { Search, X, Plus } from 'lucide-react';
import { EXERCISE_CATALOG, BODY_PART_ES, EQUIPMENT_ES, BODY_PARTS } from '../data/exerciseCatalog';

const RESULTS_LIMIT = 30;

function normalize(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');
}

function chipStyle(active) {
    return {
        background: active ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
        color: active ? 'var(--bg-app)' : 'var(--text-muted)',
        border: '1px solid ' + (active ? 'var(--primary)' : 'rgba(255,255,255,0.1)'),
        borderRadius: '20px',
        padding: '0.3rem 0.75rem',
        fontSize: '0.75rem',
        fontWeight: '700',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
    };
}

// Search-and-select catalog picker, backed by the exercises-dataset text data
// (names/muscle groups only, no media — see src/data/exerciseCatalog.js).
export function ExercisePicker({ onSelect, existingNames = [] }) {
    const [query, setQuery] = useState('');
    const [bodyPart, setBodyPart] = useState('');
    const [showCustom, setShowCustom] = useState(false);
    const [customName, setCustomName] = useState('');

    const existingSet = useMemo(
        () => new Set(existingNames.map((n) => normalize(n))),
        [existingNames]
    );

    const hasFilter = query.trim().length > 0 || bodyPart !== '';

    const results = useMemo(() => {
        if (!hasFilter) return [];
        const q = normalize(query);
        return EXERCISE_CATALOG.filter((e) => !bodyPart || e.bodyPart === bodyPart).filter((e) => {
            if (!q) return true;
            return (
                normalize(e.name).includes(q) ||
                normalize(e.target).includes(q) ||
                normalize(e.muscleGroup).includes(q) ||
                normalize(BODY_PART_ES[e.bodyPart] || '').includes(q) ||
                normalize(EQUIPMENT_ES[e.equipment] || e.equipment).includes(q)
            );
        });
    }, [query, bodyPart, hasFilter]);

    const visibleResults = results.slice(0, RESULTS_LIMIT);

    const handlePick = (exercise) => {
        onSelect(exercise.name);
        setQuery('');
    };

    const handleAddCustom = () => {
        if (!customName.trim()) return;
        onSelect(customName.trim());
        setCustomName('');
        setShowCustom(false);
    };

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.65rem',
                background: 'rgba(0,0,0,0.2)',
                padding: '12px',
                borderRadius: '16px',
                border: '1px dashed rgba(255,255,255,0.15)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '12px',
                    padding: '0.5rem 0.75rem',
                }}
            >
                <Search size={18} color="var(--text-muted)" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Busca un ejercicio (ej: press banca, sentadilla)..."
                    style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        color: 'white',
                        outline: 'none',
                        fontSize: '1rem',
                        fontWeight: '500',
                    }}
                />
                {query && (
                    <button
                        onClick={() => setQuery('')}
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}
                    >
                        <X size={16} color="var(--text-muted)" />
                    </button>
                )}
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', overflowX: 'auto', paddingBottom: '2px' }}>
                <button onClick={() => setBodyPart('')} style={chipStyle(bodyPart === '')}>
                    Todos
                </button>
                {BODY_PARTS.map((bp) => (
                    <button
                        key={bp}
                        onClick={() => setBodyPart(bp === bodyPart ? '' : bp)}
                        style={chipStyle(bodyPart === bp)}
                    >
                        {BODY_PART_ES[bp] || bp}
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', maxHeight: '280px', overflowY: 'auto' }}>
                {!hasFilter && (
                    <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Escribe un nombre o elige un grupo muscular para ver ejercicios.
                    </p>
                )}
                {hasFilter && results.length === 0 && (
                    <p style={{ margin: '0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        No se encontró ningún ejercicio con ese criterio.
                    </p>
                )}
                {visibleResults.map((ex) => {
                    const already = existingSet.has(normalize(ex.name));
                    return (
                        <button
                            key={ex.id}
                            onClick={() => !already && handlePick(ex)}
                            disabled={already}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                textAlign: 'left',
                                width: '100%',
                                padding: '0.6rem 0.75rem',
                                borderRadius: '10px',
                                background: already ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                                border: '1px solid rgba(255,255,255,0.06)',
                                color: already ? 'var(--text-muted)' : 'white',
                                cursor: already ? 'default' : 'pointer',
                                opacity: already ? 0.5 : 1,
                            }}
                        >
                            <span style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: '700', fontSize: '0.95rem', textTransform: 'capitalize' }}>{ex.name}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {BODY_PART_ES[ex.bodyPart] || ex.bodyPart} · {EQUIPMENT_ES[ex.equipment] || ex.equipment}
                                </span>
                            </span>
                            {already ? (
                                <span style={{ fontSize: '0.7rem', flexShrink: 0, marginLeft: '0.5rem' }}>Ya añadido</span>
                            ) : (
                                <Plus size={16} color="var(--primary)" style={{ flexShrink: 0, marginLeft: '0.5rem' }} />
                            )}
                        </button>
                    );
                })}
                {results.length > RESULTS_LIMIT && (
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                        +{results.length - RESULTS_LIMIT} más — afina tu búsqueda para verlos.
                    </p>
                )}
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                {!showCustom ? (
                    <button
                        onClick={() => setShowCustom(true)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            fontSize: '0.8rem',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                            padding: 0,
                        }}
                    >
                        ¿No lo encuentras? Añadir uno personalizado
                    </button>
                ) : (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input
                            type="text"
                            value={customName}
                            onChange={(e) => setCustomName(e.target.value)}
                            placeholder="Nombre del ejercicio personalizado..."
                            autoFocus
                            style={{
                                flex: 1,
                                border: 'none',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '8px',
                                padding: '0.5rem 0.75rem',
                                color: 'white',
                                outline: 'none',
                            }}
                        />
                        <button
                            onClick={handleAddCustom}
                            style={{
                                background: 'var(--primary)',
                                color: 'var(--bg-app)',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.5rem 1rem',
                                fontWeight: '700',
                                cursor: 'pointer',
                            }}
                        >
                            OK
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
