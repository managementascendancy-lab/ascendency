import React, { useState } from "react";
import { Eye, EyeOff, Check, X } from "lucide-react";
import { PASSWORD_RULES, PASSWORD_MIN_LENGTH } from "@/lib/passwordRequirements";

const inputClass =
  "w-full border border-bronze/50 bg-navy px-4 py-3 pr-11 font-mono text-sm text-cream placeholder:text-cream/35 focus:border-gold-bright focus:outline-none";

// Password input with a show/hide toggle, and an optional live requirements
// checklist (used everywhere an ascendant sets a new access key: register,
// Google account setup, reset-password — not on login, since an existing
// password was already valid when it was set).
export default function PasswordField({
  value,
  onChange,
  showLabel,
  hideLabel,
  showRequirements = false,
  requirementLabels,
  minLength = PASSWORD_MIN_LENGTH,
  className = "",
  ...inputProps
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <div className="relative">
        <input
          {...inputProps}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          minLength={minLength}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? hideLabel : showLabel}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/50 transition-colors hover:text-gold-bright"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>

      {showRequirements && (
        <ul className="mt-2 space-y-1">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(value);
            return (
              <li
                key={rule.id}
                className={`flex items-center gap-1.5 font-mono text-[11px] transition-colors ${
                  met ? "text-sage" : "text-cream/40"
                }`}
              >
                {met ? <Check size={12} /> : <X size={12} />}
                {requirementLabels[rule.id]}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
