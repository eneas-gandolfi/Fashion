'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';

interface MediaUploadProps {
    onFilesChange: (files: File[]) => void;
    maxFiles?: number;
    acceptedTypes?: string;
}

export default function MediaUpload({
    onFilesChange,
    maxFiles = 10,
    acceptedTypes = "image/*,video/*"
}: MediaUploadProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFiles = (newFiles: FileList | null) => {
        if (!newFiles) return;

        const fileArray = Array.from(newFiles).slice(0, maxFiles - files.length);
        const updatedFiles = [...files, ...fileArray];
        setFiles(updatedFiles);
        onFilesChange(updatedFiles);

        // Create previews
        fileArray.forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                setPreviews(prev => [...prev, e.target?.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        const newFiles = files.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setFiles(newFiles);
        setPreviews(newPreviews);
        onFilesChange(newFiles);
    };

    const isVideo = (file: File) => file.type.startsWith('video/');

    return (
        <div>
            {/* Upload Area */}
            {files.length < maxFiles && (
                <div
                    className={`upload-area ${isDragging ? 'dragging' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept={acceptedTypes}
                        multiple={maxFiles > 1}
                        onChange={(e) => handleFiles(e.target.files)}
                        style={{ display: 'none' }}
                    />

                    <div style={{ marginBottom: '1rem' }}>
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17,8 12,3 7,8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>

                    <p style={{
                        fontSize: '1rem',
                        fontWeight: '500',
                        color: 'var(--text-primary)',
                        marginBottom: '0.5rem'
                    }}>
                        Arraste arquivos ou clique para selecionar
                    </p>

                    <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        Suporta imagens (JPG, PNG) e vídeos (MP4, MOV)
                    </p>

                    {maxFiles > 1 && (
                        <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            marginTop: '0.5rem'
                        }}>
                            Máximo de {maxFiles} arquivos para carrossel
                        </p>
                    )}
                </div>
            )}

            {/* Previews */}
            {previews.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                    gap: '1rem',
                    marginTop: '1.5rem',
                }}>
                    {previews.map((preview, index) => (
                        <div
                            key={index}
                            style={{
                                position: 'relative',
                                aspectRatio: '1',
                                borderRadius: '0.75rem',
                                overflow: 'hidden',
                                background: 'var(--background)',
                                border: '2px solid var(--border)',
                            }}
                        >
                            {isVideo(files[index]) ? (
                                <video
                                    src={preview}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            ) : (
                                <Image
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    width={200}
                                    height={200}
                                    unoptimized
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                    }}
                                />
                            )}

                            {/* File type badge */}
                            <div style={{
                                position: 'absolute',
                                top: '0.5rem',
                                left: '0.5rem',
                                padding: '0.25rem 0.5rem',
                                background: isVideo(files[index]) ? 'var(--youtube)' : 'var(--primary)',
                                color: 'white',
                                borderRadius: '0.375rem',
                                fontSize: '0.625rem',
                                fontWeight: '600',
                                textTransform: 'uppercase',
                            }}>
                                {isVideo(files[index]) ? 'Vídeo' : 'Imagem'}
                            </div>

                            {/* Remove button */}
                            <button
                                onClick={() => removeFile(index)}
                                style={{
                                    position: 'absolute',
                                    top: '0.5rem',
                                    right: '0.5rem',
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.6)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1rem',
                                    lineHeight: 1,
                                }}
                            >
                                ×
                            </button>

                            {/* Order badge */}
                            {previews.length > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '0.5rem',
                                    right: '0.5rem',
                                    width: '24px',
                                    height: '24px',
                                    background: 'var(--secondary)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                }}>
                                    {index + 1}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* File info */}
            {files.length > 0 && (
                <div style={{
                    marginTop: '1rem',
                    padding: '0.75rem 1rem',
                    background: 'var(--background)',
                    borderRadius: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {files.length} {files.length === 1 ? 'arquivo selecionado' : 'arquivos selecionados'}
                    </span>
                    <button
                        onClick={() => {
                            setFiles([]);
                            setPreviews([]);
                            onFilesChange([]);
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--error)',
                            fontSize: '0.875rem',
                            fontWeight: '500',
                            cursor: 'pointer',
                        }}
                    >
                        Limpar tudo
                    </button>
                </div>
            )}
        </div>
    );
}
