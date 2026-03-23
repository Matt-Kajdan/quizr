import { useEffect, useMemo, useRef, useState } from "react";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

function defaultGetOptionValue(option) {
  return typeof option === "object" && option !== null && "value" in option
    ? option.value
    : option;
}

function defaultGetOptionLabel(option) {
  if (typeof option === "object" && option !== null && "label" in option) {
    return option.label;
  }

  return String(option);
}

function getOptionClassName({ isActive, roundedClassName }) {
  return joinClasses(
    "w-full text-left px-4 py-3 transition-colors",
    roundedClassName,
    isActive
      ? "bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900"
  );
}

export function SelectDropdown({
  value,
  options,
  onChange,
  getOptionValue = defaultGetOptionValue,
  getOptionLabel = defaultGetOptionLabel,
  renderTrigger,
  className,
  buttonClassName,
  menuClassName,
  optionClassName,
  itemRoundedClassName,
  ariaLabel
}) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  const selectedOption = useMemo(
    () => options.find((option) => getOptionValue(option) === value) ?? null,
    [getOptionValue, options, value]
  );

  const selectedLabel = selectedOption ? getOptionLabel(selectedOption) : "";

  useEffect(() => {
    function handlePointerDown(event) {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={rootRef} className={joinClasses("relative", className)}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => setIsOpen((prev) => !prev)}
        className={joinClasses(
          "text-left",
          "cursor-pointer active:scale-[0.98] [-webkit-tap-highlight-color:transparent]",
          "bg-white dark:bg-slate-950",
          "border border-slate-200/80 dark:border-slate-700/60",
          "text-slate-800 dark:text-slate-100",
          "focus:outline-none focus:ring-0",
          "transition-all duration-200",
          "hover:bg-slate-50 dark:hover:bg-slate-900",
          "hover:border-slate-300 dark:hover:border-slate-600",
          buttonClassName
        )}
      >
        {renderTrigger
          ? renderTrigger({ isOpen, selectedOption, selectedLabel })
          : selectedLabel}
      </button>
      <div
        aria-hidden={!isOpen}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        className={joinClasses(
          "absolute left-0 right-0 top-full z-50 mt-2 overflow-y-auto [&::-webkit-scrollbar]:hidden",
          "origin-top transition-[opacity,transform,visibility] duration-150 ease-out",
          isOpen
            ? "visible translate-y-0 scale-100 opacity-100"
            : "pointer-events-none invisible -translate-y-1 scale-[0.98] opacity-0",
          "bg-white dark:bg-slate-950",
          "border border-slate-200/80 dark:border-slate-700/60",
          "shadow-lg",
          menuClassName
        )}
      >
        {options.map((option) => {
          const optionValue = getOptionValue(option);
          const optionLabel = getOptionLabel(option);
          const isActive = optionValue === value;

          return (
            <button
              key={String(optionValue)}
              type="button"
              onClick={() => {
                onChange(optionValue, option);
                setIsOpen(false);
              }}
              className={joinClasses(
                getOptionClassName({ isActive, roundedClassName: itemRoundedClassName }),
                optionClassName
              )}
            >
              {optionLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}
