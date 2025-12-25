import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { Button, buttonVariants } from "./button";

export function ButtonTable({
  className,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  return (
    <Button variant="ghost" className={cn("px-0!", className)} {...props} />
  );
}
