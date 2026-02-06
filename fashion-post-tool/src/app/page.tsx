'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getPendingPosts, getPosts, Post } from '@/lib/supabase-db';
import {
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Lightbulb,
  Zap,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Calendar,
  BarChart3,
  Hash
} from 'lucide-react';
import { motion } from 'framer-motion';

// Mock data for trending hashtags
const TRENDING_HASHTAGS = [
  { tag: '#Streetwear', growth: 23, posts: 1240 },
  { tag: '#MinimalStyle', growth: 18, posts: 890 },
  { tag: '#Y2KFashion', growth: 45, posts: 2100 },
  { tag: '#OversizedFit', growth: 12, posts: 560 },
  { tag: '#EarthTones', growth: 31, posts: 1580 },
];

const TRENDING_STYLES = [
  { name: 'Oversized', trend: 'up', change: 34 },
  { name: 'Minimalista', trend: 'up', change: 22 },
  { name: 'Y2K Revival', trend: 'up', change: 67 },
  { name: 'Boho Chic', trend: 'down', change: -8 },
  { name: 'Sporty Luxe', trend: 'up', change: 15 },
];

// Mock data for performance
const PERFORMANCE_DATA = {
  thisWeek: { likes: 4523, comments: 892, shares: 234, views: 45800 },
  lastWeek: { likes: 3890, comments: 756, shares: 198, views: 39200 },
};

// Mock calendar data
const CALENDAR_POSTS = [
  { id: 1, day: 'Seg', date: 3, title: 'Lançamento Coleção', status: 'scheduled', time: '10:00' },
  { id: 2, day: 'Ter', date: 4, title: 'Dica de Styling', status: 'scheduled', time: '14:00' },
  { id: 3, day: 'Qua', date: 5, title: 'Bastidores', status: 'draft', time: '16:00' },
  { id: 4, day: 'Qui', date: 6, title: 'Tendência da Semana', status: 'scheduled', time: '11:00' },
  { id: 5, day: 'Sex', date: 7, title: 'Look do Dia', status: 'scheduled', time: '09:00' },
  { id: 6, day: 'Sáb', date: 8, title: '', status: 'empty', time: '' },
  { id: 7, day: 'Dom', date: 9, title: '', status: 'empty', time: '' },
];

// Dynamic greeting based on time
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return { text: 'Bom dia', emoji: '☀️' };
  if (hour < 18) return { text: 'Boa tarde', emoji: '🌤️' };
  return { text: 'Boa noite', emoji: '🌙' };
};

// Calculate percentage change
const calcChange = (current: number, previous: number) => {
  return ((current - previous) / previous * 100).toFixed(1);
};

