import dayjs from "dayjs";
import { PageLayout } from "~/components/layout";
import { type RouterOutputs, api } from "~/utils/api";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import handleApiError from "~/helpers/handleApiError";
import { LoadingPage } from "~/components/loading";
import isAuth from "~/components/isAuth";
import Link from "next/link";

type EligibleStaff = RouterOutputs["schedules"]["getEligibleStaff"][number];

// ── PIN Entry Modal ────────────────────────────────────

const PinModal = ({
  staff,
  onClose,
  onSuccess,
}: {
  staff: EligibleStaff;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const ctx = api.useUtils();

  const { mutate, isLoading } = api.schedules.createTimeClockEvent.useMutation({
    onSuccess: async () => {
      await ctx.schedules.getEligibleStaff.invalidate();
      const isCurrentlyIn = staff.timeClockEvents.length % 2 === 1;
      toast.success(isCurrentlyIn ? `${staff.displayName} clocked out!` : `${staff.displayName} clocked in!`);
      onSuccess();
    },
    onError: (err) => {
      if (err.data?.code === "CONFLICT") {
        setError("Incorrect PIN. Try again.");
        setPin("");
      } else {
        handleApiError(err);
        onClose();
      }
    },
  });

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setError("");
    setPin(next);
    if (next.length === 4) {
      mutate({
        userId: staff.userId,
        clockPIN: next,
      });
    }
  };

  const handleBackspace = () => {
    setPin((p) => p.slice(0, -1));
    setError("");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isLoading) return;
      if (/^[0-9]$/.test(e.key)) handleDigit(e.key);
      if (e.key === "Backspace") handleBackspace();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, isLoading]);

  const isCurrentlyIn = staff.timeClockEvents.length % 2 === 1;

  return (
    <dialog className="modal modal-open">
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
      <div className="modal-box flex flex-col items-center gap-4 p-6">
        {/* Header */}
        <div className="flex w-full items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold capitalize">{staff.displayName}</h3>
            <p className="text-sm text-base-content/60">
              {isCurrentlyIn ? "Clocking out…" : "Clocking in…"}
            </p>
          </div>
          <span
            className={`badge badge-sm ${isCurrentlyIn ? "badge-success" : "badge-ghost"}`}
          >
            {isCurrentlyIn ? "Clocked In" : "Clocked Out"}
          </span>
        </div>

        {/* PIN dots */}
        <div className="flex gap-3 py-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full border-2 transition-all ${
                pin.length > i
                  ? "border-primary bg-primary"
                  : "border-base-300 bg-transparent"
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="alert alert-error py-2 text-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Numeric pad */}
        <div className="grid grid-cols-3 gap-2">
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <button
              key={d}
              type="button"
              className="btn btn-outline btn-lg h-14 w-14 text-xl font-semibold"
              disabled={isLoading || pin.length >= 4}
              onClick={() => handleDigit(d)}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-lg h-14 w-14 text-lg"
            disabled={isLoading || pin.length === 0}
            onClick={handleBackspace}
          >
            ⌫
          </button>
          <button
            type="button"
            className="btn btn-outline btn-lg h-14 w-14 text-xl font-semibold"
            disabled={isLoading || pin.length >= 4}
            onClick={() => handleDigit("0")}
          >
            0
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-lg h-14 w-14 text-sm"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <span className="loading loading-dots loading-md" />
        )}
      </div>
    </dialog>
  );
};

// ── Staff Card ─────────────────────────────────────────

const StaffCard = ({
  staff,
  onClick,
}: {
  staff: EligibleStaff;
  onClick: () => void;
}) => {
  const isCurrentlyIn = staff.timeClockEvents.length % 2 === 1;
  const lastPunch = staff.timeClockEvents[staff.timeClockEvents.length - 1];

  return (
    <button
      onClick={onClick}
      className="card card-compact bg-base-100 shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] border border-base-200 cursor-pointer text-left"
    >
      <div className="card-body gap-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-base-300 text-sm font-bold uppercase">
              {staff.displayName.charAt(0)}
            </div>
            <div>
              <div className="font-semibold capitalize leading-tight">{staff.displayName}</div>
              {lastPunch && (
                <div className="text-xs text-base-content/50">
                  Last punch: {dayjs(lastPunch.createdAt).format("h:mm A")}
                </div>
              )}
            </div>
          </div>
          <span
            className={`badge badge-sm font-medium ${
              isCurrentlyIn ? "badge-success" : "badge-ghost"
            }`}
          >
            {isCurrentlyIn ? "In" : "Out"}
          </span>
        </div>

        <div className={`btn btn-sm w-full ${isCurrentlyIn ? "btn-error btn-outline" : "btn-primary"}`}>
          {isCurrentlyIn ? "Clock Out" : "Clock In"}
        </div>
      </div>
    </button>
  );
};

// ── Staff Roster ───────────────────────────────────────

const StaffRoster = () => {
  const now = dayjs();
  const { data, isLoading } = api.schedules.getEligibleStaff.useQuery({
    dateRange: [now.startOf("day").toDate(), now.endOf("day").toDate()],
  });

  const [activeStaff, setActiveStaff] = useState<EligibleStaff | undefined>();

  if (isLoading) return <LoadingPage />;

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-base-content/40">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="h-12 w-12">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
        </svg>
        <p className="text-sm">No staff with clock PINs found.</p>
        <p className="text-xs">Admins can set PINs in User Management.</p>
      </div>
    );
  }

  const clocked = data.filter((s) => s.timeClockEvents.length % 2 === 1);
  const out = data.filter((s) => s.timeClockEvents.length % 2 === 0);

  return (
    <>
      {activeStaff && (
        <PinModal
          staff={activeStaff}
          onClose={() => setActiveStaff(undefined)}
          onSuccess={() => setActiveStaff(undefined)}
        />
      )}

      {clocked.length > 0 && (
        <div className="mb-4">
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-success/80">
            Clocked In ({clocked.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clocked.map((s) => (
              <StaffCard key={s.userId} staff={s} onClick={() => setActiveStaff(s)} />
            ))}
          </div>
        </div>
      )}

      {out.length > 0 && (
        <div>
          <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-base-content/40">
            Not Clocked In ({out.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {out.map((s) => (
              <StaffCard key={s.userId} staff={s} onClick={() => setActiveStaff(s)} />
            ))}
          </div>
        </div>
      )}
    </>
  );
};

// ── Page ───────────────────────────────────────────────

function TimeClockPage() {
  const getTime = () => dayjs().format("h:mm:ss A");
  const [time, setTime] = useState(getTime);

  useEffect(() => {
    const timer = setInterval(() => setTime(getTime), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: settings } = api.profile.getSettingsByUser.useQuery();

  return (
    <PageLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-base-content">Time Clock</h1>
            <p className="mt-0.5 text-sm text-base-content/60">
              {dayjs().format("dddd, MMMM D, YYYY")}
              <span className="ml-2 font-mono">{time}</span>
            </p>
          </div>
          {settings?.isAdmin && (
            <Link href="/timeclock/admin" className="btn btn-outline btn-sm gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
              Manage
            </Link>
          )}
        </div>

        <StaffRoster />
      </div>
    </PageLayout>
  );
}

export default isAuth(TimeClockPage, "employee");
