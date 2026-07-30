"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownRight,
  CalendarDays,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  HeartPulse,
  LockKeyhole,
  LogOut,
  Medal,
  Menu,
  Scale,
  Sparkles,
  Target,
  Trophy,
  X,
} from "lucide-react";
import {
  challengeWeeks,
  demoCheckIns,
  formatChallengeDate,
  getParticipantCheckIns,
  getParticipantStats,
  participants,
  roundOne,
  type CheckIn,
  type Participant,
} from "./lib/challenge";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type AppSection = "overview" | "check-in" | "standings";
type LeaderboardMetric = "weight" | "sessions";

type RemoteParticipant = {
  id: string;
  slug: string;
  display_name: string;
  color: string;
};

const today = new Date();
const challengeStart = new Date("2026-08-01T00:00:00+12:00");
const challengeEnd = new Date("2026-09-19T23:59:59+12:00");

const getActualDay = () => {
  if (today < challengeStart) return 0;
  if (today > challengeEnd) return 50;
  return Math.min(
    50,
    Math.floor((today.getTime() - challengeStart.getTime()) / 86_400_000) + 1,
  );
};

function FiveOLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`five-o-logo ${compact ? "five-o-logo--compact" : ""}`}>
      <span>FIVE-O</span>
      <strong>50</strong>
      <small>CHALLENGE</small>
    </div>
  );
}

function Avatar({
  participant,
  size = "medium",
}: {
  participant: Participant;
  size?: "small" | "medium" | "large";
}) {
  return (
    <span
      className={`avatar avatar--${size}`}
      style={{
        backgroundColor: participant.tint,
        color: participant.color,
        borderColor: `${participant.color}55`,
      }}
      aria-hidden="true"
    >
      {participant.initials}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  detail,
  tone = "navy",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone?: "navy" | "yellow" | "coral" | "green";
}) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__icon">{icon}</div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{detail}</span>
      </div>
    </article>
  );
}

function LoginScreen({
  onDemoLogin,
  onRemoteLogin,
  loading,
  error,
}: {
  onDemoLogin: (participant: Participant) => void;
  onRemoteLogin: (participant: Participant, password: string) => void;
  loading: boolean;
  error: string;
}) {
  const [selected, setSelected] = useState<Participant>(participants[0]);
  const [password, setPassword] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSupabaseConfigured) {
      onRemoteLogin(selected, password);
    } else {
      onDemoLogin(selected);
    }
  };

  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="login-story__top">
          <FiveOLogo />
          <span className="eyebrow eyebrow--light">
            <Sparkles size={15} /> Family fitness, made fun
          </span>
          <h1>
            50 days.
            <br />
            Five competitors.
            <br />
            <em>One big finish.</em>
          </h1>
          <p>
            Track every weigh-in, log your exercise sessions, and keep the whole
            family moving toward 19 September.
          </p>
          <div className="login-story__facts">
            <span>
              <CalendarDays size={18} /> 1 Aug — 19 Sep
            </span>
            <span>
              <Trophy size={18} /> $50 per kg*
            </span>
            <span>
              <Dumbbell size={18} /> 30+ min sessions
            </span>
          </div>
        </div>
        <Image
          src="/images/davo-hero-mascot.webp"
          alt="A cheerful illustrated athlete flexing both arms"
          className="login-mascot"
          width={1254}
          height={1254}
          priority
          unoptimized
        />
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <span className="eyebrow">Davo Five-O Challenge</span>
          <h2>Who&apos;s checking in?</h2>
          <p className="login-panel__intro">
            Pick your profile to open your personal dashboard.
          </p>

          {!isSupabaseConfigured && (
            <div className="preview-notice">
              <Sparkles size={17} />
              <div>
                <strong>Preview mode</strong>
                <span>Sample data is loaded so you can test every feature.</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="profile-grid" role="radiogroup" aria-label="Choose profile">
              {participants.map((participant) => (
                <button
                  type="button"
                  key={participant.slug}
                  className={`profile-choice ${
                    selected.slug === participant.slug ? "is-selected" : ""
                  }`}
                  onClick={() => setSelected(participant)}
                  role="radio"
                  aria-checked={selected.slug === participant.slug}
                >
                  <Avatar participant={participant} />
                  <span>{participant.name}</span>
                  <i>{selected.slug === participant.slug && <Check size={14} />}</i>
                </button>
              ))}
            </div>

            {isSupabaseConfigured && (
              <label className="field">
                <span>Password</span>
                <div className="input-with-icon">
                  <LockKeyhole size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </label>
            )}

            {error && <p className="form-error">{error}</p>}

            <button className="primary-button primary-button--wide" disabled={loading}>
              {loading
                ? "Opening dashboard..."
                : isSupabaseConfigured
                  ? `Sign in as ${selected.name}`
                  : `Preview as ${selected.name}`}
              {!loading && <ChevronRight size={19} />}
            </button>
          </form>

          <p className="fine-print">
            *Minimum 4 kg total loss to qualify for the per-kilo reward.
          </p>
        </div>
      </section>
    </main>
  );
}

