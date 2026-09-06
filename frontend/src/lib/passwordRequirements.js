// Generic access-key (password) requirements, shared by every flow that sets
// one: registration, Google account setup, and password reset. Mirrors the
// rules enforced server-side in backend/server.py — kept in sync manually
// since the two run in different languages.
export const PASSWORD_MIN_LENGTH = 12;

export const PASSWORD_RULES = [
  { id: "length", test: (pw) => pw.length >= PASSWORD_MIN_LENGTH },
  { id: "upper", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower", test: (pw) => /[a-z]/.test(pw) },
  { id: "digit", test: (pw) => /\d/.test(pw) },
  { id: "special", test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

export function passwordMeetsRequirements(pw) {
  return PASSWORD_RULES.every((rule) => rule.test(pw));
}
