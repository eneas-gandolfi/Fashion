'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Sparkles,
  Zap,
  Share2,
  Calculator,
  ArrowRight,
  Lightbulb,
  CheckCircle2,
  Flame,
  ArrowUpRight,
  Calendar,
  BarChart3,
  ChevronDown
} from 'lucide-react';
import { motion, useScroll, useTransform, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';

// --- VISUAL COMPONENTS (From About Page) ---

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

// --- CONTENT COMPONENTS ---

const DidacticStep = ({
  number,
  icon,
  title,
  action,
  tip,
  link,
  linkText,
  delay = 0
}: {
  number: string,
  icon: React.ReactNode,
  title: string,
  action: string,
  tip: string,
  link: string,
  linkText: string,
  delay?: number
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ delay, duration: 0.5 }}
    style={{
      background: 'white',
      borderRadius: '0px',
      border: '1px solid rgba(0,0,0,0.04)',
      boxShadow: '0 20px 40px rgba(0,0,0,0.02), 0 0 0 1px rgba(0,0,0,0.02)',
      padding: '2.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '1.5rem',
      height: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    {/* Decorative Background */}
    <div style={{
      position: 'absolute',
      top: '-50px',
      right: '-50px',
      width: '150px',
      height: '150px',
      background: 'radial-gradient(circle, rgba(193,125,106,0.08) 0%, transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none'
    }} />

    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative', zIndex: 1 }}>
      <div style={{
        width: '56px', height: '56px', borderRadius: '16px',
        background: 'linear-gradient(135deg, var(--surface) 0%, white 100%)',
        color: 'var(--primary)',
        border: '1px solid rgba(0,0,0,0.05)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 8px 16px rgba(0,0,0,0.03)'
      }}>
        {icon}
      </div>
      <span style={{
        fontSize: '5rem',
        fontWeight: '900',
        color: 'var(--primary)',
        opacity: 0.15,
        lineHeight: 0.8,
        fontFamily: 'var(--font-heading)',
        userSelect: 'none'
      }}>{number}</span>
    </div>

    <div style={{ position: 'relative', zIndex: 1 }}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>{title}</h3>
      <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
        {action}
      </p>

      <div style={{ background: '#FFFCEA', borderRadius: '12px', padding: '1rem', border: '1px solid #FFE58F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
          <Lightbulb size={14} className="text-yellow-600" />
          <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-primary)', textTransform: 'uppercase' }}>Pro Tip</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{tip}"
        </p>
      </div>
    </div>

    <div style={{ marginTop: 'auto', paddingTop: '1.5rem', position: 'relative', zIndex: 1 }}>
      <Link href={link} className="flex items-center gap-2 text-sm font-bold text-[var(--primary)] hover:opacity-80 transition-opacity">
        {linkText} <ArrowRight size={16} />
      </Link>
    </div>
  </motion.div>
);

const SimulatorSection = () => {
  const [followers, setFollowers] = useState(15000);
  const [engagement, setEngagement] = useState(4.5);
  const reach = Math.round(followers * (engagement / 100) * 12.5);
  const conversions = Math.round(reach * 0.025);

  return (
    <div style={{
      background: 'white',
      borderRadius: '0px',
      border: '1px solid rgba(0,0,0,0.05)',
      boxShadow: '0 40px 100px -20px rgba(193, 125, 106, 0.15)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Decorative Top Border */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, var(--primary), #D4A04A)' }} />

      {/* Soft Background Globs */}
      <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(193,125,106,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(212,160,74,0.05) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div style={{ padding: '4rem 2rem 2rem', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '8px 16px', background: 'rgba(193,125,106,0.1)',
            borderRadius: '100px', marginBottom: '1.5rem',
            color: 'var(--primary)', fontWeight: '700', fontSize: '0.8rem', letterSpacing: '0.05em'
          }}>
            <Calculator size={16} /> SIMULADOR DE ROI
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)', lineHeight: 1.1 }}>
            O Poder do Engajamento
          </h2>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
            Veja como pequenos ajustes na qualidade do conteúdo geram resultados exponenciais na sua estratégia.
          </p>
        </div>

        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '3rem', alignItems: 'center' }}>

          {/* Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
            {/* Followers Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <label style={{ fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>SEGUIDORES</label>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>{followers.toLocaleString()}</span>
              </div>
              <input
                type="range" min="1000" max="100000" step="1000"
                value={followers}
                onChange={(e) => setFollowers(Number(e.target.value))}
                className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[var(--primary)] hover:bg-gray-200 transition-colors"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
              />
            </div>

            {/* Engagement Input */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', alignItems: 'flex-end' }}>
                <label style={{ fontWeight: '700', color: 'var(--text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em' }}>TAXA DE ENGAJAMENTO</label>
                <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '1.5rem', fontVariantNumeric: 'tabular-nums' }}>{engagement}%</span>
              </div>
              <input
                type="range" min="1" max="15" step="0.5"
                value={engagement}
                onChange={(e) => setEngagement(Number(e.target.value))}
                className="w-full h-3 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[var(--primary)] hover:bg-gray-200 transition-colors"
                style={{ boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.8rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span className="flex items-center gap-1"><ArrowRight size={12} className="rotate-180" /> Média do Mercado (1-3%)</span>
                <span className="flex items-center gap-1 font-bold text-[var(--primary)]"><Flame size={12} /> Viral (10%+)</span>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div style={{
            padding: '3rem',
            background: 'linear-gradient(135deg, #FFF 0%, #FAFAFA 100%)',
            borderRadius: '32px',
            boxShadow: '0 20px 60px -10px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.03)',
            position: 'relative',
            textAlign: 'center'
          }}>
            <div style={{ display: 'grid', gap: '2rem' }}>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Alcance Estimado</div>
                <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {reach.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Pessoas alcançadas organicamente
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(0,0,0,0.05)', margin: '0 2rem' }} />

              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary)', color: 'white', borderRadius: '100px', fontWeight: '700', fontSize: '0.9rem', boxShadow: '0 10px 20px rgba(193, 125, 106, 0.3)' }}>
                  <TrendingUp size={16} /> CONVERSÕES
                </div>
                <div style={{ fontSize: '3rem', fontWeight: '900', color: 'var(--primary)', lineHeight: 1, marginTop: '1rem', letterSpacing: '-0.02em' }}>
                  ~{conversions.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--primary)', opacity: 0.8, marginTop: '0.5rem' }}>
                  Potenciais clientes
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default function TutorialPage() {
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 0.5], [0, -50]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  const didacticSteps = [
    {
      title: 'Radar de Tendências',
      icon: <TrendingUp size={24} />,
      action: 'Acesse a aba Radar e filtre por "Emergente". Identifique padrões visuais e temas que estão começando a ganhar tração no seu nicho.',
      tip: 'Tendências com crescimento >30% na última semana têm 3x mais chance de viralizar.',
      link: '/radar',
      linkText: 'Explorar Tendências'
    },
    {
      title: 'Curadoria Visual',
      icon: <Sparkles size={24} />,
      action: 'Crie um novo moodboard em "Inspirações". Salve pelo menos 5 referências que combinem estética com a mensagem que você quer passar.',
      tip: 'Misture 1 referência de concorrente direto com 4 de indústrias diferentes (ex: arquitetura, cinema) para originalidade.',
      link: '/inspiracoes',
      linkText: 'Criar Moodboard'
    },
    {
      title: 'Criação Assistida',
      icon: <Zap size={24} />,
      action: 'No editor, use o botão "Gerar com IA". Defina o tone de voz da sua marca e deixe a ferramenta criar variações de legenda e hashtags.',
      tip: 'Sempre peça 3 variações: uma curta (impacto), uma média (storytelling) e uma técnica (educativa).',
      link: '/criar-post',
      linkText: 'Abrir Editor'
    },
    {
      title: 'Publicação Estratégica',
      icon: <Share2 size={24} />,
      action: 'Ao finalizar, verifique o "Score de Viralidade" no preview. Se estiver acima de 80, agende para o horário nobre sugerido no calendário.',
      tip: 'Os horários de pico variam, mas postar 30min antes do pico garante que você esteja no topo do feed quando o tráfego aumentar.',
      link: '/dashboard',
      linkText: 'Ver Calendário'
    },
  ];

  const masteryCards = [
    {
      icon: <BarChart3 size={32} />,
      title: 'Decifrando Métricas',
      desc: 'Entenda a diferença crucial: Alcance é quem te vê, Engajamento é quem se importa.',
      badge: 'Básico',
      color: '#E0F2FE',
      textColor: '#0369A1'
    },
    {
      icon: <Calendar size={32} />,
      title: 'Planejamento é Poder',
      desc: 'A consistência vence a sorte. Use nosso calendário visual para manter um fluxo constante.',
      badge: 'Estratégia',
      color: '#F0FDF4',
      textColor: '#15803D'
    },
    {
      icon: <Zap size={32} />,
      title: 'Otimização com IA',
      desc: 'Nossa IA analisa o que funciona, aumentando sua descoberta em até 40%.',
      badge: 'Pro',
      color: '#FAF5FF',
      textColor: '#7E22CE'
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', overflow: 'hidden' }}>

      {/* Global Styles for Bento Grid & Layout */}
      <style jsx global>{`
            .bento-grid {
                display: grid;
                grid-template-columns: 1fr;
                gap: 1.25rem;
            }
            @media (min-width: 768px) {
                .bento-grid {
                    grid-template-columns: repeat(3, minmax(0, 1fr));
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

      {/* 1. HERO SECTION */}
      <section style={{ position: 'relative', paddingTop: '10rem', paddingBottom: '8rem', overflow: 'hidden' }}>
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
            <Sparkles size={14} /> TUTORIAL INTERATIVO
          </motion.div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', fontWeight: '800', lineHeight: 1.1, marginBottom: '2rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Domine a Arte do <br />
            <span style={{ color: 'transparent', backgroundClip: 'text', WebkitBackgroundClip: 'text', backgroundImage: 'linear-gradient(90deg, var(--primary) 0%, #D4A04A 100%)' }}>
              Conteúdo Viral
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}
          >
            Um guia passo a passo para transformar dados em influência.
            Aprenda a usar o Fashion Center Academy como um expert.
          </motion.p>
        </motion.div>
      </section>

      {/* 2. DIDACTIC WORKFLOW (Grid of Steps) */}
      <section style={{ padding: '4rem 1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>Fluxo de Execução</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Do insight à publicação em 4 passos definitivos.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {didacticSteps.map((step, idx) => (
              <TiltCard key={idx} noTilt={true} className="col-span-1">
                <DidacticStep
                  number={`0${idx + 1}`}
                  {...step}
                  delay={idx * 0.1}
                />
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MASTERY SECTION (Bento Grid) */}
      <section style={{ padding: '4rem 1.5rem', background: 'white' }}>
        <div style={{ maxWidth: '980px', margin: '0 auto' }}>
          <div style={{ marginBottom: '4rem', textAlign: 'center' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>Dominando a Ferramenta</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Três pilares estratégicos para o crescimento sustentável.</p>
          </div>

          <div className="bento-grid">
            {masteryCards.map((card, i) => (
              <TiltCard key={i} className="col-span-1">
                <div style={{
                  height: '100%', minHeight: '320px',
                  background: card.color,
                  borderRadius: '0px',
                  padding: '2.5rem',
                  display: 'flex', flexDirection: 'column',
                  border: '1px solid rgba(0,0,0,0.05)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Abstract Shapes */}
                  <div style={{
                    position: 'absolute',
                    top: '10%',
                    right: '-10%',
                    width: '120px',
                    height: '120px',
                    background: 'rgba(255,255,255,0.4)',
                    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                    transform: 'rotate(12deg)',
                    pointerEvents: 'none'
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '5%',
                    left: '-5%',
                    width: '80px',
                    height: '80px',
                    background: 'rgba(255,255,255,0.3)',
                    borderRadius: '30% 70% 50% 50% / 60% 40% 60% 40%',
                    transform: 'rotate(-20deg)',
                    pointerEvents: 'none'
                  }} />

                  <div style={{
                    width: '64px', height: '64px', borderRadius: '18px',
                    background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    marginBottom: '2rem', color: card.textColor,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
                    position: 'relative', zIndex: 1
                  }}>              {card.icon}
                  </div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '1rem', color: 'var(--text-primary)' }}>{card.title}</h3>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{card.desc}</p>
                  <div style={{ marginTop: '2rem' }}>
                    <span style={{
                      padding: '6px 14px', background: 'rgba(255,255,255,0.6)',
                      borderRadius: '100px', fontSize: '0.8rem', fontWeight: '700',
                      color: card.textColor, textTransform: 'uppercase'
                    }}>
                      {card.badge}
                    </span>
                  </div>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* 4. SIMULATOR SECTION */}
      <section style={{ padding: '4rem 1.5rem', background: '#f9fafb' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <SimulatorSection />
        </div>
      </section>

      {/* 5. FOOTER CTA */}
      <section style={{ padding: '4rem 1.5rem', position: 'relative' }}>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.3 }}
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, var(--primary) 0%, #D4A04A 100%)',
            borderRadius: '0px',
            padding: '6rem 2rem',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 40px 100px -20px rgba(193, 125, 106, 0.4)'
          }}>

          {/* Floating particles (Inside Card) */}
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                width: `${20 + i * 12}px`,
                height: `${20 + i * 12}px`,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                filter: 'blur(2px)'
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, 20, 0],
                opacity: [0.3, 0.6, 0.3]
              }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}
            />
          ))}

          <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px', margin: '0 auto' }}>
            <motion.h2
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: '800', marginBottom: '1.5rem', color: 'white', letterSpacing: '-0.02em' }}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              Pronto para começar?
            </motion.h2>
            <motion.p
              style={{ fontSize: '1.25rem', color: 'rgba(255,255,255,0.95)', marginBottom: '3rem', lineHeight: 1.6 }}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Aplique o que você aprendeu e transforme seu conteúdo hoje mesmo.
            </motion.p>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                href="/criar-post"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '12px',
                  padding: '20px 56px',
                  background: 'white',
                  color: 'var(--primary)',
                  borderRadius: '100px',
                  fontWeight: '800',
                  fontSize: '1.2rem',
                  textDecoration: 'none',
                  boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
                  letterSpacing: '0.02em'
                }}
              >
                <Sparkles size={22} fill="currentColor" strokeWidth={2} />
                CRIAR POST
              </Link>
            </motion.div>
          </div>

        </motion.div>
      </section>

    </div>
  );
}
