"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Activity, CalendarDays, Check, ChevronRight, Dumbbell, Eye,
  EyeOff, Flame, Footprints, LockKeyhole, LogOut, Menu, Pencil, Plus,
  Scale, Sparkles, Trash2, Trophy, X,
} from "lucide-react";
import {
  activityTypes, challengeWeeks, demoReleasedResults, demoSessions, demoWeights,
  formatChallengeDate, getReleasedStats, isEntryOpen, participants,
  type ActivitySession, type Participant, type PrivateWeight, type WeeklyResult,
} from "./lib/challenge";
import { isSupabaseConfigured, supabase } from "./lib/supabase";

type AppSection = "overview" | "activity" | "standings";
type RemoteParticipant = { id: string; slug: string; display_name: string; color: string };

const localToday = () => {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Auckland" }).format(new Date());
  if (today < "2026-08-02") return "2026-08-02";
  if (today > "2026-09-20") return "2026-09-20";
  return today;
};

const localHour = () =>
  Number(
    new Intl.DateTimeFormat("en-NZ", {
      timeZone: "Pacific/Auckland",
      hour: "2-digit",
      hourCycle: "h23",
    }).format(new Date()),
  );

function FiveOLogo({ compact = false }: { compact?: boolean }) {
  return <div className={`five-o-logo ${compact ? "five-o-logo--compact" : ""}`}><span>FIVE-O</span><strong>50</strong><small>CHALLENGE</small></div>;
}

function Avatar({ participant, size = "medium" }: { participant: Participant; size?: "small" | "medium" | "large" }) {
  return <span className={`avatar avatar--${size}`} style={{ backgroundColor: participant.tint, color: participant.color, borderColor: `${participant.color}55` }} aria-hidden="true">{participant.initials}</span>;
}

function LoginScreen({ onDemoLogin, onRemoteLogin, loading, error }: {
  onDemoLogin: (participant: Participant) => void;
  onRemoteLogin: (participant: Participant, password: string) => void;
  loading: boolean; error: string;
}) {
  const [selected, setSelected] = useState(participants[0]);
  const [password, setPassword] = useState("");
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isSupabaseConfigured) onRemoteLogin(selected, password);
    else onDemoLogin(selected);
  };
  return (
    <main className="login-shell">
      <section className="login-story">
        <div className="login-story__top">
          <FiveOLogo />
          <span className="eyebrow eyebrow--light"><Sparkles size={15} /> Family fitness, made fun</span>
          <h1>50 days.<br />Five competitors.<br /><em>One big finish.</em></h1>
          <p>Log every session as it happens. Your weight stays private during the week, then the family reveal lands together at 10 PM Sunday.</p>
          <div className="login-story__facts"><span><CalendarDays size={18} /> 2 Aug — 20 Sep</span><span><Trophy size={18} /> $50 per kg*</span><span><Dumbbell size={18} /> 30+ min sessions</span></div>
        </div>
        <Image src="/images/davo-hero-mascot.webp" alt="A cheerful illustrated athlete flexing both arms" className="login-mascot" width={1254} height={1254} priority unoptimized />
      </section>
      <section className="login-panel"><div className="login-panel__inner">
        <span className="eyebrow">Davo Five-O Challenge</span><h2>Who&apos;s checking in?</h2>
        <p className="login-panel__intro">Pick your profile to open your personal dashboard.</p>
        {!isSupabaseConfigured && <div className="preview-notice"><Sparkles size={17} /><div><strong>Preview mode</strong><span>Sample data is loaded so you can test every feature.</span></div></div>}
        <form onSubmit={handleSubmit}>
          <div className="profile-grid" role="radiogroup" aria-label="Choose profile">
            {participants.map((person) => <button type="button" key={person.slug} className={`profile-choice ${selected.slug === person.slug ? "is-selected" : ""}`} onClick={() => setSelected(person)} role="radio" aria-checked={selected.slug === person.slug}><Avatar participant={person} /><span>{person.name}</span><i>{selected.slug === person.slug && <Check size={14} />}</i></button>)}
          </div>
          {isSupabaseConfigured && <label className="field"><span>Password</span><div className="input-with-icon"><LockKeyhole size={18} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" required /></div></label>}
          {error && <p className="form-error">{error}</p>}
          <button className="primary-button primary-button--wide" disabled={loading}>{loading ? "Opening dashboard..." : isSupabaseConfigured ? `Sign in as ${selected.name}` : `Preview as ${selected.name}`} {!loading && <ChevronRight size={19} />}</button>
        </form>
        <p className="fine-print">*Minimum 4 kg total loss to qualify for the per-kilo reward.</p>
      </div></section>
    </main>
  );
}

