"use client";

import Link from "next/link";
import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export type ButtonVariant = "primary" | "secondary" | "accent";

interface CustomButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-500 hover:via-blue-500 hover:to-cyan-500 dark:from-teal-500 dark:to-blue-500 dark:hover:from-teal-400 dark:hover:via-blue-400 dark:hover:to-cyan-400 text-white shadow-lg shadow-teal-500/30 dark:shadow-teal-400/40 hover:shadow-teal-500/50 dark:hover:shadow-teal-400/60 px-8 py-4 h-auto text-base font-semibold rounded-full transition-all duration-300 transform hover:scale-105 relative overflow-hidden border border-teal-600/20 dark:border-teal-400/30",
  secondary:
    "bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 px-8 py-4 h-auto text-base font-semibold rounded-full shadow-lg transition-all duration-300",
  accent:
    "bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 dark:from-teal-500 dark:to-cyan-500 dark:hover:from-teal-400 dark:hover:to-cyan-400 text-white shadow-lg shadow-teal-500/25 dark:shadow-teal-400/35 hover:shadow-teal-500/40 dark:hover:shadow-teal-400/50 px-8 py-4 h-auto text-base font-semibold rounded-full transition-all duration-300 transform hover:scale-105 border border-teal-600/20 dark:border-teal-400/30",
};

export const CustomButton: React.FC<CustomButtonProps> = ({
  href,
  children,
  className = "",
  variant = "primary",
}) => {
  if (variant === "primary") {
    return (
      <Link href={href}>
        <Button
          className={`${variantClasses[variant]} ${className} whitespace-nowrap flex-nowrap relative m-px`}
        >
          <span className="flex items-center gap-3">{children}</span>
        </Button>
      </Link>
    );
  }

  return (
    <Link href={href}>
      <Button
        className={`${variantClasses[variant]} ${className} whitespace-nowrap flex-nowrap relative overflow-hidden group`}
      >
        <span className="relative z-10 flex items-center gap-3">
          {children}
        </span>
        {variant === "secondary" && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-100/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        )}
      </Button>
    </Link>
  );
};
