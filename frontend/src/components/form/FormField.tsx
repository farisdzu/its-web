import { ReactNode } from "react";
import Label from "./Label";
import Input from "./input/InputField";

export interface FormFieldProps {
  label: string | ReactNode;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/**
 * FormField - Reusable form field wrapper component
 * Combines Label, Input/Select, and Error message in one component
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Nama Bagian"
 *   htmlFor="name"
 *   required
 *   error={formError}
 * >
 *   <Input
 *     id="name"
 *     value={form.name}
 *     onChange={(e) => setForm({...})}
 *   />
 * </FormField>
 * ```
 */
export default function FormField({
  label,
  htmlFor,
  required = false,
  error,
  hint,
  children,
  className = "",
}: FormFieldProps) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-error-500"> *</span>}
      </Label>
      {children}
      {error && (
        <p className="mt-1.5 text-sm text-error-600 dark:text-error-400">
          {error}
        </p>
      )}
      {!error && hint && (
        <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
          {hint}
        </p>
      )}
    </div>
  );
}

