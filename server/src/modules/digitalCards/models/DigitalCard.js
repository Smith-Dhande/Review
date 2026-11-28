import mongoose from 'mongoose'

export const DIGITAL_CARD_TEMPLATES = [
  'minimal-white',
  'premium-dark',
  'modern-gradient',
  'corporate-professional',
  'creative-portfolio',
  'elegant-personal',
  'bold-modern',
  'glass-tech',
]

export const DIGITAL_CARD_FONTS = [
  'Inter',
  'Plus Jakarta Sans',
  'Outfit',
  'Manrope',
  'DM Sans',
  'Poppins',
  'Montserrat',
  'Lato',
  'Playfair Display',
  'Cormorant Garamond',
  'Cinzel',
  'Fraunces',
  'DM Serif Display',
  'Bodoni Moda',
  'Lora',
  'Syne',
  'Bricolage Grotesque',
  'Space Grotesk',
  'JetBrains Mono',
]

const assetSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    publicId: { type: String, trim: true, default: '' },
    format: { type: String, trim: true, default: '' },
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 },
  },
  { _id: false },
)

const contactActionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ['call', 'whatsapp', 'email', 'save_contact', 'website', 'directions'],
      required: true,
    },
    label: { type: String, trim: true, maxlength: 40, default: '' },
    enabled: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
)

const socialLinkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    platform: {
      type: String,
      enum: [
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
      ],
      required: true,
    },
    label: { type: String, trim: true, maxlength: 50, default: '' },
    url: { type: String, trim: true, maxlength: 1000, default: '' },
    enabled: { type: Boolean, default: true },
  },
  { _id: false },
)

const sectionItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, trim: true, maxlength: 120, default: '' },
    description: { type: String, trim: true, maxlength: 400, default: '' },
    url: { type: String, trim: true, maxlength: 1000, default: '' },
    image: { type: assetSchema, default: () => ({}) },
  },
  { _id: false },
)

const customSectionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'services',
        'skills',
        'portfolio',
        'products',
        'certifications',
        'achievements',
        'gallery',
        'links',
        'text',
      ],
      default: 'services',
    },
    title: { type: String, trim: true, maxlength: 100, default: '' },
    subtitle: { type: String, trim: true, maxlength: 200, default: '' },
    content: { type: String, trim: true, maxlength: 1500, default: '' },
    items: { type: [sectionItemSchema], default: [] },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { _id: false },
)

const digitalCardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 140 },
    slug: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
    publicUrl: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'paused'],
      default: 'active',
    },
    personalInformation: {
      fullName: { type: String, trim: true, maxlength: 140, default: '' },
      profilePicture: { type: assetSchema, default: () => ({}) },
      coverImage: { type: assetSchema, default: () => ({}) },
      jobTitle: { type: String, trim: true, maxlength: 120, default: '' },
      profession: { type: String, trim: true, maxlength: 120, default: '' },
      companyName: { type: String, trim: true, maxlength: 140, default: '' },
      companyLogo: { type: assetSchema, default: () => ({}) },
      shortBio: { type: String, trim: true, maxlength: 320, default: '' },
      longBio: { type: String, trim: true, maxlength: 2000, default: '' },
      tagline: { type: String, trim: true, maxlength: 160, default: '' },
      location: { type: String, trim: true, maxlength: 160, default: '' },
      address: { type: String, trim: true, maxlength: 300, default: '' },
      googleMapsUrl: { type: String, trim: true, maxlength: 2048, default: '' },
      websiteUrl: { type: String, trim: true, maxlength: 1000, default: '' },
    },
    contactInformation: {
      phone: { type: String, trim: true, maxlength: 40, default: '' },
      secondaryPhone: { type: String, trim: true, maxlength: 40, default: '' },
      email: { type: String, trim: true, maxlength: 140, default: '' },
      whatsappNumber: { type: String, trim: true, maxlength: 40, default: '' },
      whatsappMessage: { type: String, trim: true, maxlength: 300, default: '' },
      website: { type: String, trim: true, maxlength: 1000, default: '' },
      businessAddress: { type: String, trim: true, maxlength: 300, default: '' },
      googleMapsUrl: { type: String, trim: true, maxlength: 2048, default: '' },
      actions: { type: [contactActionSchema], default: [] },
    },
    socialLinks: {
      displayStyle: {
        type: String,
        enum: ['icon_only', 'icon_label', 'compact_button', 'section'],
        default: 'icon_label',
      },
      items: { type: [socialLinkSchema], default: [] },
    },
    customSections: { type: [customSectionSchema], default: [] },
    templateId: {
      type: String,
      enum: DIGITAL_CARD_TEMPLATES,
      default: 'minimal-white',
    },
    appearance: {
      primaryColor: { type: String, default: '#1B6B4A' },
      secondaryColor: { type: String, default: '#0F172A' },
      accentColor: { type: String, default: '#1B6B4A' },
      backgroundColor: { type: String, default: '#F7F7F5' },
      textColor: { type: String, default: '#171716' },
      buttonBgColor: { type: String, default: '#1B6B4A' },
      buttonTextColor: { type: String, default: '#FFFFFF' },
      cardBgColor: { type: String, default: '#FFFFFF' },
      borderColor: { type: String, default: '#E5E5E3' },
      backgroundType: {
        type: String,
        enum: ['solid', 'gradient', 'pattern', 'image'],
        default: 'solid',
      },
      backgroundGradient: { type: String, trim: true, maxlength: 300, default: '' },
      backgroundPattern: {
        type: String,
        enum: ['none', 'dots', 'grid', 'diagonal'],
        default: 'none',
      },
      backgroundImage: { type: assetSchema, default: () => ({}) },
      themeMode: { type: String, enum: ['light', 'dark'], default: 'light' },
      headingFont: { type: String, enum: DIGITAL_CARD_FONTS, default: 'Inter' },
      bodyFont: { type: String, enum: DIGITAL_CARD_FONTS, default: 'Inter' },
      buttonFont: { type: String, enum: DIGITAL_CARD_FONTS, default: 'Inter' },
      headingSize: { type: String, enum: ['sm', 'md', 'lg', 'xl'], default: 'lg' },
      bodySize: { type: String, enum: ['sm', 'md', 'lg'], default: 'md' },
      fontWeight: { type: String, enum: ['normal', 'medium', 'semibold', 'bold'], default: 'semibold' },
      lineHeight: { type: String, enum: ['tight', 'normal', 'relaxed'], default: 'normal' },
      letterSpacing: { type: String, enum: ['tight', 'normal', 'wide'], default: 'normal' },
      profileImageShape: { type: String, enum: ['circle', 'rounded', 'square'], default: 'circle' },
      profileImageSize: { type: String, enum: ['sm', 'md', 'lg'], default: 'md' },
      showBanner: { type: Boolean, default: true },
      bannerHeight: { type: mongoose.Schema.Types.Mixed, default: 'md' },
      textAlign: { type: String, enum: ['left', 'center'], default: 'center' },
      contentAlign: { type: String, enum: ['left', 'center'], default: 'center' },
      sectionSpacing: { type: String, enum: ['compact', 'comfortable', 'spacious'], default: 'comfortable' },
      buttonStyle: { type: String, enum: ['filled', 'outlined', 'soft'], default: 'filled' },
      buttonShape: { type: String, enum: ['rounded', 'pill', 'square'], default: 'rounded' },
      buttonSize: { type: String, enum: ['sm', 'md', 'lg'], default: 'md' },
      borderRadius: { type: String, enum: ['none', 'sm', 'md', 'lg', 'xl'], default: 'lg' },
      cardWidth: { type: String, enum: ['narrow', 'standard', 'wide'], default: 'standard' },
      dividerStyle: { type: String, enum: ['line', 'subtle', 'none'], default: 'subtle' },
    },
    visibilitySettings: {
      showProfilePicture: { type: Boolean, default: true },
      showCoverImage: { type: Boolean, default: true },
      showCompanyLogo: { type: Boolean, default: true },
      showJobTitle: { type: Boolean, default: true },
      showProfession: { type: Boolean, default: true },
      showCompanyName: { type: Boolean, default: true },
      showTagline: { type: Boolean, default: true },
      showShortBio: { type: Boolean, default: true },
      showLongBio: { type: Boolean, default: true },
      showLocation: { type: Boolean, default: true },
      showAddress: { type: Boolean, default: true },
      showPhone: { type: Boolean, default: true },
      showSecondaryPhone: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: true },
      showWhatsapp: { type: Boolean, default: true },
      showWebsite: { type: Boolean, default: true },
      showGoogleMaps: { type: Boolean, default: true },
      showSocialLinks: { type: Boolean, default: true },
      showSaveContact: { type: Boolean, default: true },
      showCustomSections: { type: Boolean, default: true },
    },
  },
  { timestamps: true, collection: 'digitalcards' },
)

digitalCardSchema.index({ status: 1, createdAt: -1 })
digitalCardSchema.index({ createdAt: -1 })
digitalCardSchema.index({ 'personalInformation.profilePicture.publicId': 1 }, { sparse: true })
digitalCardSchema.index({ 'personalInformation.coverImage.publicId': 1 }, { sparse: true })
digitalCardSchema.index({ 'personalInformation.companyLogo.publicId': 1 }, { sparse: true })
digitalCardSchema.index({ 'appearance.backgroundImage.publicId': 1 }, { sparse: true })
digitalCardSchema.index({ 'customSections.items.image.publicId': 1 }, { sparse: true })

const DigitalCard = mongoose.model('DigitalCard', digitalCardSchema)
export default DigitalCard
