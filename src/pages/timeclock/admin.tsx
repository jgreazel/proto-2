import { DatePicker, Select, TimePicker } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import isAuth from "~/components/isAuth";
import { PageLayout } from "~/components/layout";
import { LoadingPage } from "~/components/loading";
import handleApiError from "~/helpers/handleApiError";
import { api } from "~/utils/api";

// ── Types ──────────────────────────────────────────────

type PunchEvent = {
  id: string;
  userId: string;
  createdBy: string;
  createdAt: Date;
};

type FilterForm = {
  date: Dayjs;
  userId: string;
};

type PunchForm = {
  time: Dayjs;
};

// ── Punches Table ──────────────────────────────────────

const PunchesSection = ({ userId, date }: { userId: string; date: Dayjs }) => {
  const utils = api.useUtils();
  const range: [Date, Date] = [date.startOf("day").toDate(), date.endOf("day").toDate()];

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
      toast.success("Deleted!");
    },
    onError: handleApiError,
  });

  const onSave = (eventId?: string) => {
    handleSubmit((d) => {
      upsert({
        eventId: eventId ?? undefined,
        time: d.time.toDate(),
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

  if (isLoading) return <div className="skeleton h-40 w-full rounded-xl" />;
  if (error) return <div className="alert alert-error text-sm">{error.message}</div>;

  // Compute hour totals from paired punches
  const sorted = [...(data ?? [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  let totalMinutes = 0;
  for (let i = 0; i < sorted.length - 1; i += 2) {
    totalMinutes += (new Date(sorted[i + 1]!.createdAt).getTime() - new Date(sorted[i]!.createdAt).getTime()) / 60000;
  }
  const totalHours = Math.floor(totalMinutes / 60);
  const totalMins = Math.round(totalMinutes % 60);

  return (
    <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <div className="flex items-center justify-between border-b border-base-300 px-6 py-4">
        <div>
          <h3 className="text-base font-medium">Time Punches</h3>
          <p className="mt-0.5 text-xs text-base-content/60">
            {date.format("MMMM D, YYYY")}
            {totalMinutes > 0 && (
              <span className="ml-2 font-medium text-success">
                Total: {totalHours}h {totalMins}m
              </span>
            )}
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          disabled={isBusy || !!editingId || showAdd}
          onClick={() => { setShowAdd(true); reset({ time: dayjs() }); }}
        >
          + Add Punch
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-base-200">
          <thead className="bg-base-200/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">#</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-base-content/60">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-200 bg-base-100">
            {showAdd && (
              <tr className="bg-primary/5">
                <td className="px-6 py-3 text-sm text-base-content/40">{(sorted.length + 1)}</td>
                <td className="px-6 py-3">
                  <span className={`badge badge-sm ${sorted.length % 2 === 0 ? "badge-success" : "badge-error"}`}>
                    {sorted.length % 2 === 0 ? "In" : "Out"}
                  </span>
                </td>
                <td className="px-6 py-3">
                  <Controller
                    control={control}
                    name="time"
                    render={({ field }) => (
                      <TimePicker value={field.value} format="h:mm A" onChange={(v) => field.onChange(v)} size="small" />
                    )}
                  />
                </td>
                <td className="px-6 py-3">
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-xs" disabled={isBusy} onClick={() => onSave()}>Save</button>
                    <button className="btn btn-ghost btn-xs" onClick={() => { setShowAdd(false); reset(); }}>Cancel</button>
                  </div>
                </td>
              </tr>
            )}
            {sorted.map((punch, idx) => (
              <tr key={punch.id} className={idx % 2 === 0 ? "bg-base-100" : "bg-base-200/30"}>
                <td className="px-6 py-3 text-sm text-base-content/40">{idx + 1}</td>
                <td className="px-6 py-3">
                  <span className={`badge badge-sm ${idx % 2 === 0 ? "badge-success" : "badge-error"}`}>
                    {idx % 2 === 0 ? "In" : "Out"}
                  </span>
                </td>
                <td className="px-6 py-3 text-sm">
                  {editingId === punch.id ? (
                    <Controller
                      control={control}
                      name="time"
                      render={({ field }) => (
                        <TimePicker value={field.value} format="h:mm A" onChange={(v) => field.onChange(v)} size="small" />
                      )}
                    />
                  ) : (
                    dayjs(punch.createdAt).format("h:mm A")
                  )}
                </td>
                <td className="px-6 py-3">
                  {editingId === punch.id ? (
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-xs" disabled={isBusy} onClick={() => onSave(punch.id)}>Save</button>
                      <button className="btn btn-ghost btn-xs" onClick={() => { setEditingId(null); reset(); }}>Cancel</button>
                      <button className="btn btn-ghost btn-xs text-error" disabled={isBusy} onClick={() => deletePunch({ id: punch.id })}>Delete</button>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost btn-xs"
                      disabled={!!editingId || showAdd || isBusy}
                      onClick={() => startEdit(punch)}
                    >
                      Edit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!sorted.length && !showAdd && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-sm text-base-content/40">
                  No punches recorded for this day.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Filter Form ────────────────────────────────────────

const FilterForm = ({
  onSearch,
}: {
  onSearch: (userId: string, date: Dayjs) => void;
}) => {
  const { control, handleSubmit, formState } = useForm<FilterForm>({
    defaultValues: { date: dayjs() },
  });
  const { data: users, isLoading } = api.profile.getUsers.useQuery();

  const opts = (users ?? []).map((u) => ({
    value: u.id,
    label: u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.username ?? u.id,
  }));

  return (
    <div className="overflow-hidden rounded-xl border border-base-300 bg-base-100 shadow-sm">
      <div className="border-b border-base-300 px-6 py-4">
        <h3 className="text-base font-medium">View Punches</h3>
        <p className="mt-0.5 text-xs text-base-content/60">Select a team member and date to view or edit their time punches</p>
      </div>
      <form
        className="flex flex-wrap items-end gap-3 px-6 py-4"
        onSubmit={handleSubmit((d) => onSearch(d.userId, d.date))}
      >
        <Controller
          control={control}
          name="userId"
          rules={{ required: true }}
          render={({ field }) => (
            <label className="form-control w-full max-w-xs">
              <div className="label pb-1">
                <span className="label-text text-xs font-medium">Team Member</span>
              </div>
              <Select
                loading={isLoading}
                options={opts}
                value={field.value}
                onChange={field.onChange}
                placeholder="Select employee…"
                className="w-full"
                showSearch
                filterOption={(input, opt) => (opt?.label ?? "").toLowerCase().includes(input.toLowerCase())}
              />
            </label>
          )}
        />
        <Controller
          control={control}
          name="date"
          rules={{ required: true }}
          render={({ field }) => (
            <label className="form-control w-full max-w-xs">
              <div className="label pb-1">
                <span className="label-text text-xs font-medium">Date</span>
              </div>
              <DatePicker
                value={field.value}
                format="MM/DD/YYYY"
                onChange={(d) => field.onChange(d)}
                className="w-full"
              />
            </label>
          )}
        />
        <button
          type="submit"
          className="btn btn-primary"
          disabled={!formState.isValid}
        >
          View Punches
        </button>
      </form>
    </div>
  );
};

// ── Page ───────────────────────────────────────────────

function TimeclockAdminPage() {
  const [selection, setSelection] = useState<{ userId: string; date: Dayjs } | null>(null);

  return (
    <PageLayout>
      <div className="space-y-6 p-4 lg:p-6">
        <div>
          <h1 className="text-2xl font-semibold text-base-content">Time Clock Admin</h1>
          <p className="mt-1 text-sm text-base-content/60">Manage time punches</p>
        </div>

        <FilterForm onSearch={(userId, date) => setSelection({ userId, date })} />

        {selection && (
          <PunchesSection userId={selection.userId} date={selection.date} />
        )}
      </div>
    </PageLayout>
  );
}

export default isAuth(TimeclockAdminPage, "admin");
