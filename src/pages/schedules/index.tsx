import { Controller, useForm } from "react-hook-form";
import dayjs, { type Dayjs } from "dayjs";
import { TimePicker, Calendar } from "antd";
import { type RouterOutputs, api } from "~/utils/api";

import { PageLayout } from "~/components/layout";
import handleApiError from "~/helpers/handleApiError";
import toast from "react-hot-toast";
import type { RangeValueType } from "../_app";
import { type ReactElement, useState } from "react";

type ShiftFormData = {
  userId: string;
  timeRange: RangeValueType<Dayjs>;
};

const ShiftForm = ({ day }: { day: Dayjs }) => {
  const { data, isLoading: isGettingUsers } =
    api.profile.getAllUsers.useQuery();

  const { register, handleSubmit, control, reset } = useForm<ShiftFormData>();
  // todo: handle optimistic updates to UI, may need to change query to lazy query and pass in onsuccess to requery?
  // ? or can i invalidate and cause an auto refetch?
  const { mutate, isLoading } = api.schedules.createShift.useMutation({
    onError: handleApiError,
    onSuccess: (newShift) => {
      reset();
      toast.success("Shift Created!");
      // api.schedules.getShifts.useQuery({
      //   dateRange: [day.startOf("day").toDate(), day.endOf("day").toDate()],
      // });
      const utils = api.useUtils();
      // const prev = utils.schedules.getShifts.getData({
      //   dateRange: [day.startOf("month").toDate(), day.endOf("month").toDate()]
      // });
      utils.schedules.getShifts.setData(
        {
          dateRange: [
            day.startOf("month").toDate(),
            day.endOf("month").toDate(),
          ],
        },
        (prev) => [...(prev ?? []), newShift],
      );
    },
  });

  const submit = (data: ShiftFormData) => {
    if (!data.timeRange[0] || !data.timeRange[1]) {
      console.error("date values can't be undefined");
      return;
    }

    mutate({
      userId: data.userId,
      start: dayjs(day)
        .set("hour", data.timeRange[0].hour())
        .set("minute", data.timeRange[0].minute())
        .toDate(),
      end: dayjs(day)
        .set("hour", data.timeRange[1].hour())
        .set("minute", data.timeRange[1].minute())
        .toDate(),
    });
  };

  return (
    <form onSubmit={handleSubmit(submit)}>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Assignee</span>
        </div>
        <select
          {...register("userId", {
            required: true,
            disabled: isLoading || isGettingUsers,
          })}
          className="select select-bordered capitalize"
        >
          {data?.map((u) => (
            <option key={u.id} value={u.id} className="capitalize">
              {u.username}
            </option>
          ))}
        </select>
      </label>
      <Controller
        control={control}
        name="timeRange"
        render={({ field }) => (
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Shift</span>
            </div>
            <TimePicker.RangePicker
              format="HH:mm a"
              minuteStep={15}
              className="input input-bordered w-full max-w-xs"
              value={field.value}
              onChange={(dates) => field.onChange(dates)}
            />
          </label>
        )}
      />
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">
          Create
        </button>
      </div>
    </form>
  );
};

const ShiftModal = ({
  onClose,
  children,
}: {
  onClose: () => void;
  children: ReactElement[] | ReactElement;
}) => {
  return (
    <dialog id="shift-modal" className="modal modal-open">
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
        {children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
};

const CellView = ({
  data,
}: {
  data: RouterOutputs["schedules"]["getShifts"];
}) => (
  <ul>
    {data.map((d) => (
      <li key={d.id} className="flex flex-row items-center gap-2 capitalize">
        <div className="badge badge-secondary badge-sm">
          {dayjs(d.start).format("HH:mm")}
        </div>
        <span>{d.username}</span>
      </li>
    ))}
  </ul>
);

const DesktopView = () => {
  const [showModal, setShowModal] = useState(false);
  const [calVal, setCalVal] = useState(() => dayjs());
  const { data, isLoading } = api.schedules.getShifts.useQuery({
    dateRange: [
      calVal.startOf("month").toDate(),
      calVal.endOf("month").toDate(),
    ],
  });

  const handleCellClick = (value: Dayjs) => {
    // todo: figure out how not to open a modal when switching months
    setCalVal(value);
    setShowModal(true);
  };

  const filterShifts =
    (day: Dayjs) => (data: RouterOutputs["schedules"]["getShifts"][number]) =>
      dayjs(data.start).startOf("day").isSame(day.startOf("day"));

  const cellRenderer = (current: Dayjs, info: { type: string }) => {
    const shifts = data?.filter(filterShifts(current)) ?? [];
    if (info.type === "date") {
      return <CellView data={shifts} />;
    }
  };

  return (
    <PageLayout>
      <div className="card card-compact bg-base-200">
        <div className="card-body">
          {data?.length === 0 && (
            <div role="alert" className="alert alert-info">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 stroke-current"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <span>Click a date to begin adding shifts</span>
            </div>
          )}
          <Calendar
            cellRender={cellRenderer}
            className="rounded-lg p-2 shadow-lg"
            value={calVal}
            onChange={handleCellClick}
            onPanelChange={handleCellClick}
          />
        </div>
      </div>
      {showModal && (
        <ShiftModal onClose={() => setShowModal(false)}>
          <ShiftForm day={calVal} />
          <CellView data={data?.filter(filterShifts(calVal)) ?? []} />
        </ShiftModal>
      )}
    </PageLayout>
  );
};

export default function SchedulesPage() {
  return <DesktopView />;
}
