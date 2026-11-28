/**
 * Generates an RFC-6350/3.0 compatible vCard (.vcf) string using only
 * published, visible fields of a digital card.
 */

function escapeVCardValue(val) {
  return String(val || '')
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .trim()
}

export function buildVCardForCard(card) {
  if (!card) return ''
  const p = card.personalInformation || {}
  const c = card.contactInformation || {}
  const v = card.visibilitySettings || {}

  const displayName = escapeVCardValue(p.fullName || card.name || 'Contact')
  const parts = String(p.fullName || card.name || '')
    .trim()
    .split(/\s+/)
  const firstName = escapeVCardValue(parts[0] || displayName)
  const lastName = escapeVCardValue(parts.slice(1).join(' '))

  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${displayName}`,
    `N:${lastName};${firstName};;;`,
  ]

  if (v.showCompanyName !== false && p.companyName) {
    lines.push(`ORG:${escapeVCardValue(p.companyName)}`)
  }
  const roleTitle =
    (v.showJobTitle !== false && p.jobTitle) ||
    (v.showProfession !== false && p.profession) ||
    ''
  if (roleTitle) {
    lines.push(`TITLE:${escapeVCardValue(roleTitle)}`)
  }
  if (v.showPhone !== false && c.phone) {
    lines.push(`TEL;TYPE=CELL,VOICE:${escapeVCardValue(c.phone)}`)
  }
  if (v.showSecondaryPhone !== false && c.secondaryPhone) {
    lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCardValue(c.secondaryPhone)}`)
  }
  if (v.showEmail !== false && c.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${escapeVCardValue(c.email)}`)
  }

  const website = c.website || p.websiteUrl || ''
  if (v.showWebsite !== false && website) {
    lines.push(`URL:${website.trim()}`)
  }

  const address = c.businessAddress || p.address || ''
  if (v.showAddress !== false && address) {
    lines.push(`ADR;TYPE=WORK:;;${escapeVCardValue(address)};;;;`)
  }

  if (v.showShortBio !== false && p.shortBio) {
    lines.push(`NOTE:${escapeVCardValue(p.shortBio)}`)
  }

  lines.push('END:VCARD')
  return `${lines.join('\r\n')}\r\n`
}
