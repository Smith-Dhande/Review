import mongoose from 'mongoose'

const analyticsEventSchema = new mongoose.Schema(
  {
    businessPublicId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
      enum: [
        'totalScans',
        'landingViews',
        'initialRating',
        'questionnaireStarts',
        'questionnaireCompletions',
        'reviewDraftsGenerated',
        'copyClicks',
        'googleReviewRedirects',
      ],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
)

// Serves both 365-day TTL retention and overview date-range ($gte/$lte createdAt) queries
analyticsEventSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 365 * 24 * 60 * 60 },
)
// Serves business-specific date-filtered analytics and deleteEventsForBusiness prefix queries
analyticsEventSchema.index({ businessPublicId: 1, createdAt: -1 })

const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema)
export default AnalyticsEvent
