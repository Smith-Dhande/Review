/**
 * Category-aware editorial visual treatments.
 * Provides subtle paper tone, border tint, and editorial kicker
 * tailored to each business category without inventing stock imagery.
 */

const CATEGORY_THEMES = {
  Café: {
    paperBg: '#FBF8F3',
    surfaceTint: '#F4EFE6',
    borderColor: '#E5DEC9',
    kicker: 'Guestbook · Café',
  },
  Restaurant: {
    paperBg: '#FAF8F5',
    surfaceTint: '#F3EFEA',
    borderColor: '#E4DFD7',
    kicker: 'Dining Notes',
  },
  Wellness: {
    paperBg: '#FAF9F7',
    surfaceTint: '#F2F0EC',
    borderColor: '#E5E2DC',
    kicker: 'Guest Reflection',
  },
  Beauty: {
    paperBg: '#FAF9F8',
    surfaceTint: '#F3F0EE',
    borderColor: '#E6E1DD',
    kicker: 'Client Experience',
  },
  Healthcare: {
    paperBg: '#F8FAFC',
    surfaceTint: '#EFF3F8',
    borderColor: '#DDE4EC',
    kicker: 'Patient Feedback',
  },
  Retail: {
    paperBg: '#FAFAFA',
    surfaceTint: '#F2F2F2',
    borderColor: '#E4E4E4',
    kicker: 'Client Impressions',
  },
  Gym: {
    paperBg: '#FAFAF8',
    surfaceTint: '#F1F1EE',
    borderColor: '#E2E2DE',
    kicker: 'Member Feedback',
  },
  Bookstore: {
    paperBg: '#FBF9F5',
    surfaceTint: '#F3EFE7',
    borderColor: '#E6DFD3',
    kicker: 'Reader Notes',
  },
  Photography: {
    paperBg: '#FAFAFA',
    surfaceTint: '#F1F1F1',
    borderColor: '#E3E3E3',
    kicker: 'Studio Notes',
  },
}

const DEFAULT_THEME = {
  paperBg: '#FAF9F6',
  surfaceTint: '#F3F1EC',
  borderColor: '#E6E4DF',
  kicker: 'Guest Feedback',
}

export function getCategoryTheme(category) {
  return CATEGORY_THEMES[category] || DEFAULT_THEME
}
