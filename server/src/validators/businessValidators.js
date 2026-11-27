import { z } from 'zod'
import {
  ALLOWED_ALIGNMENTS,
  ALLOWED_FONTS,
  ALLOWED_LAYOUT_STYLES,
  ALLOWED_LENGTHS,
  ALLOWED_LOGO_PLACEMENTS,
  ALLOWED_TONES,
} from '../models/Business.js'
import { ALLOWED_QUESTION_CATEGORIES } from '../services/reviewGeneration/questionClassifier.js'

const logoSchema = z
  .object({
    url: z.string().max(600).optional(),
    publicId: z.string().max(240).optional(),
    format: z.string().max(16).optional(),
    width: z.number().min(0).optional(),
    height: z.number().min(0).optional(),
  })
  .nullable()
  .optional()

const PLACE_ID_RE = /^(?:ChIJ|GhIJ|Eh)[A-Za-z0-9_-]{10,}$/

function isValidGoogleReviewInput(val) {
  const trimmed = String(val || '').trim()
  if (!trimmed) return true
  if (PLACE_ID_RE.test(trimmed)) return true
  try {
    const parsed = new URL(trimmed)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

const googleReviewUrlSchema = z
  .string()
  .max(4096, 'Google Review URL must be at most 4096 characters')
  .refine(
    isValidGoogleReviewInput,
    'Google Review URL must be a valid http(s) URL or Google Place ID',
  )
  .optional()

const reviewConfigSchema = z
  .object({
    googleReviewUrl: googleReviewUrlSchema,
    welcomeMessage: z
      .string()
      .max(400, 'Welcome message must be at most 400 characters')
      .optional(),
    tone: z.enum(ALLOWED_TONES).optional(),
    length: z.enum(ALLOWED_LENGTHS).optional(),
    autoCopyPrompt: z.boolean().optional(),
  })
  .optional()

const appearanceSchema = z
  .object({
    accentColor: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
      .optional(),
    fontFamily: z.enum(ALLOWED_FONTS).optional(),
    businessNameAlignment: z.enum(ALLOWED_ALIGNMENTS).optional(),
    logoPlacement: z.enum(ALLOWED_LOGO_PLACEMENTS).optional(),
    layoutStyle: z.enum(ALLOWED_LAYOUT_STYLES).optional(),
  })
  .optional()

export const questionItemSchema = z.object({
  id: z.string().min(1).max(64).optional(),
  text: z.string().trim().min(1, 'Question text is required').max(240),
  category: z.enum(ALLOWED_QUESTION_CATEGORIES).optional(),
  customContext: z.string().max(160).optional(),
  type: z.enum(['single_choice', 'multiple_choice', 'short_text']).optional(),
  required: z.boolean().optional(),
  enabled: z.boolean().optional(),
  options: z.array(z.string().max(120)).max(20).optional(),
})

export const createBusinessSchema = z.object({
  name: z.string().trim().min(1, 'Business name is required').max(140),
  logo: logoSchema,
  category: z.string().max(60).optional(),
  location: z.string().max(160).optional(),
  address: z.string().max(260).optional(),
  phone: z.string().max(40).optional(),
  email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  status: z.enum(['active', 'paused']).optional(),
  googleReviewUrl: googleReviewUrlSchema,
  welcomeMessage: z
    .string()
    .max(400, 'Welcome message must be at most 400 characters')
    .optional(),
  reviewConfig: reviewConfigSchema,
  appearance: appearanceSchema,
  questions: z.array(questionItemSchema).max(50).optional(),
})

export const updateBusinessSchema = createBusinessSchema.partial()

export const updateQuestionsSchema = z.object({
  questions: z.array(questionItemSchema).max(50),
})

export const publicEventSchema = z.object({
  event: z.enum([
    'totalScans',
    'landingViews',
    'initialRating',
    'questionnaireStarts',
    'questionnaireCompletions',
    'reviewDraftsGenerated',
    'copyClicks',
    'googleReviewRedirects',
  ]),
  rating: z.number().int().min(1).max(5).optional(),
})

export const businessListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(80).default(''),
  status: z.enum(['all', 'active', 'paused']).default('all'),
})

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export const analyticsRangeQuerySchema = z
  .object({
    range: z.enum(['7d', '30d', '90d', 'custom']).default('30d'),
    from: z.string().regex(ISO_DATE_RE, 'Invalid start date format (YYYY-MM-DD)').optional(),
    to: z.string().regex(ISO_DATE_RE, 'Invalid end date format (YYYY-MM-DD)').optional(),
  })
  .superRefine((data, ctx) => {
    if (data.range === 'custom') {
      if (!data.from || !data.to) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Both "from" and "to" dates are required for custom range.',
        })
        return
      }
      const start = new Date(`${data.from}T00:00:00.000Z`)
      const end = new Date(`${data.to}T23:59:59.999Z`)
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid custom date values.',
        })
        return
      }
      if (start > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '"from" date must be on or before "to" date.',
        })
        return
      }
      const diffDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
      if (diffDays > 366) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Custom date range cannot exceed 366 days.',
        })
      }
    }
  })

export const cleanupLogoSchema = z.object({
  publicId: z
    .string()
    .trim()
    .regex(
      /^reviewbuddy\/businesses\/logos\/[a-zA-Z0-9_-]{6,120}$/,
      'Invalid Cloudinary asset publicId.',
    ),
})
