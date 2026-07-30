import { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

/**
 * Password input with a reveal toggle.
 *
 * Typing a password blind into an unfamiliar site is where most sign-up
 * mistypes happen, and a mistyped password on a *registration* form is only
 * discovered after the account exists. The toggle is a plain button so it is
 * reachable by keyboard and announces its own state.
 *
 * Presentation only — value and validation stay with the parent form.
 */
const PasswordField = ({
  id,
  label,
  value,
  onChange,
  name,
  placeholder,
  autoComplete = 'current-password',
  minLength,
  hint,
  invalid = false,
  action = null,
  ...rest
}) => {
  const [shown, setShown] = useState(false);
  const hintId = hint ? `${id}-hint` : undefined;

  return (
    <div className="form-group">
      <div className="au-label-row">
        <label className="form-label" htmlFor={id}>{label}</label>
        {action}
      </div>

      <div className="input-wrap">
        <Lock size={16} aria-hidden="true" />
        <input
          id={id}
          name={name}
          type={shown ? 'text' : 'password'}
          className="form-input au-input-reveal"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          minLength={minLength}
          aria-invalid={invalid || undefined}
          aria-describedby={hintId}
          required
          {...rest}
        />
        <button
          type="button"
          className="au-reveal"
          onClick={() => setShown((s) => !s)}
          aria-pressed={shown}
          aria-controls={id}
          title={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}
          <span className="sr-only">{shown ? 'Hide password' : 'Show password'}</span>
        </button>
      </div>

      {hint && <p className="form-hint" id={hintId}>{hint}</p>}
    </div>
  );
};

export default PasswordField;
