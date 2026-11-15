import React from 'react';
import { MatchResult } from '../types/domain';
import styles from './MatchCard.module.css';

interface Props {
  result: MatchResult;
  opportunityTitle?: string;
  opportunityType?: string;
}

function pct(v: number | null): string {
  if (v === null) return 'N/A';
  return `${Math.round(v * 100)}%`;
}

function bar(v: number | null) {
  const width = v === null ? 0 : Math.round(v * 100);
  return (
    <div className={styles.barTrack} role="presentation">
      <div className={styles.barFill} style={{ width: `${width}%` }} />
    </div>
  );
}

export default function MatchCard({ result, opportunityTitle, opportunityType }: Props) {
  const isEligible = result.eligibilityStatus === 'eligible';

  return (
    <article className={[styles.card, !isEligible ? styles.ineligible : ''].join(' ')}>
      <div className={styles.header}>
        <div>
          {opportunityTitle && <h3 className={styles.title}>{opportunityTitle}</h3>}
          {opportunityType && (
            <span className="badge badge--grey">{opportunityType}</span>
          )}
        </div>
        <div className={styles.scoreWrapper}>
          <span
            className={styles.score}
            aria-label={`Match fit score: ${result.matchScore} out of 100`}
          >
            {result.matchScore.toFixed(0)}
          </span>
          <span className={styles.scoreLabel}>/ 100</span>
          {/* Never say "accuracy" — per ALGORITHM_AND_AI_POLICY.md */}
          <span className={styles.scoreNote}>match fit</span>
        </div>
      </div>

      {/* Eligibility */}
      {!isEligible && (
        <div className={styles.ineligibleBanner} role="alert">
          <strong>Not eligible:</strong>{' '}
          {result.ineligibilityReasons.join(' ')}
        </div>
      )}

      {/* Component scores */}
      <div className={styles.components}>
        {[
          { label: 'Skill coverage',       val: result.componentScores.skillCoverage },
          { label: 'Interest similarity',  val: result.componentScores.interestSimilarity },
          { label: 'Availability',         val: result.componentScores.availability },
          { label: 'Location fit',         val: result.componentScores.location },
        ].map(({ label, val }) => (
          <div key={label} className={styles.component}>
            <div className={styles.componentHeader}>
              <span className={styles.componentLabel}>{label}</span>
              <span className={styles.componentValue}>{pct(val)}</span>
            </div>
            {bar(val)}
          </div>
        ))}
      </div>

      {/* Matched skills */}
      {result.matchedSkills.length > 0 && (
        <div className={styles.skills}>
          <span className={styles.skillsLabel}>Matched:</span>
          {result.matchedSkills.map(s => (
            <span key={s} className="badge badge--green">{s}</span>
          ))}
        </div>
      )}

      {/* Missing */}
      {result.missingRequirements.length > 0 && (
        <div className={styles.skills}>
          <span className={styles.skillsLabel}>Missing:</span>
          {result.missingRequirements.map(s => (
            <span key={s} className="badge badge--grey">{s}</span>
          ))}
        </div>
      )}

      {/* Reasons */}
      {result.reasons.length > 0 && (
        <ul className={styles.reasons} aria-label="Match reasons">
          {result.reasons.map((r, i) => (
            <li key={i}>{r}</li>
          ))}
        </ul>
      )}
    </article>
  );
}
