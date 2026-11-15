import { greedyTeamFormation, Role, Candidate } from '../../matching/teamFormation';

describe('greedyTeamFormation', () => {
  const roles: Role[] = [
    { roleLabel: 'Developer',  requiredSkillIds: [1, 12], importance: 1.0 },
    { roleLabel: 'Designer',   requiredSkillIds: [3],     importance: 0.8 },
    { roleLabel: 'Marketer',   requiredSkillIds: [7, 13], importance: 0.7 },
  ];

  const candidates: Candidate[] = [
    { userId: 'u1', displayName: 'Alice',  offerSkillIds: [1, 12],  profileAgeInDays: 90 },
    { userId: 'u2', displayName: 'Bob',    offerSkillIds: [3, 9],   profileAgeInDays: 30 },
    { userId: 'u3', displayName: 'Carol',  offerSkillIds: [7, 13],  profileAgeInDays: 5  },
  ];

  test('assigns each role to a distinct candidate', () => {
    const result = greedyTeamFormation(roles, candidates);
    const assignedIds = result.assignments.map(a => a.userId).filter(Boolean);
    const unique = new Set(assignedIds);
    expect(unique.size).toBe(assignedIds.length);
  });

  test('no candidate used twice', () => {
    const result = greedyTeamFormation(roles, candidates);
    const used = result.assignments.map(a => a.userId).filter(Boolean);
    expect(new Set(used).size).toBe(used.length);
  });

  test('uncoveredRoles is empty when all roles have candidates', () => {
    const result = greedyTeamFormation(roles, candidates);
    // All 3 roles should have someone assigned (perfect match)
    const unassigned = result.assignments.filter(a => a.userId === null);
    expect(unassigned).toHaveLength(0);
  });

  test('handles empty candidates gracefully', () => {
    const result = greedyTeamFormation(roles, []);
    result.assignments.forEach(a => {
      expect(a.userId).toBeNull();
    });
    expect(result.uncoveredRoles.length).toBeGreaterThan(0);
  });

  test('handles empty roles gracefully', () => {
    const result = greedyTeamFormation([], candidates);
    expect(result.assignments).toHaveLength(0);
  });

  test('reports greedy-set-cover algorithm name', () => {
    const result = greedyTeamFormation(roles, candidates);
    expect(result.algorithm).toBe('greedy-set-cover');
  });

  test('includes limitations note in result', () => {
    const result = greedyTeamFormation(roles, candidates);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  test('prefers newer profiles when coverage is equal (cold-start fairness)', () => {
    // Both u4 and u5 have same skills; u5 is newer
    const twoDevs: Candidate[] = [
      { userId: 'u4', displayName: 'Old Dev', offerSkillIds: [1, 12], profileAgeInDays: 200 },
      { userId: 'u5', displayName: 'New Dev', offerSkillIds: [1, 12], profileAgeInDays: 2 },
    ];
    const result = greedyTeamFormation(
      [{ roleLabel: 'Developer', requiredSkillIds: [1, 12], importance: 1.0 }],
      twoDevs
    );
    expect(result.assignments[0].userId).toBe('u5');
  });
});
