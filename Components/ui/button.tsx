import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm",
    "cursor-pointer select-none transition-all duration-150 ease-out",
    "active:scale-[0.98] disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-45 disabled:active:scale-100",
    "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0",
    "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/45",
    "aria-invalid:ring-destructive/25",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground font-semibold shadow-md shadow-black/25 ring-1 ring-primary/30 hover:brightness-110 hover:shadow-lg",
        destructive:
          "bg-destructive text-white font-semibold shadow-md shadow-black/25 ring-1 ring-destructive/35 hover:brightness-110",
        outline:
          "border-2 border-border bg-background font-semibold shadow-sm hover:bg-accent hover:border-primary/30 dark:border-white/16 dark:bg-white/6 dark:hover:border-[oklch(0.65_0.05_85/0.35)] dark:hover:bg-white/10",
        secondary:
          "bg-secondary text-secondary-foreground font-semibold shadow-sm ring-1 ring-border/40 hover:brightness-105 dark:bg-white/8 dark:hover:bg-white/12",
        ghost:
          "font-medium hover:bg-accent/80 dark:hover:bg-white/8",
        link: "text-primary font-semibold underline-offset-4 hover:underline",
        success:
          "font-semibold shadow-md shadow-black/25 ring-1 ring-[oklch(0.55_0.1_145/0.4)] bg-[oklch(0.48_0.1_145)] text-[oklch(0.97_0.02_145)] hover:bg-[oklch(0.54_0.11_145)] hover:shadow-lg",
        apex:
          "font-semibold shadow-md shadow-black/30 ring-1 ring-[oklch(0.62_0.12_195/0.45)] bg-linear-to-r from-[oklch(0.52_0.12_195)] to-[oklch(0.62_0.08_85)] text-[oklch(0.12_0.02_265)] hover:brightness-110 hover:shadow-lg",
      },
      size: {
        default: "h-10 px-4 py-2 has-[>svg]:px-3",
        sm: "h-9 rounded-md gap-1.5 px-3.5 text-sm has-[>svg]:px-2.5",
        lg: "h-11 rounded-lg px-6 text-base has-[>svg]:px-4",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
