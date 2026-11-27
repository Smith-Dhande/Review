import mongoose from 'mongoose'
import { ALLOWED_QUESTION_CATEGORIES } from '../services/reviewGeneration/questionClassifier.js'

export const ALLOWED_TONES = [
  'Natural and Conversational',
  'Friendly and Casual',
  'Professional',
  'Enthusiastic',
  'Simple and Straightforward',
]

export const ALLOWED_LENGTHS = ['Short', 'Medium', 'Detailed']

export const ALLOWED_FONTS = [
  'Inter',
  'DM Sans',
  'Poppins',
  'Lato',
  'Manrope',
  'Plus Jakarta Sans',
  'Playfair Display',
  'Lora',
  'Outfit',
  'Source Sans 3',
]

export const ALLOWED_ALIGNMENTS = ['left', 'center']

export const ALLOWED_LOGO_PLACEMENTS = ['above', 'beside']

export const ALLOWED_LAYOUT_STYLES = ['centered', 'compact']

const questionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true, maxlength: 240 },
    category: {
      type: String,
      enum: ALLOWED_QUESTION_CATEGORIES,
      default: 'custom',
    },
    customContext: { type: String, trim: true, default: '', maxlength: 160 },
    type: {
      type: String,
      enum: ['single_choice', 'multiple_choice', 'short_text'],
      default: 'single_choice',
    },
    required: { type: Boolean, default: false },
    options: [{ type: String, trim: true, maxlength: 120 }],
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
)

const businessSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    qrPublicUrl: {
      type: String,
      required: true,
      immutable: true,
    },
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, trim: true },
    logoText: { type: String, trim: true, maxlength: 4 },
    logo: {
      url: { type: String, trim: true, default: '' },
      publicId: { type: String, trim: true, default: '' },
      format: { type: String, trim: true, default: '' },
      width: { type: Number, default: 0 },
      height: { type: Number, default: 0 },
    },
    category: { type: String, trim: true, default: 'Other' },
    location: { type: String, trim: true, default: '', maxlength: 160 },
    address: { type: String, trim: true, default: '', maxlength: 260 },
    phone: { type: String, trim: true, default: '', maxlength: 40 },
    email: { type: String, trim: true, default: '', maxlength: 140 },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
    },
    reviewConfig: {
      googleReviewUrl: { type: String, trim: true, default: '' },
      welcomeMessage: { type: String, trim: true, default: '', maxlength: 400 },
      tone: {
        type: String,
        enum: ALLOWED_TONES,
        default: 'Natural and Conversational',
      },
      length: {
        type: String,
        enum: ALLOWED_LENGTHS,
        default: 'Medium',
      },
      autoCopyPrompt: { type: Boolean, default: true },
    },
    appearance: {
      accentColor: { type: String, default: '#1B6B4A' },
      fontFamily: { type: String, enum: ALLOWED_FONTS, default: 'Inter' },
      businessNameAlignment: {
        type: String,
        enum: ALLOWED_ALIGNMENTS,
        default: 'left',
      },
      logoPlacement: {
        type: String,
        enum: ALLOWED_LOGO_PLACEMENTS,
        default: 'beside',
      },
      layoutStyle: {
        type: String,
        enum: ALLOWED_LAYOUT_STYLES,
        default: 'centered',
      },
    },
    questions: { type: [questionSchema], default: [] },
    analytics: {
      totalScans: { type: Number, default: 0 },
      landingViews: { type: Number, default: 0 },
      totalInitialRatings: { type: Number, default: 0 },
      ratingSum: { type: Number, default: 0 },
      ratingDistribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 },
      },
      questionnaireStarts: { type: Number, default: 0 },
      questionnaireCompletions: { type: Number, default: 0 },
      reviewDraftsGenerated: { type: Number, default: 0 },
      copyClicks: { type: Number, default: 0 },
      googleReviewRedirects: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
)

businessSchema.index({ slug: 1 })
businessSchema.index({ status: 1, createdAt: -1 })
businessSchema.index({ createdAt: -1 })
businessSchema.index({ 'logo.publicId': 1 }, { sparse: true })

const Business = mongoose.model('Business', businessSchema)
export default Business
