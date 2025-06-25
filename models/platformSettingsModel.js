import mongoose from 'mongoose';

const adminContactSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
}, { _id: false });

const platformSettingsSchema = new mongoose.Schema({
  qrCodeUrl: { type: String },
  upiId: { type: String },
  bannerImageUrl: { type: String },
  whatsAppNumber: { type: String },
  adminContact: adminContactSchema
}, { timestamps: true });

export default mongoose.model('PlatformSettings', platformSettingsSchema);
