function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export function PageHeader({
  title,
  subtitle,
  className,
  titleClassName,
  subtitleClassName,
}) {
  const hasSubtitle = subtitle !== undefined && subtitle !== null && subtitle !== "";

  return (
    <div className={joinClasses("mt-1.5 mb-9 text-center sm:mt-0 sm:mb-12", className)}>
      <div className="space-y-3 sm:space-y-4">
        <h1
          className={joinClasses(
            "select-none text-3xl font-medium text-slate-800 sm:text-4xl md:text-5xl",
            titleClassName
          )}
        >
          {title}
        </h1>
        <div className="min-h-[1.5rem] sm:min-h-[1.75rem]">
          {hasSubtitle ? (
            <p
              className={joinClasses(
                "select-none text-base text-slate-600 sm:text-lg",
                subtitleClassName
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
