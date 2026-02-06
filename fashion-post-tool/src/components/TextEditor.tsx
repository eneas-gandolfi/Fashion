'use client';

import { useState, useEffect, useRef } from 'react';
import { Copy, Trash2 } from 'lucide-react';
import { PLATFORM_ICONS } from './PlatformIcons';

interface TextEditorProps {
    values: {
        instagram: string;
        facebook: string;
        youtube: string;
        x: string;
        tiktok: string;
    };
    onChange: (values: TextEditorProps['values']) => void;
    selectedPlatforms: string[];
}

const tabs = [
    {
        id: 'instagram',
        label: 'Instagram',
        platformName: 'Instagram',
        maxChars: 2200,
        icon: PLATFORM_ICONS.instagram,
        hint: 'Legenda do Instagram. Máximo 2200 caracteres.',
        placeholder: 'Escreva uma legenda envolvente para o Instagram...\n\nUse emojis 📸✨ e hashtags #fashion #trends'
    },
    {
        id: 'facebook',
        label: 'Facebook',
        platformName: 'Facebook',
        maxChars: 2200,
        icon: PLATFORM_ICONS.facebook,
        hint: 'Texto do Facebook. Envolva sua comunidade.',
        placeholder: 'No que você está pensando? Crie um post para o Facebook...'
    },
    {
        id: 'youtube',
        label: 'YouTube',
        platformName: 'YouTube',
        maxChars: 5000,
        icon: PLATFORM_ICONS.youtube,
        hint: 'Título e descrição do vídeo.',
        placeholder: 'Título do Vídeo\n\n----------------\n\nDescrição detalhada, capítulos e links importantes...'
    },
    {
        id: 'x',
        label: 'X (Twitter)',
        platformName: 'X',
        maxChars: 280,
        icon: PLATFORM_ICONS.x,
        hint: 'Texto curto e direto. Máximo 280 caracteres.',
        placeholder: 'O que está acontecendo? (Max 280 chars)'
    },
    {
        id: 'tiktok',
        label: 'TikTok',
        platformName: 'TikTok',
        maxChars: 2200,
        icon: PLATFORM_ICONS.tiktok,
        hint: 'Legenda do TikTok com hashtags virais.',
        placeholder: 'Descreva seu vídeo do TikTok...\n\n#fyp #viral #fashion'
    },
];

