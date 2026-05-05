"use client";

import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: Props) {
  return (
    <button
      className={clsx(
        "focus-ring inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-[#625df5] text-white hover:bg-[#514ce4]",
        variant === "secondary" && "border border-slate-300 bg-white text-ink hover:bg-slate-50",
        variant === "danger" && "bg-coral text-white hover:bg-[#cf5d44]",
        variant === "ghost" && "bg-transparent text-ink hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}
