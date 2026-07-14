/**
 * There is no `level` field anywhere in the API — `CurrentUserGamification`/`EmployeeAnalytics`
 * only expose `totalPoints`. "Innovation Level" is a deterministic, disclosed tier label derived
 * from that one real field, the same way "Risk Level" elsewhere in this app derives from
 * `priority` — not a fabricated backend concept, a documented frontend presentation of a real
 * number.
 */
export interface Level {
  tier: number;
  name: string;
  minPoints: number;
  nextThreshold: number | null;
}

const LEVELS: { name: string; minPoints: number }[] = [
  { name: "Novice", minPoints: 0 },
  { name: "Contributor", minPoints: 100 },
  { name: "Innovator", minPoints: 300 },
  { name: "Change Maker", minPoints: 700 },
  { name: "Catalyst", minPoints: 1500 },
  { name: "Master Innovator", minPoints: 3000 },
];

export function getLevel(totalPoints: number): Level {
  let tier = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalPoints >= LEVELS[i].minPoints) tier = i;
  }
  const next = LEVELS[tier + 1];
  return {
    tier,
    name: LEVELS[tier].name,
    minPoints: LEVELS[tier].minPoints,
    nextThreshold: next ? next.minPoints : null,
  };
}

/** 0–100. A maxed-out (final tier) level reads as fully complete rather than divide-by-zero. */
export function getLevelProgress(totalPoints: number): number {
  const level = getLevel(totalPoints);
  if (level.nextThreshold === null) return 100;
  const span = level.nextThreshold - level.minPoints;
  const gained = totalPoints - level.minPoints;
  return Math.min(100, Math.max(0, Math.round((gained / span) * 100)));
}
