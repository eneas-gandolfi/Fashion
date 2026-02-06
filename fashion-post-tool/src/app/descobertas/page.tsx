'use client';

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { Check, X, TrendingUp, Users, Hash, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface DiscoveredProfile {
  id: string;
  niche_id: string;
  platform: string;
  handle: string;
  url: string;
  discovered_via: string;
  engagement_score: number;
  follower_count: number;
  verified: boolean;
  profile_data: {
    bio: string;
    avatar: string;
    total_videos: number;
    total_likes: number;
  };
  status: 'pending' | 'approved' | 'rejected' | 'monitoring';
  created_at: string;
  niche_name?: string;
}

interface DiscoveredProfileRow extends DiscoveredProfile {
  niches?: { name: string } | null;
}

interface Niche {
  id: string;
  name: string;
  description: string;
}

export default function DiscoveryPage() {
  const [profiles, setProfiles] = useState<DiscoveredProfile[]>([]);
  const [niches, setNiches] = useState<Niche[]>([]);
  const [selectedNiche, setSelectedNiche] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [loading, setLoading] = useState(true);

  const fetchNiches = useCallback(async () => {
    const { data } = await supabase
      .from('niches')
      .select('id, name, description')
      .eq('enabled', true)
      .order('name');

    if (data) setNiches(data as Niche[]);
  }, []);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);

    let query = supabase
      .from('discovered_profiles')
      .select(`
        *,
        niches!inner(name)
      `)
      .eq('status', selectedStatus)
      .order('engagement_score', { ascending: false })
      .limit(50);

    if (selectedNiche !== 'all') {
      query = query.eq('niche_id', selectedNiche);
    }

    const { data } = await query;

    if (data) {
      const formatted = (data as DiscoveredProfileRow[]).map((p) => ({
        ...p,
        niche_name: p.niches?.name,
      }));
      setProfiles(formatted);
    }

    setLoading(false);
  }, [selectedNiche, selectedStatus]);

  useEffect(() => {
    fetchNiches();
  }, [fetchNiches]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  async function approveProfile(profileId: string) {
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .limit(1)
      .single();

    if (!stores) return;

    const { error } = await supabase.rpc('approve_discovered_profile', {
      p_profile_id: profileId,
      p_store_id: stores.id,
    });

    if (!error) {
      fetchProfiles();
    }
  }

  async function rejectProfile(profileId: string) {
    const { error } = await supabase
      .from('discovered_profiles')
      .update({ status: 'rejected' })
      .eq('id', profileId);

    if (!error) {
      fetchProfiles();
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const avgEngagement = useMemo(() => {
    if (profiles.length === 0) return 0;
    const total = profiles.reduce((acc, p) => acc + (p.engagement_score || 0), 0);
    return Math.round(total / profiles.length);
  }, [profiles]);

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          background: 'radial-gradient(circle at top right, rgba(193, 125, 106, 0.15), transparent 60%), var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '20px',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Descobertas automaticas
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.35rem' }}>Novos perfis por nicho</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              Curadoria rapida para aprovar e monitorar influenciadores.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-info">Atualizacao diaria</span>
          </div>
        </div>
      </motion.header>

      <div className="card-flat" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div>
            <label>Nicho</label>
            <select value={selectedNiche} onChange={(e) => setSelectedNiche(e.target.value)}>
              <option value="all">Todos</option>
              {niches.map((niche) => (
                <option key={niche.id} value={niche.id}>
                  {niche.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Status</label>
            <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="monitoring">Monitoramento</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="label">Total</span>
            <Users size={16} className="text-primary" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{profiles.length}</div>
          <div className="text-muted">Perfis descobertos</div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="label">Engajamento medio</span>
            <TrendingUp size={16} className="text-success" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{formatNumber(avgEngagement)}</div>
          <div className="text-muted">Media por perfil</div>
        </div>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span className="label">Nichos ativos</span>
            <Hash size={16} className="text-primary" />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{niches.length}</div>
          <div className="text-muted">Configurados</div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid var(--border)',
            borderTopColor: 'var(--primary)',
            margin: '0 auto 1rem',
          }} className="animate-spin" />
          <p style={{ color: 'var(--text-secondary)' }}>Carregando perfis...</p>
        </div>
      ) : profiles.length === 0 ? (
        <div className="empty-state" style={{
          background: 'var(--surface)',
          border: '1.5px dashed var(--border)',
          borderRadius: '12px',
        }}>
          <div className="empty-state-title">Nenhum perfil encontrado</div>
          <div className="empty-state-description">Tente ajustar os filtros ou aguarde nova coleta.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {profiles.map((profile) => (
            <motion.div
              key={profile.id}
              whileHover={{ y: -4 }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{
                background: 'var(--primary-gradient)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: 'white',
              }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  {profile.niche_name || 'Nicho'}
                </span>
                {profile.verified && (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700 }}>verificado</span>
                )}
              </div>

              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  {profile.profile_data?.avatar ? (
                    <Image
                      src={profile.profile_data.avatar}
                      alt={profile.handle ? `Avatar de ${profile.handle}` : 'Avatar do perfil'}
                      width={48}
                      height={48}
                      unoptimized
                      style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                    }}>
                      {profile.handle?.[0]?.toUpperCase() || 'P'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>@{profile.handle}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {profile.platform}
                    </div>
                  </div>
                  <span className="badge badge-neutral">{profile.status}</span>
                </div>

                {profile.profile_data?.bio && (
                  <p style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    marginBottom: '0.75rem',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}>
                    {profile.profile_data.bio}
                  </p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <div className="label">Engajamento</div>
                    <div style={{ fontWeight: 700 }}>{formatNumber(profile.engagement_score)}</div>
                  </div>
                  <div>
                    <div className="label">Seguidores</div>
                    <div style={{ fontWeight: 700 }}>{formatNumber(profile.follower_count)}</div>
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  Origem: <strong style={{ color: 'var(--text-secondary)' }}>{profile.discovered_via}</strong>
                </div>

                {selectedStatus === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button
                      onClick={() => approveProfile(profile.id)}
                      className="btn btn-primary"
                      style={{ flex: 1, padding: '0.5rem 0.75rem' }}
                    >
                      <Check size={14} />
                      Aprovar
                    </button>
                    <button
                      onClick={() => rejectProfile(profile.id)}
                      className="btn btn-outline"
                      style={{ flex: 1, padding: '0.5rem 0.75rem', color: 'var(--error)', borderColor: 'var(--error-light)' }}
                    >
                      <X size={14} />
                      Rejeitar
                    </button>
                  </div>
                )}

                <a
                  href={profile.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  Ver perfil
                  <ExternalLink size={14} />
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
