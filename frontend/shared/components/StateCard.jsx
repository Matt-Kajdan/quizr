import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { PageBackdrop } from "./PageBackdrop";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const opalBackdropStyle = {
  backgroundColor: "var(--opal-bg-color)",
  backgroundImage: "var(--opal-backdrop-image)",
};

const toneClasses = {
  neutral: {
    card: "bg-white/70 border-slate-200/80",
    icon: "bg-slate-100/90 text-slate-500",
    title: "text-slate-800",
    description: "text-slate-600",
  },
  search: {
    card: "bg-white/70 border-slate-200/80",
    icon: "bg-slate-100/90 text-slate-500",
    title: "text-slate-900",
    description: "text-slate-600",
  },
  friendly: {
    card: "bg-white/70 border-slate-200/80",
    icon: "bg-gradient-to-br from-amber-400 to-rose-400 text-white",
    title: "text-slate-800",
    description: "text-slate-600",
  },
  danger: {
    card: "bg-white/80 border-slate-200/80",
    icon: "bg-rose-500/15 text-rose-500",
    title: "text-slate-800",
    description: "text-slate-600",
  },
};

const defaultIcons = {
  empty: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  "no-results": (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 11.5h5" />
    </svg>
  ),
  error: (
    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
};

function renderAction({
  actionLabel,
  actionTo,
  actionHref,
  onAction,
  actionClassName,
}) {
  if (!actionLabel) return null;

  const classes = joinClasses(
    "inline-flex items-center justify-center rounded-xl bg-slate-800 px-6 py-3 font-semibold text-white transition-colors hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-300",
    actionClassName
  );

  if (actionTo) {
    return (
      <Link to={actionTo} className={classes}>
        {actionLabel}
      </Link>
    );
  }

  if (actionHref) {
    return (
      <a href={actionHref} className={classes}>
        {actionLabel}
      </a>
    );
  }

  return (
    <button type="button" onClick={onAction} className={classes}>
      {actionLabel}
    </button>
  );
}

export function StateCard({
  mode = "inline",
  backdrop = "none",
  variant = "empty",
  tone = "neutral",
  title,
  description,
  icon,
  actionLabel,
  actionTo,
  actionHref,
  onAction,
  wrapperClassName,
  cardClassName,
  iconWrapperClassName,
  titleClassName,
  descriptionClassName,
  actionClassName,
  children,
}) {
  const toneClassSet = toneClasses[tone] || toneClasses.neutral;
  const action = renderAction({
    actionLabel,
    actionTo,
    actionHref,
    onAction,
    actionClassName,
  });

  const card = (
    <div
      role={variant === "error" ? "alert" : "region"}
      className={joinClasses(
        "rounded-2xl border p-8 text-center shadow-sm backdrop-blur-lg sm:rounded-3xl",
        toneClassSet.card,
        cardClassName
      )}
    >
      <div
        className={joinClasses(
          "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full sm:mb-6 sm:h-20 sm:w-20",
          toneClassSet.icon,
          iconWrapperClassName
        )}
      >
        {icon || defaultIcons[variant] || defaultIcons.empty}
      </div>
      <h3 className={joinClasses("mb-2 text-xl font-semibold sm:text-2xl", toneClassSet.title, titleClassName)}>
        {title}
      </h3>
      {description && (
        <p className={joinClasses("text-sm sm:text-base", toneClassSet.description, descriptionClassName)}>
          {description}
        </p>
      )}
      {children}
      {action && <div className="mt-4 sm:mt-6">{action}</div>}
    </div>
  );

  if (mode !== "fullscreen") {
    return <div className={wrapperClassName}>{card}</div>;
  }

  const fullscreenOverlay = (
    <>
      {backdrop === "page" && <PageBackdrop />}
      {backdrop === "opal" && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[69]"
          style={opalBackdropStyle}
        />
      )}
      <div className={joinClasses("fixed inset-0 z-[70] flex items-center justify-center p-4", wrapperClassName)}>
        {card}
      </div>
    </>
  );

  if (typeof document === "undefined") {
    return fullscreenOverlay;
  }

  return createPortal(fullscreenOverlay, document.body);
}
