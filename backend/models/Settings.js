const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    default: "default-user-id"
  },
  geminiApiKey: {
    type: String,
    default: ""
  },
  isGeminiConfigured: {
    type: Boolean,
    default: false
  },
  whatsappNumber: {
    type: String,
    default: ""
  },
  // Twilio Configuration
  twilioAccountSid: {
    type: String,
    default: ""
  },
  twilioAuthToken: {
    type: String,
    default: ""
  },
  twilioWhatsAppFrom: {
    type: String,
    default: "whatsapp:+14155238886" // Twilio Sandbox number
  },
  isTwilioConfigured: {
    type: Boolean,
    default: false
  },
  notificationEnabled: {
    type: Boolean,
    default: true
  },
  autoSync: {
    type: Boolean,
    default: true
  },
  language: {
    type: String,
    default: "en"
  }
}, { 
  timestamps: true 
});

module.exports = mongoose.model("Settings", settingsSchema);