import React, { useState, useEffect } from 'react';
import { getRadar } from '../api/client';
import { MatchResult } from '../types/domain';
import MatchCard from '../components/MatchCard';
import { useAuth } from '../context/AuthContext';
import styles from './RadarPage.module.css';

export default function RadarPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [k, setK]             = useState(20);
  const [filter, setFilter]   = useState<'all' | 'eligible'>('eligible');

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setError(null);
    getRadar(user.id, k)
      .then(data => setMatches(data.matches))
      .catch(() => setError('Could not load Opportunity Radar. Is the server running?'))
      .finally(() => setLoading(false));
  }, [user, k]);

  const displayed = filter === 'eligible'
    ? matches.filter(m => m.eligibilityStatus === 'eligible')
    : matches;

  if (!user) {
    return <main className={styles.main}><p>Please sign in to view your Opportunity Radar.</p></main>;
  }

  return (
    <main className={styles.main}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.heading}>🎯 Opportunity Radar</h1>
          <p className={styles.sub}>
            Personalised ranked matches based on your skills, interests and availability.
            Scores are <strong>match fit indicators</strong>, not accuracy.
          </p>
        </div>
        <div className={styles.controls}>
          <div className={styles.controlGroup}>
            <label htmlFor="filter-select">Show:</label>
            <select
              id="filter-select"
              value={filter}
              onChange={e => setFilter(e.target.value as 'all' | 'eligible')}
            >
              <option value="eligible">Eligible only</option>
              <option value="all">All (including ineligible)</option>
            </select>
          </div>
          <div className={styles.controlGroup}>
            <label htmlFor="k-select">Top:</label>
            <select id="k-select" value={k} onChange={e => setK(Number(e.target.value))}>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
      </div>

      {loading && (
        <div aria-live="polite" aria-busy>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 180, marginBottom: 16 }} />
          ))}
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      {!loading && !error && displayed.length === 0 && (
        <div className={styles.empty} role="status">
          <p>No {filter === 'eligible' ? 'eligible ' : ''}opportunities found.</p>
          {filter === 'eligible' && (
            <button className="btn btn--ghost" onClick={() => setFilter('all')} style={{ marginTop: '0.75rem' }}>
              Show all results (including ineligible)
            </button>
          )}
        </div>
      )}

      {!loading && displayed.length > 0 && (
        <div aria-live="polite">
          <p className={styles.count} role="status">
            Showing {displayed.length} match{displayed.length !== 1 ? 'es' : ''}
          </p>
          <div className={styles.list}>
            {displayed.map(m => (
              <MatchCard key={m.entityId} result={m} />
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
