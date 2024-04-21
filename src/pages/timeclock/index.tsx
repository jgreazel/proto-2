import dayjs from "dayjs";
import { PageLayout } from "~/components/layout";
import { type RouterOutputs, api } from "~/utils/api";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import handleApiError from "~/helpers/handleApiError";

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
  const { register, handleSubmit, reset, formState } = useForm<TimeClockEvent>({
    defaultValues: {
      hourCodeId: user.settings?.defaultHourCodeId ?? undefined,
      userId: user.settings?.userId,
      clockPIN: "",
    },
  });
  const { mutate, isLoading: isMutating } =
    api.schedules.createTimeClockEvent.useMutation({
      onSuccess: () => {
        toast.success("Time Card Punched!");
        reset();
        onClose();
      },
      onError: handleApiError,
    });

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
    return <div className="loading loading-spinner loading-md"></div>;
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

export default function TimeClockPage() {
  // const getToday = () => dayjs().format("dddd, MMMM D, YYYY - h:mm:ss A");
  // const [title, setTitle] = useState(getToday);

  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setTitle(getToday);
  //   }, 2000);

  //   return () => clearInterval(timer);
  // }, []);

  return (
    <PageLayout>
      {/* <h1 className="p-3 text-2xl font-semibold">{title}</h1> */}
      <ShiftFeed />
    </PageLayout>
  );
}
