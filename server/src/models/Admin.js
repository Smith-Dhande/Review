import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    role: {
      type: String,
      enum: ['Administrator'],
      default: 'Administrator',
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    sessionVersion: {
      type: Number,
      default: 1,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },
    // Ready for future TOTP-based 2FA without rebuilding login
    mfa: {
      enabled: { type: Boolean, default: false },
      totpSecretEncrypted: { type: String, default: '', select: false },
      recoveryCodeHashes: { type: [String], default: [], select: false },
    },
  },
  { timestamps: true },
)

const Admin = mongoose.model('Admin', adminSchema)
export default Admin
