export type Participant = {
  slug: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  tint: string;
};

export type ActivitySession = {
  id: string;
  participantSlug: string;
  sessionDate: string;
  activityType: string;
  minutes: number;
  note: string;
  createdAt: string;
};

export type PrivateWeight = {
  id: string;
  participantSlug: string;
  recordedDate: string;
  weightKg: number;
};

export type WeeklyResult = {
  participantSlug: string;
  weekNumber: number;
  weekEnd: string;
  weightKg: number;
  weeklyChangeKg: number;
  totalLostKg: number;
};

export const participants: Participant[] = [
  { slug: "sam", name: "Sam", email: "sam@davo-five-o.local", initials: "SM", color: "#f2c94c", tint: "#fff7d6" },
  { slug: "trish", name: "Trish", email: "trish@davo-five-o.local", initials: "TR", color: "#ef8354", tint: "#fff0e9" },
  { slug: "dave", name: "Dave", email: "dave@davo-five-o.local", initials: "DV", color: "#3b82a0", tint: "#e6f4f8" },
  { slug: "emma", name: "Emma", email: "emma@davo-five-o.local", initials: "EM", color: "#8a6fd1", tint: "#f1edfb" },
  { slug: "jacob", name: "Jacob", email: "jacob@davo-five-o.local", initials: "JC", color: "#54a777", tint: "#e9f7ee" },
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

export const activityTypes = ["Gym", "Walk", "Run", "Cycle", "Swim", "Sport", "Other"];

const demoDates = ["2026-08-18", "2026-08-19", "2026-08-20", "2026-08-21"];
export const demoSessions: ActivitySession[] = participants.flatMap((person, personIndex) =>
  demoDates.slice(0, personIndex % 2 === 0 ? 4 : 3).map((date, index) => ({
    id: `demo-${person.slug}-${index}`,
    participantSlug: person.slug,
    sessionDate: date,
    activityType: activityTypes[(personIndex + index) % 6],
    minutes: 35 + ((personIndex + index) % 4) * 10,
    note: index === 2 ? "Good session — feeling stronger!" : "",
    createdAt: `${date}T${String(18 - index).padStart(2, "0")}:15:00+12:00`,
  })),
);

const demoWeightValues: Record<string, number[]> = {
  sam: [92.4, 91.7, 91.1, 90.8, 90.6],
  trish: [79.6, 79.1, 78.4, 78.1],
  dave: [112.8, 111.5, 110.7, 110.1, 109.9],
  emma: [74.2, 73.8, 73.2, 73.0],
  jacob: [98.7, 98.0, 97.2, 96.9],
};

export const demoWeights: PrivateWeight[] = participants.flatMap((person) =>
  demoWeightValues[person.slug].map((weightKg, index) => ({
    id: `weight-${person.slug}-${index}`,
    participantSlug: person.slug,
    recordedDate: index < 3 ? challengeWeeks[index].date : demoDates[index - 3],
    weightKg,
  })),
);

export const demoReleasedResults: WeeklyResult[] = participants.flatMap((person) => {
  const values = demoWeightValues[person.slug];
  return [0, 1, 2].map((weekNumber) => ({
    participantSlug: person.slug,
    weekNumber,
    weekEnd: challengeWeeks[weekNumber].date,
    weightKg: values[weekNumber],
    weeklyChangeKg: weekNumber === 0 ? 0 : Math.round((values[weekNumber - 1] - values[weekNumber]) * 10) / 10,
    totalLostKg: Math.round((values[0] - values[weekNumber]) * 10) / 10,
  }));
});

export const formatChallengeDate = (isoDate: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-NZ", options ?? { day: "numeric", month: "short" }).format(
    new Date(`${isoDate}T12:00:00+12:00`),
  );

export const roundOne = (value: number) => Math.round(value * 10) / 10;

export const getReleasedStats = (
  results: WeeklyResult[],
  sessions: ActivitySession[],
  participantSlug: string,
) => {
  const rows = results
    .filter((row) => row.participantSlug === participantSlug)
    .sort((a, b) => a.weekNumber - b.weekNumber);
  const latest = rows.at(-1);
  const personSessions = sessions.filter((row) => row.participantSlug === participantSlug);
  const sessionsCompleted = personSessions.length;
  const exerciseMinutes = personSessions.reduce((sum, row) => sum + row.minutes, 0);
  const kgLost = Math.max(0, latest?.totalLostKg ?? 0);
  return {
    latestWeek: latest?.weekNumber ?? 0,
    kgLost,
    sessionsCompleted,
    exerciseMinutes,
    reward: kgLost >= 4 ? kgLost * 50 : 0,
  };
};
