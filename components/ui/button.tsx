import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva("inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#223b83] disabled:pointer-events-none disabled:opacity-50", { variants: { variant: { default: "bg-[#223b83] text-white hover:bg-[#1b306e]", outline: "border border-[#dfe3dc] bg-white text-[#223b83] hover:border-[#223b83]", ghost: "text-[#667085] hover:bg-[#f0f2ed] hover:text-[#182032]" }, size: { default: "px-4 py-2.5", sm: "px-3 py-2", lg: "px-6 py-3.5" } }, defaultVariants: { variant: "default", size: "default" } });

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
