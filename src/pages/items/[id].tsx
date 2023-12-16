import Head from "next/head";
import { useEffect, useState } from "react";
import { LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";

import { api } from "~/utils/api";
import { Button } from "~/components/button";
import { useParams } from "next/navigation";

type AdmissionFormData = {
  label: string;
  sellingPrice: number;
  passType: "seasonal" | "day";
  patronLimit?: number;
};

const AdmissionItemForm = (props: {
  onSubmit: (data: AdmissionFormData) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  data?: AdmissionFormData;
}) => {
  const { onSubmit, isSubmitting, isLoading, data } = props;

  const [showPatronLimit, setShowPatronLimit] = useState(false);

  const { register, handleSubmit, watch, formState, reset } =
    useForm<AdmissionFormData>({
      defaultValues: {
        label: "",
        sellingPrice: 0,
        passType: "day",
      },
    });
  const watchForm = watch();
  const watchPassType = watch("passType");

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  useEffect(() => {
    setShowPatronLimit(watchPassType === "seasonal");
  }, [watchPassType, setShowPatronLimit]);

  return (
    <form
      className="flex grow flex-col gap-2"
      onSubmit={handleSubmit(() => {
        onSubmit(watchForm);
        !data && reset();
      })}
    >
      <label className="text-xs font-medium">Label</label>
      <input
        id="label"
        placeholder="Ex: Adult Day Pass"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("label", {
          required: true,
          disabled: isSubmitting || isLoading,
        })}
      />
      <label className="text-xs font-medium">Selling Price</label>
      <input
        id="sell-price"
        type="number"
        placeholder="Ex: 400 ($4.00)"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("sellingPrice", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
        })}
      />
      <div className="mb-4 flex items-center">
        <input
          id="passTypeDayPassOption"
          type="radio"
          value="day"
          {...register("passType")}
          className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
        />
        <label
          htmlFor="passTypeDayPassOption"
          className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          Day Pass
        </label>
      </div>
      <div className="flex items-center">
        <input
          id="passTypeSeasonalPassOption"
          type="radio"
          value="seasonal"
          {...register("passType")}
          className="h-4 w-4 border-gray-300 bg-gray-100 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:ring-offset-gray-800 dark:focus:ring-blue-600"
        />
        <label
          htmlFor="passTypeSeasonalPassOption"
          className="ms-2 text-sm font-medium text-gray-900 dark:text-gray-300"
        >
          Seasonal Pass
        </label>
      </div>
      {showPatronLimit && (
        <>
          <label htmlFor="patronLimit" className="text-xs font-medium">
            Patron Limit
          </label>
          <input
            id="patronLimit"
            type="number"
            placeholder="Ex: 4"
            className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
            {...register("patronLimit", {
              required: false,
              disabled: isSubmitting || isLoading,
              valueAsNumber: true,
            })}
          />
        </>
      )}
      {formState.isValid && !isSubmitting && (
        <Button disabled={isSubmitting} type="submit">
          {data ? "Save" : "Create"}
        </Button>
      )}
      {isSubmitting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </form>
  );
};

type ConcessionFormData = {
  label: string;
  purchasePrice: number;
  sellingPrice: number;
  inStock: number;
};

