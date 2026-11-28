import mongoose from 'mongoose'

export const DIGITAL_CARD_EVENT_TYPES = [
  'profileVisits',
  'callClicks',
  'whatsappClicks',
  'emailClicks',
  'websiteClicks',
  'socialClicks',
  'directionsClicks',
  'saveContactClicks',
]

const digitalCardEventSchema = new mongoose.Schema(
  {
    cardSlug: {
      type: String,
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: DIGITAL_CARD_EVENT_TYPES,
    },
    target: {
      type: String,
      trim: true,
      maxlength: 40,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'digitalcardevents',
  },
)

digitalCardEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 },
)
digitalCardEventSchema.index({ cardSlug: 1, createdAt: -1 })
digitalCardEventSchema.index({ eventType: 1, createdAt: -1 })

const DigitalCardEvent = mongoose.model('DigitalCardEvent', digitalCardEventSchema)
export default DigitalCardEvent
