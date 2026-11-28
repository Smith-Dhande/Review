/**
 * Per-template visual design system for Digital Business Cards.
 * Each of the 8 templates defines a distinct layout composition, surface treatment,
 * typography hierarchy, and section styling while honoring all admin overrides.
 */

export const TEMPLATE_THEMES = {
  // Template 1 – Luxury Noir
  'premium-dark': {
    id: 'premium-dark',
    label: 'Luxury Noir',
    heroLayout: 'luxury_noir',
    isDark: true,
    defaultHeadingTracking: 'tracking-tight',
    defaultEyebrowClass: 'uppercase tracking-[0.2em] text-[10px] font-semibold',
    cardFrameStyle: (a) => ({
      background: `linear-gradient(180deg, ${a.cardBgColor || '#141417'} 0%, #0D0D10 100%)`,
      color: a.textColor || '#F4F4F5',
      borderColor: `${a.accentColor || '#D4AF37'}38`,
      boxShadow:
        '0 24px 60px -15px rgba(0,0,0,0.65), inset 0 1px 0 rgba(212,175,55,0.22)',
    }),
    backdropOverlay: (a) => ({
      backgroundImage: `radial-gradient(circle at 50% 0%, ${a.accentColor || '#D4AF37'}18 0%, transparent 55%)`,
    }),
    sectionTitleClass: 'text-xs font-semibold uppercase tracking-[0.18em]',
    cardSurfaceClass: 'bg-white/[0.03]',
    subtleBorderColor: (a) => `${a.accentColor || '#D4AF37'}2B`,
  },

  // Template 2 – Modern Editorial
  'minimal-white': {
    id: 'minimal-white',
    label: 'Modern Editorial',
    heroLayout: 'editorial_asymmetric',
    isDark: false,
    defaultHeadingTracking: 'tracking-[-0.025em]',
    defaultEyebrowClass: 'uppercase tracking-[0.16em] text-[10px] font-semibold',
    cardFrameStyle: (a) => ({
      backgroundColor: a.cardBgColor || '#FFFFFF',
      color: a.textColor || '#171716',
      borderColor: a.borderColor || '#E5E5E3',
      boxShadow: '0 20px 50px -20px rgba(23,23,22,0.12)',
    }),
    backdropOverlay: () => ({}),
    sectionTitleClass: 'text-xs font-semibold uppercase tracking-[0.14em]',
    cardSurfaceClass: 'bg-black/[0.02]',
    subtleBorderColor: (a) => a.borderColor || '#E5E5E3',
  },

  // Template 3 – Aurora / Gradient
  'modern-gradient': {
    id: 'modern-gradient',
    label: 'Aurora Gradient',
    heroLayout: 'aurora_layered',
    isDark: false,
    defaultHeadingTracking: 'tracking-tight',
    defaultEyebrowClass: 'text-[11px] font-semibold tracking-wide',
    cardFrameStyle: (a) => ({
      backgroundColor: a.cardBgColor || '#FFFFFF',
      color: a.textColor || '#0F172A',
      borderColor: `${a.primaryColor || '#4F46E5'}24`,
      boxShadow: `0 24px 60px -18px ${a.primaryColor || '#4F46E5'}28`,
    }),
    backdropOverlay: (a) => ({
      backgroundImage: `radial-gradient(at 15% 15%, ${a.primaryColor || '#4F46E5'}22 0px, transparent 50%), radial-gradient(at 85% 80%, ${a.secondaryColor || '#06B6D4'}22 0px, transparent 50%)`,
    }),
    sectionTitleClass: 'text-xs font-bold uppercase tracking-[0.12em]',
    cardSurfaceClass: 'bg-slate-900/[0.025]',
    subtleBorderColor: (a) => `${a.primaryColor || '#4F46E5'}22`,
  },

  // Template 4 – Executive Elite
  'corporate-professional': {
    id: 'corporate-professional',
    label: 'Executive Elite',
    heroLayout: 'executive_split',
    isDark: false,
    defaultHeadingTracking: 'tracking-tight',
    defaultEyebrowClass: 'uppercase tracking-[0.14em] text-[10px] font-semibold',
    cardFrameStyle: (a) => ({
      backgroundColor: a.cardBgColor || '#FFFFFF',
      color: a.textColor || '#0F172A',
      borderColor: a.borderColor || '#CBD5E1',
      boxShadow: '0 16px 40px -16px rgba(15,23,42,0.14)',
    }),
    backdropOverlay: () => ({}),
    sectionTitleClass: 'text-xs font-bold uppercase tracking-[0.12em]',
    cardSurfaceClass: 'bg-slate-900/[0.025]',
    subtleBorderColor: (a) => a.borderColor || '#E2E8F0',
  },

  // Template 5 – Creative Studio
  'creative-portfolio': {
    id: 'creative-portfolio',
    label: 'Creative Studio',
    heroLayout: 'creative_studio',
    isDark: false,
    defaultHeadingTracking: 'tracking-[-0.03em]',
    defaultEyebrowClass: 'uppercase tracking-[0.14em] text-[10px] font-bold',
    cardFrameStyle: (a) => ({
      backgroundColor: a.cardBgColor || '#FFFFFF',
      color: a.textColor || '#18181B',
      borderColor: a.borderColor || '#FED7AA',
      boxShadow: `0 22px 48px -18px ${a.primaryColor || '#EA580C'}22`,
    }),
    backdropOverlay: (a) => ({
      backgroundImage: `radial-gradient(circle at 90% 10%, ${a.primaryColor || '#EA580C'}14 0%, transparent 45%)`,
    }),
    sectionTitleClass: 'text-sm font-bold tracking-tight',
    cardSurfaceClass: 'bg-black/[0.025]',
    subtleBorderColor: (a) => a.borderColor || '#E4E4E7',
  },

  // Template 6 – Elegant Personal
  'elegant-personal': {
    id: 'elegant-personal',
    label: 'Elegant Personal',
    heroLayout: 'elegant_framed',
    isDark: false,
    defaultHeadingTracking: 'tracking-[-0.01em]',
    defaultEyebrowClass: 'uppercase tracking-[0.2em] text-[10px] font-medium',
    cardFrameStyle: (a) => ({
      backgroundColor: a.cardBgColor || '#FFFDF9',
      color: a.textColor || '#1C1917',
      borderColor: a.borderColor || '#E7E0D6',
      boxShadow: '0 18px 46px -18px rgba(124,45,18,0.12)',
    }),
    backdropOverlay: () => ({}),
    sectionTitleClass: 'text-xs font-semibold uppercase tracking-[0.18em]',
    cardSurfaceClass: 'bg-stone-900/[0.02]',
    subtleBorderColor: (a) => a.borderColor || '#E7E0D6',
  },

  // Template 7 – Neo Modern
  'bold-modern': {
    id: 'bold-modern',
    label: 'Neo Modern',
    heroLayout: 'neo_block',
    isDark: false,
    defaultHeadingTracking: 'tracking-[-0.03em]',
    defaultEyebrowClass: 'uppercase tracking-[0.16em] text-[10px] font-bold',
    cardFrameStyle: (a) => ({
      backgroundColor: a.cardBgColor || '#FFFFFF',
      color: a.textColor || '#111827',
      borderColor: a.secondaryColor || '#111827',
      boxShadow: `6px 6px 0px ${a.secondaryColor || '#111827'}`,
    }),
    backdropOverlay: () => ({}),
    sectionTitleClass: 'text-xs font-extrabold uppercase tracking-[0.14em]',
    cardSurfaceClass: 'bg-black/[0.03]',
    subtleBorderColor: (a) => a.secondaryColor || '#111827',
  },

  // Template 8 – Glass / Modern Tech
  'glass-tech': {
    id: 'glass-tech',
    label: 'Glass / Modern Tech',
    heroLayout: 'glass_floating',
    isDark: true,
    defaultHeadingTracking: 'tracking-tight',
    defaultEyebrowClass: 'uppercase tracking-[0.16em] text-[10px] font-semibold',
    cardFrameStyle: (a) => ({
      background: `linear-gradient(160deg, ${a.cardBgColor || '#1E293B'}D9 0%, rgba(15,23,42,0.88) 100%)`,
      color: a.textColor || '#F8FAFC',
      borderColor: 'rgba(255,255,255,0.16)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow:
        '0 25px 60px -15px rgba(2,6,23,0.7), inset 0 1px 0 rgba(255,255,255,0.18)',
    }),
    backdropOverlay: (a) => ({
      backgroundImage: `radial-gradient(circle at 20% 15%, ${a.primaryColor || '#38BDF8'}2E 0%, transparent 45%), radial-gradient(circle at 85% 75%, ${a.secondaryColor || '#818CF8'}29 0%, transparent 45%)`,
    }),
    sectionTitleClass: 'text-xs font-semibold uppercase tracking-[0.15em]',
    cardSurfaceClass: 'bg-white/[0.06]',
    subtleBorderColor: () => 'rgba(255,255,255,0.14)',
  },
}

export function getTemplateTheme(templateId) {
  return TEMPLATE_THEMES[templateId] || TEMPLATE_THEMES['minimal-white']
}
