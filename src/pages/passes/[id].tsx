import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Button } from "~/components/button";
import { LoadingSpinner } from "~/components/loading";
import { api } from "~/utils/api";

type SeasonPassFormData = {
  label: string;
};

export default function SinglePassPage() {
  const { register, handleSubmit, reset } = useForm<SeasonPassFormData>();
  const ctx = api.useUtils();
  const { mutate, isLoading } = api.passes.createSeasonPass.useMutation({
    onSuccess: () => {
      reset();
      void ctx.passes.getAll.invalidate();
    },
    onError: (e: { message: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const msg = JSON.parse(e.message)[0].message as string | undefined;
      if (msg) toast.error(msg);
    },
  });
  const onSubmit = (data: SeasonPassFormData) => {
    mutate({
      seasonPass: data,
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mx-auto flex w-1/2 flex-col gap-3"
    >
      <label className="text-xs font-medium">Label</label>
      <input
        id="label"
        placeholder="Ex: Johnson, Anderson, etc..."
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("label", {
          required: true,
          disabled: isLoading,
        })}
      />
      {isLoading ? (
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      ) : (
        <Button type="submit">Create</Button>
      )}
    </form>
  );
}
