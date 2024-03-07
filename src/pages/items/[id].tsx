import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useForm } from "react-hook-form";

import { api } from "~/utils/api";
import { Button } from "~/components/button";
import { useParams } from "next/navigation";
import handleApiError from "~/helpers/handleApiError";

type AdmissionFormData = {
  label: string;
  sellingPrice: number;
  passType: "seasonal" | "day";
  patronLimit: number | null;
};

const AdmissionItemForm = (props: {
  onSubmit: (data: AdmissionFormData) => void;
  isSubmitting: boolean;
  isLoading: boolean;
  data?: AdmissionFormData;
}) => {
  const { onSubmit, isSubmitting, isLoading, data } = props;

  const [showPatronLimit, setShowPatronLimit] = useState(false);

  const { register, handleSubmit, watch, formState, reset, getValues } =
    useForm<AdmissionFormData>({
      defaultValues: {
        label: "",
        sellingPrice: 0,
        passType: "day",
      },
    });
  const watchPassType = watch("passType");

  useEffect(() => {
    if (getValues().label === "" && data) reset(data);
  }, [data, reset, getValues]);

  useEffect(() => {
    setShowPatronLimit(watchPassType === "seasonal");
  }, [watchPassType, setShowPatronLimit]);

  return (
    <form
      className="flex grow flex-col gap-2"
      onSubmit={handleSubmit((values) => {
        onSubmit(values);
        !data && reset();
      })}
    >
      <label className="text-xs font-medium">Label</label>
      <input
        id="label"
        type="text"
        placeholder="Ex: Adult Day Pass"
        className="input input-bordered grow"
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
        className="input input-bordered grow"
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
          className="radio"
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
          className="radio"
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
            className="input input-bordered grow"
            {...register("patronLimit", {
              required: watchPassType === "seasonal",
              disabled: isSubmitting || isLoading,
              valueAsNumber: true,
              min: 1,
            })}
          />
        </>
      )}
      {!isSubmitting && (
        <Button
          primary
          disabled={isSubmitting || !formState.isValid}
          type="submit"
        >
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
        className="input input-bordered grow"
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
        className="input input-bordered grow"
        {...register("purchasePrice", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
          min: 1,
        })}
      />
      <label className="text-xs font-medium">Selling Price</label>
      <input
        id="sell-price"
        type="number"
        placeholder="Ex: 150 ($1.50)"
        className="input input-bordered grow"
        {...register("sellingPrice", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
          min: 1,
        })}
      />
      <label className="text-xs font-medium">Quantity in Stock</label>
      <input
        id="init-stock"
        type="number"
        placeholder="Ex: 0"
        className="input input-bordered grow"
        {...register("inStock", {
          required: true,
          disabled: isSubmitting || isLoading,
          valueAsNumber: true,
          min: 1,
        })}
      />
      {!isSubmitting && (
        <Button
          primary
          disabled={isSubmitting || !formState.isValid}
          type="submit"
        >
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

const mutationOpts = (ctx: {
  items: { getById: { invalidate: () => void } };
}) => ({
  onSuccess: () => {
    void ctx.items.getById.invalidate();
  },
  onError: handleApiError,
});

const CreateItemWizard = () => {
  // ctx v. api: ctx = server side OR as part of the request... or is it just the react context?
  const ctx = api.useUtils();
  const { mutate: concessionMutation, isLoading: isCreating } =
    api.items.createConcessionItem.useMutation(mutationOpts(ctx));
  const { mutate: admissionMutation, isLoading: isCreatingA } =
    api.items.createAdmissionItem.useMutation(mutationOpts(ctx));

  const [tab, setTab] = useState<"admission" | "concession">("admission");

  return (
    <div className="flex w-full flex-col gap-3">
      <div role="tablist" className="tabs-boxed tabs">
        <a
          role="tab"
          className={`tab ${tab === "concession" && "tab-active"}`}
          onClick={() => setTab("concession")}
        >
          Concession
        </a>
        <a
          role="tab"
          className={`tab ${tab === "admission" && "tab-active"}`}
          onClick={() => setTab("admission")}
        >
          Admission
        </a>
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

const EditItemWizard = (props: { id: string }) => {
  const { data, isLoading } = api.items.getById.useQuery({ id: props.id });

  const ctx = api.useUtils();
  const { mutate: concessionMutate, isLoading: isUpdating } =
    api.items.updateConcessionItem.useMutation(mutationOpts(ctx));
  const { mutate: admissionMutate, isLoading: isUpdatingA } =
    api.items.updateAdmissionItem.useMutation(mutationOpts(ctx));

  if (isLoading) {
    return (
      <div>
        <LoadingPage />
      </div>
    );
  }

  return (
    <div className="flex w-full gap-3">
      {data?.item.isConcessionItem ? (
        <ConcessionItemForm
          data={data?.item as ConcessionFormData}
          isLoading={isLoading}
          isSubmitting={isUpdating}
          onSubmit={(data) => concessionMutate({ ...data, id: props.id })}
        />
      ) : (
        <AdmissionItemForm
          data={{
            label: "",
            sellingPrice: 0,
            patronLimit: null,
            ...data?.item,
            passType: data?.item.isSeasonal ? "seasonal" : "day",
          }}
          isLoading={isLoading}
          isSubmitting={isUpdatingA}
          onSubmit={(data) =>
            admissionMutate({
              ...data,
              id: props.id,
              isDay: data.passType === "day",
              isSeasonal: data.passType === "seasonal",
              patronLimit:
                data.passType === "seasonal"
                  ? data.patronLimit ?? 1
                  : undefined,
            })
          }
        />
      )}
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
      <dialog id="single-item-modal" className="modal modal-open">
        <form method="dialog" className="modal-backdrop">
          <Link href="/items">close</Link>
        </form>
        <div className="modal-box">
          <form method="dialog">
            <Link
              href="/items"
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
            </Link>
          </form>
          <div className="mt-4">
            {id === "0" ? (
              <CreateItemWizard />
            ) : (
              <EditItemWizard id={id as string} />
            )}
          </div>
        </div>
      </dialog>
    </>
  );
}
