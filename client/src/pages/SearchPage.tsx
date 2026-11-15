import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { searchOpportunities } from '../api/client';
import { Opportunity, SearchResult } from '../types/domain';
import styles from './SearchPage.module.css';

const TYPES = ['', 'job', 'internship', 'freelance', 'volunteering', 'mentorship', 'creative', 'startup'];
const REMOTE_MODES = ['', 'remote', 'onsite', 'hybrid', 'flexible'];

function OpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <article className="card" style={{ marginBottom: '0.75rem' }}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>{opp.title}</h3>
          <div className={styles.cardMeta}>
            <span className="badge badge--teal">{opp.type}</span>
            {opp.isPaid ? (
              <span className="badge badge--green">
                {opp.amountMin
                  ? `₹${opp.amountMin.toLocaleString()}${opp.amountMax ? '–' + opp.amountMax.toLocaleString() : '+'}`
                  : 'Paid'}
              </span>
            ) : (
              <span className="badge badge--grey">Unpaid / Volunteer</span>
            )}
            {opp.remoteMode && (
              <span className="badge badge--lavender">{opp.remoteMode}</span>
            )}
            {opp.location && (
              <span className={styles.location}>📍 {opp.location}</span>
            )}
          </div>
        </div>
      </div>

      {opp.description && (
        <p className={styles.desc}>{opp.description.slice(0, 160)}{opp.description.length > 160 ? '…' : ''}</p>
      )}

      {opp.skills.length > 0 && (
        <div className={styles.skills}>
          {opp.skills.map(s => (
            <span key={s.skillId} className={['badge', s.isMandatory ? 'badge--teal' : 'badge--grey'].join(' ')}>
              {s.skillName}{s.isMandatory ? ' *' : ''}
            </span>
          ))}
        </div>
      )}

      {opp.requiredHoursPw && (
        <span className={styles.hours}>⏱ {opp.requiredHoursPw} hrs/week</span>
      )}
    </article>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [q, setQ]           = useState(searchParams.get('q') ?? '');
  const [type, setType]     = useState(searchParams.get('type') ?? '');
  const [remote, setRemote] = useState(searchParams.get('remoteMode') ?? '');
  const [isPaid, setIsPaid] = useState(searchParams.get('isPaid') ?? '');
  const [page, setPage]     = useState(1);

  const [result, setResult]   = useState<SearchResult<Opportunity> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const doSearch = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = { page: p, pageSize: 15 };
      if (q)      params.q         = q;
      if (type)   params.type      = type;
      if (remote) params.remoteMode = remote;
      if (isPaid) params.isPaid    = isPaid;
      const data = await searchOpportunities(params);
      setResult(data);
      setPage(p);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [q, type, remote, isPaid]);

  // Initial load from URL params
  useEffect(() => { doSearch(1); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSearchParams({ q, type, remoteMode: remote, isPaid });
    doSearch(1);
  }

  const totalPages = result ? Math.ceil(result.total / (result.pageSize || 15)) : 0;

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Search Opportunities</h1>

      {/* Filters */}
      <form onSubmit={handleSubmit} className={styles.filterForm} role="search">
        <div className={styles.filterRow}>
          <div className={styles.searchField}>
            <label htmlFor="search-q" className="sr-only">Search keyword</label>
            <input
              id="search-q"
              type="search"
              placeholder="Search by keyword, skill, or role…"
              value={q}
              onChange={e => setQ(e.target.value)}
              aria-label="Search keyword"
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="type-filter" className="sr-only">Type</label>
            <select id="type-filter" value={type} onChange={e => setType(e.target.value)}>
              <option value="">All types</option>
              {TYPES.filter(Boolean).map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="remote-filter" className="sr-only">Work mode</label>
            <select id="remote-filter" value={remote} onChange={e => setRemote(e.target.value)}>
              <option value="">All modes</option>
              {REMOTE_MODES.filter(Boolean).map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="paid-filter" className="sr-only">Payment</label>
            <select id="paid-filter" value={isPaid} onChange={e => setIsPaid(e.target.value)}>
              <option value="">Paid & Unpaid</option>
              <option value="true">Paid only</option>
              <option value="false">Unpaid / Volunteer</option>
            </select>
          </div>

          <button type="submit" className="btn btn--primary">Search</button>
        </div>
      </form>

      {/* Typo suggestion */}
      {result?.suggestion && (
        <div className={styles.suggestion} role="status">
          Did you mean a skill: <strong>{result.suggestion}</strong>?{' '}
          <button
            className="btn btn--ghost"
            style={{ fontSize: '0.85rem', padding: '0.25rem 0.75rem', minHeight: 'unset' }}
            onClick={() => { setQ(result.suggestion!); doSearch(1); }}
          >
            Search for "{result.suggestion}"
          </button>
          <span className={styles.suggNote}>(your original query was kept)</span>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={styles.results} aria-live="polite" aria-busy="true">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 120, marginBottom: 12 }} />
          ))}
        </div>
      )}

      {/* Error */}
      {error && <p className={styles.error} role="alert">{error}</p>}

      {/* No results */}
      {!loading && result && result.items.length === 0 && (
        <p className={styles.empty} role="status">
          No opportunities found. Try different keywords or filters.
        </p>
      )}

      {/* Results */}
      {!loading && result && result.items.length > 0 && (
        <>
          <p className={styles.resultCount} role="status">
            {result.total} result{result.total !== 1 ? 's' : ''} found
          </p>
          <div className={styles.results} aria-live="polite">
            {result.items.map(opp => (
              <OpportunityCard key={opp.id} opp={opp} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination} role="navigation" aria-label="Pagination">
              <button
                className="btn btn--ghost"
                disabled={page <= 1}
                onClick={() => doSearch(page - 1)}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              <span className={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn--ghost"
                disabled={page >= totalPages}
                onClick={() => doSearch(page + 1)}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
