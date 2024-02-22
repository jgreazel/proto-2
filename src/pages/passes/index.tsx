import { PageLayout } from "~/components/layout";
import { Button } from "~/components/button";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import Link from "next/link";
import { useState } from "react";
import filterPasses from "~/helpers/filterPasses";

export default function PassesPage() {
  const { data, isLoading } = api.passes.getAll.useQuery();
  const [filter, setFilter] = useState("");

  return (
    <PageLayout
      actionRow={
        <div>
          <Button href="passes/0">Add Pass</Button>
        </div>
      }
    >
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="flex h-full flex-col gap-3 p-1">
          <h1 className="p-3 font-bold underline">Season Passes</h1>
          <div className="flex flex-row items-center gap-2">
            <label
              className="font-semibold text-slate-800"
              htmlFor="pass-filter"
            >
              Filter:
            </label>
            <input
              id="pass-filter"
              value={filter}
              placeholder="Ex: Anderson, John, etc..."
              onChange={(e) => setFilter(e.target.value)}
              className="w-full rounded-xl bg-slate-50 p-3 text-slate-700 shadow-xl"
            />
          </div>
          <div className="flex h-full flex-col gap-2 overflow-auto">
            {data
              ?.filter((d) => filterPasses(d, filter))
              .map((p) => (
                <div
                  className="rounded-md bg-slate-50 p-3 font-medium text-slate-700 shadow-lg"
                  key={p.id + "-pass-card"}
                >
                  <div className="flex flex-row items-baseline gap-2">
                    <div>{p.label}</div>
                    <Link
                      className="text-xs text-slate-400"
                      href={`passes/${p.id}`}
                    >
                      Edit
                    </Link>
                  </div>
                  <div className="flex flex-col gap-2 p-4">
                    {p.patrons.map((x) => (
                      <div
                        key={x.passId + x.id}
                        className="flex flex-row items-baseline justify-between rounded-2xl bg-slate-50 p-1 px-4 shadow-lg"
                      >
                        {x.firstName}
                        {!!x.birthDate && (
                          <div className="text-sm text-slate-400">
                            {new Date().getFullYear() -
                              x.birthDate.getFullYear()}{" "}
                            y/o
                          </div>
                        )}
                        <Link
                          className="ml-2 text-xs text-slate-400"
                          href={`passes/patrons/${x.id}`}
                        >
                          Edit
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}
