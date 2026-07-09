import * as React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-neutral-400 select-none">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={`w-full rounded-lg border border-border bg-neutral-950 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-600 transition-all focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50 ${
            error ? "border-priority-high focus:border-priority-high focus:ring-priority-high" : ""
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs text-priority-high">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
