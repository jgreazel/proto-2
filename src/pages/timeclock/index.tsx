import dayjs, { Dayjs } from "dayjs";
import { PageLayout } from "~/components/layout";
import { type RouterOutputs, api } from "~/utils/api";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import handleApiError from "~/helpers/handleApiError";
import { LoadingPage } from "~/components/loading";
import isAuth from "~/components/isAuth";
import { DatePicker, Select, TimePicker } from "antd";

type TimeClockEvent = {
  hourCodeId: string;
  clockPIN: string;
  userId: string;
};

type ClockUser = {
  username: string;
  settings: RouterOutputs["schedules"]["getShiftsByUser"][number]["settings"];
  timePunches: RouterOutputs["schedules"]["getShiftsByUser"][number]["timeClockEvents"];
};

const ClockInModal = ({
  onClose,
  user,
}: {
  onClose: () => void;
  user: ClockUser;
}) => {
  const { register, handleSubmit, reset, formState, control } =
    useForm<TimeClockEvent>({
      defaultValues: {
        hourCodeId: user.settings?.defaultHourCodeId ?? undefined,
        userId: user.settings?.userId,
        clockPIN: "",
      },
    });
  const ctx = api.useUtils();
  const { mutate, isLoading: isMutating } =
    api.schedules.createTimeClockEvent.useMutation({
      onSuccess: async () => {
        await ctx.schedules.getShiftsByUser.invalidate();
        toast.success("Time Card Punched!");
        reset();
        onClose();
      },
      onError: handleApiError,
    });

  const { data: hourCodeOpts, isLoading: isFetchingOpts } =
    api.schedules.getHourCodes.useQuery();
  const options = hourCodeOpts?.map((x) => ({
    label: x.label,
    value: x.id,
  }));

  const { data: userData } = api.profile.getSettingsByUser.useQuery();

  const handleForm = (data: TimeClockEvent) => {
    mutate(data);
  };

  return (
    <dialog className="modal modal-open">
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
      <div className="modal-box">
        <form method="dialog">
          <button
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </form>
        <form onSubmit={handleSubmit(handleForm)}>
          <div className="card-body">
            <div className="card-title capitalize">
              Time Card - {user.username}
            </div>

            <label className="form-control">
              <span className="label-text">Clock PIN</span>
              <input
                className="input input-bordered uppercase"
                placeholder="0000"
                minLength={4}
                maxLength={4}
                disabled={isMutating}
                {...register("clockPIN", {
                  required: true,
                  maxLength: 4,
                  minLength: 4,
                })}
              />
            </label>

            {!!userData?.isAdmin && (
              <div>
                <div className="label-text">Role</div>
                <Controller
                  control={control}
                  name="hourCodeId"
                  rules={{
                    required: true,
                  }}
                  render={({ field }) => (
                    <Select
                      className="h-10 w-full"
                      disabled={isFetchingOpts}
                      options={options}
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                    />
                  )}
                />
              </div>
            )}

            <div className="card-actions justify-end">
              <button
                type="submit"
                className="btn btn-secondary btn-sm"
                disabled={!formState.isValid || isMutating}
              >
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </dialog>
  );
};

