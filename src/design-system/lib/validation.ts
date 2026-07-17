export type FieldErrors = Record<string, string>;

export type ValidationResult = {
  ok: true;
  data: Record<string, string>;
} | {
  ok: false;
  fields: FieldErrors;
  formError?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "L’email est requis.";
  if (!EMAIL_RE.test(email)) return "Entre une adresse email valide.";
  return null;
}

export function validatePassword(
  value: string,
  opts?: { min?: number; requiredMessage?: string },
): string | null {
  const min = opts?.min ?? 8;
  if (!value) return opts?.requiredMessage ?? "Le mot de passe est requis.";
  if (value.length < min) {
    return `Au moins ${min} caractères.`;
  }
  return null;
}

export function validateSignIn(formData: FormData): ValidationResult {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const fields: FieldErrors = {};

  const emailError = validateEmail(email);
  if (emailError) fields.email = emailError;

  const passwordError = validatePassword(password, {
    min: 1,
    requiredMessage: "Le mot de passe est requis.",
  });
  if (passwordError) fields.password = passwordError;

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    data: {
      email: email.trim(),
      password,
      next: String(formData.get("next") ?? "/app/overview"),
    },
  };
}

export function validateSignUp(formData: FormData): ValidationResult {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const fields: FieldErrors = {};

  const emailError = validateEmail(email);
  if (emailError) fields.email = emailError;

  const passwordError = validatePassword(password, { min: 8 });
  if (passwordError) fields.password = passwordError;

  if (Object.keys(fields).length > 0) {
    return { ok: false, fields };
  }

  return {
    ok: true,
    data: {
      email: email.trim(),
      password,
      first_name: firstName,
      last_name: lastName,
    },
  };
}

export function validateForgotPassword(formData: FormData): ValidationResult {
  const email = String(formData.get("email") ?? "");
  const fields: FieldErrors = {};
  const emailError = validateEmail(email);
  if (emailError) fields.email = emailError;
  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data: { email: email.trim() } };
}

export function validateResetPassword(formData: FormData): ValidationResult {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  const fields: FieldErrors = {};

  const passwordError = validatePassword(password, { min: 8 });
  if (passwordError) fields.password = passwordError;

  if (!confirm) {
    fields.confirm_password = "Confirme ton mot de passe.";
  } else if (password !== confirm) {
    fields.confirm_password = "Les mots de passe ne correspondent pas.";
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return { ok: true, data: { password, confirm_password: confirm } };
}

export function validateChangePassword(formData: FormData): ValidationResult {
  const current = String(formData.get("current_password") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm_password") ?? "");
  const fields: FieldErrors = {};

  if (!current) {
    fields.current_password = "Mot de passe actuel requis.";
  }

  const passwordError = validatePassword(password, { min: 8 });
  if (passwordError) fields.password = passwordError;

  if (!confirm) {
    fields.confirm_password = "Confirme le nouveau mot de passe.";
  } else if (password !== confirm) {
    fields.confirm_password = "Les mots de passe ne correspondent pas.";
  }

  if (Object.keys(fields).length > 0) return { ok: false, fields };
  return {
    ok: true,
    data: {
      current_password: current,
      password,
      confirm_password: confirm,
    },
  };
}