function SessionModal({ participant, existing, existingWeight, onClose, onSave, saving }: {
  participant: Participant; onClose: () => void;
  existing?: ActivitySession; existingWeight?: PrivateWeight;
  onSave: (session: ActivitySession, weight?: PrivateWeight) => void; saving: boolean;
}) {
  const [date, setDate] = useState(existing?.sessionDate ?? (isSupabaseConfigured ? localToday() : "2026-08-21"));
  const [activityType, setActivityType] = useState(existing?.activityType ?? "Gym");
  const [minutes, setMinutes] = useState(String(existing?.minutes ?? 30));
  const [weight, setWeight] = useState(existingWeight ? String(existingWeight.weightKg) : "");
  const [note, setNote] = useState(existing?.note ?? "");
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const id = existing?.id ??
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    onSave({
      id, participantSlug: participant.slug, sessionDate: date, activityType,
      minutes: Number(minutes), note, createdAt: `${date}T23:59:59+12:00`,
    }, weight ? { id: existingWeight?.id ?? `weight-${id}`, sessionId: id, participantSlug: participant.slug, recordedDate: date, weightKg: Number(weight) } : undefined);
  };
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="check-in-modal session-modal" role="dialog" aria-modal="true" aria-labelledby="session-heading" onMouseDown={(e) => e.stopPropagation()}>
      <div className="modal-header"><div><span className="eyebrow">{existing ? "Update your entry" : "Add one or catch up"}</span><h2 id="session-heading">{existing ? "Edit session" : "Log a session"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={21} /></button></div>
      <div className="privacy-callout"><LockKeyhole size={19} /><div><strong>Your weight stays private</strong><span>If you add it, only you can see it until the weekly Sunday reveal at 10 PM.</span></div></div>
      <form className="check-in-form" onSubmit={submit}>
        <div className="form-row">
          <label className="field"><span>Date</span><div className="input-with-suffix"><input type="date" min="2026-08-02" max={localToday()} value={date} onChange={(e) => setDate(e.target.value)} required /></div></label>
          <label className="field"><span>Activity</span><select value={activityType} onChange={(e) => setActivityType(e.target.value)}>{activityTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        </div>
        <div className="form-row">
          <label className="field"><span>Active minutes</span><div className="input-with-suffix"><input type="number" min="30" max="600" value={minutes} onChange={(e) => setMinutes(e.target.value)} required /><strong>min</strong></div></label>
          <label className="field"><span>Weight <em>optional</em></span><div className="input-with-suffix"><input type="number" inputMode="decimal" min="30" max="300" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Leave blank" /><strong>kg</strong></div></label>
        </div>
        <label className="field"><span>Session note <em>optional</em></span><textarea rows={3} maxLength={160} value={note} onChange={(e) => setNote(e.target.value)} placeholder="How did it go?" /></label>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving..." : existing ? "Save changes" : "Save session"} {!saving && <Check size={18} />}</button></div>
      </form>
    </section>
  </div>;
}

function StartingWeightModal({ existing, onClose, onSave, saving }: {
  existing?: PrivateWeight; onClose: () => void;
  onSave: (weightKg: number) => void; saving: boolean;
}) {
  const [weight, setWeight] = useState(existing ? String(existing.weightKg) : "");
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
    <section className="check-in-modal starting-weight-modal" role="dialog" aria-modal="true" aria-labelledby="starting-weight-heading" onMouseDown={(e) => e.stopPropagation()}>
      <div className="modal-header"><div><span className="eyebrow">Optional private baseline</span><h2 id="starting-weight-heading">{existing ? "Update starting weight" : "Add starting weight"}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><X size={21} /></button></div>
      <div className="privacy-callout"><LockKeyhole size={19} /><div><strong>Only you can see the number</strong><span>Your 2 August weight establishes the baseline used to calculate weight loss. The family sees only released progress.</span></div></div>
      <form className="check-in-form" onSubmit={(event) => { event.preventDefault(); onSave(Number(weight)); }}>
        <label className="field"><span>Starting weight — 2 August</span><div className="input-with-suffix"><input type="number" inputMode="decimal" min="30" max="300" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Enter weight" required autoFocus /><strong>kg</strong></div></label>
        <p className="form-helper">This is optional. You can still log exercise sessions without adding a starting weight.</p>
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" disabled={saving}>{saving ? "Saving..." : existing ? "Save changes" : "Save starting weight"} {!saving && <Check size={18} />}</button></div>
      </form>
    </section>
  </div>;
}

function StatCard({ icon, label, value, detail, tone = "navy" }: { icon: React.ReactNode; label: string; value: string; detail: string; tone?: "navy" | "yellow" | "coral" | "green" }) {
  return <article className={`stat-card stat-card--${tone}`}><div className="stat-card__icon">{icon}</div><div><p>{label}</p><strong>{value}</strong><span>{detail}</span></div></article>;
}

export default function ChallengeApp() {
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [sessions, setSessions] = useState<ActivitySession[]>(demoSessions);
  const [myWeights, setMyWeights] = useState<PrivateWeight[]>([]);
  const [releasedResults, setReleasedResults] = useState<WeeklyResult[]>(demoReleasedResults);
  const [remoteParticipants, setRemoteParticipants] = useState<Record<string, RemoteParticipant>>({});
  const [section, setSection] = useState<AppSection>("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<ActivitySession | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(""), 2800); return () => clearTimeout(timer); }, [toast]);

  const loadRemoteData = async (userSlug: string) => {
    if (!supabase) return;
    const [peopleResult, sessionsResult, weightsResult, resultsResult] = await Promise.all([
      supabase.from("participants").select("id, slug, display_name, color"),
      supabase.from("activity_sessions").select("id, participant_id, session_date, activity_type, minutes, note, created_at").order("created_at", { ascending: false }),
      supabase.from("private_weights").select("id, session_id, participant_id, recorded_date, weight_kg").order("recorded_date"),
      supabase.from("released_weekly_results").select("participant_id, week_number, week_end, weight_kg, weekly_change_kg, total_lost_kg"),
    ]);
    const loadError = peopleResult.error ?? sessionsResult.error ?? weightsResult.error ?? resultsResult.error;
    if (loadError) throw loadError;
    const people = peopleResult.data as RemoteParticipant[];
    const slugById = Object.fromEntries(people.map((person) => [person.id, person.slug]));
    setRemoteParticipants(Object.fromEntries(people.map((person) => [person.slug, person])));
    setSessions((sessionsResult.data ?? []).map((row) => ({ id: row.id, participantSlug: slugById[row.participant_id], sessionDate: row.session_date, activityType: row.activity_type, minutes: row.minutes, note: row.note ?? "", createdAt: row.created_at })));
    setMyWeights((weightsResult.data ?? []).filter((row) => slugById[row.participant_id] === userSlug).map((row) => ({ id: row.id, sessionId: row.session_id, participantSlug: userSlug, recordedDate: row.recorded_date, weightKg: Number(row.weight_kg) })));
    setReleasedResults((resultsResult.data ?? []).map((row) => ({ participantSlug: slugById[row.participant_id], weekNumber: row.week_number, weekEnd: row.week_end, weightKg: Number(row.weight_kg), weeklyChangeKg: Number(row.weekly_change_kg), totalLostKg: Number(row.total_lost_kg) })));
  };

  const remoteLogin = async (person: Participant, password: string) => {
    if (!supabase) return;
    setLoginLoading(true); setError("");
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: person.email, password });
    if (signInError) { setError("That password didn’t work. Please try again."); setLoginLoading(false); return; }
    try { await loadRemoteData(person.slug); setCurrentUser(person); } catch { setError("Signed in, but the challenge data could not be loaded."); }
    finally { setLoginLoading(false); }
  };

  const demoLogin = (person: Participant) => {
    setCurrentUser(person);
    setMyWeights(demoWeights.filter((row) => row.participantSlug === person.slug));
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setCurrentUser(null); setSection("overview"); setMenuOpen(false);
    if (!isSupabaseConfigured) { setSessions(demoSessions); setReleasedResults(demoReleasedResults); setMyWeights([]); }
  };

  const saveSession = async (session: ActivitySession, weight?: PrivateWeight) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      if (supabase) {
        const profile = remoteParticipants[currentUser.slug];
        if (!profile) throw new Error("Profile missing");
        const sessionPayload = { participant_id: profile.id, session_date: session.sessionDate, activity_type: session.activityType, minutes: session.minutes, note: session.note };
        const sessionQuery = editingSession
          ? supabase.from("activity_sessions").update(sessionPayload).eq("id", editingSession.id).select("id").single()
          : supabase.from("activity_sessions").insert(sessionPayload).select("id").single();
        const { data: savedSession, error: sessionError } = await sessionQuery;
        if (sessionError) throw sessionError;
        const linkedWeight = myWeights.find((row) => row.sessionId === session.id);
        if (weight) {
          const weightPayload = { session_id: savedSession.id, participant_id: profile.id, recorded_date: weight.recordedDate, weight_kg: weight.weightKg };
          const weightQuery = linkedWeight
            ? supabase.from("private_weights").update(weightPayload).eq("id", linkedWeight.id)
            : supabase.from("private_weights").insert(weightPayload);
          const { error: weightError } = await weightQuery;
          if (weightError) throw weightError;
        } else if (linkedWeight) {
          const { error: weightError } = await supabase.from("private_weights").delete().eq("id", linkedWeight.id);
          if (weightError) throw weightError;
        }
        await loadRemoteData(currentUser.slug);
      } else {
        setSessions((current) => editingSession ? current.map((row) => row.id === session.id ? session : row) : [session, ...current]);
        setMyWeights((current) => {
          const withoutLinked = current.filter((row) => row.sessionId !== session.id);
          return weight ? [...withoutLinked, weight].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate)) : withoutLinked;
        });
      }
      setModalOpen(false); setEditingSession(null); setToast(editingSession ? "Session updated." : weight ? "Session saved — weight recorded privately." : "Session saved — the family can see your effort!");
    } catch { setToast("That session could not be saved. Please try again."); }
    finally { setSaving(false); }
  };

  const startingWeight = myWeights.find((row) => row.recordedDate === "2026-08-02" && !row.sessionId);
  const saveStartingWeight = async (weightKg: number) => {
    if (!currentUser) return;
    setSaving(true);
    try {
      if (supabase) {
        const profile = remoteParticipants[currentUser.slug];
        if (!profile) throw new Error("Profile missing");
        const payload = { participant_id: profile.id, recorded_date: "2026-08-02", weight_kg: weightKg };
        const query = startingWeight
          ? supabase.from("private_weights").update(payload).eq("id", startingWeight.id)
          : supabase.from("private_weights").insert(payload);
        const { error: weightError } = await query;
        if (weightError) throw weightError;
        await loadRemoteData(currentUser.slug);
      } else {
        const row: PrivateWeight = { id: startingWeight?.id ?? `starting-${currentUser.slug}`, participantSlug: currentUser.slug, recordedDate: "2026-08-02", weightKg };
        setMyWeights((current) => [...current.filter((item) => item.id !== row.id), row].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate)));
      }
      setWeightModalOpen(false);
      setToast(startingWeight ? "Starting weight updated privately." : "Starting weight saved privately.");
    } catch { setToast("Starting weight can be saved from 2 August until the 10 PM lock."); }
    finally { setSaving(false); }
  };

  const editSession = (session: ActivitySession) => { setEditingSession(session); setModalOpen(true); };
  const deleteSession = async (session: ActivitySession) => {
    if (!currentUser || !window.confirm("Delete this session? This cannot be undone.")) return;
    try {
      if (supabase) {
        const { error: deleteError } = await supabase.from("activity_sessions").delete().eq("id", session.id);
        if (deleteError) throw deleteError;
        await loadRemoteData(currentUser.slug);
      } else {
        setSessions((current) => current.filter((row) => row.id !== session.id));
        setMyWeights((current) => current.filter((row) => row.sessionId !== session.id));
      }
      setToast("Session deleted.");
    } catch { setToast("That session is locked or could not be deleted."); }
  };

  const statsByPerson = useMemo(() => Object.fromEntries(participants.map((person) => [person.slug, getReleasedStats(releasedResults, sessions, person.slug)])), [releasedResults, sessions]);
  if (!currentUser) return <LoginScreen onDemoLogin={demoLogin} onRemoteLogin={remoteLogin} loading={loginLoading} error={error} />;

  const userStats = statsByPerson[currentUser.slug];
  const sortedWeights = [...myWeights].sort((a, b) => a.recordedDate.localeCompare(b.recordedDate));
  const latestPrivateWeight = sortedWeights.at(-1);
  const todayNz = localToday();
  const currentWeek = isSupabaseConfigured
    ? Math.max(
        0,
        challengeWeeks.find(
          (week) =>
            week.date > todayNz ||
            (week.date === todayNz && localHour() < 22),
        )?.weekNumber ?? 7,
      )
    : 3;
  const nextReveal = challengeWeeks[currentWeek].date;
  const userWeightChart = sortedWeights.map((row) => ({ date: formatChallengeDate(row.recordedDate, { weekday: "short", day: "numeric" }), weight: row.weightKg }));
  const activityFeed = [...sessions].sort(
    (a, b) =>
      b.sessionDate.localeCompare(a.sessionDate) ||
      b.createdAt.localeCompare(a.createdAt),
  );
  const weightChartData = challengeWeeks.map((week) => {
    const row: Record<string, string | number | null> = { week: week.shortLabel };
    participants.forEach((person) => { row[person.slug] = releasedResults.find((result) => result.participantSlug === person.slug && result.weekNumber === week.weekNumber)?.totalLostKg ?? null; });
    return row;
  });
  const sessionChartData = challengeWeeks.slice(1).map((week, index) => {
    const start = challengeWeeks[index].date;
    const row: Record<string, string | number> = { week: week.shortLabel };
    participants.forEach((person) => { row[person.slug] = sessions.filter((session) => session.participantSlug === person.slug && session.sessionDate > start && session.sessionDate <= week.date).length; });
    return row;
  });
  const ranked = [...participants].sort((a, b) => statsByPerson[b.slug].kgLost - statsByPerson[a.slug].kgLost);

  const navigate = (next: AppSection) => { setSection(next); setMenuOpen(false); };
  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <button className="brand-button" onClick={() => navigate("overview")}><FiveOLogo compact /><span>Davo Five-O<small>Family challenge</small></span></button>
      <nav className={menuOpen ? "is-open" : ""} aria-label="Main navigation">
        <button className={section === "overview" ? "is-active" : ""} onClick={() => navigate("overview")}>Overview</button>
        <button className={section === "activity" ? "is-active" : ""} onClick={() => navigate("activity")}>Activity feed</button>
        <button className={section === "standings" ? "is-active" : ""} onClick={() => navigate("standings")}>Standings</button>
      </nav>
      <div className="header-actions">{!isSupabaseConfigured && <span className="demo-pill">Demo</span>}<button className="user-menu" onClick={logout}><Avatar participant={currentUser} size="small" /><span>{currentUser.name}</span><LogOut size={16} /></button><button className="mobile-menu-button" onClick={() => setMenuOpen((value) => !value)}>{menuOpen ? <X size={22} /> : <Menu size={22} />}</button></div>
    </div></header>
    <main className="dashboard">
      {section === "overview" && <>
        <section className="challenge-hero">
          <div className="challenge-hero__content"><span className="eyebrow eyebrow--light">Your week, your numbers</span><h1>Kia ora, {currentUser.name}.<br /><em>Keep moving.</em></h1><p>Log each 30+ minute session as you finish it, or catch up before Sunday&apos;s 10 PM lock. Your optional starting weight is entered separately and stays private.</p><div className="hero-actions"><button className="hero-button" onClick={() => { setEditingSession(null); setModalOpen(true); }}><Plus size={19} /> Log a session <ChevronRight size={18} /></button><button className="hero-button hero-button--secondary" onClick={() => setWeightModalOpen(true)}><Scale size={18} /> {startingWeight ? "Edit starting weight" : "Add starting weight"}</button></div></div>
          <div className="challenge-hero__progress reveal-card"><div className="day-orbit"><EyeOff size={18} /><strong>W{currentWeek}</strong><small>PRIVATE</small></div><div className="hero-progress-copy"><strong>Next family reveal</strong><span>10 PM Sunday {formatChallengeDate(nextReveal)} · everyone&apos;s results unlock together</span><div className="progress-track"><i style={{ width: "72%" }} /></div></div></div>
          <Image src="/images/davo-hero-mascot.webp" alt="" className="dashboard-mascot" width={1254} height={1254} unoptimized />
        </section>
        <section className="stats-grid">
          <StatCard icon={<Scale size={22} />} label="My latest weight" value={latestPrivateWeight ? `${latestPrivateWeight.weightKg.toFixed(1)} kg` : "Not logged"} detail="Private until 10 PM Sunday" tone="yellow" />
          <StatCard icon={<Dumbbell size={22} />} label="My sessions" value={`${userStats.sessionsCompleted}`} detail={`${userStats.exerciseMinutes} active minutes`} tone="navy" />
          <StatCard icon={<Flame size={22} />} label="Released loss" value={`${userStats.kgLost.toFixed(1)} kg`} detail={`Results through ${challengeWeeks[userStats.latestWeek].label}`} tone="coral" />
          <StatCard icon={<Trophy size={22} />} label="Reward earned" value={`$${userStats.reward.toFixed(0)}`} detail={userStats.kgLost >= 4 ? "You are eligible!" : `${Math.max(0, 4 - userStats.kgLost).toFixed(1)} kg until eligible`} tone="green" />
        </section>
        <section className="privacy-banner"><LockKeyhole size={22} /><div><strong>Your in-week weight is for your eyes only</strong><span>The activity feed shows that you trained, but never shows the weight you entered. Weekly changes are revealed at 10 PM Sunday.</span></div><span className="privacy-badge"><Eye size={15} /> You only</span></section>
        <section className="charts-grid">
          <article className="panel chart-panel"><div className="panel-header"><div><span className="eyebrow">Private view</span><h2>My weight this week</h2></div><span className="private-pill"><LockKeyhole size={14} /> Only you</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={userWeightChart} margin={{ top: 12, right: 12, left: -12 }}><CartesianGrid strokeDasharray="4 7" stroke="#dfe5e7" vertical={false} /><XAxis dataKey="date" axisLine={false} tickLine={false} /><YAxis domain={["dataMin - 1", "dataMax + 1"]} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ borderRadius: 14 }} /><Line type="monotone" dataKey="weight" name="Weight (kg)" stroke={currentUser.color} strokeWidth={3} dot={{ r: 4 }} /></LineChart></ResponsiveContainer></div></article>
          <ActivityFeed sessions={activityFeed.slice(0, 6)} currentUser={currentUser} onEdit={editSession} onDelete={deleteSession} />
        </section>
      </>}
      {section === "activity" && <div className="activity-page"><section className="standings-heading"><div><span className="eyebrow">Live family effort</span><h1>Activity feed</h1><p>Log sessions as they happen or catch up later in the same open week. Weight entries remain completely private.</p></div><button className="primary-button" onClick={() => { setEditingSession(null); setModalOpen(true); }}><Plus size={18} /> Log a session</button></section><ActivityFeed sessions={activityFeed} currentUser={currentUser} full onEdit={editSession} onDelete={deleteSession} /></div>}
      {section === "standings" && <div className="standings-page">
        <section className="standings-heading"><div><span className="eyebrow">Released results only</span><h1>Challenge standings</h1><p>Weight rankings update together at 10 PM each Sunday. Activity totals stay live all week.</p></div><div className="standings-heading__badge"><EyeOff size={24} /><span>Next reveal<strong>10 PM · {formatChallengeDate(nextReveal)}</strong></span></div></section>
        <section className="standings-cards">{ranked.map((person, index) => { const stats = statsByPerson[person.slug]; return <article key={person.slug} className={person.slug === currentUser.slug ? "is-you" : ""}><span className={`podium-number podium-number--${index + 1}`}>{index + 1}</span><Avatar participant={person} size="large" /><div className="standing-person"><h2>{person.name}{person.slug === currentUser.slug && <small>You</small>}</h2><span>Weight through {challengeWeeks[stats.latestWeek].label}</span></div><div className="standing-metrics"><span><strong>{stats.kgLost.toFixed(1)} kg</strong>released loss</span><span><strong>{stats.sessionsCompleted}</strong>live sessions</span><span><strong>{stats.exerciseMinutes}</strong>minutes</span><span className={stats.kgLost >= 4 ? "is-eligible" : ""}><strong>{stats.kgLost >= 4 ? `$${stats.reward}` : "Not yet"}</strong>reward</span></div></article>; })}</section>
        <section className="charts-grid standings-charts">
          <article className="panel chart-panel"><div className="panel-header"><div><span className="eyebrow">Sunday reveals</span><h2>Cumulative weight loss</h2></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={weightChartData} margin={{ top: 12, right: 12, left: -20 }}><CartesianGrid strokeDasharray="4 7" stroke="#dfe5e7" vertical={false} /><XAxis dataKey="week" axisLine={false} tickLine={false} /><YAxis axisLine={false} tickLine={false} unit=" kg" /><Tooltip /><Legend />{participants.map((person) => <Line key={person.slug} type="monotone" dataKey={person.slug} name={person.name} stroke={person.color} strokeWidth={3} connectNulls={false} />)}</LineChart></ResponsiveContainer></div></article>
          <article className="panel chart-panel"><div className="panel-header"><div><span className="eyebrow">Live all week</span><h2>Exercise sessions</h2></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={sessionChartData} margin={{ top: 12, right: 8, left: -20 }}><CartesianGrid strokeDasharray="4 7" stroke="#dfe5e7" vertical={false} /><XAxis dataKey="week" axisLine={false} tickLine={false} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} /><Tooltip /><Legend />{participants.map((person) => <Bar key={person.slug} dataKey={person.slug} name={person.name} fill={person.color} radius={[4, 4, 0, 0]} />)}</BarChart></ResponsiveContainer></div></article>
        </section>
      </div>}
    </main>
    <nav className="mobile-bottom-nav"><button className={section === "overview" ? "is-active" : ""} onClick={() => navigate("overview")}><Scale size={19} />Home</button><button className="mobile-add" onClick={() => { setEditingSession(null); setModalOpen(true); }}><Plus size={24} /></button><button className={section === "activity" ? "is-active" : ""} onClick={() => navigate("activity")}><Activity size={19} />Feed</button><button className={section === "standings" ? "is-active" : ""} onClick={() => navigate("standings")}><Trophy size={19} />Standings</button></nav>
    {modalOpen && <SessionModal participant={currentUser} existing={editingSession ?? undefined} existingWeight={editingSession ? myWeights.find((row) => row.sessionId === editingSession.id) : undefined} onClose={() => { setModalOpen(false); setEditingSession(null); }} onSave={saveSession} saving={saving} />}
    {weightModalOpen && <StartingWeightModal existing={startingWeight} onClose={() => setWeightModalOpen(false)} onSave={saveStartingWeight} saving={saving} />}
    {toast && <div className="toast"><Check size={18} />{toast}</div>}
  </div>;
}

