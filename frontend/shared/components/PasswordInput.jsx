import { forwardRef } from "react";
import { Field } from "./Field";

/**
 * A password input with a toggle button to show/hide the password.
 * Accepts all standard input props (value, onChange, placeholder, disabled, minLength, etc.)
 * plus an optional `inputClassName` to override the input's class.
 *
 * When `minLength` and `value` are provided, a character counter is shown
 * to the left of the eye icon.
 */
export const PasswordInput = forwardRef(function PasswordInput({
  inputClassName,
  minLength,
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
      characterCount={typeof minLength === "number" ? minLength : false}
      inputClassName={inputClassName}
    />
  );
});
