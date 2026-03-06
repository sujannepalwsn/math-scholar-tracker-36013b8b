import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-black transition-all duration-200 uppercase tracking-widest",
  {
    variants: {
      variant: {
        default: "border-primary/10 bg-primary/5 text-primary hover:bg-primary/10",
        secondary: "border-muted-foreground/10 bg-muted/50 text-muted-foreground hover:bg-muted/80",
        destructive: "border-destructive/10 bg-destructive/5 text-destructive hover:bg-destructive/10",
        outline: "border-primary/20 text-primary bg-white/50 backdrop-blur-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
