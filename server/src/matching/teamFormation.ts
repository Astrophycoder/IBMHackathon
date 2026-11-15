/**
 * Team Formation — Greedy Set Cover Heuristic
 * Per ALGORITHM_AND_AI_POLICY.md: use greedy set-cover for multi-skill coverage.
 * Hungarian algorithm is used only when it is a true 1-to-1 assignment problem.
 *
 * Complexity: O(roles * candidates) per iteration, O(roles^2 * candidates) total.
 * Documented limitation: greedy is not optimal; it approximates within ln(n)+1
 * of optimal for set cover. Document this clearly.
 */

export interface Role {
  roleLabel: string;
  requiredSkillIds: number[];
  importance: number; // 0–1
}

export interface Candidate {
  userId: string;
  displayName: string;
  offerSkillIds: number[];
  profileAgeInDays?: number;
}

export interface TeamAssignment {
  roleLabel: string;
  userId: string | null;
  displayName: string | null;
  coverageScore: number;      // fraction of role skills covered
  coveredSkills: number[];
  missingSkills: number[];
  reasons: string[];
}

export interface TeamFormationResult {
  assignments: TeamAssignment[];
  uncoveredRoles: string[];
  algorithm: 'greedy-set-cover';
  limitations: string;
}

/**
 * Greedy set-cover assignment.
 * Each candidate may only be assigned once (one-to-one constraint).
 * Ties broken by cold-start: newer profiles preferred.
 */
export function greedyTeamFormation(
  roles: Role[],
  candidates: Candidate[]
): TeamFormationResult {
  const usedCandidateIds = new Set<string>();
  const assignments: TeamAssignment[] = [];

  // Sort roles by importance descending so critical roles are filled first
  const sortedRoles = [...roles].sort((a, b) => b.importance - a.importance);

  for (const role of sortedRoles) {
    const requiredSet = new Set(role.requiredSkillIds);

    let bestCandidate: Candidate | null = null;
    let bestCoverage = -1;

    for (const c of candidates) {
      if (usedCandidateIds.has(c.userId)) continue;
      const covered = c.offerSkillIds.filter(id => requiredSet.has(id)).length;
      const coverage = requiredSet.size > 0 ? covered / requiredSet.size : 0;

      if (
        coverage > bestCoverage ||
        (coverage === bestCoverage &&
          (c.profileAgeInDays ?? 999) < ((bestCandidate?.profileAgeInDays) ?? 999))
      ) {
        bestCoverage = coverage;
        bestCandidate = c;
      }
    }

    if (bestCandidate) {
      usedCandidateIds.add(bestCandidate.userId);
      const covered = bestCandidate.offerSkillIds.filter(id => requiredSet.has(id));
      const missing = [...requiredSet].filter(id => !covered.includes(id));

      assignments.push({
        roleLabel:     role.roleLabel,
        userId:        bestCandidate.userId,
        displayName:   bestCandidate.displayName,
        coverageScore: bestCoverage,
        coveredSkills: covered,
        missingSkills: missing,
        reasons: [
          `Covers ${covered.length}/${requiredSet.size} required skills.`,
          ...(missing.length > 0 ? [`Missing skill IDs: ${missing.join(', ')}.`] : []),
        ],
      });
    } else {
      assignments.push({
        roleLabel:     role.roleLabel,
        userId:        null,
        displayName:   null,
        coverageScore: 0,
        coveredSkills: [],
        missingSkills: [...requiredSet],
        reasons:       ['No eligible candidate found.'],
      });
    }
  }

  const uncoveredRoles = assignments
    .filter(a => a.userId === null || a.coverageScore < 1)
    .map(a => a.roleLabel);

  return {
    assignments,
    uncoveredRoles,
    algorithm: 'greedy-set-cover',
    limitations:
      'Greedy set cover is within ln(n)+1 of optimal. ' +
      'Does not guarantee globally optimal assignment. ' +
      'Each person may only be assigned to one role. ' +
      'Revisit with Hungarian algorithm if roles become strictly one-to-one.',
  };
}
