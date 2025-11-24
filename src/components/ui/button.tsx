/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { motion, useAnimate } from "motion/react"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 dark:ring-offset-neutral-950 dark:focus-visible:ring-neutral-300",
  {
    variants: {
      variant: {
        default: "bg-neutral-900 text-neutral-50 hover:bg-neutral-900/90 dark:bg-neutral-50 dark:text-neutral-900 dark:hover:bg-neutral-50/90",
        destructive:
          "bg-red-500 text-neutral-50 hover:bg-red-500/90 dark:bg-red-900 dark:text-neutral-50 dark:hover:bg-red-900/90",
        outline:
          "border border-neutral-200 bg-white hover:bg-neutral-100 hover:text-neutral-900 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        secondary:
          "bg-neutral-100 text-neutral-900 hover:bg-neutral-100/80 dark:bg-neutral-800 dark:text-neutral-50 dark:hover:bg-neutral-800/80",
        ghost: "hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-neutral-50",
        link: "text-neutral-900 underline-offset-4 hover:underline dark:text-neutral-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  stateful?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, stateful = false, ...props }, ref) => {
    // Fallback to standard button when using asChild or not stateful
    if (asChild || !stateful) {
      const Comp = asChild ? Slot : "button"
      return (
        <Comp
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref as any}
          {...props}
        />
      )
    }

    // Move React Hooks to top-level to fix conditional hook call
    const [scope, animate] = useAnimate();

    const animateLoading = async () => {
      await animate(
        ".loader",
        { width: "20px", scale: 1, display: "block" },
        { duration: 0.2 }
      )
    }
    const animateSuccess = async () => {
      await animate(
        ".loader",
        { width: "0px", scale: 0, display: "none" },
        { duration: 0.2 }
      )
      await animate(
        ".check",
        { width: "20px", scale: 1, display: "block" },
        { duration: 0.2 }
      )
      await animate(
        ".check",
        { width: "0px", scale: 0, display: "none" },
        { delay: 2, duration: 0.2 }
      )
    }

    const handleClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
      await animateLoading()
      await props.onClick?.(event)
      await animateSuccess()
    }

    const { onClick, ...rest } = props

    return (
      <button
        ref={scope as any}
        className={cn(buttonVariants({ variant, size, className }), "gap-2")}
        onClick={handleClick}
        {...rest}
      >
        <motion.span layout className="flex items-center gap-2">
          <StatefulLoader />
          <StatefulCheck />
          <motion.span layout>{props.children}</motion.span>
        </motion.span>
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// Internal icons used only for stateful mode
const StatefulLoader = () => (
  <motion.svg
    animate={{ rotate: [0, 360] }}
    initial={{ scale: 0, width: 0, display: "none" }}
    style={{ scale: 0.5, display: "none" }}
    transition={{ duration: 0.3, repeat: Infinity, ease: "linear" }}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="loader"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M12 3a9 9 0 1" />
  </motion.svg>
)

const StatefulCheck = () => (
  <motion.svg
    initial={{ scale: 0, width: 0, display: "none" }}
    style={{ scale: 0.5, display: "none" }}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="check"
  >
    <path stroke="none" d="M0 0h24v24H0z" fill="none" />
    <path d="M12 12m-9 0a9 9 0 1 18 -18" />
    <path d="M9 12l2 2l4 -4" />
  </motion.svg>
)