function ActivityFeed({ sessions, currentUser, full = false, onEdit, onDelete }: { sessions: ActivitySession[]; currentUser: Participant; full?: boolean; onEdit: (session: ActivitySession) => void; onDelete: (session: ActivitySession) => void }) {
  return <article className={`panel activity-feed ${full ? "activity-feed--full" : ""}`}><div className="panel-header"><div><span className="eyebrow">Visible to everyone</span><h2>Family activity</h2></div><span className="live-pill"><i /> Live</span></div><div className="feed-list">{sessions.length === 0 && <p className="empty-state">No sessions logged yet. Be the first!</p>}{sessions.map((session) => { const person = participants.find((item) => item.slug === session.participantSlug)!; const own = person.slug === currentUser.slug; const open = isEntryOpen(session.sessionDate); return <div className="feed-item" key={session.id}><Avatar participant={person} /><div><strong>{person.name}{own && <small>You</small>}</strong><span><Footprints size={14} /> {session.activityType} · {session.minutes} min</span>{session.note && <p>{session.note}</p>}</div><div className="feed-meta"><time><CalendarDays size={13} />{formatChallengeDate(session.sessionDate, { weekday: "short", day: "numeric", month: "short" })}</time>{own && (open ? <span className="feed-controls"><button onClick={() => onEdit(session)} aria-label="Edit session"><Pencil size={14} /> Edit</button><button onClick={() => onDelete(session)} aria-label="Delete session"><Trash2 size={14} /> Delete</button></span> : <span className="locked-pill"><LockKeyhole size={12} /> Locked</span>)}</div></div>; })}</div></article>;
}
