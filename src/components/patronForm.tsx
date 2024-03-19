import { Controller, useForm } from "react-hook-form";
import { useEffect } from "react";
import { DatePicker } from "antd";

import { Button } from "./button";
import type { Dayjs } from "dayjs";

export type PatronFormData = {
  id?: string;
  firstName: string;
  lastName: string;
  birthDate: Dayjs;
};

type Props = {
  data?: PatronFormData;
  onSubmit: (data: PatronFormData) => void;
  submitText?: string;
  disabled: boolean;
  onCancel: () => void;
};

const PatronForm = (props: Props) => {
  const { register, handleSubmit, control, reset, formState } =
    useForm<PatronFormData>({
      defaultValues: { ...props.data },
    });

  const submitAndReset = (data: PatronFormData) => {
    props.onSubmit(data);
    reset();
  };

  useEffect(() => {
    if (props.data) {
      reset(props.data);
    }
  }, [props.data, reset]);

  return (
    <form
      onSubmit={handleSubmit(submitAndReset)}
      className="flex flex-col gap-2"
    >
      <label className="text-xs font-medium">First Name</label>
      <input
        id="firstName"
        type="text"
        placeholder="Ex: John"
        className="input input-bordered"
        {...register("firstName", {
          required: true,
          disabled: props.disabled,
        })}
      />
      <label className="text-xs font-medium">Last Name</label>
      <input
        id="lastName"
        type="text"
        placeholder="Ex: Doe"
        className="input input-bordered grow"
        {...register("lastName", {
          required: true,
          disabled: props.disabled,
        })}
      />
      <Controller
        control={control}
        name="birthDate"
        render={({ field }) => (
          <label className="form-control w-full max-w-xs">
            <div className="label">
              <span className="label-text">Birthday (Optional)</span>
            </div>
            <DatePicker
              value={field.value}
              className="input input-bordered w-full max-w-xs"
              onChange={(date) => field.onChange(date)}
            />
          </label>
        )}
      />
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => {
            reset();
            props.onCancel();
          }}
        >
          Cancel
        </Button>
        <button
          className="btn btn-primary"
          type="submit"
          disabled={!formState.isValid}
        >
          {props.submitText ?? "Submit"}
        </button>
      </div>
    </form>
  );
};

export default PatronForm;
