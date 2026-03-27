import { forwardRef, useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

const baseInputClassName = "w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 py-3 text-slate-700 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-slate-300/70 dark:border-slate-800/70 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-700/70 disabled:opacity-50";

export const Field = forwardRef(function Field({
  id,
  type = "text",
  label,
  helpText,
  error,
  reserveMessageSpace = false,
  className,
  labelClassName,
  inputClassName,
  controlWrapperClassName,
  messageClassName,
  helpTextClassName,
  errorClassName,
  showPasswordToggle,
  characterCount,
  value,
  minLength,
  trailingContent,
  ...inputProps
}, ref) {
  const generatedId = useId();
  const resolvedId = id ?? generatedId;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPasswordField = type === "password";
  const shouldShowPasswordToggle = isPasswordField && showPasswordToggle !== false;
  const resolvedType = shouldShowPasswordToggle && isPasswordVisible ? "text" : type;
  const resolvedCharacterCount = typeof characterCount === "number"
    ? characterCount
    : characterCount
      ? minLength
      : null;
  const shouldShowCounter = Boolean(characterCount) && typeof value === "string";
  const valueLength = typeof value === "string" ? value.length : 0;
  const isCharacterMinimumMet = typeof resolvedCharacterCount === "number"
    ? valueLength >= resolvedCharacterCount
    : false;

  const trailing = (
    <>
      {shouldShowCounter && valueLength > 0 && (
        <span
          className={joinClasses(
            "text-xs tabular-nums select-none transition-colors",
            isCharacterMinimumMet
              ? "text-emerald-500"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          {valueLength}
        </span>
      )}
      {shouldShowPasswordToggle && (
        <button
          type="button"
          onClick={() => setIsPasswordVisible((current) => !current)}
          tabIndex={-1}
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
          className="flex items-center px-3 text-slate-400 transition-colors hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
        >
          {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
      {trailingContent}
    </>
  );

  const hasTrailing = shouldShowCounter || shouldShowPasswordToggle || Boolean(trailingContent);
  const resolvedInputClassName = joinClasses(
    baseInputClassName,
    hasTrailing ? (shouldShowCounter ? "pr-20" : "pr-12") : "",
    inputClassName
  );
  const shouldShowMessage = Boolean(error) || Boolean(helpText) || reserveMessageSpace;

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={resolvedId}
          className={joinClasses("block text-sm text-slate-600 dark:text-slate-400", labelClassName)}
        >
          {label}
        </label>
      )}
      <div className={joinClasses("relative", controlWrapperClassName)}>
        <input
          {...inputProps}
          id={resolvedId}
          ref={ref}
          type={resolvedType}
          value={value}
          minLength={minLength}
          className={resolvedInputClassName}
        />
        {hasTrailing && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            {trailing}
          </div>
        )}
      </div>
      {shouldShowMessage && (
        <p
          className={joinClasses(
            "text-xs",
            error ? "text-rose-500" : "text-slate-500 dark:text-slate-400",
            messageClassName,
            error ? errorClassName : helpTextClassName
          )}
        >
          {error || helpText || "\u00A0"}
        </p>
      )}
    </div>
  );
});

