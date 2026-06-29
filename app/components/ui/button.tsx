import * as React from "react";
import { cn } from "../../lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "danger";
  size?: "default" | "sm" | "icon";
};

const variantClass = {
  default: "uiButton uiButtonDefault",
  outline: "uiButton uiButtonOutline",
  ghost: "uiButton uiButtonGhost",
  danger: "uiButton uiButtonDanger"
};

const sizeClass = {
  default: "uiButtonDefaultSize",
  sm: "uiButtonSmall",
  icon: "uiButtonIcon"
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => (
    <button ref={ref} className={cn(variantClass[variant], sizeClass[size], className)} {...props} />
  )
);

Button.displayName = "Button";
