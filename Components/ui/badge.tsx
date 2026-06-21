import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-white/10 bg-white/8 text-foreground dark:border-white/12",
        outline:
          "border-white/15 bg-transparent text-foreground dark:border-white/18",
        destructive:
          "border-transparent bg-destructive text-white shadow-sm ring-1 ring-destructive/30",
        success:
          "border-transparent bg-[oklch(0.48_0.1_145)] text-[oklch(0.97_0.02_145)] shadow-sm ring-1 ring-[oklch(0.55_0.1_145/0.35)]",
        warning:
          "border-transparent bg-[oklch(0.72_0.11_75)] text-[oklch(0.2_0.04_75)] shadow-sm ring-1 ring-[oklch(0.65_0.1_75/0.35)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