function CheckInModal({
  participant,
  checkIns,
  initialWeek,
  onClose,
  onSave,
  saving,
}: {
  participant: Participant;
  checkIns: CheckIn[];
  initialWeek: number;
  onClose: () => void;
  onSave: (checkIn: CheckIn) => void;
  saving: boolean;
}) {
  const [weekNumber, setWeekNumber] = useState(initialWeek);
  const existing = checkIns.find(
    (row) =>
      row.participantSlug === participant.slug && row.weekNumber === weekNumber,
  );
  const [weight, setWeight] = useState(existing?.weightKg.toString() ?? "");
  const [sessions, setSessions] = useState(
    existing?.exerciseSessions.toString() ?? "",
  );
  const [minutes, setMinutes] = useState(
    existing?.exerciseMinutes.toString() ?? "",
  );
  const [energy, setEnergy] = useState(existing?.energy ?? 3);
  const [note, setNote] = useState(existing?.note ?? "");

  const selectWeek = (nextWeekNumber: number) => {
    const row = checkIns.find(
      (item) =>
        item.participantSlug === participant.slug &&
        item.weekNumber === nextWeekNumber,
    );
    setWeekNumber(nextWeekNumber);
    setWeight(row?.weightKg.toString() ?? "");
    setSessions(row?.exerciseSessions.toString() ?? "");
    setMinutes(row?.exerciseMinutes.toString() ?? "");
    setEnergy(row?.energy ?? 3);
    setNote(row?.note ?? "");
  };

  const selectedWeek = challengeWeeks[weekNumber];
  const isBaseline = weekNumber === 0;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSave({
      participantSlug: participant.slug,
      weekNumber,
      weighInDate: selectedWeek.date,
      weightKg: Number(weight),
      exerciseSessions: isBaseline ? 0 : Number(sessions),
      exerciseMinutes: isBaseline ? 0 : Number(minutes),
      energy,
      note,
    });
  };

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="check-in-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="check-in-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">Saturday check-in</span>
            <h2 id="check-in-heading">Log your progress</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close check-in">
            <X size={21} />
          </button>
        </div>

        <div className="week-selector" role="tablist" aria-label="Choose challenge week">
          {challengeWeeks.map((week) => (
            <button
              key={week.weekNumber}
              type="button"
              className={weekNumber === week.weekNumber ? "is-active" : ""}
              onClick={() => selectWeek(week.weekNumber)}
              role="tab"
              aria-selected={weekNumber === week.weekNumber}
            >
              {week.shortLabel}
            </button>
          ))}
        </div>

        <div className="selected-week">
          <CalendarDays size={18} />
          <div>
            <strong>{selectedWeek.label} weigh-in</strong>
            <span>Saturday {formatChallengeDate(selectedWeek.date)}</span>
          </div>
        </div>

        <form className="check-in-form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Weight (kg)</span>
            <div className="input-with-suffix">
              <input
                type="number"
                inputMode="decimal"
                min="30"
                max="300"
                step="0.1"
                value={weight}
                onChange={(event) => setWeight(event.target.value)}
                placeholder="e.g. 89.4"
                required
              />
              <strong>kg</strong>
            </div>
          </label>

          {!isBaseline && (
            <div className="form-row">
              <label className="field">
                <span>Exercise sessions</span>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="30"
                    value={sessions}
                    onChange={(event) => setSessions(event.target.value)}
                    placeholder="0"
                    required
                  />
                  <strong>30+ min</strong>
                </div>
              </label>
              <label className="field">
                <span>Total active minutes</span>
                <div className="input-with-suffix">
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    max="3000"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                    placeholder="0"
                    required
                  />
                  <strong>min</strong>
                </div>
              </label>
            </div>
          )}

          {!isBaseline && (
            <fieldset className="energy-field">
              <legend>How did you feel this week?</legend>
              <div>
                {["Rough", "Low", "Okay", "Good", "Great"].map((label, index) => (
                  <button
                    type="button"
                    key={label}
                    className={energy === index + 1 ? "is-active" : ""}
                    onClick={() => setEnergy(index + 1)}
                  >
                    <span>{["😮‍💨", "😕", "🙂", "💪", "🔥"][index]}</span>
                    <small>{label}</small>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          <label className="field">
            <span>Weekly note <em>optional</em></span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="What went well? What will you focus on next week?"
              rows={3}
              maxLength={240}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary-button" disabled={saving}>
              {saving ? "Saving..." : existing ? "Update check-in" : "Submit check-in"}
              {!saving && <Check size={18} />}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function ChallengeApp() {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>(demoCheckIns);
  const [remoteParticipants, setRemoteParticipants] = useState<
    Record<string, RemoteParticipant>
  >({});
  const [section, setSection] = useState<AppSection>("overview");
  const [leaderboardMetric, setLeaderboardMetric] =
    useState<LeaderboardMetric>("weight");
  const [menuOpen, setMenuOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadRemoteData = async () => {
    if (!supabase) return;
    const [{ data: participantRows, error: participantError }, { data: checkInRows, error: checkInError }] =
      await Promise.all([
        supabase.from("participants").select("id, slug, display_name, color"),
        supabase
          .from("check_ins")
          .select(
            "participant_id, week_number, weigh_in_date, weight_kg, exercise_sessions, exercise_minutes, energy, note",
          ),
      ]);

    if (participantError || checkInError) {
      throw participantError ?? checkInError;
    }

    const bySlug = Object.fromEntries(
      (participantRows as RemoteParticipant[]).map((participant) => [
        participant.slug,
        participant,
      ]),
    );
    const slugById = Object.fromEntries(
      (participantRows as RemoteParticipant[]).map((participant) => [
        participant.id,
        participant.slug,
      ]),
    );

    setRemoteParticipants(bySlug);
    setCheckIns(
      (checkInRows ?? []).map((row) => ({
        participantSlug: slugById[row.participant_id],
        weekNumber: row.week_number,
        weighInDate: row.weigh_in_date,
        weightKg: Number(row.weight_kg),
        exerciseSessions: row.exercise_sessions,
        exerciseMinutes: row.exercise_minutes,
        energy: row.energy,
        note: row.note ?? "",
      })),
    );
  };

  const remoteLogin = async (participant: Participant, password: string) => {
    if (!supabase) return;
    setLoginLoading(true);
    setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: participant.email,
      password,
    });
    if (signInError) {
      setError("That password didn’t work. Please try again.");
      setLoginLoading(false);
      return;
    }
    try {
      await loadRemoteData();
      setCurrentUser(participant);
    } catch {
      setError("Signed in, but the challenge data could not be loaded.");
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null);
    setSection("overview");
    setMenuOpen(false);
    if (!isSupabaseConfigured) setCheckIns(demoCheckIns);
  };

  const saveCheckIn = async (checkIn: CheckIn) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      if (supabase) {
        const remoteParticipant = remoteParticipants[currentUser.slug];
        if (!remoteParticipant) throw new Error("Participant profile not found");
        const { error: saveError } = await supabase.from("check_ins").upsert(
          {
            participant_id: remoteParticipant.id,
            week_number: checkIn.weekNumber,
            weigh_in_date: checkIn.weighInDate,
            weight_kg: checkIn.weightKg,
            exercise_sessions: checkIn.exerciseSessions,
            exercise_minutes: checkIn.exerciseMinutes,
            energy: checkIn.energy,
            note: checkIn.note,
          },
          { onConflict: "participant_id,week_number" },
        );
        if (saveError) throw saveError;
        await loadRemoteData();
      } else {
        setCheckIns((current) => [
          ...current.filter(
            (row) =>
              !(
                row.participantSlug === checkIn.participantSlug &&
                row.weekNumber === checkIn.weekNumber
              ),
          ),
          checkIn,
        ]);
      }
      setCheckInOpen(false);
      setToast(`${challengeWeeks[checkIn.weekNumber].label} saved — nice work!`);
    } catch {
      setToast("That check-in could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const statsByPerson = useMemo(
    () =>
      Object.fromEntries(
        participants.map((participant) => [
          participant.slug,
          getParticipantStats(checkIns, participant.slug),
        ]),
      ),
    [checkIns],
  );

  const leaderboard = useMemo(
    () =>
      [...participants].sort((a, b) =>
        leaderboardMetric === "weight"
          ? statsByPerson[b.slug].kgLost - statsByPerson[a.slug].kgLost
          : statsByPerson[b.slug].sessionsCompleted -
            statsByPerson[a.slug].sessionsCompleted,
      ),
    [leaderboardMetric, statsByPerson],
  );

  const weightChartData = useMemo(
    () =>
      challengeWeeks.map((week) => {
        const row: Record<string, string | number | null> = {
          week: week.shortLabel,
        };
        participants.forEach((participant) => {
          const participantRows = getParticipantCheckIns(checkIns, participant.slug);
          const baseline = participantRows.find((item) => item.weekNumber === 0);
          const current = participantRows.find(
            (item) => item.weekNumber === week.weekNumber,
          );
          row[participant.slug] =
            baseline && current
              ? Math.max(0, roundOne(baseline.weightKg - current.weightKg))
              : null;
        });
        return row;
      }),
    [checkIns],
  );

  const sessionChartData = useMemo(
    () =>
      challengeWeeks.slice(1).map((week) => {
        const row: Record<string, string | number> = { week: week.shortLabel };
        participants.forEach((participant) => {
          row[participant.slug] =
            checkIns.find(
              (item) =>
                item.participantSlug === participant.slug &&
                item.weekNumber === week.weekNumber,
            )?.exerciseSessions ?? 0;
        });
        return row;
      }),
    [checkIns],
  );

  if (!currentUser) {
    return (
      <LoginScreen
        onDemoLogin={setCurrentUser}
        onRemoteLogin={remoteLogin}
        loading={loginLoading}
        error={error}
      />
    );
  }

  const userStats = statsByPerson[currentUser.slug];
  const userRows = getParticipantCheckIns(checkIns, currentUser.slug);
  const latestWeek = userStats.latestWeek;
  const suggestedWeek = Math.min(7, latestWeek + 1);
  const displayDay = isSupabaseConfigured ? getActualDay() : 22;
  const daysRemaining = Math.max(0, 50 - displayDay);
  const progress = Math.min(100, (displayDay / 50) * 100);
  const nextWeek = challengeWeeks[Math.min(7, suggestedWeek)];
  const leadingWeight = [...participants].sort(
    (a, b) => statsByPerson[b.slug].kgLost - statsByPerson[a.slug].kgLost,
  )[0];
  const leadingSessions = [...participants].sort(
    (a, b) =>
      statsByPerson[b.slug].sessionsCompleted -
      statsByPerson[a.slug].sessionsCompleted,
  )[0];

  const navigate = (nextSection: AppSection) => {
    setSection(nextSection);
    setMenuOpen(false);
    if (nextSection === "check-in") {
      setCheckInOpen(true);
      setSection("overview");
    }
  };

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <button
            className="brand-button"
            onClick={() => navigate("overview")}
            aria-label="Go to overview"
          >
            <FiveOLogo compact />
            <span>
              Davo Five-O
              <small>Family challenge</small>
            </span>
          </button>

          <nav className={menuOpen ? "is-open" : ""} aria-label="Main navigation">
            <button
              className={section === "overview" ? "is-active" : ""}
              onClick={() => navigate("overview")}
            >
              Overview
            </button>
            <button onClick={() => navigate("check-in")}>Weekly check-in</button>
            <button
              className={section === "standings" ? "is-active" : ""}
              onClick={() => navigate("standings")}
            >
              Standings
            </button>
          </nav>

          <div className="header-actions">
            {!isSupabaseConfigured && <span className="demo-pill">Demo</span>}
            <button className="user-menu" onClick={logout} title="Sign out">
              <Avatar participant={currentUser} size="small" />
              <span>{currentUser.name}</span>
              <LogOut size={16} />
            </button>
            <button
              className="mobile-menu-button"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard">
        {section === "overview" ? (
          <>
            <section className="challenge-hero">
              <div className="challenge-hero__content">
                <span className="eyebrow eyebrow--light">
                  {isSupabaseConfigured ? "The challenge is on" : "Sample week 3 preview"}
                </span>
                <h1>
                  Kia ora, {currentUser.name}.
                  <br />
                  <em>Keep the streak alive.</em>
                </h1>
                <p>
                  Every session counts. Log your Saturday weigh-in and see how
                  the family is tracking across all 50 days.
                </p>
                <button className="hero-button" onClick={() => setCheckInOpen(true)}>
                  <Scale size={19} />
                  Log {nextWeek.label.toLowerCase()}
                  <ChevronRight size={18} />
                </button>
              </div>

              <div className="challenge-hero__progress">
                <div className="day-orbit">
                  <span>DAY</span>
                  <strong>{displayDay}</strong>
                  <small>OF 50</small>
                </div>
                <div className="hero-progress-copy">
                  <strong>{daysRemaining} days to go</strong>
                  <span>Final weigh-in · Saturday 19 September</span>
                  <div className="progress-track">
                    <i style={{ width: `${progress}%` }} />
                  </div>
                </div>
              </div>

              <Image
                src="/images/davo-hero-mascot.webp"
                alt=""
                className="dashboard-mascot"
                width={1254}
                height={1254}
                unoptimized
              />
            </section>

            <section className="stats-grid" aria-label="Your challenge statistics">
              <StatCard
                icon={<ArrowDownRight size={22} />}
                label="Weight lost"
                value={`${userStats.kgLost.toFixed(1)} kg`}
                detail={`${Math.max(0, 4 - userStats.kgLost).toFixed(1)} kg to reward eligibility`}
                tone="yellow"
              />
              <StatCard
                icon={<Dumbbell size={22} />}
                label="Exercise sessions"
                value={`${userStats.sessionsCompleted}`}
                detail={`${userStats.exerciseMinutes} active minutes`}
                tone="navy"
              />
              <StatCard
                icon={<Flame size={22} />}
                label="Check-in streak"
                value={`${Math.max(0, userRows.length - 1)} weeks`}
                detail={`${Math.max(0, 7 - latestWeek)} weekly check-ins left`}
                tone="coral"
              />
              <StatCard
                icon={<Trophy size={22} />}
                label="Reward earned"
                value={`$${userStats.reward.toFixed(0)}`}
                detail={
                  userStats.kgLost >= 4
                    ? "You’ve crossed the 4 kg minimum"
                    : "Unlocks once you reach 4 kg"
                }
                tone="green"
              />
            </section>

            <section className="dashboard-grid">
              <article className="panel panel--leaderboard">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">Friendly competition</span>
                    <h2>Family leaderboard</h2>
                  </div>
                  <div className="metric-toggle">
                    <button
                      className={leaderboardMetric === "weight" ? "is-active" : ""}
                      onClick={() => setLeaderboardMetric("weight")}
                    >
                      Kg lost
                    </button>
                    <button
                      className={leaderboardMetric === "sessions" ? "is-active" : ""}
                      onClick={() => setLeaderboardMetric("sessions")}
                    >
                      Sessions
                    </button>
                  </div>
                </div>

                <div className="leaderboard">
                  {leaderboard.map((participant, index) => {
                    const participantStats = statsByPerson[participant.slug];
                    const maxValue =
                      leaderboardMetric === "weight"
                        ? Math.max(...participants.map((p) => statsByPerson[p.slug].kgLost))
                        : Math.max(
                            ...participants.map(
                              (p) => statsByPerson[p.slug].sessionsCompleted,
                            ),
                          );
                    const value =
                      leaderboardMetric === "weight"
                        ? participantStats.kgLost
                        : participantStats.sessionsCompleted;
                    return (
                      <div
                        className={`leaderboard-row ${
                          participant.slug === currentUser.slug ? "is-you" : ""
                        }`}
                        key={participant.slug}
                      >
                        <span className={`rank rank--${index + 1}`}>
                          {index < 3 ? <Medal size={18} /> : index + 1}
                        </span>
                        <Avatar participant={participant} size="small" />
                        <div className="leaderboard-person">
                          <strong>
                            {participant.name}
                            {participant.slug === currentUser.slug && <small>You</small>}
                          </strong>
                          <div className="mini-track">
                            <i
                              style={{
                                width: `${maxValue ? (value / maxValue) * 100 : 0}%`,
                                backgroundColor: participant.color,
                              }}
                            />
                          </div>
                        </div>
                        <strong className="leaderboard-value">
                          {leaderboardMetric === "weight"
                            ? `${participantStats.kgLost.toFixed(1)} kg`
                            : participantStats.sessionsCompleted}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              </article>

              <article className="panel next-check-in">
                <div className="next-check-in__icon">
                  <CalendarDays size={25} />
                </div>
                <span className="eyebrow">Coming up</span>
                <h2>{nextWeek.label} check-in</h2>
                <p>Saturday {formatChallengeDate(nextWeek.date)}</p>
                <ul>
                  <li>
                    <Check size={15} /> Record your weight
                  </li>
                  <li>
                    <Check size={15} /> Count 30+ minute sessions
                  </li>
                  <li>
                    <Check size={15} /> Add active minutes
                  </li>
                </ul>
                <button className="primary-button" onClick={() => setCheckInOpen(true)}>
                  Fill it in now <ChevronRight size={17} />
                </button>
              </article>
            </section>

            <section className="charts-grid">
              <article className="panel chart-panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">Progress over time</span>
                    <h2>Cumulative weight lost</h2>
                  </div>
                  <span className="unit-pill">Kilograms</span>
                </div>
                <div className="chart-wrap" aria-label="Cumulative weight loss chart">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightChartData} margin={{ top: 14, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 7" stroke="#dfe5e7" vertical={false} />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#657477", fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: "#657477", fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #dfe5e7" }} />
                        <Legend iconType="circle" iconSize={8} />
                        {participants.map((participant) => (
                          <Line
                            key={participant.slug}
                            type="monotone"
                            dataKey={participant.slug}
                            name={participant.name}
                            stroke={participant.color}
                            strokeWidth={participant.slug === currentUser.slug ? 3.5 : 2}
                            dot={{ r: participant.slug === currentUser.slug ? 4 : 3 }}
                            connectNulls={false}
                          />
                        ))}
                      </LineChart>
                    </ResponsiveContainer>
                </div>
              </article>

              <article className="panel chart-panel">
                <div className="panel-header">
                  <div>
                    <span className="eyebrow">Week by week</span>
                    <h2>Exercise sessions</h2>
                  </div>
                  <span className="unit-pill">30+ minutes</span>
                </div>
                <div className="chart-wrap" aria-label="Weekly exercise sessions chart">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sessionChartData} margin={{ top: 14, right: 8, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="4 7" stroke="#dfe5e7" vertical={false} />
                        <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#657477", fontSize: 12 }} />
                        <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#657477", fontSize: 12 }} />
                        <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #dfe5e7" }} />
                        <Legend iconType="circle" iconSize={8} />
                        {participants.map((participant) => (
                          <Bar
                            key={participant.slug}
                            dataKey={participant.slug}
                            name={participant.name}
                            fill={participant.color}
                            radius={[5, 5, 0, 0]}
                            maxBarSize={15}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                </div>
              </article>
            </section>

            <section className="timeline-panel panel">
              <div className="panel-header">
                <div>
                  <span className="eyebrow">The road to day 50</span>
                  <h2>Challenge timeline</h2>
                </div>
                <span className="timeline-total">{userRows.length}/8 weigh-ins logged</span>
              </div>
              <div className="timeline">
                {challengeWeeks.map((week) => {
                  const completed = userRows.some(
                    (row) => row.weekNumber === week.weekNumber,
                  );
                  const isNext = week.weekNumber === suggestedWeek;
                  return (
                    <button
                      key={week.weekNumber}
                      className={`${completed ? "is-complete" : ""} ${
                        isNext ? "is-next" : ""
                      }`}
                      onClick={() => setCheckInOpen(true)}
                    >
                      <span>{completed ? <Check size={16} /> : week.weekNumber}</span>
                      <strong>{week.label}</strong>
                      <small>{formatChallengeDate(week.date)}</small>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="motivation-strip">
              <div className="motivation-strip__icon">
                <HeartPulse size={26} />
              </div>
              <div>
                <span className="eyebrow eyebrow--light">Why we&apos;re doing it</span>
                <h2>Stronger for the op. Stronger for recovery.</h2>
                <p>
                  Fifty days is tough, but this family is tougher. Keep showing up
                  for Dave—and for yourself.
                </p>
              </div>
              <div className="leaders-mini">
                <span>
                  <Scale size={18} />
                  Weight leader <strong>{leadingWeight.name}</strong>
                </span>
                <span>
                  <Dumbbell size={18} />
                  Session leader <strong>{leadingSessions.name}</strong>
                </span>
              </div>
            </section>
          </>
        ) : (
          <StandingsView
            checkIns={checkIns}
            statsByPerson={statsByPerson}
            currentUser={currentUser}
          />
        )}
      </main>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <button
          className={section === "overview" ? "is-active" : ""}
          onClick={() => navigate("overview")}
        >
          <Target size={20} />
          Overview
        </button>
        <button className="mobile-check-in-button" onClick={() => navigate("check-in")}>
          <Scale size={23} />
          Check-in
        </button>
        <button
          className={section === "standings" ? "is-active" : ""}
          onClick={() => navigate("standings")}
        >
          <Trophy size={20} />
          Standings
        </button>
      </nav>

      {checkInOpen && (
        <CheckInModal
          participant={currentUser}
          checkIns={checkIns}
          initialWeek={suggestedWeek}
          onClose={() => setCheckInOpen(false)}
          onSave={saveCheckIn}
          saving={saving}
        />
      )}

      {toast && (
        <div className="toast" role="status">
          <Check size={18} /> {toast}
        </div>
      )}
    </div>
  );
}

function StandingsView({
  checkIns,
  statsByPerson,
  currentUser,
}: {
  checkIns: CheckIn[];
  statsByPerson: Record<
    string,
    {
      baselineWeight: number;
      currentWeight: number;
      latestWeek: number;
      kgLost: number;
      sessionsCompleted: number;
      exerciseMinutes: number;
      reward: number;
    }
  >;
  currentUser: Participant;
}) {
  const ranked = [...participants].sort(
    (a, b) => statsByPerson[b.slug].kgLost - statsByPerson[a.slug].kgLost,
  );
  const combinedData = challengeWeeks.map((week) => {
    const completed = checkIns.filter((row) => row.weekNumber === week.weekNumber);
    return {
      week: week.shortLabel,
      sessions: completed.reduce((sum, row) => sum + row.exerciseSessions, 0),
      minutes: completed.reduce((sum, row) => sum + row.exerciseMinutes, 0),
    };
  });

  return (
    <div className="standings-page">
      <section className="standings-heading">
        <div>
          <span className="eyebrow">Everyone, side by side</span>
          <h1>Challenge standings</h1>
          <p>
            Weight-loss progress, exercise totals, and reward eligibility across
            the whole Five-O crew.
          </p>
        </div>
        <div className="standings-heading__badge">
          <Trophy size={25} />
          <span>
            Current leader
            <strong>{ranked[0].name}</strong>
          </span>
        </div>
      </section>

      <section className="standings-cards">
        {ranked.map((participant, index) => {
          const stats = statsByPerson[participant.slug];
          return (
            <article
              key={participant.slug}
              className={participant.slug === currentUser.slug ? "is-you" : ""}
            >
              <span className={`podium-number podium-number--${index + 1}`}>
                {index + 1}
              </span>
              <Avatar participant={participant} size="large" />
              <div className="standing-person">
                <h2>
                  {participant.name}
                  {participant.slug === currentUser.slug && <small>You</small>}
                </h2>
                <span>Through {challengeWeeks[stats.latestWeek].label}</span>
              </div>
              <div className="standing-metrics">
                <span>
                  <strong>{stats.kgLost.toFixed(1)} kg</strong>
                  lost
                </span>
                <span>
                  <strong>{stats.sessionsCompleted}</strong>
                  sessions
                </span>
                <span>
                  <strong>{stats.exerciseMinutes}</strong>
                  minutes
                </span>
                <span className={stats.kgLost >= 4 ? "is-eligible" : ""}>
                  <strong>{stats.kgLost >= 4 ? `$${stats.reward}` : "Not yet"}</strong>
                  reward
                </span>
              </div>
            </article>
          );
        })}
      </section>

      <section className="charts-grid standings-charts">
        <article className="panel chart-panel">
          <div className="panel-header">
            <div>
              <span className="eyebrow">Combined effort</span>
              <h2>Family activity total</h2>
            </div>
          </div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={combinedData} margin={{ top: 12, right: 8, left: -20 }}>
                  <defs>
                    <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f2c94c" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#f2c94c" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 7" stroke="#dfe5e7" vertical={false} />
                  <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fill: "#657477", fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#657477", fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 14, border: "1px solid #dfe5e7" }} />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    name="Sessions"
                    stroke="#d5a900"
                    fill="url(#activityGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
          </div>
        </article>

        <article className="panel rewards-panel">
          <span className="eyebrow">Extra motivation</span>
          <h2>The prize picture</h2>
          <div className="reward-rule">
            <strong>$50</strong>
            <span>for every kilogram lost</span>
          </div>
          <p>Reach at least 4 kg total loss by the final weigh-in to qualify.</p>
          <div className="special-prizes">
            <span>
              <Medal size={20} /> Most kilograms lost
            </span>
            <span>
              <Dumbbell size={20} /> Most sessions completed
            </span>
          </div>
        </article>
      </section>
    </div>
  );
}
