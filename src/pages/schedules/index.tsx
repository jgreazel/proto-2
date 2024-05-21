import { Controller, useForm } from "react-hook-form";
import dayjs, { type Dayjs } from "dayjs";
import { TimePicker, Calendar, DatePicker } from "antd";
import { useUser } from "@clerk/nextjs";

import { type RouterOutputs, api } from "~/utils/api";

import { PageLayout } from "~/components/layout";
import handleApiError from "~/helpers/handleApiError";
import toast from "react-hot-toast";
import type { RangeValueType } from "../_app";
import { type ReactElement, useState } from "react";
import isAuth from "~/components/isAuth";

type ShiftFormData = {
  userId: string;
  timeRange: RangeValueType<Dayjs>;
};

const ShiftForm = ({
  day,
  value,
  onSuccess,
}: {
  day: Dayjs;
  value?: RouterOutputs["schedules"]["getShifts"][number];
  onSuccess: () => Promise<void>;
}) => {
  const { data, isLoading: isGettingUsers } = api.profile.getUsers.useQuery();

  const { register, handleSubmit, control, reset, formState } =
    useForm<ShiftFormData>({
      defaultValues: !!value
        ? {
            userId: value?.userId,
            timeRange: [dayjs(value?.start), dayjs(value?.end)],
          }
        : undefined,
    });

  const onMutate = {
    onError: handleApiError,
    onSuccess: async () => {
      reset();
      toast.success(`${!!value ? "Schedule modified" : "Shift created"}!`);
      await onSuccess();
    },
  };

  const { mutate: edit, isLoading: isEditing } =
    api.schedules.editShift.useMutation(onMutate);
  const { mutate, isLoading } = api.schedules.createShift.useMutation(onMutate);
  const { mutate: delMutate, isLoading: isDeleting } =
    api.schedules.deleteShift.useMutation(onMutate);

  const handleFormSubmit = (data: ShiftFormData) => {
    if (!data.timeRange[0] || !data.timeRange[1]) {
      console.error("date values can't be undefined");
      return;
    }
    const mainChunk = {
      userId: data.userId,
      start: dayjs(day)
        .set("hour", data.timeRange[0].hour())
        .set("minute", data.timeRange[0].minute())
        .toDate(),
      end: dayjs(day)
        .set("hour", data.timeRange[1].hour())
        .set("minute", data.timeRange[1].minute())
        .toDate(),
    };
    !!value
      ? edit({
          id: value.id,
          ...mainChunk,
        })
      : mutate(mainChunk);
  };

  const handleDelete = () => {
    if (!value) {
      console.error("No Shift to delete");
      return;
    }
    delMutate({ id: value.id });
  };

  const isDisabled = isLoading || isEditing || isDeleting;

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <h2 className="mb-2 text-xl font-bold">{day.format("dddd, MMMM D")}</h2>
      <div className="divider" />
      <h3 className="font-md text-lg">{!!value ? "Edit" : "New"} Shift</h3>
      <label className="form-control w-full max-w-xs">
        <div className="label">
          <span className="label-text">Assignee</span>
        </div>
        <select
          {...register("userId", {
            required: true,
            disabled: isLoading || isGettingUsers || isEditing,
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
        rules={{
          required: true,
        }}
        render={({ field }) => (
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Shift</span>
            </div>
            <TimePicker.RangePicker
              disabled={isDisabled}
              format="h:mm A"
              minuteStep={15}
              className="input input-bordered w-full max-w-xs"
              value={field.value}
              onChange={(dates) => field.onChange(dates)}
            />
          </label>
        )}
      />
      <div
        className={`mt-4 flex ${!!value ? "justify-between" : "justify-end"}`}
      >
        {!!value && (
          <button
            type="button"
            className="btn btn-outline btn-accent"
            disabled={isDisabled}
            onClick={handleDelete}
          >
            Delete
          </button>
        )}
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isDisabled || !formState.isValid}
        >
          {!!value ? "Save" : "Create"}
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
  onClick,
}: {
  data: RouterOutputs["schedules"]["getShifts"];
  onClick?: (shift: RouterOutputs["schedules"]["getShifts"][number]) => void;
}) => {
  const dataByHours = data.reduce(
    (acc, d) => {
      const dataIdx = acc.findIndex(
        (x) =>
          x.start === dayjs(d.start).format("h:mm") &&
          x.end === dayjs(d.end).format("h:mm"),
      );
      if (dataIdx > -1) {
        acc[dataIdx]?.shifts.push(d);
      } else {
        acc.push({
          day: dayjs(d.start).format("MMM, D"),
          start: dayjs(d.start).format("h:mm"),
          end: dayjs(d.end).format("h:mm"),
          shifts: [d],
        });
      }
      return acc;
    },
    [] as {
      day: string;
      start: string;
      end: string;
      shifts: RouterOutputs["schedules"]["getShifts"][number][];
    }[],
  );

  return (
    <ul>
      {dataByHours.map((d) => (
        <li key={d.day + d.shifts[0]?.id}>
          <div className="badge badge-outline badge-sm">
            {d.start + " - " + d.end}
          </div>
          <div>
            {d.shifts.map((s) =>
              !!onClick ? (
                <div
                  key="info-tooltip"
                  className="tooltip tooltip-right hover:cursor-pointer"
                  data-tip="Edit"
                >
                  <button
                    key={s.id}
                    className="btn btn-ghost btn-sm btn-wide capitalize"
                    onClick={(e) => {
                      if (!onClick) return;
                      e.stopPropagation();
                      onClick(s);
                    }}
                  >
                    {s.username}
                  </button>
                </div>
              ) : (
                <div key={s.id} className="capitalize">
                  {s.username}
                </div>
              ),
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

const CloneSection = ({
  srcDate,
  onSuccess,
}: {
  srcDate: Dayjs;
  onSuccess: () => Promise<void>;
}) => {
  const [val, setVal] = useState<Dayjs>();
  const { mutate, isLoading } = api.schedules.cloneDay.useMutation({
    onError: handleApiError,
    onSuccess: async () => {
      await onSuccess();
      toast.success("Shifts successfully duplicated!");
      setVal(undefined);
    },
  });
  const handleClick = () => {
    if (!val) {
      return;
    }
    mutate({ source: srcDate.toDate(), target: val.toDate() });
  };

  return (
    <>
      <div className="items-bottom flex flex-row gap-2">
        <h3 className="font-md mb-2 text-lg">Duplicate Shifts</h3>
        <div
          key="info-tooltip"
          className="tooltip hover:cursor-pointer"
          data-tip="Duplicating a schedule day will copy all shifts to the Target Date. You may still edit them after they've been duplicated."
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
              d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
            />
          </svg>
        </div>
      </div>
      <div className="label">Target Date</div>
      <div className="flex flex-row gap-2">
        <DatePicker
          value={val}
          onChange={setVal}
          placeholder="Target Date"
          className="input input-bordered w-full"
          disabled={isLoading}
        />
        <button
          disabled={isLoading || !val}
          onClick={handleClick}
          className="btn btn-outline btn-secondary"
        >
          Duplicate
        </button>
      </div>
    </>
  );
};

const DesktopView = () => {
  const [showModal, setShowModal] = useState(false);
  const [calVal, setCalVal] = useState(() => dayjs());
  const [singleSiftModalData, setSingleShiftModalData] =
    useState<RouterOutputs["schedules"]["getShifts"][number]>();
  const { data, isLoading, refetch } = api.schedules.getShifts.useQuery({
    dateRange: [
      calVal.startOf("month").startOf("day").toDate(),
      calVal.endOf("month").endOf("day").toDate(),
    ],
  });
  const { data: perm, isLoading: isGettingPerm } =
    api.profile.getSettingsByUser.useQuery();

  const handleCellClick = (
    value: Dayjs,
    info: { source: "date" | "month" | "year" | "customize" },
  ) => {
    setCalVal(value);
    if (info.source === "date") {
      setShowModal(true);
    }
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

  const handleFormSuccess = async () => {
    await refetch();
  };

  const canSchedule = !!perm?.isAdmin || !!perm?.canSchedule;

  const shiftList = (
    <>
      <div className="items-bottom flex flex-row gap-2">
        <h3 className="font-md mb-2 text-lg">Scheduled</h3>
      </div>
      {data?.some(filterShifts(calVal)) ? (
        <CellView
          onClick={canSchedule ? (x) => setSingleShiftModalData(x) : undefined}
          data={data?.filter(filterShifts(calVal)) ?? []}
        />
      ) : (
        <div role="alert" className="alert">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="h-6 w-6 shrink-0 stroke-info"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <span>No shifts scheduled for today</span>
        </div>
      )}
    </>
  );

  const modalContent = canSchedule ? (
    <>
      <ShiftForm day={calVal} onSuccess={handleFormSuccess} />
      <div className="divider" />
      {shiftList}
      <div className="divider" />
      <CloneSection srcDate={calVal} onSuccess={handleFormSuccess} />
    </>
  ) : (
    <>{shiftList}</>
  );

  return (
    <PageLayout>
      <div className="flex flex-col gap-2 p-2">
        {canSchedule && data?.length === 0 && (
          <div role="alert" className="alert">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="h-6 w-6 shrink-0 stroke-info"
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
          disabledDate={() => isLoading || isGettingPerm}
          cellRender={cellRenderer}
          className="rounded-xl p-2 shadow-xl"
          value={calVal}
          onChange={setCalVal}
          onPanelChange={setCalVal}
          onSelect={handleCellClick}
        />
      </div>
      {showModal && (
        <ShiftModal onClose={() => setShowModal(false)}>
          {modalContent}
        </ShiftModal>
      )}
      {singleSiftModalData && (
        <ShiftModal onClose={() => setSingleShiftModalData(undefined)}>
          <ShiftForm
            day={calVal}
            onSuccess={async () => {
              await handleFormSuccess();
              setSingleShiftModalData(undefined);
            }}
            value={singleSiftModalData}
          />
        </ShiftModal>
      )}
    </PageLayout>
  );
};

function SchedulesPage() {
  return <DesktopView />;
}

export default isAuth(SchedulesPage, "employee");
