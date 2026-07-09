import { DatePicker, Select, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

// ── Types ──────────────────────────────────────────────

type PunchEvent = {
  id: string;
  userId: string;
  createdBy: string;
  createdAt: Date;
};

type PunchForm = {
  time: Dayjs;
};

type UserInfo = { id: string; label: string };

// ── Helpers ────────────────────────────────────────────

function getWeekRange(anchor: Dayjs): [Date, Date] {
  return [anchor.startOf("week").toDate(), anchor.endOf("week").toDate()];
}

function computeHours(events: { createdAt: Date }[]) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
  let mins = 0;
  for (let i = 0; i < sorted.length - 1; i += 2) {
    mins += (new Date(sorted[i + 1]!.createdAt).getTime() - new Date(sorted[i]!.createdAt).getTime()) / 60000;
  }
  return { hours: Math.floor(mins / 60), minutes: Math.round(mins % 60), isOdd: sorted.length % 2 !== 0 };
}

// ── Missing Punches Alert ──────────────────────────────

const MissingPunchesAlert = ({
  issues,
  onFix,
}: {
  issues: { userId: string; userName: string; date: Dayjs; punchCount: number }[];
  onFix: (userId: string, date: Dayjs) => void;
}) => {
  if (!issues.length) return null;

  return (
    <div className="rounded-xl border border-warning/40 bg-warning/5 p-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-xl">⚠️</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-warning-content">
            {issues.length} missing clock-out{issues.length > 1 ? "s" : ""} this week
          </h3>
          <p className="mt-1 text-xs text-base-content/60">
            These team members have an odd number of punches — likely a missed clock-out. Tap to fix.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {issues.map((issue) => (
              <button
                key={`${issue.userId}-${issue.date.format("YYYY-MM-DD")}`}
                className="btn btn-warning btn-sm min-h-[44px] gap-1"
                onClick={() => onFix(issue.userId, issue.date)}
                aria-label={`Fix missing clock-out for ${issue.userName} on ${issue.date.format("dddd M/D")}`}
              >
                <span className="max-w-[120px] truncate">{issue.userName}</span>
                <span className="opacity-70">· {issue.date.format("ddd M/D")}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Punch Card (mobile) / Row (desktop) ────────────────

const PunchRow = ({
  punch,
  idx,
  isEditing,
  isBusy,
  control,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: {
  punch: PunchEvent;
  idx: number;
  isEditing: boolean;
  isBusy: boolean;
  control: ReturnType<typeof useForm<PunchForm>>["control"];
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) => {
  const isIn = idx % 2 === 0;

  // Mobile: card layout
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${idx % 2 === 0 ? "bg-base-100" : "bg-base-200/30"}`}>
      <span className={`badge badge-sm ${isIn ? "badge-success" : "badge-error"}`}>
        {isIn ? "In" : "Out"}
      </span>

      <div className="flex-1">
        {isEditing ? (
          <Controller
            control={control}
            name="time"
            render={({ field }) => (
              <TimePicker
                value={field.value}
                format="h:mm A"
                onChange={(v) => field.onChange(v)}
                size="small"
                className="w-full max-w-[140px]"
                allowClear={false}
              />
            )}
          />
        ) : (
          <span className="text-sm font-medium">
            {dayjs(punch.createdAt).format("h:mm A")}
          </span>
        )}
      </div>

      <div className="flex gap-1">
        {isEditing ? (
          <>
            <button className="btn btn-primary btn-sm min-h-[44px]" disabled={isBusy} onClick={onSave}>Save</button>
            <button className="btn btn-ghost btn-sm min-h-[44px]" onClick={onCancel} aria-label="Cancel editing">✕</button>
            <button className="btn btn-ghost btn-sm min-h-[44px] text-error" disabled={isBusy} onClick={onDelete} aria-label="Delete punch">🗑</button>
          </>
        ) : (
          <button className="btn btn-ghost btn-sm min-h-[44px]" disabled={isBusy} onClick={onEdit}>Edit</button>
        )}
      </div>
    </div>
  );
};

// ── Punches Section ────────────────────────────────────

const PunchesSection = ({
  userId,
  userName,
  date,
  onClose,
}: {
  userId: string;
  userName: string;
  date: Dayjs;
  onClose: () => void;
}) => {
  const utils = api.useUtils();
  const range: [Date, Date] = [date.startOf("day").toDate(), date.endOf("day").toDate()];

  const mergeDateTime = (time: Dayjs) =>
    date.hour(time.hour()).minute(time.minute()).second(time.second());

  const { data, isLoading, error } = api.timeclockAdmin.getTimeclockEvents.useQuery(
    { userId, range },
    { enabled: !!userId },
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { control, handleSubmit, reset, setValue } = useForm<PunchForm>({
    defaultValues: { time: dayjs() },
  });

  const { mutate: upsert, isLoading: isSaving } = api.timeclockAdmin.upsertTimeclockEvent.useMutation({
    onSuccess: async () => {
      await utils.timeclockAdmin.getTimeclockEvents.invalidate();
      await utils.timeclockAdmin.getWeekOverview.invalidate();
      toast.success("Saved!");
      setEditingId(null);
      setShowAdd(false);
      reset();
    },
    onError: handleApiError,
  });

  const { mutate: deletePunch, isLoading: isDeleting } = api.timeclockAdmin.deleteTimeclockEvent.useMutation({
    onSuccess: async () => {
      await utils.timeclockAdmin.getTimeclockEvents.invalidate();
      await utils.timeclockAdmin.getWeekOverview.invalidate();
      setEditingId(null);
      reset();
      toast.success("Deleted!");
    },
    onError: handleApiError,
  });

  const onSave = (eventId?: string) => {
    void handleSubmit((d) => {
      if (!d.time || !d.time.isValid()) {
        toast.error("Please select a valid time");
        return;
      }
      upsert({
        eventId: eventId ?? undefined,
        time: mergeDateTime(d.time).toDate(),
        userId: eventId ? undefined : userId,
      });
    })();
  };

  const startEdit = (punch: PunchEvent) => {
    setEditingId(punch.id);
    setShowAdd(false);
    setValue("time", dayjs(punch.createdAt));
  };

  const isBusy = isSaving || isDeleting;

  const sorted = useMemo(
    () => [...(data ?? [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [data],
  );

  const { hours, minutes, isOdd } = useMemo(() => computeHours(sorted), [sorted]);

  if (isLoading) return <div className="skeleton h-40 w-full rounded-xl" />;
  if (error) return <div className="alert alert-error text-sm">{error.message}</div>;

  return (
    <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-base-300 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-medium">{userName}</h3>
            <button className="btn btn-ghost btn-xs" onClick={onClose}>✕</button>
          </div>
          <p className="mt-0.5 text-xs text-base-content/60">
            📅 {date.format("dddd, MMMM D, YYYY")}
            {hours + minutes > 0 && (
              <span className="ml-2 font-medium text-success">
                Total: {hours}h {minutes}m
              </span>
            )}
            {isOdd && (
              <span className="ml-2 font-medium text-warning">⚠ Missing clock-out</span>
            )}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm w-full sm:w-auto"
          disabled={isBusy || !!editingId || showAdd}
          onClick={() => { setShowAdd(true); reset({ time: dayjs() }); }}
        >
          + Add Punch
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="flex flex-wrap items-center gap-3 border-b border-primary/20 bg-primary/5 px-4 py-3 sm:px-6">
          <span className={`badge badge-sm ${sorted.length % 2 === 0 ? "badge-success" : "badge-error"}`}>
            {sorted.length % 2 === 0 ? "In" : "Out"}
          </span>
          <Controller
            control={control}
            name="time"
            render={({ field }) => (
              <TimePicker
                value={field.value}
                format="h:mm A"
                onChange={(v) => field.onChange(v)}
                size="small"
                className="w-full max-w-[140px]"
                allowClear={false}
              />
            )}
          />
          <span className="text-xs text-base-content/50">on {date.format("M/D")}</span>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-xs" disabled={isBusy} onClick={() => onSave()}>Save</button>
            <button className="btn btn-ghost btn-xs" onClick={() => { setShowAdd(false); reset(); }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Punch list */}
      <div className="divide-y divide-base-200">
        {sorted.map((punch, idx) => (
          <PunchRow
            key={punch.id}
            punch={punch}
            idx={idx}
            isEditing={editingId === punch.id}
            isBusy={isBusy}
            control={control}
            onEdit={() => startEdit(punch)}
            onSave={() => onSave(punch.id)}
            onCancel={() => { setEditingId(null); reset(); }}
            onDelete={() => deletePunch({ id: punch.id })}
          />
        ))}
        {!sorted.length && !showAdd && (
          <div className="px-4 py-8 text-center text-sm text-base-content/40">
            No punches recorded for this day.
          </div>
        )}
      </div>
    </div>
  );
};

// ── Week Overview Table ────────────────────────────────

const WeekOverview = ({
  weekStart,
  users,
  onSelectCell,
}: {
  weekStart: Dayjs;
  users: UserInfo[];
  onSelectCell: (userId: string, date: Dayjs) => void;
}) => {
  const range: [Date, Date] = getWeekRange(weekStart);
  const { data: events, isLoading } = api.timeclockAdmin.getWeekOverview.useQuery({ range });

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => weekStart.startOf("week").add(i, "day")),
    [weekStart],
  );

  const grid = useMemo(() => {
    if (!events) return {};
    // Build a lookup map for O(events) instead of O(users * days * events)
    const lookup: Record<string, typeof events> = {};
    for (const e of events) {
      const key = `${e.userId}|${dayjs(e.createdAt).format("YYYY-MM-DD")}`;
      (lookup[key] ??= []).push(e);
    }
    const result: Record<string, Record<string, typeof events>> = {};
    for (const user of users) {
      result[user.id] = {};
      for (const day of days) {
        const dayKey = day.format("YYYY-MM-DD");
        result[user.id]![dayKey] = lookup[`${user.id}|${dayKey}`] ?? [];
      }
    }
    return result;
  }, [events, users, days]);

  if (isLoading) return <div className="skeleton h-48 w-full rounded-xl" />;

  // Sort: users with activity this week first, then inactive
  const sortedUsers = useMemo(() => {
    const withActivity = users.filter((u) => {
      const userEvents = Object.values(grid[u.id] ?? {});
      return userEvents.some((evts) => evts.length > 0);
    });
    const noActivity = users.filter((u) => {
      const userEvents = Object.values(grid[u.id] ?? {});
      return !userEvents.some((evts) => evts.length > 0);
    });
    return { active: withActivity, inactive: noActivity };
  }, [users, grid]);

  const [showInactive, setShowInactive] = useState(false);

  // Mobile: card list per user. Desktop: table grid.
  return (
    <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <div className="border-b border-base-300 px-4 py-3 sm:px-6">
        <h3 className="text-base font-medium">Weekly Overview</h3>
        <p className="mt-0.5 text-xs text-base-content/60">Select a team member's day to view or edit their punches below ↓</p>
      </div>

      {/* Desktop table — capped height so punch detail is always visible */}
      <div className="hidden max-h-[45vh] overflow-auto md:block">
        <table className="min-w-full">
          <thead className="sticky top-0 z-10 bg-base-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-base-content/60">Team Member</th>
              {days.map((d) => (
                <th key={d.format("ddd")} className="px-3 py-2 text-center text-xs font-medium text-base-content/60">
                  {d.format("ddd M/D")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedUsers.active.map((user, rowIdx) => (
              <tr
                key={user.id}
                className={`cursor-pointer transition-colors hover:bg-primary/10 ${rowIdx % 2 === 0 ? "bg-base-100" : "bg-base-200/40"}`}
              >
                <td className="max-w-[150px] truncate px-4 py-2 text-sm font-medium">{user.label}</td>
                {days.map((day) => {
                  const dayKey = day.format("YYYY-MM-DD");
                  const dayEvents = grid[user.id]?.[dayKey] ?? [];
                  const count = dayEvents.length;
                  const isOdd = count % 2 !== 0;
                  const { hours, minutes } = computeHours(dayEvents);
                  const isFuture = day.isAfter(dayjs(), "day");

                  return (
                    <td key={dayKey} className="px-1 py-2 text-center">
                      {isFuture ? (
                        <span className="text-xs text-base-content/20">—</span>
                      ) : count === 0 ? (
                        <button
                          onClick={() => onSelectCell(user.id, day)}
                          className="btn btn-ghost btn-xs text-base-content/30"
                        >
                          —
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectCell(user.id, day)}
                          className={`btn btn-xs gap-0.5 ${isOdd ? "btn-warning" : "btn-ghost"}`}
                        >
                          {isOdd && <span>⚠</span>}
                          <span className="text-xs">
                            {hours > 0 || minutes > 0 ? `${hours}h${minutes > 0 ? `${minutes}m` : ""}` : `${count}p`}
                          </span>
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Inactive users collapsed section */}
        {sortedUsers.inactive.length > 0 && (
          <div className="border-t border-base-300">
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-left text-xs text-base-content/50 hover:bg-base-200/50"
              onClick={() => setShowInactive(!showInactive)}
            >
              <span>{showInactive ? "▼" : "▶"}</span>
              <span>{sortedUsers.inactive.length} team member{sortedUsers.inactive.length > 1 ? "s" : ""} with no activity this week</span>
            </button>
            {showInactive && (
              <table className="min-w-full">
                <tbody>
                  {sortedUsers.inactive.map((user, rowIdx) => (
                    <tr
                      key={user.id}
                      className={`text-base-content/40 transition-colors hover:bg-primary/5 ${rowIdx % 2 === 0 ? "bg-base-100" : "bg-base-200/40"}`}
                    >
                      <td className="max-w-[150px] truncate px-4 py-2 text-sm">{user.label}</td>
                      {days.map((day) => {
                        const isFuture = day.isAfter(dayjs(), "day");
                        return (
                          <td key={day.format("YYYY-MM-DD")} className="px-1 py-2 text-center">
                            {isFuture ? (
                              <span className="text-xs text-base-content/10">—</span>
                            ) : (
                              <button
                                onClick={() => onSelectCell(user.id, day)}
                                className="btn btn-ghost btn-xs text-base-content/20"
                              >
                                —
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Mobile card view */}
      <div className="max-h-[50vh] divide-y divide-base-200 overflow-auto md:hidden">
        {sortedUsers.active.map((user) => {
          const userDays = days
            .filter((d) => !d.isAfter(dayjs(), "day"))
            .map((day) => {
              const dayKey = day.format("YYYY-MM-DD");
              const dayEvents = grid[user.id]?.[dayKey] ?? [];
              return { day, events: dayEvents };
            });

          if (!userDays.length) return null;

          const hasIssue = userDays.some((d) => d.events.length % 2 !== 0 && d.events.length > 0);

          return (
            <div key={user.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{user.label}</span>
                {hasIssue && <span className="text-xs text-warning">⚠ missing punch</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {userDays.map(({ day, events: dayEvts }) => {
                  const isOdd = dayEvts.length % 2 !== 0 && dayEvts.length > 0;
                  const { hours, minutes } = computeHours(dayEvts);
                  return (
                    <button
                      key={day.format("YYYY-MM-DD")}
                      onClick={() => onSelectCell(user.id, day)}
                      className={`btn btn-sm min-h-[44px] min-w-[44px] gap-0.5 ${isOdd ? "btn-warning" : "btn-ghost"}`}
                      aria-label={`${user.label} ${day.format("dddd M/D")} - ${dayEvts.length} punches`}
                    >
                      <span className="text-[10px] opacity-70">{day.format("ddd")}</span>
                      {dayEvts.length === 0 ? "—" : `${hours}h${minutes > 0 ? `${minutes}m` : ""}`}
                      {isOdd && <span>⚠</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Mobile inactive collapse */}
        {sortedUsers.inactive.length > 0 && (
          <div className="px-4 py-3">
            <button
              className="text-xs text-base-content/50"
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? "▼ Hide" : "▶ Show"} {sortedUsers.inactive.length} inactive member{sortedUsers.inactive.length > 1 ? "s" : ""}
            </button>
            {showInactive && (
              <div className="mt-2 space-y-1">
                {sortedUsers.inactive.map((user) => (
                  <div key={user.id} className="text-xs text-base-content/40">{user.label}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────

function TimeclockAdminPage() {
  const [weekStart, setWeekStart] = useState<Dayjs>(dayjs().startOf("week"));
  const [selection, setSelection] = useState<{ userId: string; userName: string; date: Dayjs } | null>(null);

  const { data: usersData } = api.profile.getUsers.useQuery();
  const users: UserInfo[] = useMemo(
    () => (usersData ?? []).map((u) => ({
      id: u.id,
      label: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username ?? u.id,
    })),
    [usersData],
  );

  // Compute missing punches from the week overview
  const weekRange: [Date, Date] = getWeekRange(weekStart);
  const { data: weekEvents } = api.timeclockAdmin.getWeekOverview.useQuery({ range: weekRange });

  const issues = useMemo(() => {
    if (!weekEvents || !users.length) return [];
    const result: { userId: string; userName: string; date: Dayjs; punchCount: number }[] = [];
    const days = Array.from({ length: 7 }, (_, i) => weekStart.startOf("week").add(i, "day"));

    for (const user of users) {
      for (const day of days) {
        if (day.isAfter(dayjs(), "day")) continue;
        const dayEvents = weekEvents.filter(
          (e) => e.userId === user.id && dayjs(e.createdAt).format("YYYY-MM-DD") === day.format("YYYY-MM-DD"),
        );
        if (dayEvents.length > 0 && dayEvents.length % 2 !== 0) {
          result.push({ userId: user.id, userName: user.label, date: day, punchCount: dayEvents.length });
        }
      }
    }
    return result;
  }, [weekEvents, users, weekStart]);

  const handleSelectCell = (userId: string, date: Dayjs) => {
    const user = users.find((u) => u.id === userId);
    setSelection({ userId, userName: user?.label ?? userId, date });
  };

  return (
    <PageLayout>
      <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
        {/* Header with week navigation */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-base-content sm:text-2xl">Time Clock Admin</h1>
            <p className="mt-0.5 text-xs text-base-content/60">
              Week of {weekStart.format("MMM D")} – {weekStart.endOf("week").format("MMM D, YYYY")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setWeekStart((w) => w.subtract(1, "week"))}
            >
              ← Prev
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setWeekStart(dayjs().startOf("week"))}
              disabled={weekStart.isSame(dayjs().startOf("week"), "day")}
            >
              This Week
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setWeekStart((w) => w.add(1, "week"))}
              disabled={weekStart.isAfter(dayjs(), "week")}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Alerts */}
        <MissingPunchesAlert issues={issues} onFix={handleSelectCell} />

        {/* Weekly overview grid */}
        <WeekOverview weekStart={weekStart} users={users} onSelectCell={handleSelectCell} />

        {/* Selected day detail */}
        {selection && (
          <PunchesSection
            userId={selection.userId}
            userName={selection.userName}
            date={selection.date}
            onClose={() => setSelection(null)}
          />
        )}
      </div>
    </PageLayout>
  );
}

export default isAuth(TimeclockAdminPage, "admin");
