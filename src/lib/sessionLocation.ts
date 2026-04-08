/** Tutoring session location: DB uses location_type + location_detail; API may still expose legacy `location` string. */
export function sessionIsOnline(s: {
  location_type?: string | null;
  location?: string | null;
}): boolean {
  if (s.location_type === 'online') return true;
  if (s.location_type === 'onsite') return false;
  const loc = String(s.location ?? '').toLowerCase();
  return loc === 'online' || loc.startsWith('online:');
}
