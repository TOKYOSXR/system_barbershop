import * as React from "react";

/**
 * Minimal `asChild` slot implementation: merges the given props (including
 * className and ref) onto the single child element. Avoids pulling in the full
 * Radix dependency for the small set of components that need `asChild`.
 */
export interface SlotProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
}

export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...props }, ref) => {
    if (!React.isValidElement(children)) {
      return null;
    }

    const child = children as React.ReactElement<Record<string, unknown>>;
    const childProps = child.props;

    const mergedClassName = [
      props.className,
      childProps.className as string | undefined,
    ]
      .filter(Boolean)
      .join(" ");

    return React.cloneElement(child, {
      ...props,
      ...childProps,
      className: mergedClassName || undefined,
      ref,
    } as Record<string, unknown>);
  },
);
Slot.displayName = "Slot";
