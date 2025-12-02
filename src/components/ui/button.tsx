import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-glow-cyan hover:bg-primary/90 hover:shadow-glow-intense active:shadow-neumorphic-inset",
        destructive:
          "bg-destructive text-destructive-foreground shadow-md hover:bg-destructive/90",
        outline:
          "border-2 border-primary/50 bg-transparent text-primary hover:bg-primary/10 hover:border-primary hover:shadow-glow-cyan",
        secondary:
          "bg-secondary text-secondary-foreground shadow-glow-purple hover:bg-secondary/90 hover:shadow-glow-intense",
        ghost:
          "text-foreground hover:bg-muted hover:text-foreground",
        link:
          "text-primary underline-offset-4 hover:underline",
        // Futuristic variants
        neon: "relative overflow-hidden bg-transparent border-2 border-primary text-primary font-bold uppercase tracking-wider hover:bg-primary/10 hover:shadow-glow-cyan",
        glass: "bg-card/50 backdrop-blur-xl border border-primary/20 text-foreground hover:border-primary/40 hover:shadow-glow-cyan",
        "3d": "bg-gradient-to-b from-card to-muted border border-border/50 text-foreground shadow-neumorphic hover:text-primary active:shadow-neumorphic-inset active:translate-y-0.5",
        hero: "bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold uppercase tracking-wider shadow-glow-cyan hover:shadow-glow-intense animate-pulse-glow",
        // Accessible large button
        accessible: "min-h-[56px] min-w-[56px] px-8 py-4 text-xl font-bold bg-primary text-primary-foreground shadow-glow-cyan hover:shadow-glow-intense rounded-2xl",
        // Voice action button
        voice: "relative bg-secondary text-secondary-foreground rounded-full shadow-glow-purple hover:shadow-glow-intense",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-8 text-lg",
        xl: "h-16 rounded-2xl px-10 text-xl",
        icon: "h-12 w-12",
        "icon-lg": "h-14 w-14",
        "icon-xl": "h-16 w-16",
        // Accessible minimum size
        accessible: "min-h-[44px] min-w-[44px] px-6 py-3",
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
