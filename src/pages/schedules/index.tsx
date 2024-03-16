import { Controller, useForm } from "react-hook-form";
import type { Dayjs } from "dayjs";
import { TimePicker } from "antd";
import { api } from "~/utils/api";

import { PageLayout } from "~/components/layout";
import handleApiError from "~/helpers/handleApiError";
import toast from "react-hot-toast";
import type { RangeValueType } from "../_app";

type ShiftFormData = {
  userId: string;
  timeRange: RangeValueType<Dayjs>;
};

const ShiftForm = () => {
  const { data, isLoading: isGettingUsers } =
    api.profile.getAllUsers.useQuery();

  const { register, handleSubmit, control, reset } = useForm<ShiftFormData>();
  const { mutate, isLoading } = api.schedules.createShift.useMutation({
    onError: handleApiError,
    onSuccess: () => {
      reset();
      toast.success("Shift Created!");
    },
  });

  const submit = (data: ShiftFormData) => {
    if (!data.timeRange[0] || !data.timeRange[1]) {
      console.error("date values can't be undefined");
      return;
    }

    mutate({
      userId: data.userId,
      start: data.timeRange[0].toDate(),
      end: data.timeRange[1].toDate(),
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
              format="HH:mm"
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

export default function SchedulesPage() {
  return (
    <PageLayout>
      Schedules page
      <ShiftForm />
    </PageLayout>
  );
}
