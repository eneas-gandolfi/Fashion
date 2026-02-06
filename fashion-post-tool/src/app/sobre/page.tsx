'use client';

import { useState, useRef } from 'react';
import {
    motion,
    useScroll,
    useTransform,
    useSpring,
    useMotionValue,
    useMotionTemplate,
    AnimatePresence,
    Variants
} from 'framer-motion';
import {
    ChevronDown,
    Zap,
    BarChart3,
    Sparkles,
    Target,
    BrainCircuit,
    Cpu,
    TrendingUp,
    Search,
    Layers,
    Share2,
    CheckCircle2,
    XCircle
} from 'lucide-react';

// --- VISUAL COMPONENTS (Localized & Light Theme) ---

// 1. Tilt Card Component
const TiltCard = ({ children, className = '', noTilt = false }: { children: React.ReactNode, className?: string, noTilt?: boolean }) => {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const xSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const ySpring = useSpring(y, { stiffness: 300, damping: 30 });

    const transform = useMotionTemplate`perspective(1000px) rotateX(${xSpring}deg) rotateY(${ySpring}deg)`;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current || noTilt) return;

        const rect = ref.current.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;

        x.set(yPct * -10);
        y.set(xPct * 10);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{
                transform: noTilt ? 'none' : transform,
                transformStyle: 'preserve-3d',
            }}
            className={className}
        >
            {children}
        </motion.div>
    );
};

// 2. Typing Text Effect
const TypingText = ({ text, className = '' }: { text: string, className?: string }) => {
    const words = text.split(" ");
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({ opacity: 1, transition: { staggerChildren: 0.03, delayChildren: 0.04 * i } }),
    };
    const child: Variants = {
        visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 12, stiffness: 100 } },
        hidden: { opacity: 0, y: 20, transition: { type: "spring", damping: 12, stiffness: 100 } },
    };
    return (
        <motion.div className={className} style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }} variants={container} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            {words.map((word, index) => (
                <div key={index} style={{ display: 'flex', marginLeft: index === 0 ? 0 : '0.3em' }}>
                    {Array.from(word).map((letter, i) => (
                        <motion.span key={i} variants={child}>{letter}</motion.span>
                    ))}
                </div>
            ))}
        </motion.div>
    );
};