const ConcessionItemForm = (props: {
  onSubmit: (data: ConcessionFormData) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  data?: ConcessionFormData;
}) => {
  const { onSubmit, isSubmitting, isLoading, data } = props;

  const { register, handleSubmit, watch, formState, reset } =
    useForm<ConcessionFormData>({
      defaultValues: {
        label: "",
        purchasePrice: 0,
        sellingPrice: 0,
        inStock: 0,
      },
    });
  const watchForm = watch();

  useEffect(() => {
    if (data) reset(data);
  }, [data, reset]);

  return (
    <form
      className="flex grow flex-col gap-2"
      onSubmit={handleSubmit(() => {
        onSubmit(watchForm);
        !data && reset();
      })}
    >
      <label className="text-xs font-medium">Label</label>
      <input
        id="label"
        placeholder="Ex: Candy Bar"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("label", {
          required: true,
          disabled: isSubmitting || isLoading,
        })}
      />
      <label className="text-xs font-medium">Purchase Price</label>
      <input
        id="purchase-price"
        type="number"
        placeholder="Ex: 50 ($0.50)"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("purchasePrice", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
        })}
      />
      <label className="text-xs font-medium">Selling Price</label>
      <input
        id="sell-price"
        type="number"
        placeholder="Ex: 150 ($1.50)"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("sellingPrice", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
        })}
      />
      <label className="text-xs font-medium">Quantity in Stock</label>
      <input
        id="init-stock"
        type="number"
        placeholder="Ex: 0"
        className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
        {...register("inStock", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
        })}
      />
      {formState.isValid && !isSubmitting && (
        <Button disabled={isSubmitting} type="submit">
          {data ? "Save" : "Create"}
        </Button>
      )}
      {isSubmitting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </form>
  );
};

const CreateItemWizard = () => {
  // ctx v. api: ctx = server side OR as part of the request
  const ctx = api.useUtils();
  const mutationOps = {
    onSuccess: () => {
      void ctx.items.getAll.invalidate();
    },
    onError: (e: { message: string }) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const msg = JSON.parse(e.message)[0].message as string | undefined;
      if (msg) toast.error(msg);
    },
  };
  const { mutate: concessionMutation, isLoading: isCreating } =
    api.items.createConcessionItem.useMutation(mutationOps);
  const { mutate: admissionMutation, isLoading: isCreatingA } =
    api.items.createAdmissionItem.useMutation(mutationOps);

  const [tab, setTab] = useState<"admission" | "concession">("admission");

  return (
    <div className="flex w-full flex-col gap-3">
      <div className="flex items-center justify-evenly rounded-xl border-2 border-solid border-sky-600 text-slate-800">
        <div
          className={
            tab === "admission" ? "rounded-2xl bg-sky-600 p-2 text-sky-50" : ""
          }
          onClick={() => {
            setTab("admission");
          }}
        >
          Admission Item
        </div>
        <div
          className={
            tab === "concession" ? "rounded-2xl bg-sky-600 p-2 text-sky-50" : ""
          }
          onClick={() => {
            setTab("concession");
          }}
        >
          Concession Item
        </div>
      </div>
      {tab === "admission" ? (
        <AdmissionItemForm
          isLoading={false}
          isSubmitting={isCreatingA}
          onSubmit={(data) =>
            admissionMutation({
              ...data,
              isDay: data.passType === "day",
              isSeasonal: data.passType === "seasonal",
              patronLimit:
                data.passType === "seasonal"
                  ? data.patronLimit ?? 1
                  : undefined,
            })
          }
        />
      ) : (
        <ConcessionItemForm
          isLoading={false}
          isSubmitting={isCreating}
          onSubmit={concessionMutation}
        />
      )}
    </div>
  );
};

const EditConcessionItemWizard = (props: { id: string }) => {
  const { data, isLoading } = api.items.getById.useQuery({ id: props.id });

  const ctx = api.useUtils();
  const { mutate, isLoading: isUpdating } =
    api.items.updateConcessionItem.useMutation({
      onSuccess: () => {
        void ctx.items.getById.invalidate();
      },
      onError: (e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const msg = JSON.parse(e.message)[0].message as string | undefined;
        if (msg) toast.error(msg);
      },
    });

  return (
    <div className="flex w-full gap-3">
      <ConcessionItemForm
        data={data?.item as ConcessionFormData}
        isLoading={isLoading}
        isSubmitting={isUpdating}
        onSubmit={(data) => mutate({ ...data, id: props.id })}
      />
    </div>
  );
};

export default function SingleItemPage() {
  const params = useParams();
  const id = params?.id ?? "0";

  return (
    <>
      <Head>
        <title>GS: Single Item</title>
      </Head>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
          <div className="p-4">
            {id === "0" ? (
              <CreateItemWizard />
            ) : (
              <EditConcessionItemWizard id={id as string} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
