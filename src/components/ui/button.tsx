import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-b from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-white/15 ring-inset hover:from-blue-400 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98]",
        secondary: "border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900",
        accent: "bg-gradient-to-b from-orange-400 to-orange-500 text-white shadow-lg shadow-orange-500/25 ring-1 ring-white/15 ring-inset hover:from-orange-300 hover:to-orange-400 hover:scale-[1.02] active:scale-[0.98]",
        ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
        outline: "border border-gray-200 bg-white text-gray-900 hover:bg-gray-50 hover:border-gray-300",
      },
      size: {
        default: "h-11 px-5 py-2.5",
        sm: "h-9 rounded-xl px-4 text-xs",
        lg: "h-12 rounded-2xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
