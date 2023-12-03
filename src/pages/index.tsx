import { SignOutButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import { useState } from "react";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import toast from "react-hot-toast";

import { type RouterOutputs, api } from "~/utils/api";
import Link from "next/link";

const CreateConcessionItemWizard = () => {
  const { user } = useUser();
  const [label, setLabel] = useState("");
  const ctx = api.useUtils();
  const { mutate, isLoading: isCreating } = api.items.create.useMutation({
    onSuccess: () => {
      setLabel("");
      void ctx.items.getAll.invalidate();
    },
    onError: (e) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const msg = JSON.parse(e.message)[0].message as string | undefined;
      if (msg) toast.error(msg);
    },
  });

  if (!user) return null;
  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.imageUrl}
        alt="Profile image"
        className="h-10 w-10 rounded-full"
        width={56}
        height={56}
      />
      <div className="flex grow flex-col">
        <label className="text-xs font-medium">Label</label>
        <input
          id="label"
          placeholder="Ex: Candy Bar"
          className="grow rounded-lg bg-slate-50 p-2 shadow-lg outline-none"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={isCreating}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (label !== "") {
                mutate({ label });
              }
            }
          }}
        />
        {label !== "" && !isCreating && (
          <button disabled={isCreating} onClick={() => mutate({ label })}>
            Create
          </button>
        )}
        {isCreating && (
          <div className="flex items-center justify-center">
            <LoadingSpinner size={20} />
          </div>
        )}
      </div>
    </div>
  );
};

type ItemWithCreatedBy = RouterOutputs["items"]["getAll"][number];

const ItemView = (props: { item: ItemWithCreatedBy }) => {
  const { item, createdBy } = props.item;

  const usDollar = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  });

  return (
    <div className="rounded-lg bg-slate-50 p-6 shadow-lg" key={item.id}>
      <div className="flex flex-row items-baseline gap-2">
        <Link
          href={`/items/${item.id}`}
          className="font-medium hover:underline"
        >
          {item.label}
        </Link>
        <div className="text-xs capitalize italic text-slate-400">
          Last edit:{" "}
          <Link className="hover:underline" href={`/@${createdBy.username}`}>
            @{createdBy.username}
          </Link>{" "}
          - {item.createdAt.toLocaleString()}
        </div>
      </div>
      <div className="flex flex-row items-center justify-between">
        <div>Category: Concession</div>
        <div>Selling Price: {usDollar.format(item.sellingPrice / 100)}</div>
        <div>In Stock: {item.inStock}</div>
      </div>
    </div>
  );
};

const ItemList = () => {
  const { data, isLoading } = api.items.getAll.useQuery();

  if (isLoading) return <LoadingPage />;

  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col gap-3 px-3">
      {data.map((itemWithCreator) => (
        <ItemView key={itemWithCreator.item.id} item={itemWithCreator} />
      ))}
    </div>
  );
};

export default function Home() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  // user should load fast, just return empty until then
  if (!userLoaded) return <div></div>;

  // start fetching early
  api.items.getAll.useQuery();

  return (
    <>
      <main className="flex h-screen justify-center">
        <div className="h-full w-full md:max-w-2xl">
          <div className="p-4">
            {!!isSignedIn && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between font-semibold">
                  <div className="capitalize">Hi, {user.username}</div>
                  <SignOutButton />
                </div>
                <CreateConcessionItemWizard />
              </div>
            )}
          </div>
          <ItemList />
        </div>
      </main>
    </>
  );
}
