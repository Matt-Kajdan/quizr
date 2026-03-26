import { Children, Fragment } from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function ButtonGroup({
  children,
  className,
  dividerClassName,
  ...rest
}) {
  const items = Children.toArray(children).filter(Boolean);

  if (items.length === 0) return null;

  return (
    <div
      className={joinClasses(
        "inline-flex max-w-full items-stretch overflow-hidden rounded-xl border border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-slate-900/40",
        className
      )}
      {...rest}
    >
      {items.map((child, index) => (
        <Fragment key={index}>
          {index > 0 && (
            <div
              aria-hidden="true"
              className={joinClasses(
                "w-px shrink-0 bg-slate-200/80 dark:bg-slate-800/80",
                dividerClassName
              )}
            />
          )}
          {child}
        </Fragment>
      ))}
    </div>
  );
}
