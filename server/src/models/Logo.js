import mongoose from 'mongoose'

const logoSchema = new mongoose.Schema(
  {
    logoId: { type: String, required: true, unique: true, index: true },
    mimeType: { type: String, required: true },
    dataBase64: { type: String, required: true },
  },
  { timestamps: true },
)

const Logo = mongoose.model('Logo', logoSchema)
export default Logo