// 3. Trend Radar Visual - Editorial radar + cloth swatches
const TrendGrowthVisual = () => {
    const chips = [
        { label: 'Cortes retos', color: '#C17D6A' },
        { label: 'Couro macio', color: '#A66355' },
        { label: 'Tons oliva', color: '#8E9B6D' },
        { label: 'Alfaiataria', color: '#6E5A52' },
    ];

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(135deg, #fffaf7 0%, #fff1ea 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(193,125,106,0.15) 1px, transparent 0)', backgroundSize: '28px 28px', opacity: 0.35 }} />

            <div style={{ position: 'relative', width: '230px', height: '230px' }}>
                {/* Orbit lines */}
                {[0, 1, 2].map(i => (
                    <div
                        key={`ring-${i}`}
                        style={{
                            position: 'absolute',
                            inset: `${i * 28}px`,
                            borderRadius: '50%',
                            border: `1.5px solid rgba(193, 125, 106, ${0.25 + i * 0.1})`,
                        }}
                    />
                ))}

                {/* Rotating needle */}
                <motion.div
                    style={{
                        position: 'absolute',
                        inset: '0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                >
                    <div style={{ width: '2px', height: '110px', background: 'linear-gradient(180deg, rgba(193,125,106,0), rgba(193,125,106,0.8))' }} />
                </motion.div>

                {/* Center mark */}
                <motion.div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '66px',
                        height: '66px',
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '50%',
                        background: 'linear-gradient(140deg, var(--primary) 0%, #E1B088 100%)',
                        boxShadow: '0 12px 30px rgba(193, 125, 106, 0.35)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.8, repeat: Infinity }}
                >
                    <TrendingUp size={22} style={{ color: 'white' }} />
                </motion.div>

                {/* Cloth chips */}
                {chips.map((chip, index) => (
                    <motion.div
                        key={chip.label}
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: `rotate(${index * 75}deg) translateX(85px) rotate(-${index * 75}deg)`,
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                    >
                        <div style={{
                            background: 'white',
                            borderRadius: '14px',
                            padding: '6px 10px',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            boxShadow: '0 10px 20px rgba(0,0,0,0.08)',
                            border: '1px solid rgba(0,0,0,0.06)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            whiteSpace: 'nowrap',
                        }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: chip.color, boxShadow: `0 0 0 3px ${chip.color}22` }} />
                            {chip.label}
                        </div>
                    </motion.div>
                ))}

                {/* Spark dots */}
                {[{ x: 25, y: 40 }, { x: 160, y: 30 }, { x: 175, y: 160 }, { x: 40, y: 170 }].map((dot, i) => (
                    <motion.div
                        key={`dot-${i}`}
                        style={{
                            position: 'absolute',
                            left: dot.x,
                            top: dot.y,
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: 'rgba(193, 125, 106, 0.8)',
                            boxShadow: '0 0 0 6px rgba(193, 125, 106, 0.15)',
                        }}
                        animate={{ scale: [0.9, 1.2, 0.9] }}
                        transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                    />
                ))}
            </div>

            {/* Badge */}
            <motion.div
                style={{
                    position: 'absolute',
                    bottom: '20px',
                    right: '20px',
                    padding: '8px 16px',
                    background: 'var(--primary)',
                    color: 'white',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '700',
                    boxShadow: '0 8px 20px rgba(193, 125, 106, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                <Zap size={14} fill="currentColor" /> 4 Detectadas
            </motion.div>
        </div>
    );
};

const ContentGeneratorVisual = () => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
                width: '180px', height: '260px', background: 'white',
                borderRadius: '20px', boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
                border: '1px solid #f3f4f6', overflow: 'hidden', display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ height: '30px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', padding: '0 10px', gap: '6px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f3f4f6' }} />
                    <div style={{ width: '60px', height: '4px', borderRadius: '3px', background: '#f3f4f6' }} />
                </div>
                <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <motion.div
                        style={{ width: '100%', height: '100px', borderRadius: '8px', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        animate={{ background: ['#f9fafb', '#fff0ea', '#f9fafb'] }}
                        transition={{ duration: 3, repeat: Infinity }}
                    >
                        <Sparkles size={18} style={{ color: 'var(--primary)', opacity: 0.5 }} />
                    </motion.div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <motion.div style={{ height: '6px', width: '90%', background: '#f3f4f6', borderRadius: '4px' }} />
                        <motion.div style={{ height: '6px', width: '60%', background: '#f3f4f6', borderRadius: '4px' }} />
                    </div>
                    <motion.div
                        style={{
                            marginTop: 'auto', width: '100%', height: '28px',
                            background: 'var(--primary)', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: '9px', fontWeight: 'bold', gap: '4px'
                        }}
                        animate={{ scale: [1, 1.02, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        <Zap size={8} fill="currentColor" /> GERAR
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

// 4. Competitor Spy Visual - Shows profile cards being monitored
const CompetitorSpyVisual = () => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            {/* Stacked Profile Cards */}
            <div style={{ position: 'relative', width: '160px', height: '200px' }}>
                {/* Card 3 (back) */}
                <div style={{ position: 'absolute', top: '20px', left: '20px', width: '120px', height: '140px', background: '#f3f4f6', borderRadius: '12px', transform: 'rotate(6deg)' }} />
                {/* Card 2 (middle) */}
                <div style={{ position: 'absolute', top: '10px', left: '10px', width: '120px', height: '140px', background: '#e5e7eb', borderRadius: '12px', transform: 'rotate(3deg)' }} />
                {/* Card 1 (front) */}
                <motion.div
                    style={{ position: 'absolute', top: 0, left: 0, width: '120px', height: '140px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f9fafb', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Target size={20} style={{ color: 'var(--primary)' }} />
                    </div>
                    <div style={{ width: '80%', height: '6px', background: '#f3f4f6', borderRadius: '3px', marginBottom: '6px' }} />
                    <div style={{ width: '60%', height: '4px', background: '#f9fafb', borderRadius: '2px', marginBottom: '12px' }} />
                    <div style={{ display: 'flex', gap: '8px', width: '100%', justifyContent: 'center' }}>
                        <div style={{ padding: '4px 8px', background: 'var(--primary-light)', borderRadius: '6px', fontSize: '8px', color: 'var(--primary)', fontWeight: '600' }}>12k seg</div>
                        <div style={{ padding: '4px 8px', background: '#f3f4f6', borderRadius: '6px', fontSize: '8px', color: 'var(--text-muted)', fontWeight: '600' }}>5 posts</div>
                    </div>
                </motion.div>
                {/* Scanning indicator */}
                <motion.div
                    style={{ position: 'absolute', top: '-10px', right: '-10px', width: '24px', height: '24px', background: 'var(--success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    <Search size={12} style={{ color: 'white' }} />
                </motion.div>
            </div>
        </div>
    );
};

// 5. Inspiration Board Visual - Collage with fabric swatches
const InspirationBoardVisual = () => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', background: 'linear-gradient(145deg, #ffffff 0%, #fff7f2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ position: 'relative', width: '220px', height: '200px' }}>
                {/* Base sheet */}
                <div style={{ position: 'absolute', inset: 0, borderRadius: '20px', background: 'white', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 18px 40px rgba(0,0,0,0.08)' }} />

                {/* Collage cards */}
                <motion.div
                    style={{ position: 'absolute', top: '20px', left: '18px', width: '90px', height: '120px', borderRadius: '16px', background: 'linear-gradient(150deg, #F3E5DC, #EFD2C4)', boxShadow: '0 10px 24px rgba(193,125,106,0.2)' }}
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                    style={{ position: 'absolute', top: '18px', right: '20px', width: '90px', height: '60px', borderRadius: '14px', background: '#F9FAFB', border: '1px dashed rgba(193,125,106,0.3)' }}
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2.6, repeat: Infinity }}
                />
                <motion.div
                    style={{ position: 'absolute', bottom: '20px', right: '18px', width: '120px', height: '70px', borderRadius: '16px', background: 'linear-gradient(150deg, #E9EEF7, #F5F7FB)', border: '1px solid rgba(90,138,199,0.2)' }}
                    animate={{ y: [0, 5, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity }}
                />
                <motion.div
                    style={{ position: 'absolute', bottom: '26px', left: '26px', width: '70px', height: '48px', borderRadius: '14px', background: '#FFF2E7', border: '1px solid rgba(212,160,74,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    animate={{ scale: [0.98, 1.02, 0.98] }}
                    transition={{ duration: 2.2, repeat: Infinity }}
                >
                    <Sparkles size={14} style={{ color: 'var(--warning)' }} />
                </motion.div>

                {/* Tape details */}
                <div style={{ position: 'absolute', top: '10px', left: '60px', width: '32px', height: '10px', borderRadius: '6px', background: 'rgba(193,125,106,0.25)', transform: 'rotate(-8deg)' }} />
                <div style={{ position: 'absolute', top: '76px', right: '12px', width: '30px', height: '10px', borderRadius: '6px', background: 'rgba(90,138,199,0.25)', transform: 'rotate(12deg)' }} />
            </div>

            {/* Collection badge */}
            <motion.div
                style={{ position: 'absolute', bottom: '15px', right: '15px', padding: '6px 12px', background: 'var(--warning)', borderRadius: '20px', fontSize: '9px', color: 'white', fontWeight: '700', boxShadow: '0 4px 12px rgba(212, 160, 74, 0.4)' }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
            >
                +142 ideias
            </motion.div>
        </div>
    );
};

// --- CONTENT DATA ---

const METRICS = [
    { value: '+10k', label: 'Tendências Rastreadas', sub: 'Diariamente em tempo real' },
    { value: '85%', label: 'Economia de Tempo', sub: 'Na criação de conteúdo' },
    { value: '24/7', label: 'Monitoramento', sub: 'Análise ininterrupta' },
];

const FEATURES = [
    {
        title: 'Radar de Tendências',
        description: 'Identifique o que vai viralizar antes da concorrência.',
        visual: <TrendGrowthVisual />,
        colSpan: 2
    },
    {
        title: 'Espião de Concorrência',
        description: 'Monitore estratégias de grandes players.',
        visual: <CompetitorSpyVisual />,
        colSpan: 1
    },
    {
        title: 'Gerador de Legendas Neural',
        description: 'Copywriting que entende psicologia de consumo.',
        visual: <ContentGeneratorVisual />,
        colSpan: 1
    },
    {
        title: 'Banco de Inspirações',
        description: 'Curadoria automática de referências globais.',
        visual: <InspirationBoardVisual />,
        colSpan: 2
    },
];

const FAQ_DATA = [
    {
        id: '1',
        cat: 'Estratégia',
        q: 'O que define a Plataforma?',
        a: 'Somos um ecossistema de inteligência competitiva. Centralizamos o monitoramento de mercado e a automação de conteúdo para empoderar decisores com dados precisos, eliminando o "achismo" da equação.'
    },
    {
        id: '2',
        cat: 'Inteligência',
        q: 'Qual a profundidade da análise de IA?',
        a: 'Nossa IA neural não apenas "vê" imagens. Ela decodifica semântica visual (estilo, ocasião, tendências micro) e correlaciona com dados de engajamento do mercado para sugerir narrativas de alta conversão.'
    },
    {
        id: '3',
        cat: 'Dados',
        q: 'O quão atualizados são os insights?',
        a: 'Em tempo real. Nossos crawlers operam 24/7 varrendo milhares de pontos de dados de competidores e influenciadores globais para garantir que você capture a tendência no momento de sua gênese.'
    },
];

const WORKFLOW = [
    { title: '1. Rastrear', desc: 'Monitoramento Global', icon: Search },
    { title: '2. Analisar', desc: 'Filtro de Relevância', icon: BrainCircuit },
    { title: '3. Gerar', desc: 'Criação Automática', icon: Zap },
    { title: '4. Publicar', desc: 'Gestão Inteligente', icon: Share2 },
];

export default function AboutPage() {
    const [openQuestionId, setOpenQuestionId] = useState<string | null>(null);

    const { scrollYProgress } = useScroll();
    const yHero = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
    const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

    return (
        <div style={{ minHeight: '100vh', background: 'var(--background)', overflow: 'hidden' }}>

            {/* Global Styles for Bento Grid & Layout */}
            <style jsx global>{`
                .bento-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media (min-width: 768px) {
                    .bento-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                    .col-span-2 { grid-column: span 2; }
                    .col-span-1 { grid-column: span 1; }
                }
                .mesh-bg {
                    background: radial-gradient(at 0% 0%, rgba(193, 125, 106, 0.15) 0px, transparent 50%),
                                radial-gradient(at 100% 0%, rgba(212, 160, 74, 0.15) 0px, transparent 50%),
                                radial-gradient(at 100% 100%, rgba(71, 167, 106, 0.15) 0px, transparent 50%);
                    filter: blur(40px);
                }
            `}</style>

            {/* 1. HERO SECTION V2 */}
            <section style={{ position: 'relative', paddingTop: '8rem', paddingBottom: '6rem', overflow: 'hidden' }}>
                <div className="mesh-bg" style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

                <motion.div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem', position: 'relative', zIndex: 1, textAlign: 'center', y: yHero, opacity: opacityHero }}>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            padding: '6px 16px', background: 'rgba(255,255,255,0.7)',
                            borderRadius: '100px', marginBottom: '2rem',
                            border: '1px solid rgba(0,0,0,0.05)', backdropFilter: 'blur(10px)',
                            color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.05em'
                        }}
                    >
                        <Sparkles size={14} /> NOVA VERSÃO 2.0
                    </motion.div>

                    <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: '800', lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                        Sistema Operacional do <br />
                        <span style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(90deg, var(--primary) 0%, #D4A04A 100%)' }}>
                            Marketing de Moda
                        </span>
                    </h1>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}
                    >
                        Deixe a intuição para a criação. Deixe os dados para a estratégia.
                        A única plataforma que une <strong>Big Data</strong> e <strong>Inteligência Artificial</strong>.
                    </motion.p>
                </motion.div>
            </section>

            {/* 2. METRICS BAR */}
            <section style={{ borderTop: '1px solid rgba(0,0,0,0.05)', borderBottom: '1px solid rgba(0,0,0,0.05)', background: 'white' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '3rem 1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                    {METRICS.map((m, i) => (
                        <div key={i} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{m.value}</div>
                            <div style={{ fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{m.label}</div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{m.sub}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 3. PROBLEM VS SOLUTION */}
            <section style={{ padding: '6rem 1.5rem', background: '#f9fafb' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem' }}>Evolua seu Processo</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>O marketing manual não escala. Veja a diferença.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', alignItems: 'stretch' }}>
                        {/* Old Way */}
                        <div style={{ padding: '2rem', background: 'white', borderRadius: '24px', opacity: 0.7, border: '1px solid transparent' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: '#ef4444' }}>
                                <XCircle size={24} />
                                <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>O Jeito Antigo</h3>
                            </div>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)' }}>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Planilhas manuais infinitas</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> "Prints" soltos no WhatsApp</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-400" /> Bloqueio criativo constante</li>
                            </ul>
                        </div>

                        {/* New Way */}
                        <div style={{ padding: '2.5rem', background: 'white', borderRadius: '24px', border: '1px solid var(--primary)', boxShadow: '0 20px 40px rgba(193, 125, 106, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.5rem', color: 'var(--success)' }}>
                                <CheckCircle2 size={24} />
                                <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Com a Plataforma</h3>
                            </div>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-primary)', fontWeight: '500' }}>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Insights automáticos e precisos</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Centralização total de dados</li>
                                <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /> Geração contínua (24/7)</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* 4. WORKFLOW STEPS */}
            <section style={{ padding: '6rem 1.5rem', background: 'white' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem' }}>
                        {WORKFLOW.map((step, i) => (
                            <div key={i} style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--primary)' }}>
                                    <step.icon size={28} />
                                </div>
                                <h3 style={{ fontWeight: '800', fontSize: '1.1rem', marginBottom: '0.5rem' }}>{step.title}</h3>
                                <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. FEATURES BENTO GRID */}
            <section style={{ padding: '6rem 1.5rem', background: 'var(--surface)' }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
                    <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem' }}>Funcionalidades Principais</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>Tudo o que você precisa para dominar o mercado.</p>
                    </div>

                    <div className="bento-grid">
                        {FEATURES.map((feature, i) => (
                            <TiltCard key={i} className={`col-span-${feature.colSpan}`}>
                                <div style={{ height: '100%', minHeight: '320px', background: 'white', borderRadius: '24px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                                        {feature.visual}
                                    </div>
                                    <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.03)' }}>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.5rem' }}>{feature.title}</h3>
                                        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{feature.description}</p>
                                    </div>
                                </div>
                            </TiltCard>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. FOOTER CTA */}
            <section style={{ padding: '6rem 1.5rem', background: 'linear-gradient(135deg, var(--primary) 0%, #D4A04A 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                {/* Floating particles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        style={{
                            position: 'absolute',
                            width: `${20 + i * 10}px`,
                            height: `${20 + i * 10}px`,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            top: `${10 + i * 15}%`,
                            left: `${5 + i * 15}%`,
                        }}
                        animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
                        transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
                    />
                ))}

                <motion.div
                    style={{ maxWidth: '800px', margin: '0 auto', position: 'relative', zIndex: 1 }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.h2
                        style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: '800', marginBottom: '1.5rem', color: 'white' }}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        Pronto para elevar o nível?
                    </motion.h2>
                    <motion.p
                        style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.9)', marginBottom: '3rem' }}
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                    >
                        Junte-se a decisores que transformaram dados em autoridade de mercado.
                    </motion.p>
                    <motion.a
                        href="/"
                        style={{
                            display: 'inline-flex', alignItems: 'center', gap: '10px',
                            padding: '18px 48px',
                            background: 'white',
                            color: 'var(--primary)',
                            borderRadius: '100px',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            textDecoration: 'none',
                            boxShadow: '0 20px 50px rgba(0,0,0,0.25)'
                        }}
                        whileHover={{ scale: 1.05, boxShadow: '0 25px 60px rgba(0,0,0,0.3)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Sparkles size={20} /> Acessar Dashboard
                    </motion.a>
                </motion.div>
            </section>

            {/* FAQ SECTION (Simplified) */}
            <section style={{ padding: '6rem 1.5rem', background: 'white' }}>
                <div style={{ maxWidth: '900px', margin: '0 auto' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '3rem', textAlign: 'center' }}>Dúvidas Frequentes</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {FAQ_DATA.map((item) => (
                            <div key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => setOpenQuestionId(openQuestionId === item.id ? null : item.id)}
                                    style={{ width: '100%', padding: '1.5rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
                                >
                                    <span style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>{item.q}</span>
                                    <ChevronDown size={20} style={{ transform: openQuestionId === item.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.3s' }} />
                                </button>
                                <AnimatePresence>
                                    {openQuestionId === item.id && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                            <p style={{ paddingBottom: '1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.a}</p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
