import React, { useState, useEffect } from 'react';
import { getComplementary } from '../api/client';
import { ComplementaryMatch } from '../types/domain';
import { useAuth } from '../context/AuthContext';
import styles from './ComplementaryPage.module.css';

function ComplementaryCard({ match }: { match: ComplementaryMatch }) {
  return (
    <article className="card">
      <div className={styles.cardHeader}>
        <div className={styles.avatar}>{match.displayName.charAt(0)}</div>
        <div>
          <h3 className={styles.name}>{match.displayName}</h3>
          <div className={styles.scoreRow}>
            <span className={styles.score}>{match.complementScore}</span>
            <span className={styles.scoreLabel}>/ 100 complement fit</span>
          </div>
        </div>
      </div>

      {match.offersYouNeed.length > 0 && (
        <div className={styles.row}>
          <span className={styles.rowLabel}>They offer you need:</span>
          <div className={styles.tags}>
            {match.offersYouNeed.map(s => (
              <span key={s} className="badge badge--teal">{s}</span>
            ))}
          </div>
        </div>
      )}

      {match.needsYouOffer.length > 0 && (
        <div className={styles.row}>
          <span className={styles.rowLabel}>You offer they need:</span>
          <div className={styles.tags}>
            {match.needsYouOffer.map(s => (
              <span key={s} className="badge badge--lavender">{s}</span>
            ))}
          </div>
        </div>
      )}

      <ul className={styles.reasons}>
        {match.reasons.map((r, i) => <li key={i}>{r}</li>)}
      </ul>
    </article>
  );
}

export default function ComplementaryPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState<ComplementaryMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    getComplementary(user.id, 15)
      .then(d => setMatches(d.matches))
      .catch(() => setError('Could not load complementary users.'))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return <main className={styles.main}><p>Please sign in.</p></main>;
  }

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>🔗 Complementary Skills</h1>
      <p className={styles.sub}>
        People whose skills fill your needs — and whose needs you can fill.
        Collaboration starts here.
      </p>

      {loading && (
        <div>
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 140, marginBottom: 12 }} />
          ))}
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}

      {!loading && !error && matches.length === 0 && (
        <p className={styles.empty} role="status">
          No complementary matches found. Add skills to your profile to discover collaborators.
        </p>
      )}

      {!loading && matches.length > 0 && (
        <div className={styles.grid} aria-live="polite">
          {matches.map(m => <ComplementaryCard key={m.userId} match={m} />)}
        </div>
      )}
    </main>
  );
}
