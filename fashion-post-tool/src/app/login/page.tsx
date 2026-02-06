'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { signIn } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await signIn(email, password);
            router.push('/');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Email ou senha incorretos';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Animated Mesh Gradient Background */}
            <div style={styles.meshGradient} />

            <motion.div
                style={styles.loginBox}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
            >
                {/* Logo */}
                <motion.div
                    style={styles.logoContainer}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <Image
                        src="/logo.png"
                        alt="Fashion Center"
                        width={140}
                        height={140}
                        style={{ objectFit: 'contain', background: 'transparent' }}
                        priority
                    />
                    <motion.p
                        style={styles.subtitle}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                    >
                        Gestão de Posts
                    </motion.p>
                </motion.div>

                {/* Form */}
                <motion.form
                    onSubmit={handleSubmit}
                    style={styles.form}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                >
                    <motion.div
                        style={styles.inputGroup}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6, duration: 0.4 }}
                    >
                        <label style={styles.label}>Email</label>
                        <motion.input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            style={styles.input}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#A36353';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(163, 99, 83, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#E8DDD8';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                            whileFocus={{ scale: 1.01 }}
                            required
                        />
                    </motion.div>

                    <motion.div
                        style={styles.inputGroup}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.7, duration: 0.4 }}
                    >
                        <label style={styles.label}>Senha</label>
                        <motion.input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            style={styles.input}
                            onFocus={(e) => {
                                e.target.style.borderColor = '#A36353';
                                e.target.style.transform = 'translateY(-2px)';
                                e.target.style.boxShadow = '0 4px 12px rgba(163, 99, 83, 0.15)';
                            }}
                            onBlur={(e) => {
                                e.target.style.borderColor = '#E8DDD8';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = 'none';
                            }}
                            whileFocus={{ scale: 1.01 }}
                            required
                            minLength={6}
                        />
                    </motion.div>

                    {error && (
                        <motion.div
                            style={styles.error}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        type="submit"
                        disabled={loading}
                        style={{
                            ...styles.button,
                            opacity: loading ? 0.7 : 1,
                        }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 0.4 }}
                        whileHover={!loading ? {
                            y: -2,
                            boxShadow: '0 8px 16px -4px rgba(61, 38, 28, 0.3)'
                        } : {}}
                        whileTap={!loading ? { scale: 0.98 } : {}}
                        onMouseEnter={(e) => {
                            if (!loading) {
                                e.currentTarget.style.background = '#8F5545';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#A36353';
                        }}
                    >
                        {loading ? (
                            <div style={styles.loadingContainer}>
                                <motion.div
                                    style={styles.spinner}
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                />
                                Entrando...
                            </div>
                        ) : (
                            'Entrar'
                        )}
                    </motion.button>

                    {/* Forgot Password Link */}
                    <motion.div
                        style={styles.forgotPasswordContainer}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.4 }}
                    >
                        <a
                            href="#"
                            style={styles.forgotPasswordLink}
                            onClick={(e) => e.preventDefault()}
                            onMouseEnter={(e) => e.currentTarget.style.color = '#8F5545'}
                            onMouseLeave={(e) => e.currentTarget.style.color = '#A36353'}
                        >
                            Esqueci minha senha
                        </a>
                    </motion.div>
                </motion.form>
            </motion.div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative' as const,
        overflow: 'hidden',
        padding: '1rem',
    },
    meshGradient: {
        position: 'absolute' as const,
        inset: 0,
        background: 'radial-gradient(circle at 20% 50%, #C89B88 0%, transparent 50%), radial-gradient(circle at 80% 80%, #A36353 0%, transparent 50%), radial-gradient(circle at 40% 20%, #D4A894 0%, transparent 50%), linear-gradient(135deg, #B88A77 0%, #9A6B5A 100%)',
        animation: 'meshMove 20s ease-in-out infinite',
    },
    loginBox: {
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderRadius: '24px',
        padding: '3rem',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 25px 50px -12px rgba(61, 38, 28, 0.3)',
        position: 'relative' as const,
        zIndex: 1,
        border: '1px solid rgba(255, 255, 255, 0.3)',
    },
    logoContainer: {
        textAlign: 'center' as const,
        marginBottom: '2rem',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '0.5rem',
    },
    subtitle: {
        fontSize: '1rem',
        fontWeight: '600',
        color: '#3D261C',
        margin: 0,
        letterSpacing: '0.02em',
    },
    form: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '1.25rem',
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '0.5rem',
    },
    label: {
        fontSize: '0.875rem',
        fontWeight: '600',
        color: '#3D261C',
        letterSpacing: '0.01em',
    },
    input: {
        padding: '0.875rem 1rem',
        fontSize: '1rem',
        border: '1px solid #E8DDD8',
        borderRadius: '12px',
        outline: 'none',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        color: '#3D261C',
        background: '#FAFAFA',
    },
    button: {
        padding: '1rem',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#ffffff',
        background: '#A36353',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        marginTop: '0.5rem',
        boxShadow: '0 6px 12px -2px rgba(61, 38, 28, 0.25)',
    },
    error: {
        padding: '0.75rem 1rem',
        background: 'rgba(199, 90, 90, 0.1)',
        border: '1px solid var(--error)',
        borderRadius: '8px',
        color: 'var(--error)',
        fontSize: '0.875rem',
    },
    forgotPasswordContainer: {
        textAlign: 'center' as const,
        marginTop: '0.5rem',
    },
    forgotPasswordLink: {
        fontSize: '0.875rem',
        color: '#A36353',
        textDecoration: 'none',
        fontWeight: '500',
        transition: 'color 0.2s ease',
    },
    loadingContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
    },
    spinner: {
        width: '16px',
        height: '16px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        borderTopColor: '#ffffff',
        borderRadius: '50%',
    },
};
