import { type PropsWithChildren } from "react";
import Link from "next/link";

export const Button = (
  props: PropsWithChildren & {
    href?: string;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
    onClick?: () => void;
    primary?: boolean;
  },
) => {
  return props.href ? (
    <Link href={props.href} className={`btn ${props.primary && "btn-primary"}`}>
      {props.children}
    </Link>
  ) : (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      type={props.type ?? "button"}
      className={`btn ${props.primary && "btn-primary"}`}
    >
      {props.children}
    </button>
  );
};
