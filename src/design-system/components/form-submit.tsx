import { Button } from "@/design-system/components/button";

/** Submit control for server actions without ad-hoc button styles. */
export function FormSubmit({
  children,
  variant = "ghost",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button type="submit" variant={variant} fullWidth={variant === "ghost"} {...props}>
      {children}
    </Button>
  );
}
