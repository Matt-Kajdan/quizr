import { Children, forwardRef } from "react";
import { Link } from "react-router-dom";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const interactiveClasses = {
  primary: {
    standard: "border-transparent bg-slate-800 text-white visited:text-white hover:bg-slate-700 hover:text-white focus:text-white active:text-white dark:bg-white dark:text-slate-900 dark:visited:text-slate-900 dark:hover:bg-slate-300 dark:hover:text-slate-900 dark:focus:text-slate-900 dark:active:text-slate-900",
    green: "border-transparent bg-emerald-600 text-white visited:text-white hover:bg-emerald-500 hover:text-white focus:text-white active:text-white dark:bg-emerald-300 dark:text-emerald-950 dark:visited:text-emerald-950 dark:hover:bg-emerald-100 dark:hover:text-emerald-950 dark:focus:text-emerald-950 dark:active:text-emerald-950",
    red: "border-transparent bg-rose-600 text-white visited:text-white hover:bg-rose-500 hover:text-white focus:text-white active:text-white dark:bg-rose-600 dark:text-rose-950 dark:visited:text-rose-950 dark:hover:bg-rose-400 dark:hover:text-rose-950 dark:focus:text-rose-950 dark:active:text-rose-950",
    amber: "border-transparent bg-amber-500 text-white visited:text-white hover:bg-amber-400 hover:text-white focus:text-white active:text-white dark:bg-amber-300 dark:text-amber-950 dark:visited:text-amber-950 dark:hover:bg-amber-100 dark:hover:text-amber-950 dark:focus:text-amber-950 dark:active:text-amber-950",
  },
  secondary: {
    standard: "border-slate-300/80 bg-white/80 text-slate-700 visited:text-slate-700 shadow-sm hover:border-slate-400/80 hover:bg-slate-50 hover:text-slate-700 focus:text-slate-700 active:text-slate-700 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-100 dark:visited:text-slate-100 dark:hover:bg-slate-800/80 dark:hover:text-slate-100 dark:focus:text-slate-100 dark:active:text-slate-100",
    green: "border-emerald-800/40 bg-emerald-50/90 text-emerald-800 visited:text-emerald-800 shadow-sm hover:border-emerald-800/60 hover:bg-emerald-100 hover:text-emerald-800 focus:text-emerald-800 active:text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-950/50 dark:text-emerald-300 dark:visited:text-emerald-300 dark:hover:border-emerald-300/50 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-200 dark:focus:text-emerald-300 dark:active:text-emerald-300",
    red: "border-rose-700/40 bg-rose-50/90 text-rose-700 visited:text-rose-700 shadow-sm hover:border-rose-700/70 hover:bg-rose-100 hover:text-rose-700 focus:text-rose-700 active:text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-300 dark:visited:text-rose-300 dark:hover:border-rose-400/40 dark:hover:bg-rose-900/40 dark:hover:text-rose-400 dark:focus:text-rose-300 dark:active:text-rose-300",
    amber: "border-amber-700/40 bg-amber-50/90 text-amber-700 visited:text-amber-700 shadow-sm hover:border-amber-700/60 hover:bg-amber-100 hover:text-amber-700 focus:text-amber-700 active:text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300 dark:visited:text-amber-300 dark:hover:border-amber-400/40 dark:hover:bg-amber-900/50 dark:hover:text-amber-300 dark:focus:text-amber-300 dark:active:text-amber-300",
  },
  subtle: {
    standard: "border-transparent bg-transparent text-slate-700 visited:text-slate-700 hover:bg-slate-100/80 hover:text-slate-700 focus:text-slate-700 active:text-slate-700 dark:text-slate-200 dark:visited:text-slate-200 dark:hover:bg-slate-800/60 dark:hover:text-slate-200 dark:focus:text-slate-200 dark:active:text-slate-200",
    green: "border-transparent bg-transparent text-emerald-700 visited:text-emerald-700 hover:bg-emerald-100/80 hover:text-emerald-700 focus:text-emerald-700 active:text-emerald-700 dark:text-emerald-300 dark:visited:text-emerald-300 dark:hover:bg-emerald-900/40 dark:hover:text-emerald-300 dark:focus:text-emerald-300 dark:active:text-emerald-300",
    red: "border-transparent bg-transparent text-rose-700 visited:text-rose-700 hover:bg-rose-100/80 hover:text-rose-700 focus:text-rose-700 active:text-rose-700 dark:text-rose-300 dark:visited:text-rose-300 dark:hover:bg-rose-900/40 dark:hover:text-rose-300 dark:focus:text-rose-300 dark:active:text-rose-300",
    amber: "border-transparent bg-transparent text-amber-700 visited:text-amber-700 hover:bg-amber-100/80 hover:text-amber-700 focus:text-amber-700 active:text-amber-700 dark:text-amber-300 dark:visited:text-amber-300 dark:hover:bg-amber-900/40 dark:hover:text-amber-300 dark:focus:text-amber-300 dark:active:text-amber-300",
  },
};