export default function TextEditor({ values, onChange, selectedPlatforms }: TextEditorProps) {
    const [activeTab, setActiveTab] = useState('instagram');
    const prevPlatformsRef = useRef<string[]>([]);

    // Auto-switch tab when a NEW platform is selected
    useEffect(() => {
        const prevPlatforms = prevPlatformsRef.current;
        const newPlatform = selectedPlatforms.find(p => !prevPlatforms.includes(p));

        if (newPlatform && tabs.some(t => t.id === newPlatform)) {
            setActiveTab(newPlatform);
        }

        prevPlatformsRef.current = selectedPlatforms;
    }, [selectedPlatforms]);

    const handleChange = (id: string, value: string) => {
        onChange({
            ...values,
            [id]: value,
        });
    };

    const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];
    const currentValue = values[activeTab as keyof typeof values];
    const charCount = currentValue.length;
    const isOverLimit = charCount > activeTabData.maxChars;

    const clearCurrent = () => handleChange(activeTab, '');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Platform Tabs */}
            <div
                className="tabs"
                style={{
                    borderBottom: '1px solid var(--border)',
                    paddingBottom: 0,
                    marginBottom: 0,
                    flexWrap: 'wrap',
                    rowGap: '0.5rem',
                    maxWidth: '100%',
                }}
            >
                {tabs.map((tab) => {
                    const value = values[tab.id as keyof typeof values];
                    const hasContent = value.length > 0;
                    const isSelectedPlatform = selectedPlatforms.includes(tab.id);
                    const isActive = activeTab === tab.id;

                    // Only show tab if it's selected OR contains text
                    // This fixes the "User perceives prioritization" issue by removing noise
                    if (!isSelectedPlatform && !hasContent) return null;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            className={`tab ${isActive ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                flexShrink: 0
                            }}
                        >
                            <span>{tab.icon}</span>
                            <span className="hidden sm:inline">
                                {tab.label}
                            </span>

                            {hasContent && (
                                <span style={{
                                    width: '6px', height: '6px',
                                    background: 'var(--success)', borderRadius: '50%'
                                }} />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Empty State when no platform selected */}
            {!selectedPlatforms.some(p => values[p as keyof typeof values]?.length > 0) && selectedPlatforms.length === 0 && (
                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', background: 'var(--background)', border: '1px dashed var(--border)', borderRadius: '12px' }}>
                    <p style={{ marginBottom: '0.5rem' }}>👋</p>
                    <p>Selecione uma plataforma acima para começar a escrever.</p>
                </div>
            )}

            {/* Editor Area - Only show if we have an active visible tab */}
            {(selectedPlatforms.length > 0 || Object.values(values).some(v => v.length > 0)) && (
                <div style={{
                    position: 'relative',
                    background: 'var(--background)',
                    borderRadius: '0 0 12px 12px', // Rounded bottom
                    border: '1px solid var(--border)',
                    borderTop: 'none', // Merge with tabs
                    padding: '1rem'
                }}>

                    {/* Visual Hint for Active Platform */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {activeTabData.icon} Editando para {activeTabData.platformName}
                        </span>
                        <span style={{
                            fontSize: '0.75rem',
                            color: isOverLimit ? 'var(--error)' : 'var(--text-secondary)',
                            fontWeight: isOverLimit ? '700' : '400'
                        }}>
                            {charCount} / {activeTabData.maxChars}
                        </span>
                    </div>

                    <textarea
                        value={currentValue}
                        onChange={(e) => handleChange(activeTab, e.target.value)}
                        placeholder={activeTabData.placeholder}
                        style={{
                            width: '100%',
                            minHeight: '200px',
                            padding: '1rem',
                            borderRadius: '0.5rem',
                            border: isOverLimit ? '1.5px solid var(--error)' : '1px solid var(--border)',
                            background: 'var(--surface)',
                            fontSize: '0.9375rem',
                            lineHeight: '1.6',
                            resize: 'vertical',
                            outline: 'none',
                            transition: 'border-color 0.2s'
                        }}
                        onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                        onBlur={(e) => e.target.style.borderColor = isOverLimit ? 'var(--error)' : 'var(--border)'}
                    />

                    {/* Toolbar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                onClick={() => {
                                    // Smart Sync: Copies current text to ALL other selected platforms
                                    const currentText = values[activeTab as keyof typeof values];
                                    if (!currentText) return;

                                    const newValues = { ...values };
                                    selectedPlatforms.forEach(platformId => {
                                        if (platformId === activeTab) return; // Skip self

                                        // Handle specific limits
                                        if (platformId === 'x') {
                                            newValues.x = currentText.slice(0, 280);
                                        } else {
                                            newValues[platformId as keyof typeof values] = currentText;
                                        }
                                    });
                                    onChange(newValues);
                                }}
                                className="btn btn-ghost"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                                title="Replicar texto atual para todas as abas selecionadas"
                            >
                                <Copy size={14} /> Replicar para todas
                            </button>
                        </div>
                        <div>
                            <button
                                type="button"
                                onClick={clearCurrent}
                                className="btn btn-ghost"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: 'var(--error)' }}
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Content Status - Redesigned */}
            <div style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                marginTop: '0.5rem'
            }}>
                <div style={{
                    whiteSpace: 'nowrap', fontSize: '0.75rem', fontWeight: '700',
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                    Status dos Textos
                </div>

                <div style={{ height: '24px', width: '1px', background: 'var(--border)' }} />

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
                    {tabs.map(tab => {
                        const value = values[tab.id as keyof typeof values];
                        const hasContent = value.length > 0;
                        const isOver = value.length > tab.maxChars;
                        const isSelected = selectedPlatforms.includes(tab.id);

                        // Only show status for selected platforms or if they have content
                        if (!isSelected && !hasContent) return null;

                        return (
                            <div key={tab.id} style={{
                                display: 'flex', alignItems: 'center', gap: '4px',
                                fontSize: '0.75rem',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                background: hasContent ? (isOver ? 'var(--error-light)' : 'var(--success-light)') : 'var(--background)',
                                color: hasContent ? (isOver ? 'var(--error)' : 'var(--success)') : 'var(--text-muted)',
                                border: '1px solid',
                                borderColor: hasContent ? (isOver ? 'var(--error)' : 'var(--success)') : 'var(--border)',
                            }}>
                                <span style={{ fontSize: '0.85rem' }}>
                                    {hasContent ? (isOver ? '⚠️' : '✓') : '○'}
                                </span>
                                <span style={{ fontWeight: '600' }}>{tab.platformName}</span>
                            </div>
                        );
                    })}

                    {/* Empty state specifically for status bar */}
                    {!selectedPlatforms.some(p => values[p as keyof typeof values]?.length > 0) && selectedPlatforms.length === 0 && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Selecione uma plataforma...
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
