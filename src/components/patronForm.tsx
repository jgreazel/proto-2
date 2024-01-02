import { Controller, useForm } from "react-hook-form";
import DatePicker from "react-datepicker";
import { Button } from "./button";

export type PatronFormData = {
  id?: string;
  firstName: string;
  lastName: string;
  birthDate: Date | null;
};

type Props = {
  onSubmit: (data: PatronFormData) => void;
  submitText?: string;
  disabled: boolean;
  onCancel: () => void;
};

const PatronForm = (props: Props) => {
  const { register, handleSubmit, control, reset } = useForm<PatronFormData>();

  const submitAndReset = (data: PatronFormData) => {
    props.onSubmit(data);
    reset();
  };

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
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
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
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("lastName", {
          required: true,
          disabled: props.disabled,
        })}
      />
      <label className="text-xs font-medium">Birth Date</label>
      <Controller
        control={control}
        name="birthDate"
        render={({ field }) => (
          <DatePicker
            className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
            placeholderText="Birthday (Optional)"
            selected={field.value}
            onChange={(date: Date) => field.onChange(date)}
          />
        )}
      />
      <div>
        <Button type="submit">{props.submitText ?? "Submit"}</Button>
        <Button
          onClick={() => {
            reset();
            props.onCancel();
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default PatronForm;