export default function Dashboard() {
  const [pendingPosts, setPendingPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting] = useState(getGreeting());

  useEffect(() => {
    async function loadData() {
      try {
        const [pending, all] = await Promise.all([
          getPendingPosts(),
          getPosts()
        ]);
        setPendingPosts(pending);
        setAllPosts(all);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const stats = {
    pending: pendingPosts.length,
    posted: allPosts.filter(p => p.postado_em_todas).length,
    total: allPosts.length
  };

  // Calculate performance changes
  const likesChange = calcChange(PERFORMANCE_DATA.thisWeek.likes, PERFORMANCE_DATA.lastWeek.likes);
  const engagementRate = ((PERFORMANCE_DATA.thisWeek.likes + PERFORMANCE_DATA.thisWeek.comments) / PERFORMANCE_DATA.thisWeek.views * 100).toFixed(2);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="dashboard-shell max-w-7xl mx-auto px-4 md:px-6 py-8 pb-24 min-h-screen">

      {/* HERO - Dynamic Greeting */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="dashboard-hero flex flex-col md:flex-row justify-between items-start md:items-center mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-primary/10 to-warning/5 border border-[var(--border)] gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{greeting.emoji}</span>
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
              {greeting.text}, Fashion Center
            </h1>
          </div>
          <p className="text-sm md:text-base text-[var(--text-secondary)] capitalize">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Quick Stats Pills */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-full border border-[var(--border)] shadow-sm">
            <Clock size={16} className="text-[var(--warning)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">{stats.pending}</span>
            <span className="text-xs text-[var(--text-muted)]">pendentes</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-full border border-[var(--border)] shadow-sm">
            <CheckCircle2 size={16} className="text-[var(--success)]" />
            <span className="text-sm font-bold text-[var(--text-primary)]">{stats.posted}</span>
            <span className="text-xs text-[var(--text-muted)]">publicados</span>
          </div>
        </div>
      </motion.header>

      {/* MAIN GRID - Actions */}
      <div className="dashboard-actions grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

        {/* Quick Action: Create Post */}
        <Link href="/criar-post" className="action-card action-card--primary w-full shadow-lg hover:shadow-xl transition-all" style={{ textDecoration: 'none' }}>
          <span className="action-card__title">Criar Post Agora</span>
          <span className="action-card__meta">Abrir editor criativo</span>
        </Link>

        {/* Quick Action: Inspirations */}
        <Link href="/inspiracoes" className="action-card action-card--outline w-full hover:border-[var(--primary)] transition-all" style={{ textDecoration: 'none' }}>
          <span className="action-card__title">Galeria de Ideias</span>
          <span className="action-card__meta">Explore tendências e inspirações</span>
        </Link>
      </div>

      {/* SECOND ROW: Trends + Performance */}
      <div className="dashboard-row grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">

        {/* TRENDING SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="dash-card trend-card"
        >
          <div className="dash-card__header trend-header">
            <div className="flex items-center gap-3">
              <div className="trend-icon flex items-center justify-center">
                <Flame size={18} className="text-white" />
              </div>
              <h3 className="dash-card__title text-base font-bold text-[var(--text-primary)]">Tendências em Alta</h3>
            </div>
            <Link href="/radar" className="trend-link">
              Ver Radar →
            </Link>
          </div>

          {/* Hashtags */}
          <div className="trend-section">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Hashtags Crescendo
            </p>
            <div className="trend-chips">
              {TRENDING_HASHTAGS.slice(0, 4).map((item) => (
                <motion.div
                  key={item.tag}
                  whileHover={{ scale: 1.05 }}
                  className="trend-chip"
                >
                  <Hash size={12} className="text-[var(--primary)]" />
                  <span className="text-sm font-semibold text-[var(--text-primary)]">{item.tag.replace('#', '')}</span>
                  <span className="trend-growth text-xs font-bold flex items-center gap-0.5">
                    <ArrowUpRight size={10} /> {item.growth}%
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Styles */}
          <div className="trend-section">
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
              Estilos em Destaque
            </p>
            <div className="grid grid-cols-3 gap-3">
              {TRENDING_STYLES.slice(0, 3).map((style) => (
                <div
                  key={style.name}
                  className="trend-style"
                >
                  <p className="text-sm font-bold text-[var(--text-primary)] mb-1 truncate">{style.name}</p>
                  <p
                    className={`text-xs font-bold flex items-center justify-center gap-1 ${style.trend === 'up' ? 'text-emerald-500' : 'text-red-500'
                      }`}
                  >
                    {style.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {Math.abs(style.change)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* PERFORMANCE SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="dash-card dash-card--dark performance-card"
        >
          <div className="dash-card__header performance-header">
            <div className="dash-header-icon dash-header-icon--dark">
              <BarChart3 size={18} />
            </div>
            <div>
              <h3 className="dash-card__title text-base font-bold">Performance</h3>
              <p className="text-xs text-white/60">vs. semana anterior</p>
            </div>
          </div>

          {/* Big Number */}
          <div className="performance-kpi mb-6">
            <p className="text-xs text-white/50 uppercase tracking-wider mb-1">Taxa de Engajamento</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold leading-none">{engagementRate}%</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <ArrowUpRight size={14} /> +{likesChange}%
              </span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="performance-metrics grid grid-cols-2 gap-3">
            {[
              { icon: Heart, label: 'Curtidas', value: PERFORMANCE_DATA.thisWeek.likes.toLocaleString() },
              { icon: MessageCircle, label: 'Comentários', value: PERFORMANCE_DATA.thisWeek.comments.toLocaleString() },
              { icon: Eye, label: 'Visualizações', value: `${(PERFORMANCE_DATA.thisWeek.views / 1000).toFixed(1)}k` },
              { icon: Share2, label: 'Compartilhamentos', value: PERFORMANCE_DATA.thisWeek.shares },
            ].map((metric) => (
              <div key={metric.label} className="dash-metric performance-metric">
                <div className="flex items-center gap-2 mb-1">
                  <metric.icon size={14} />
                  <span className="text-xs text-white/70">{metric.label}</span>
                </div>
                <p className="text-xl font-bold">{metric.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* THIRD ROW: Calendar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="dash-card dashboard-calendar calendar-card"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4 calendar-header">
          <div className="flex items-center gap-3">
            <div className="dash-header-icon dash-header-icon--light">
              <Calendar size={18} className="text-[var(--primary)]" />
            </div>
            <div>
              <h3 className="dash-card__title text-base font-bold text-[var(--text-primary)]">Calendário da Semana</h3>
              <p className="text-xs text-[var(--text-muted)]">Fevereiro 2026</p>
            </div>
          </div>
          <Link href="/criar-post" className="btn btn-primary schedule-btn">
            <Plus size={14} /> Agendar Post
          </Link>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
          {CALENDAR_POSTS.map((day, index) => (
            <motion.div
              key={day.id}
              whileHover={{ scale: 1.02, borderColor: 'var(--primary)' }}
              className={`calendar-day p-4 rounded-2xl min-h-[110px] transition-all duration-200 border-2 ${day.status === 'empty'
                ? 'bg-[var(--background)] border-dashed border-[var(--border)] opacity-70 cursor-pointer'
                : 'bg-[var(--surface)] border-solid border-[var(--border)] cursor-default'
                }`}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-[var(--text-muted)] uppercase">{day.day}</span>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 2 ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-primary)]'
                  }`}>
                  {day.date}
                </span>
              </div>

              {day.status === 'scheduled' && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-1 leading-tight">{day.title}</p>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Clock size={10} className="text-[var(--text-muted)]" />
                    <span className="text-[10px] text-[var(--text-muted)]">{day.time}</span>
                  </div>
                  <div className="inline-block px-1.5 py-0.5 bg-emerald-500/10 rounded text-[10px] font-bold text-emerald-500">
                    AGENDADO
                  </div>
                </div>
              )}

              {day.status === 'draft' && (
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-1 leading-tight">{day.title}</p>
                  <div className="flex items-center gap-1 mb-1.5">
                    <Clock size={10} className="text-[var(--text-muted)]" />
                    <span className="text-[10px] text-[var(--text-muted)]">{day.time}</span>
                  </div>
                  <div className="inline-block px-1.5 py-0.5 bg-yellow-500/10 rounded text-[10px] font-bold text-yellow-500">
                    RASCUNHO
                  </div>
                </div>
              )}

              {day.status === 'empty' && (
                <div className="flex items-center justify-center h-12">
                  <Plus size={18} className="text-[var(--text-muted)]" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
