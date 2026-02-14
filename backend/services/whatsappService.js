const twilio = require("twilio");
const Settings = require("../models/Settings");

const sendStockAlert = async (productName, currentStock, season) => {
  try {
    // Fetch all settings from database
    const userId = "default-user-id";
    const settings = await Settings.findOne({ userId });
    
    if (!settings) {
      throw new Error("Settings not found. Please configure your settings first.");
    }
    
    // Check if Twilio credentials are configured
    if (!settings.isTwilioConfigured || !settings.twilioAccountSid || !settings.twilioAuthToken) {
      throw new Error("Twilio credentials not configured. Please add Twilio Account SID and Auth Token in Settings.");
    }
    
    // Check if WhatsApp number is configured
    if (!settings.whatsappNumber || settings.whatsappNumber.trim().length === 0) {
      throw new Error("WhatsApp number not configured. Please add a WhatsApp number in Settings.");
    }
    
    // Check if notifications are enabled
    if (!settings.notificationEnabled) {
      console.log("⚠️ Notifications are disabled in settings. Skipping WhatsApp alert.");
      return null; // Skip sending but don't throw error
    }

    // Initialize Twilio client with credentials from database
    console.log("🔧 Initializing Twilio client with credentials from database...");
    const client = twilio(settings.twilioAccountSid, settings.twilioAuthToken);

    const thresholdText = season === "Summer" ? "Summer Threshold Alert" : "Stock Alert";

    const messageBody = `⚠️ LOW STOCK ALERT!

Product: ${productName}
Current Stock: ${currentStock}
Season: ${season}

Action Required: Reorder immediately!
`;

    // Use dynamic WhatsApp numbers from settings
    const fromNumber = settings.twilioWhatsAppFrom || "whatsapp:+14155238886";
    const toNumber = `whatsapp:${settings.whatsappNumber}`;

    console.log("📤 Sending WhatsApp message...");
    console.log("📱 From:", fromNumber);
    console.log("📱 To:", toNumber);

    const whatsappMessage = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: messageBody,
    });

    console.log("✅ WhatsApp Message Sent Successfully!");
    console.log("📧 Message SID:", whatsappMessage.sid);
    console.log("📱 Sent to:", settings.whatsappNumber);
    console.log("📤 Sent from:", fromNumber);
    console.log("📊 Status:", whatsappMessage.status);

    return whatsappMessage.sid;
  } catch (error) {
    console.error("❌ WhatsApp Error:", error.message);
    
    // Provide more helpful error messages
    if (error.code === 20003) {
      throw new Error("Invalid Twilio credentials. Please check your Account SID and Auth Token in Settings.");
    } else if (error.code === 21211) {
      throw new Error("Invalid WhatsApp number. Please check the phone number format in Settings.");
    } else if (error.code === 21608) {
      throw new Error("WhatsApp number is not enabled for Twilio. Please verify your Twilio sandbox or approved number.");
    }
    
    throw error; // Re-throw for syncInventory to catch
  }
};

module.exports = {
  sendStockAlert,
};