const disabledClasses = {
  primary: {
    standard: "border-transparent bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-500",
    green: "border-transparent bg-emerald-100 text-emerald-400 dark:bg-emerald-950/60 dark:text-emerald-700",
    red: "border-transparent bg-rose-100 text-rose-400 dark:bg-rose-950/60 dark:text-rose-700",
    amber: "border-transparent bg-amber-100 text-amber-400 dark:bg-amber-950/60 dark:text-amber-700",
  },
  secondary: {
    standard: "border-slate-200/80 bg-slate-100/80 text-slate-400 dark:border-slate-800/70 dark:bg-slate-900/50 dark:text-slate-500",
    green: "border-emerald-200/60 bg-emerald-50/80 text-emerald-400 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-700",
    red: "border-rose-200/60 bg-rose-50/80 text-rose-400 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-700",
    amber: "border-amber-200/70 bg-amber-50/80 text-amber-400 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-700",
  },
  subtle: {
    standard: "border-transparent bg-transparent text-slate-400 dark:text-slate-500",
    green: "border-transparent bg-transparent text-emerald-400 dark:text-emerald-700",
    red: "border-transparent bg-transparent text-rose-400 dark:text-rose-700",
    amber: "border-transparent bg-transparent text-amber-400 dark:text-amber-700",
  },
};

function getStyleClasses({ variant, color, disabled }) {
  const variantStyles = disabled ? disabledClasses[variant] : interactiveClasses[variant];
  return variantStyles?.[color] || variantStyles?.standard || "";
}

export const Button = forwardRef(function Button({
  variant = "secondary",
  color = "standard",
  disabled = false,
  icon,
  children,
  onClick,
  to,
  href,
  htmlType = "button",
  ariaLabel,
  className,
  ...rest
}, ref) {
  const targetCount = [typeof onClick === "function", Boolean(to), Boolean(href)].filter(Boolean).length;
  const hasChildren = Children.count(children) > 0;
  const hasIcon = Boolean(icon);
  const isIconOnly = hasIcon && !hasChildren;

  if (targetCount > 1) {
    throw new Error("Button accepts only one of onClick, to, or href.");
  }

  if (isIconOnly && !ariaLabel) {
    throw new Error("Icon-only buttons require ariaLabel.");
  }

  const classes = joinClasses(
    "relative inline-flex h-10 shrink-0 select-none items-center justify-center rounded-xl border text-sm font-semibold leading-none transition-[background-color,color,border-color,box-shadow,transform,opacity] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300/70",
    disabled ? "cursor-default" : "cursor-pointer active:scale-[0.98]",
    hasChildren ? "gap-2 px-4" : "w-10 px-0",
    getStyleClasses({ variant, color, disabled }),
    className
  );

  const content = (
    <>
      {hasIcon && (
        <span
          aria-hidden="true"
          className={joinClasses(
            "flex shrink-0 items-center justify-center [&_svg]:h-4 [&_svg]:w-4",
            hasChildren ? "h-5 w-5" : "h-10 w-10"
          )}
        >
          {icon}
        </span>
      )}
      {hasChildren && <span className="min-w-0">{children}</span>}
    </>
  );

  if (to && !disabled) {
    return (
      <Link ref={ref} to={to} aria-label={ariaLabel} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  if (href && !disabled) {
    return (
      <a ref={ref} href={href} aria-label={ariaLabel} className={classes} {...rest}>
        {content}
      </a>
    );
  }

  if ((to || href) && disabled) {
    return (
      <span ref={ref} aria-label={ariaLabel} aria-disabled="true" className={classes} {...rest}>
        {content}
      </span>
    );
  }

  return (
    <button
      ref={ref}
      type={htmlType}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
      className={classes}
      {...rest}
    >
      {content}
    </button>
  );
});
