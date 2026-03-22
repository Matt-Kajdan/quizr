import { Children } from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const toneClasses = {
  slate: {
    primary: "border-slate-200/80 bg-slate-100/80 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/55 dark:text-slate-200",
    secondary: "border-slate-200/80 bg-white/70 text-slate-700 dark:border-slate-700/60 dark:bg-slate-800/45 dark:text-slate-200",
    subtle: "border-transparent bg-transparent text-slate-600 dark:text-slate-300",
    interactivePrimary: "hover:bg-slate-200/90 dark:hover:bg-slate-700/70",
    interactiveSecondary: "hover:border-slate-300/80 hover:bg-white/90 dark:hover:border-slate-600/70 dark:hover:bg-slate-700/60",
    interactiveSubtle: "hover:bg-slate-100/80 dark:hover:bg-slate-800/60",
  },
  pink: {
    primary: "border-pink-300/60 bg-pink-100/85 text-pink-700 dark:border-pink-700/50 dark:bg-pink-900/35 dark:text-pink-300",
    secondary: "border-pink-300/50 bg-white/70 text-pink-700 dark:border-pink-700/50 dark:bg-slate-900/35 dark:text-pink-300",
    subtle: "border-transparent bg-transparent text-pink-700 dark:text-pink-300",
    interactivePrimary: "hover:bg-pink-200/90 dark:hover:bg-pink-900/50",
    interactiveSecondary: "hover:border-pink-400/60 hover:bg-pink-50/90 dark:hover:border-pink-600/60 dark:hover:bg-pink-900/45",
    interactiveSubtle: "hover:bg-pink-100/80 dark:hover:bg-pink-900/35",
  },
  rose: {
    primary: "border-rose-300/60 bg-rose-100/85 text-rose-700 dark:border-rose-700/50 dark:bg-rose-900/35 dark:text-rose-300",
    secondary: "border-rose-300/50 bg-white/70 text-rose-700 dark:border-rose-700/50 dark:bg-slate-900/35 dark:text-rose-300",
    subtle: "border-transparent bg-transparent text-rose-700 dark:text-rose-300",
    interactivePrimary: "hover:bg-rose-200/90 dark:hover:bg-rose-900/50",
    interactiveSecondary: "hover:border-rose-400/60 hover:bg-rose-50/90 dark:hover:border-rose-600/60 dark:hover:bg-rose-900/45",
    interactiveSubtle: "hover:bg-rose-100/80 dark:hover:bg-rose-900/35",
  },
  amber: {
    primary: "border-amber-300/60 bg-amber-100/90 text-amber-700 dark:border-amber-700/50 dark:bg-amber-900/35 dark:text-amber-300",
    secondary: "border-amber-300/50 bg-white/70 text-amber-700 dark:border-amber-700/50 dark:bg-slate-900/35 dark:text-amber-300",
    subtle: "border-transparent bg-transparent text-amber-700 dark:text-amber-300",
    interactivePrimary: "hover:bg-amber-200/90 dark:hover:bg-amber-900/50",
    interactiveSecondary: "hover:border-amber-400/60 hover:bg-amber-50/90 dark:hover:border-amber-600/60 dark:hover:bg-amber-900/45",
    interactiveSubtle: "hover:bg-amber-100/80 dark:hover:bg-amber-900/35",
  },
  orange: {
    primary: "border-orange-300/60 bg-orange-100/90 text-orange-700 dark:border-orange-700/50 dark:bg-orange-900/35 dark:text-orange-300",
    secondary: "border-orange-300/50 bg-white/70 text-orange-700 dark:border-orange-700/50 dark:bg-slate-900/35 dark:text-orange-300",
    subtle: "border-transparent bg-transparent text-orange-700 dark:text-orange-300",
    interactivePrimary: "hover:bg-orange-200/90 dark:hover:bg-orange-900/50",
    interactiveSecondary: "hover:border-orange-400/60 hover:bg-orange-50/90 dark:hover:border-orange-600/60 dark:hover:bg-orange-900/45",
    interactiveSubtle: "hover:bg-orange-100/80 dark:hover:bg-orange-900/35",
  },
  emerald: {
    primary: "border-emerald-300/60 bg-emerald-100/85 text-emerald-700 dark:border-emerald-700/50 dark:bg-emerald-900/35 dark:text-emerald-300",
    secondary: "border-emerald-300/50 bg-white/70 text-emerald-700 dark:border-emerald-700/50 dark:bg-slate-900/35 dark:text-emerald-300",
    subtle: "border-transparent bg-transparent text-emerald-700 dark:text-emerald-300",
    interactivePrimary: "hover:bg-emerald-200/90 dark:hover:bg-emerald-900/50",
    interactiveSecondary: "hover:border-emerald-400/60 hover:bg-emerald-50/90 dark:hover:border-emerald-600/60 dark:hover:bg-emerald-900/45",
    interactiveSubtle: "hover:bg-emerald-100/80 dark:hover:bg-emerald-900/35",
  },
  sky: {
    primary: "border-sky-300/60 bg-sky-100/85 text-sky-700 dark:border-sky-700/50 dark:bg-sky-900/35 dark:text-sky-300",
    secondary: "border-sky-300/50 bg-white/70 text-sky-700 dark:border-sky-700/50 dark:bg-slate-900/35 dark:text-sky-300",
    subtle: "border-transparent bg-transparent text-sky-700 dark:text-sky-300",
    interactivePrimary: "hover:bg-sky-200/90 dark:hover:bg-sky-900/50",
    interactiveSecondary: "hover:border-sky-400/60 hover:bg-sky-50/90 dark:hover:border-sky-600/60 dark:hover:bg-sky-900/45",
    interactiveSubtle: "hover:bg-sky-100/80 dark:hover:bg-sky-900/35",
  },
  blue: {
    primary: "border-blue-300/60 bg-blue-100/85 text-blue-700 dark:border-blue-700/50 dark:bg-blue-900/35 dark:text-blue-300",
    secondary: "border-blue-300/50 bg-white/70 text-blue-700 dark:border-blue-700/50 dark:bg-slate-900/35 dark:text-blue-300",
    subtle: "border-transparent bg-transparent text-blue-700 dark:text-blue-300",
    interactivePrimary: "hover:bg-blue-200/90 dark:hover:bg-blue-900/50",
    interactiveSecondary: "hover:border-blue-400/60 hover:bg-blue-50/90 dark:hover:border-blue-600/60 dark:hover:bg-blue-900/45",
    interactiveSubtle: "hover:bg-blue-100/80 dark:hover:bg-blue-900/35",
  },
  indigo: {
    primary: "border-indigo-300/60 bg-indigo-100/85 text-indigo-700 dark:border-indigo-700/50 dark:bg-indigo-900/35 dark:text-indigo-300",
    secondary: "border-indigo-300/50 bg-white/70 text-indigo-700 dark:border-indigo-700/50 dark:bg-slate-900/35 dark:text-indigo-300",
    subtle: "border-transparent bg-transparent text-indigo-700 dark:text-indigo-300",
    interactivePrimary: "hover:bg-indigo-200/90 dark:hover:bg-indigo-900/50",
    interactiveSecondary: "hover:border-indigo-400/60 hover:bg-indigo-50/90 dark:hover:border-indigo-600/60 dark:hover:bg-indigo-900/45",
    interactiveSubtle: "hover:bg-indigo-100/80 dark:hover:bg-indigo-900/35",
  },
  purple: {
    primary: "border-purple-300/60 bg-purple-100/85 text-purple-700 dark:border-purple-700/50 dark:bg-purple-900/35 dark:text-purple-300",
    secondary: "border-purple-300/50 bg-white/70 text-purple-700 dark:border-purple-700/50 dark:bg-slate-900/35 dark:text-purple-300",
    subtle: "border-transparent bg-transparent text-purple-700 dark:text-purple-300",
    interactivePrimary: "hover:bg-purple-200/90 dark:hover:bg-purple-900/50",
    interactiveSecondary: "hover:border-purple-400/60 hover:bg-purple-50/90 dark:hover:border-purple-600/60 dark:hover:bg-purple-900/45",
    interactiveSubtle: "hover:bg-purple-100/80 dark:hover:bg-purple-900/35",
  },
};

