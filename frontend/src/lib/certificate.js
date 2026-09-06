// Certificates show a real name rather than a callsign where one is on
// file — falls back to the callsign for accounts predating first/last name
// (or Google accounts where Google didn't share one).
export function certificateRecipientName(user) {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  return (fullName || user?.username || "").toUpperCase();
}
