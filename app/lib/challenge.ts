export type Participant = {
  slug: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  tint: string;
};

export type CheckIn = {
  participantSlug: string;
  weekNumber: number;
  weighInDate: string;
  weightKg: number;
  exerciseSessions: number;
  exerciseMinutes: number;
  energy: number;
  note: string;
};

export const participants: Participant[] = [
  {
    slug: "sam",
    name: "Sam",
    email: "sam@davo-five-o.local",
    initials: "SM",
    color: "#f2c94c",
    tint: "#fff7d6",
  },
  {
    slug: "trish",
    name: "Trish",
    email: "trish@davo-five-o.local",
    initials: "TR",
    color: "#ef8354",
    tint: "#fff0e9",
  },
  {
    slug: "dave",
    name: "Dave",
    email: "dave@davo-five-o.local",
    initials: "DV",
    color: "#3b82a0",
    tint: "#e6f4f8",
  },
  {
    slug: "emma",
    name: "Emma",
    email: "emma@davo-five-o.local",
    initials: "EM",
    color: "#8a6fd1",
    tint: "#f1edfb",
  },
  {
    slug: "jacob",
    name: "Jacob",
    email: "jacob@davo-five-o.local",
    initials: "JC",
    color: "#54a777",
    tint: "#e9f7ee",
  },
];

export const challengeWeeks = [
  { weekNumber: 0, label: "Start", shortLabel: "Start", date: "2026-08-01" },
  { weekNumber: 1, label: "Week 1", shortLabel: "W1", date: "2026-08-08" },
  { weekNumber: 2, label: "Week 2", shortLabel: "W2", date: "2026-08-15" },
  { weekNumber: 3, label: "Week 3", shortLabel: "W3", date: "2026-08-22" },
  { weekNumber: 4, label: "Week 4", shortLabel: "W4", date: "2026-08-29" },
  { weekNumber: 5, label: "Week 5", shortLabel: "W5", date: "2026-09-05" },
  { weekNumber: 6, label: "Week 6", shortLabel: "W6", date: "2026-09-12" },
  { weekNumber: 7, label: "Final", shortLabel: "Final", date: "2026-09-19" },
];

const weights: Record<string, number[]> = {
  sam: [92.4, 91.7, 91.1, 90.4],
  trish: [79.6, 79.1, 78.4, 77.9],
  dave: [112.8, 111.5, 110.7, 109.6],
  emma: [74.2, 73.8, 73.2, 72.8],
  jacob: [98.7, 98.0, 97.2, 96.6],
};

const sessions: Record<string, number[]> = {
  sam: [0, 4, 4, 5],
  trish: [0, 3, 5, 4],
  dave: [0, 5, 5, 6],
  emma: [0, 4, 3, 5],
  jacob: [0, 3, 4, 4],
};

export const demoCheckIns: CheckIn[] = participants.flatMap((participant) =>
  weights[participant.slug].map((weightKg, weekNumber) => ({
    participantSlug: participant.slug,
    weekNumber,
    weighInDate: challengeWeeks[weekNumber].date,
    weightKg,
    exerciseSessions: sessions[participant.slug][weekNumber],
    exerciseMinutes:
      weekNumber === 0
        ? 0
        : sessions[participant.slug][weekNumber] * 42 + weekNumber * 8,
    energy: weekNumber === 0 ? 3 : Math.min(5, 3 + (weekNumber % 3)),
    note:
      weekNumber === 3
        ? "Feeling stronger and keeping the momentum going."
        : "",
  })),
);

export const formatChallengeDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-NZ", {
    day: "numeric",
    month: "short",
  }).format(new Date(`${isoDate}T12:00:00+12:00`));

export const roundOne = (value: number) => Math.round(value * 10) / 10;

export const getParticipantCheckIns = (
  checkIns: CheckIn[],
  participantSlug: string,
) =>
  checkIns
    .filter((item) => item.participantSlug === participantSlug)
    .sort((a, b) => a.weekNumber - b.weekNumber);

export const getParticipantStats = (
  checkIns: CheckIn[],
  participantSlug: string,
) => {
  const rows = getParticipantCheckIns(checkIns, participantSlug);
  const baseline = rows.find((row) => row.weekNumber === 0);
  const latest = rows.at(-1);
  const kgLost =
    baseline && latest ? Math.max(0, roundOne(baseline.weightKg - latest.weightKg)) : 0;
  const sessionsCompleted = rows.reduce(
    (total, row) => total + row.exerciseSessions,
    0,
  );
  const exerciseMinutes = rows.reduce(
    (total, row) => total + row.exerciseMinutes,
    0,
  );

  return {
    baselineWeight: baseline?.weightKg ?? 0,
    currentWeight: latest?.weightKg ?? 0,
    latestWeek: latest?.weekNumber ?? 0,
    kgLost,
    sessionsCompleted,
    exerciseMinutes,
    reward: kgLost >= 4 ? kgLost * 50 : 0,
  };
};

