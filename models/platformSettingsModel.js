import mongoose from 'mongoose';

const platformSettingsSchema = new mongoose.Schema({
  qrCodeUrl: { type: String, required: true },
  upiId: { type: String, required: true },
  bannerImageUrl: { type: String, required: true },
  whatsAppNumber: { type: String, required: true }, // New field for WhatsApp number
  adminContact: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  }
}, { timestamps: true });

export default mongoose.model('PlatformSettings', platformSettingsSchema);
