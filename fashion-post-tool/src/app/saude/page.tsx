'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Activity, AlertTriangle, CheckCircle2, Clock, Database, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface HealthRow {
  day: string;
  workflow_name: string;
  platform: string | null;
  total_runs: number;
  success_runs: number;
  partial_runs: number;
  error_runs: number;
  records_scraped_total: number;
  last_completed_at: string | null;
  error_count: number;
}

interface LastRun {
  workflow_name: string;
  platform: string | null;
  status: 'success' | 'partial' | 'error' | 'running';
  records_scraped: number;
  error_message: string | null;
  apify_run_id: string | null;
  started_at: string;
  completed_at: string | null;
}

const statusBadge = (status: LastRun['status']) => {
  if (status === 'success') return 'badge badge-success';
  if (status === 'partial') return 'badge badge-warning';
  if (status === 'error') return 'badge badge-error';
  return 'badge badge-info';
};

export default function SaudePage() {
  const [healthRows, setHealthRows] = useState<HealthRow[]>([]);
  const [lastRuns, setLastRuns] = useState<LastRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    const [healthRes, lastRes] = await Promise.all([
      supabase.from('scraping_health_dashboard').select('*').order('day', { ascending: false }),
      supabase.from('scraping_last_run').select('*').order('started_at', { ascending: false }),
    ]);

    if (!healthRes.error && healthRes.data) {
      setHealthRows(healthRes.data as HealthRow[]);
    }

    if (!lastRes.error && lastRes.data) {
      setLastRuns(lastRes.data as LastRun[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const summary = useMemo(() => {
    const totalRuns = healthRows.reduce((sum, row) => sum + (row.total_runs || 0), 0);
    const successRuns = healthRows.reduce((sum, row) => sum + (row.success_runs || 0), 0);
    const partialRuns = healthRows.reduce((sum, row) => sum + (row.partial_runs || 0), 0);
    const errorRuns = healthRows.reduce((sum, row) => sum + (row.error_runs || 0), 0);
    const records = healthRows.reduce((sum, row) => sum + (row.records_scraped_total || 0), 0);
    const successRate = totalRuns > 0 ? Math.round((successRuns / totalRuns) * 100) : 0;
    const latest = lastRuns
      .map((r) => r.completed_at || r.started_at)
      .filter(Boolean)
      .map((d) => new Date(d as string).getTime())
      .sort((a, b) => b - a)[0];

    return {
      totalRuns,
      successRuns,
      partialRuns,
      errorRuns,
      records,
      successRate,
      lastCompleted: latest ? new Date(latest).toLocaleString('pt-BR') : 'sem dados',
    };
  }, [healthRows, lastRuns]);

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'radial-gradient(circle at top right, rgba(193, 125, 106, 0.15), transparent 60%), var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.75rem', borderRadius: '999px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            <Activity size={14} />
            Saude do scraping
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' }}>Painel de Saude</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Monitoramento de execucoes e estabilidade do sistema.
          </p>
        </div>
        <button
          className="btn btn-outline"
          onClick={fetchData}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} />
          Atualizar
        </button>
      </motion.header>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '240px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid var(--border)',
            borderTopColor: 'var(--primary)',
            borderRadius: '50%',
          }} className="animate-spin" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="label">Runs 30d</span>
                <Database size={16} className="text-primary" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{summary.totalRuns}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Total de execucoes</div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="label">Success rate</span>
                <CheckCircle2 size={16} className="text-success" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{summary.successRate}%</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                {summary.successRuns} sucesso, {summary.partialRuns} parcial
              </div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="label">Erros</span>
                <AlertTriangle size={16} className="text-error" />
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>{summary.errorRuns}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Falhas detectadas</div>
            </div>
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className="label">Ultima execucao</span>
                <Clock size={16} className="text-warning" />
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>{summary.lastCompleted}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Registro mais recente</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: '1.5rem' }}>
            <div className="card-flat" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ultimos runs</h2>
                <span className="label">status por workflow</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 0.7fr 0.7fr 1fr', gap: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0 0.5rem 0.5rem' }}>
                <div>Workflow</div>
                <div>Platform</div>
                <div>Status</div>
                <div>Inicio</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {lastRuns.slice(0, 12).map((run, idx) => (
                  <div
                    key={`${run.workflow_name}-${idx}`}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 0.7fr 0.7fr 1fr',
                      gap: '0.75rem',
                      alignItems: 'center',
                      padding: '0.75rem 0.5rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      background: 'var(--surface)',
                    }}
                  >
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{run.workflow_name}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>{run.platform || 'system'}</div>
                    <div>
                      <span className={statusBadge(run.status)}>
                        {run.status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {new Date(run.started_at).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))}
                {lastRuns.length === 0 && (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <div className="empty-state-title">Sem execucoes</div>
                    <div className="empty-state-description">Assim que houver runs, eles aparecerao aqui.</div>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card-flat" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Resumo 30d</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Registros</span>
                    <span style={{ fontWeight: 700 }}>{summary.records}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Sucesso</span>
                    <span style={{ fontWeight: 700, color: 'var(--success)' }}>{summary.successRuns}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Parcial</span>
                    <span style={{ fontWeight: 700, color: 'var(--warning)' }}>{summary.partialRuns}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-secondary">Erros</span>
                    <span style={{ fontWeight: 700, color: 'var(--error)' }}>{summary.errorRuns}</span>
                  </div>
                </div>
              </div>

              <div className="card-flat" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>Top workflows</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {healthRows.slice(0, 5).map((row, idx) => (
                    <div key={`${row.workflow_name}-${idx}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {row.workflow_name}
                      </div>
                      <div style={{ fontWeight: 700 }}>{row.total_runs}</div>
                    </div>
                  ))}
                  {healthRows.length === 0 && (
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>Sem dados ainda.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
