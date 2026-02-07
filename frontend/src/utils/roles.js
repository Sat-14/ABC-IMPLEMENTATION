export const ROLES = {
  ADMIN: 'admin',
  INVESTIGATOR: 'investigator',
  FORENSIC_ANALYST: 'forensic_analyst',
  PROSECUTOR: 'prosecutor',
  JUDGE: 'judge',
  AUDITOR: 'auditor',
}

export const ROLE_LABELS = {
  admin: 'Admin',
  investigator: 'Investigator',
  forensic_analyst: 'Forensic Analyst',
  prosecutor: 'Prosecutor',
  judge: 'Judge / Court',
  auditor: 'Auditor',
}

export const PERMISSIONS = {
  admin:            ['upload', 'view', 'transfer', 'verify', 'delete', 'admin'],
  investigator:     ['upload', 'view', 'transfer', 'verify'],
  forensic_analyst: ['view', 'verify'],
  prosecutor:       ['view', 'verify'],
  judge:            ['view', 'verify'],
  auditor:          ['view', 'verify'],
}

export function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) ?? false
}
