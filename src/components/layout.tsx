import { SignOutButton, useUser } from "@clerk/nextjs";
import type { PropsWithChildren, ReactNode } from "react";
import { Button } from "./button";
import Link from "next/link";

type LayoutProps = {
  actionRow?: ReactNode;
  hideHeader?: boolean;
};

const FullNav = () => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  // user should load fast, just return empty until then
  if (!userLoaded) return <div></div>;

  return (
    <div className="navbar rounded-lg bg-base-100 shadow">
      {/* // small screens */}
      <div className="navbar-start">
        <div className="dropdown">
          <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h8m-8 6h16"
              />
            </svg>
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content menu-md z-[1] mt-3 w-52 rounded-box bg-base-100 p-2 shadow"
          >
            <li>
              <Link href="/">Home</Link>
            </li>
            <li>
              <Link href="/checkout">Checkout</Link>
            </li>
            <li>
              <Link href="/items">Items</Link>
            </li>
            <li>
              <Link href="/passes">Passes</Link>
            </li>
            <li>
              <Link href="/reports">Reports</Link>
            </li>
          </ul>
        </div>
        <Link href="/" className="btn btn-ghost text-xl">
          Guard Shack
        </Link>
      </div>
      {/* // full width */}
      <div className="navbar-center hidden lg:flex">
        <ul className="menu menu-horizontal px-1">
          <li>
            <Link href="/checkout">Checkout</Link>
          </li>
          <li>
            <Link href="/items">Items</Link>
          </li>
          <li>
            <Link href="/passes">Passes</Link>
          </li>
          <li>
            <Link href="/reports">Reports</Link>
          </li>
        </ul>
      </div>
      <div className="navbar-end">
        {!!isSignedIn && (
          <div className="dropdown z-50">
            <div tabIndex={0} role="button" className="btn btn-ghost">
              Hi, {user.username}
            </div>
            <ul
              tabIndex={0}
              className="menu dropdown-content menu-md rounded-box bg-base-100 p-2 shadow"
            >
              <li className="w-max">
                <SignOutButton />
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export const PageLayout = (props: PropsWithChildren & LayoutProps) => {
  return (
    <main className="mx-auto flex h-screen w-full flex-col justify-start md:max-w-5xl">
      {!props.hideHeader && <FullNav />}
      <div className="grow overflow-auto pt-2">{props.children}</div>
      {props.actionRow && <div className="p-4">{props.actionRow}</div>}
    </main>
  );
};
