import { PageLayout } from "~/components/layout";
import { api } from "~/utils/api";
import { LoadingPage } from "~/components/loading";
import Link from "next/link";
import { useState } from "react";
import filterPasses from "~/helpers/filterPasses";
import PeopleGrid from "~/components/peopleGrid";
import isAuth from "~/components/isAuth";

function PassesPage() {
  const { data, isLoading } = api.passes.getAll.useQuery();
  const [filter, setFilter] = useState("");

  const filteredPasses = data?.filter((d) => filterPasses(d, filter));

  return (
    <PageLayout>
      {isLoading ? (
        <LoadingPage />
      ) : (
        <div className="flex h-full flex-col gap-3 p-4">
          <div className="flex w-full flex-row items-center justify-between gap-2 p-2">
            <label
              htmlFor="pass-filter"
              className="input input-bordered m-1 flex grow items-center gap-2"
            >
              <input
                id="pass-filter"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                type="text"
                className="grow"
                placeholder="Search"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-4 w-4 opacity-70"
              >
                <path
                  fillRule="evenodd"
                  d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
            <div className="tooltip tooltip-left" data-tip="New Season Pass">
              <Link href="passes/0" className="btn btn-circle btn-ghost">
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
                    d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
                  />
                </svg>
              </Link>
            </div>
          </div>
          {!!filteredPasses?.length ? (
            filteredPasses.map((pass) => (
              <div
                className="card card-compact bg-base-100 shadow-xl"
                key={pass.id}
              >
                <div className="card-body">
                  <h2 className="card-title"> {pass.label}</h2>
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Age</th>
                        <th>Edit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pass.patrons.map((patron) => (
                        <tr key={patron.passId + patron.id}>
                          <td className="font-medium capitalize">
                            {patron.firstName}
                          </td>
                          <td className="capitalize">{patron.lastName}</td>
                          <td>
                            {!!patron.birthDate
                              ? `${
                                  new Date().getFullYear() -
                                  patron.birthDate.getFullYear()
                                } y/o`
                              : "-"}
                          </td>
                          <td>
                            <div className="tooltip" data-tip="Edit Patron">
                              <Link
                                className="btn btn-circle btn-ghost btn-sm"
                                href={`passes/patrons/${patron.id}`}
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
                                    d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                                  />
                                </svg>
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="card-actions justify-end">
                    <Link className="btn btn-ghost" href={`passes/${pass.id}`}>
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
                          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"
                        />
                      </svg>
                      Edit Pass
                    </Link>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12">
              <PeopleGrid />
              <div className="mt-8 text-center font-medium">No Passes Yet</div>
            </div>
          )}
        </div>
      )}
    </PageLayout>
  );
}

export default isAuth(PassesPage, "employee");