const ShiftFeed = () => {
  const { data, isLoading } = api.schedules.getShiftsByUser.useQuery({
    dateRange: [dayjs().startOf("day").toDate(), dayjs().endOf("day").toDate()],
  });
  const [punchId, setPunchId] = useState<string | undefined>(undefined);

  if (isLoading) {
    return <LoadingPage />;
  }

  const punchIdData = !punchId
    ? undefined
    : data?.find((d) => d.user.id === punchId);

  return (
    <>
      {!!punchId && (
        <ClockInModal
          user={{
            username: punchIdData?.user.username ?? "",
            settings: punchIdData?.settings,
            timePunches: punchIdData?.timeClockEvents ?? [],
          }}
          onClose={() => setPunchId(undefined)}
        />
      )}
      <div className="grid gap-2 p-2 md:grid-cols-2">
        {data?.map((x) => (
          <div
            className="card card-compact bg-base-100 shadow-lg"
            key={x.user.id}
          >
            <div className="card-body">
              <div className="card-title capitalize">{x.user.username}</div>
              <div className="grid grid-cols-2">
                <div>
                  <div className="font-medium">Scheduled Shifts Today:</div>
                  {!!x.shifts.length ? (
                    x.shifts.map((s) => (
                      <div key={s.id} className="flex items-center gap-1">
                        {dayjs(s.start).format("hh:mm A")}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="h-4 w-6"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          />
                        </svg>
                        {dayjs(s.end).format("h:mm A")}
                      </div>
                    ))
                  ) : (
                    <div>None</div>
                  )}
                </div>
                <div>
                  <div className="font-medium">Time Card Punches Today:</div>
                  {!!x.timeClockEvents.length ? (
                    x.timeClockEvents.map((t, idx) => (
                      <div key={t.id} className="flex items-center gap-1">
                        {idx % 2 === 0 ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 text-success"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 0 1 0 1.972l-11.54 6.347a1.125 1.125 0 0 1-1.667-.986V5.653Z"
                            />
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="h-6 w-6 text-error"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5.25 7.5A2.25 2.25 0 0 1 7.5 5.25h9a2.25 2.25 0 0 1 2.25 2.25v9a2.25 2.25 0 0 1-2.25 2.25h-9a2.25 2.25 0 0 1-2.25-2.25v-9Z"
                            />
                          </svg>
                        )}
                        {dayjs(t.createdAt).format("h:mm A")}
                      </div>
                    ))
                  ) : (
                    <div>None</div>
                  )}
                </div>
              </div>

              <div className="card-actions justify-end">
                <button
                  disabled={isLoading || !x.settings?.clockPIN}
                  className="btn btn-outline btn-primary"
                  onClick={() => setPunchId(x.user.id)}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                    />
                  </svg>
                  Punch Time Card
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

type ManualTCForm = {
  userId: string;
  hourCodeId: string;
  date: Dayjs;
  time: Dayjs;
};

const ManualAddButton = () => {
  const [show, setShow] = useState(false);

  const onClose = () => setShow(false);

  const { reset, control, handleSubmit, formState } = useForm<ManualTCForm>();

  const { data: userOpts, isLoading: gettingUserOpts } =
    api.profile.getUsers.useQuery();
  const userOptions = userOpts?.map((u) => ({
    label: u.username,
    value: u.id,
  }));

  const { data: hcOpts, isLoading: gettingHC } =
    api.schedules.getHourCodes.useQuery();
  const hcOptions = hcOpts?.map((h) => ({
    label: h.label,
    value: h.id,
  }));

  const ctx = api.useUtils();

  const { mutate, isLoading: isCreating } =
    api.schedules.createTimeClockEvent.useMutation({
      onSuccess: () => {
        void ctx.schedules.getShiftsByUser.invalidate();
        reset();
        toast.success("Time Card Punched!");
        setShow(false);
      },
      onError: handleApiError,
    });

  const onSubmit = (data: ManualTCForm) => {
    const date = dayjs(data.date);
    const time = dayjs(data.time);
    const year = date.year();
    const month = date.month();
    const day = date.date();
    const hours = time.hour();
    const minutes = time.minute();
    const combinedDateTime = new Date(year, month, day, hours, minutes);

    mutate({
      userId: data.userId,
      manualDateTime: combinedDateTime,
      hourCodeId: data.hourCodeId,
    });
  };

  const modal = (
    <dialog id="new-hour-code-modal" className="modal modal-open">
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
      <div className="modal-box">
        <form method="dialog">
          <button
            onClick={onClose}
            className="btn btn-circle btn-ghost btn-sm absolute right-2 top-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </form>
        <div className="mb-2 text-lg font-semibold">Manual Time Punch</div>
        <div className="mb-4 text-sm font-normal italic">
          You may need to create a manual time punch if you&#39;ve noticed
          errors on the Time Clock Report
        </div>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <div className="label-text">User</div>
            <Controller
              control={control}
              name="userId"
              rules={{
                required: true,
              }}
              render={({ field }) => (
                <Select
                  className="h-10 w-full"
                  disabled={gettingUserOpts}
                  options={userOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />
          </div>
          <div>
            <div className="label-text">Role</div>
            <Controller
              control={control}
              name="hourCodeId"
              rules={{
                required: true,
              }}
              render={({ field }) => (
                <Select
                  className="h-10 w-full"
                  disabled={gettingHC}
                  options={hcOptions}
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                />
              )}
            />
          </div>

          <Controller
            control={control}
            name="date"
            rules={{
              required: true,
            }}
            render={({ field }) => (
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Date</span>
                </div>
                <DatePicker
                  value={field.value}
                  format="MM/DD/YYYY"
                  className="input input-bordered w-full max-w-xs"
                  onChange={(date) => field.onChange(date)}
                />
              </label>
            )}
          />

          <Controller
            control={control}
            name="time"
            rules={{
              required: true,
            }}
            render={({ field }) => (
              <label className="form-control w-full max-w-xs">
                <div className="label">
                  <span className="label-text">Time</span>
                </div>
                <TimePicker
                  value={field.value}
                  format="h:mm A"
                  className="input input-bordered w-full max-w-xs"
                  onChange={(time) => field.onChange(time)}
                />
              </label>
            )}
          />

          <button
            className="btn btn-primary self-end"
            type="submit"
            disabled={!formState.isValid || isCreating}
          >
            Submit
          </button>
        </form>
      </div>
    </dialog>
  );

  return (
    <>
      {show && modal}
      <button className="btn btn-outline btn-sm" onClick={() => setShow(true)}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
          />
        </svg>
        Manually Add Time Punch
      </button>
    </>
  );
};

function TimeClockPage() {
  // ? does the clock need fixed
  const getToday = () => dayjs().format("dddd, MMMM D, YYYY - h:mm:ss A");
  const [title, setTitle] = useState(getToday);

  useEffect(() => {
    const timer = setInterval(() => {
      setTitle(getToday);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const { data } = api.profile.getSettingsByUser.useQuery();

  return (
    <PageLayout>
      <h1 className="flex justify-between p-3 text-2xl font-semibold">
        {title}
        {!!data?.isAdmin && <ManualAddButton />}
      </h1>
      <ShiftFeed />
    </PageLayout>
  );
}

export default isAuth(TimeClockPage, "employee");
