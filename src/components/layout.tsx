import { SignOutButton, useUser } from "@clerk/nextjs";
import type { PropsWithChildren, ReactNode } from "react";
import { Button } from "./button";

type LayoutProps = {
  actionRow?: ReactNode;
  hideHeader?: boolean;
};

export const PageLayout = (props: PropsWithChildren & LayoutProps) => {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();

  // user should load fast, just return empty until then
  if (!userLoaded) return <div></div>;

  return (
    <main className="mx-auto flex h-screen w-full flex-col justify-start md:max-w-4xl">
      {!props.hideHeader && (
        <div className="rounded-xl bg-slate-50 p-4 shadow-xl">
          {!!isSignedIn && (
            <div className="flex flex-row justify-between align-middle font-semibold">
              <div className="self-center capitalize">Hi, {user.username}</div>
              <div className="flex flex-row gap-3">
                <Button href="/">Home</Button>
                <Button href="items">Items</Button>
                <Button href="passes">Passes</Button>
                <Button href="checkout">Checkout</Button>
                <Button href="reports">Reports</Button>
              </div>
              <SignOutButton />
            </div>
          )}
        </div>
      )}
      <div className="grow overflow-auto pt-2">{props.children}</div>
      {props.actionRow && <div className="p-4">{props.actionRow}</div>}
    </main>
  );
};
