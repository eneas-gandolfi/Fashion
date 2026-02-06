'use client';

interface SchedulePickerProps {
    days: string[];
    time: string;
    postNow?: boolean;
    onDaysChange: (days: string[]) => void;
    onTimeChange: (time: string) => void;
    onPostNowChange?: (postNow: boolean) => void;
}

const weekDays = [
    { id: 'domingo', label: 'Dom', short: 'D' },
    { id: 'segunda', label: 'Seg', short: 'S' },
    { id: 'terca', label: 'Ter', short: 'T' },
    { id: 'quarta', label: 'Qua', short: 'Q' },
    { id: 'quinta', label: 'Qui', short: 'Q' },
    { id: 'sexta', label: 'Sex', short: 'S' },
    { id: 'sabado', label: 'Sáb', short: 'S' },
];

const quickSchedules = [
    { label: 'Dias úteis', days: ['segunda', 'terca', 'quarta', 'quinta', 'sexta'], icon: '💼' },
    { label: 'Fins de semana', days: ['sabado', 'domingo'], icon: '🌴' },
    { label: 'Todos os dias', days: weekDays.map(d => d.id), icon: '📅' },
    { label: 'Padrão (Seg, Qua, Sex, Dom)', days: ['segunda', 'quarta', 'sexta', 'domingo'], icon: '⭐' },
];

export default function SchedulePicker({
    days,
    time,
    postNow = false,
    onDaysChange,
    onTimeChange,
    onPostNowChange
}: SchedulePickerProps) {

    const toggleDay = (dayId: string) => {
        if (days.includes(dayId)) {
            onDaysChange(days.filter(d => d !== dayId));
        } else {
            onDaysChange([...days, dayId]);
        }
    };

    const applyQuickSchedule = (scheduleDays: string[]) => {
        onPostNowChange?.(false);
        onDaysChange(scheduleDays);
    };

    const handlePostNow = () => {
        const newValue = !postNow;
        onPostNowChange?.(newValue);
        if (newValue) {
            onDaysChange([]);
        }
    };

    return (
        <div>
            <label style={{ marginBottom: '1rem', display: 'block' }}>
                📅 Agendamento
            </label>

            {/* Post Now Button */}
            <button
                type="button"
                onClick={handlePostNow}
                style={{
                    width: '100%',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    background: postNow
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'var(--background)',
                    border: `2px solid ${postNow ? '#10b981' : 'var(--border)'}`,
                    borderRadius: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    transition: 'all 0.2s ease',
                }}
            >
                <span style={{ fontSize: '1.5rem' }}>⚡</span>
                <div style={{ textAlign: 'left' }}>
                    <span style={{
                        fontSize: '1rem',
                        fontWeight: '600',
                        color: postNow ? 'white' : 'var(--text-primary)',
                        display: 'block',
                    }}>
                        Postar Agora
                    </span>
                    <span style={{
                        fontSize: '0.75rem',
                        color: postNow ? 'rgba(255,255,255,0.8)' : 'var(--text-secondary)',
                    }}>
                        Publicar imediatamente após criar
                    </span>
                </div>
                {postNow && (
                    <span style={{
                        marginLeft: 'auto',
                        background: 'white',
                        color: '#10b981',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                    }}>
                        ✓ Selecionado
                    </span>
                )}
            </button>

            {/* Scheduling options - only show if not posting now */}
            {!postNow && (
                <>
                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        marginBottom: '1.5rem',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            ou agende para depois
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                    </div>

                    {/* Quick options */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: '600',
                        }}>
                            Opções rápidas
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '0.5rem',
                        }}>
                            {quickSchedules.map((schedule) => {
                                const isActive = JSON.stringify(days.sort()) === JSON.stringify(schedule.days.sort());
                                return (
                                    <button
                                        key={schedule.label}
                                        type="button"
                                        onClick={() => applyQuickSchedule(schedule.days)}
                                        style={{
                                            padding: '0.75rem',
                                            background: isActive ? 'var(--primary-light)' : 'var(--background)',
                                            border: `2px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                                            borderRadius: '0.75rem',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        <span style={{ fontSize: '1rem', marginRight: '0.5rem' }}>
                                            {schedule.icon}
                                        </span>
                                        <span style={{
                                            fontSize: '0.8rem',
                                            fontWeight: isActive ? '600' : '500',
                                            color: isActive ? 'var(--primary)' : 'var(--text-primary)',
                                        }}>
                                            {schedule.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Days selector */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: '600',
                        }}>
                            Ou selecione manualmente
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {weekDays.map((day) => {
                                const isSelected = days.includes(day.id);
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleDay(day.id)}
                                        title={day.label}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '50%',
                                            border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border)'}`,
                                            background: isSelected ? 'var(--primary)' : 'var(--card)',
                                            color: isSelected ? 'white' : 'var(--text-secondary)',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        {day.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time selector */}
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginBottom: '0.75rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontWeight: '600',
                        }}>
                            Horário da postagem
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <input
                                type="time"
                                value={time}
                                onChange={(e) => onTimeChange(e.target.value)}
                                style={{
                                    width: '140px',
                                    padding: '0.75rem 1rem',
                                    fontSize: '1.25rem',
                                    fontWeight: '600',
                                    textAlign: 'center',
                                }}
                            />
                            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                                {['09:00', '12:00', '15:00', '18:30', '21:00'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => onTimeChange(t)}
                                        style={{
                                            padding: '0.5rem 0.75rem',
                                            background: time === t ? 'var(--primary)' : 'var(--background)',
                                            color: time === t ? 'white' : 'var(--text-secondary)',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            fontSize: '0.75rem',
                                            fontWeight: '500',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                        }}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Summary for scheduled posts */}
                    {days.length > 0 && (
                        <div style={{
                            marginTop: '1.5rem',
                            padding: '1rem',
                            background: 'var(--primary-light)',
                            borderRadius: '0.75rem',
                            border: '1px solid var(--primary)',
                        }}>
                            <p style={{
                                fontSize: '0.8rem',
                                color: 'var(--primary-dark)',
                                fontWeight: '500',
                            }}>
                                📣 Será publicado:
                            </p>
                            <p style={{
                                fontSize: '0.95rem',
                                fontWeight: '600',
                                color: 'var(--text-primary)',
                                marginTop: '0.25rem',
                            }}>
                                {weekDays
                                    .filter(d => days.includes(d.id))
                                    .map(d => d.label)
                                    .join(', ')} às {time}
                            </p>
                        </div>
                    )}
                </>
            )}

            {/* Summary for post now */}
            {postNow && (
                <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.1))',
                    borderRadius: '0.75rem',
                    border: '1px solid #10b981',
                }}>
                    <p style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        ⚡ Será publicado imediatamente após criar o post
                    </p>
                </div>
            )}
        </div>
    );
}