const sizeClasses = {
  sm: {
    root: "min-h-7 px-2.5 py-1 text-xs gap-1.5",
    icon: "h-3.5 w-3.5 [&_svg]:h-3.5 [&_svg]:w-3.5",
    iconOnly: "h-7 w-7",
  },
  md: {
    root: "min-h-8 px-3 py-1.5 text-xs sm:text-sm gap-2",
    icon: "h-4 w-4 [&_svg]:h-4 [&_svg]:w-4",
    iconOnly: "h-8 w-8",
  },
};

function getToneClass(color, variant, onClick) {
  const tone = toneClasses[color] || toneClasses.slate;
  const base = tone[variant] || tone.secondary;

  if (!onClick) return base;

  const hoverKey = `interactive${variant.charAt(0).toUpperCase()}${variant.slice(1)}`;
  return joinClasses(base, tone[hoverKey]);
}

export function InfoChip({
  variant = "secondary",
  size = "sm",
  color = "slate",
  icon,
  children,
  onClick,
  ariaLabel,
  className,
  ...rest
}) {
  const hasChildren = Children.count(children) > 0;
  const hasIcon = Boolean(icon);
  const isIconOnly = hasIcon && !hasChildren;
  const resolvedSize = sizeClasses[size] || sizeClasses.sm;

  if (onClick && isIconOnly && !ariaLabel) {
    throw new Error("Clickable icon-only info chips require ariaLabel.");
  }

  const classes = joinClasses(
    "inline-flex max-w-full items-center rounded-xl border font-semibold leading-none",
    onClick
      ? "cursor-pointer select-none transition-[background-color,color,border-color,box-shadow] duration-150"
      : "pointer-events-none cursor-default",
    isIconOnly ? resolvedSize.iconOnly : resolvedSize.root,
    getToneClass(color, variant, onClick),
    className
  );

  const content = (
    <>
      {hasIcon && (
        <span
          aria-hidden="true"
          className={joinClasses(
            "flex shrink-0 items-center justify-center",
            resolvedSize.icon
          )}
        >
          {icon}
        </span>
      )}
      {hasChildren && <span className="whitespace-nowrap">{children}</span>}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={classes}
        {...rest}
      >
        {content}
      </button>
    );
  }

  return (
    <span className={classes} {...rest}>
      {content}
    </span>
  );
}
