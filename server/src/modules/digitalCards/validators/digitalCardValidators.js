import { z } from 'zod'
import {
  DIGITAL_CARD_FONTS,
  DIGITAL_CARD_TEMPLATES,
} from '../models/DigitalCard.js'
import { DIGITAL_CARD_EVENT_TYPES } from '../models/DigitalCardEvent.js'

const HEX_COLOR = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
  .optional()

function isSafeHttpUrl(val) {
  const trimmed = String(val || '').trim()
  if (!trimmed) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

const safeUrl = (maxLen = 1000) =>
  z
    .string()
    .max(maxLen)
    .refine(isSafeHttpUrl, 'URL must start with http:// or https://')
    .optional()

const assetSchema = z
  .object({
    url: safeUrl(800),
    publicId: z.string().max(240).optional(),
    format: z.string().max(16).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  })
  .nullable()
  .optional()

const contactActionSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum([
    'call',
    'whatsapp',
    'email',
    'save_contact',
    'website',
    'directions',
  ]),
  label: z.string().max(40).optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).max(20).optional(),
})

const socialLinkItemSchema = z.object({
  id: z.string().min(1).max(64),
  platform: z.enum([
    'instagram',
    'facebook',
    'linkedin',
    'twitter',
    'youtube',
    'telegram',
    'pinterest',
    'snapchat',
    'github',
    'behance',
    'dribbble',
    'threads',
    'custom',
  ]),
  label: z.string().max(50).optional(),
  url: safeUrl(1000),
  enabled: z.boolean().optional(),
})

const sectionItemSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().max(120).optional(),
  description: z.string().max(400).optional(),
  url: safeUrl(1000),
  image: assetSchema,
})

const customSectionSchema = z.object({
  id: z.string().min(1).max(64),
  type: z.enum([
    'services',
    'skills',
    'portfolio',
    'products',
    'certifications',
    'achievements',
    'gallery',
    'links',
    'text',
  ]),
  title: z.string().max(100).optional(),
  subtitle: z.string().max(200).optional(),
  content: z.string().max(1500).optional(),
  items: z.array(sectionItemSchema).max(24).optional(),
  visible: z.boolean().optional(),
  order: z.number().int().min(0).max(50).optional(),
})

export const createDigitalCardSchema = z.object({
  name: z.string().trim().min(1, 'Card name is required').max(140),
  status: z.enum(['active', 'paused']).optional(),
  templateId: z.enum(DIGITAL_CARD_TEMPLATES).optional(),
  personalInformation: z
    .object({
      fullName: z.string().max(140).optional(),
      profilePicture: assetSchema,
      coverImage: assetSchema,
      jobTitle: z.string().max(120).optional(),
      profession: z.string().max(120).optional(),
      companyName: z.string().max(140).optional(),
      companyLogo: assetSchema,
      shortBio: z.string().max(320).optional(),
      longBio: z.string().max(2000).optional(),
      tagline: z.string().max(160).optional(),
      location: z.string().max(160).optional(),
      address: z.string().max(300).optional(),
      googleMapsUrl: safeUrl(2048),
      websiteUrl: safeUrl(1000),
    })
    .optional(),
  contactInformation: z
    .object({
      phone: z.string().max(40).optional(),
      secondaryPhone: z.string().max(40).optional(),
      email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
      whatsappNumber: z.string().max(40).optional(),
      whatsappMessage: z.string().max(300).optional(),
      website: safeUrl(1000),
      businessAddress: z.string().max(300).optional(),
      googleMapsUrl: safeUrl(2048),
      actions: z.array(contactActionSchema).max(10).optional(),
    })
    .optional(),
  socialLinks: z
    .object({
      displayStyle: z
        .enum(['icon_only', 'icon_label', 'compact_button', 'section'])
        .optional(),
      items: z.array(socialLinkItemSchema).max(20).optional(),
    })
    .optional(),
  customSections: z.array(customSectionSchema).max(15).optional(),
  appearance: z
    .object({
      primaryColor: HEX_COLOR,
      secondaryColor: HEX_COLOR,
      accentColor: HEX_COLOR,
      backgroundColor: HEX_COLOR,
      textColor: HEX_COLOR,
      buttonBgColor: HEX_COLOR,
      buttonTextColor: HEX_COLOR,
      cardBgColor: HEX_COLOR,
      borderColor: HEX_COLOR,
      backgroundType: z.enum(['solid', 'gradient', 'pattern', 'image']).optional(),
      backgroundGradient: z.string().max(300).optional(),
      backgroundPattern: z.enum(['none', 'dots', 'grid', 'diagonal']).optional(),
      backgroundImage: assetSchema,
      themeMode: z.enum(['light', 'dark']).optional(),
      headingFont: z.enum(DIGITAL_CARD_FONTS).optional(),
      bodyFont: z.enum(DIGITAL_CARD_FONTS).optional(),
      buttonFont: z.enum(DIGITAL_CARD_FONTS).optional(),
      headingSize: z.enum(['sm', 'md', 'lg', 'xl']).optional(),
      bodySize: z.enum(['sm', 'md', 'lg']).optional(),
      fontWeight: z.enum(['normal', 'medium', 'semibold', 'bold']).optional(),
      lineHeight: z.enum(['tight', 'normal', 'relaxed']).optional(),
      letterSpacing: z.enum(['tight', 'normal', 'wide']).optional(),
      profileImageShape: z.enum(['circle', 'rounded', 'square']).optional(),
      profileImageSize: z.enum(['sm', 'md', 'lg']).optional(),
      showBanner: z.boolean().optional(),
      bannerHeight: z.enum(['sm', 'md', 'lg']).optional(),
      textAlign: z.enum(['left', 'center']).optional(),
      contentAlign: z.enum(['left', 'center']).optional(),
      sectionSpacing: z.enum(['compact', 'comfortable', 'spacious']).optional(),
      buttonStyle: z.enum(['filled', 'outlined', 'soft']).optional(),
      buttonShape: z.enum(['rounded', 'pill', 'square']).optional(),
      buttonSize: z.enum(['sm', 'md', 'lg']).optional(),
      borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'xl']).optional(),
      cardWidth: z.enum(['narrow', 'standard', 'wide']).optional(),
      dividerStyle: z.enum(['line', 'subtle', 'none']).optional(),
    })
    .optional(),
  visibilitySettings: z.record(z.string(), z.boolean()).optional(),
})

export const updateDigitalCardSchema = createDigitalCardSchema.partial()

export const listDigitalCardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().max(100).optional().default(''),
  status: z.enum(['all', 'active', 'paused']).default('all'),
})

export const cardStatusSchema = z.object({
  status: z.enum(['active', 'paused']),
})

export const digitalCardEventSchema = z.object({
  event: z.enum(DIGITAL_CARD_EVENT_TYPES),
  target: z.string().trim().max(40).optional(),
})
