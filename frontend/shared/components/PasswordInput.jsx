import { forwardRef } from "react";
import { Field } from "./Field";

/**
 * A password input with a toggle button to show/hide the password.
 * Accepts all standard input props (value, onChange, placeholder, disabled, minLength, etc.)
 * plus an optional `inputClassName` to override the input's class.
 *
 * Set `showCharacterCount` to `true` to display a character counter
 * to the left of the eye icon.
 */
export const PasswordInput = forwardRef(function PasswordInput({
  inputClassName,
  minLength,
  showCharacterCount = false,
  value,
  ...props
}, ref) {
  return (
    <Field
      {...props}
      ref={ref}
      type="password"
      value={value}
      minLength={minLength}
      characterCount={showCharacterCount && typeof minLength === "number" ? minLength : false}
      inputClassName={inputClassName}
    />
  );
});
