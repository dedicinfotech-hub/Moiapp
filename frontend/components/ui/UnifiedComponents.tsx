'use client';

// Unified Input Component
export function UnifiedInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  required = false,
  className = '',
  inputMode,
  autoComplete,
  maxLength,
  rows,
  disabled = false,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  className?: string;
  inputMode?: React.InputHTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  maxLength?: number;
  rows?: number;
  disabled?: boolean;
}) {
  const baseInput = 'w-full bg-white border border-tn-border rounded-xl px-4 py-3.5 text-sm text-tn-text placeholder-tn-subtle focus:outline-none focus:border-tn-yellow transition-colors disabled:opacity-50';
  const baseLabel = 'block text-xs font-semibold text-tn-text mb-1.5';

  if (rows) {
    return (
      <div className={className}>
        {label && <label className={baseLabel}>{label}{required && <span className="text-tn-red-soft">*</span>}</label>}
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${baseInput} resize-none`}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      {label && <label className={baseLabel}>{label}{required && <span className="text-tn-red-soft">*</span>}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={baseInput}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        disabled={disabled}
      />
    </div>
  );
}

// Unified Select Component
export function UnifiedSelect({
  label,
  value,
  onChange,
  options,
  required = false,
  className = '',
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  className?: string;
}) {
  const baseSelect = 'w-full bg-white border border-tn-border rounded-xl px-4 py-3.5 text-sm text-tn-text focus:outline-none focus:border-tn-yellow transition-colors appearance-none';
  const baseLabel = 'block text-xs font-semibold text-tn-text mb-1.5';

  return (
    <div className={className}>
      {label && <label className={baseLabel}>{label}{required && <span className="text-tn-red-soft">*</span>}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseSelect}
        required={required}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// Unified Stat Card
export function UnifiedStatCard({
  icon,
  label,
  value,
  sub,
  bg = 'bg-tn-light',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  bg?: string;
}) {
  return (
    <div className={`${bg} rounded-xl p-3 min-w-0`}>
      <div className="mb-1 text-tn-yellow">{icon}</div>
      <p className="text-[10px] text-tn-muted leading-tight">{label}</p>
      <p className="text-sm font-bold text-tn-text mt-0.5">{value}</p>
      {sub && <p className="text-[10px] text-tn-subtle">{sub}</p>}
    </div>
  );
}

// Unified Quick Action Button
export function UnifiedQuickAction({
  icon,
  label,
  sub,
  onClick,
  className = '',
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center text-center gap-1.5 flex-1 min-w-0 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-tn-purple-bg flex items-center justify-center">{icon}</div>
      <p className="text-[10px] font-semibold text-tn-text leading-tight">{label}</p>
      <p className="text-[8px] text-tn-muted leading-tight px-1">{sub}</p>
    </button>
  );
}

// Unified Primary Button
export function UnifiedPrimaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-12 bg-tn-yellow text-black rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
}

// Unified Secondary Button
export function UnifiedSecondaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`w-full h-12 border-2 border-tn-yellow text-tn-yellow rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );
}

// Unified Filter Button
export function UnifiedFilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
        active
          ? 'bg-tn-yellow text-black'
          : 'bg-tn-light border border-tn-border text-tn-text-secondary hover:border-tn-yellow'
      }`}
    >
      {label}
    </button>
  );
}

// Unified Payment Method Button
export function UnifiedPaymentButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-3 rounded-xl text-center border-2 transition-colors ${
        active ? 'border-tn-yellow bg-tn-yellow-bg text-tn-gold' : 'border-tn-border text-tn-muted hover:border-tn-yellow'
      }`}
    >
      <span className="block text-lg text-tn-gold">{label}</span>
    </button>
  );
}