import { type PropsWithChildren } from "react";
import Link from "next/link";

export const Button = (
  props: PropsWithChildren & {
    href?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
  },
) => {
  return props.href ? (
    <Link
      href={props.href}
      className="rounded-lg border-2 border-solid border-sky-600 p-2 text-sky-700 hover:opacity-70"
    >
      {props.children}
    </Link>
  ) : (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      type={props.type ?? "button"}
      className="rounded-lg border-2 border-solid border-sky-600 p-2 text-sky-700 hover:opacity-70 disabled:opacity-50"
    >
      {props.children}
    </button>
  );
};
