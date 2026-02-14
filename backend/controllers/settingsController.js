const Settings = require("../models/Settings");

// Get user settings
const getSettings = async (req, res) => {
  try {
    console.log("📥 GET Settings request received");
    
    const userId = "default-user-id";
    
    let settings = await Settings.findOne({ userId });
    console.log("🔍 Settings found:", settings);
    
    if (!settings) {
      console.log("⚠️  No settings found, creating default...");
      settings = new Settings({
        userId: userId,
        geminiApiKey: "",
        isGeminiConfigured: false,
        whatsappNumber: "",
        twilioAccountSid: "",
        twilioAuthToken: "",
        twilioWhatsAppFrom: "whatsapp:+14155238886",
        isTwilioConfigured: false,
        notificationEnabled: true,
        autoSync: true,
        language: "en"
      });
      await settings.save();
      console.log("✅ Default settings created");
    }
    
    const safeSettings = {
      userId: settings.userId,
      // Gemini API Key (masked)
      geminiApiKey: settings.geminiApiKey ? "••••••••" + settings.geminiApiKey.slice(-4) : "",
      isGeminiConfigured: settings.isGeminiConfigured || false,
      hasGeminiKey: settings.geminiApiKey && settings.geminiApiKey.length > 0,
      // WhatsApp Number
      whatsappNumber: settings.whatsappNumber || "",
      // Twilio Credentials (masked)
      twilioAccountSid: settings.twilioAccountSid ? "••••••••" + settings.twilioAccountSid.slice(-4) : "",
      twilioAuthToken: settings.twilioAuthToken ? "••••••••" + settings.twilioAuthToken.slice(-4) : "",
      twilioWhatsAppFrom: settings.twilioWhatsAppFrom || "whatsapp:+14155238886",
      isTwilioConfigured: settings.isTwilioConfigured || false,
      hasTwilioCredentials: !!(settings.twilioAccountSid && settings.twilioAccountSid.length > 0 && settings.twilioAuthToken && settings.twilioAuthToken.length > 0),
      // Other Settings
      notificationEnabled: settings.notificationEnabled,
      autoSync: settings.autoSync,
      language: settings.language || "en",
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };
    
    console.log("✅ Sending safe settings:", safeSettings);
    res.json({ 
      success: true, 
      settings: safeSettings 
    });
  } catch (err) {
    console.error("❌ GET Settings Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message,
      stack: err.stack
    });
  }
};

// Update user settings
const updateSettings = async (req, res) => {
  try {
    console.log("📝 UPDATE Settings request:", req.body);
    
    const userId = "default-user-id";
    const { 
      geminiApiKey, 
      whatsappNumber, 
      twilioAccountSid,
      twilioAuthToken,
      twilioWhatsAppFrom,
      notificationEnabled, 
      autoSync, 
      language 
    } = req.body;
    
    let settings = await Settings.findOne({ userId });
    
    if (!settings) {
      settings = new Settings({ userId });
    }
    
    // Update Gemini API Key
    if (geminiApiKey !== undefined) {
      settings.geminiApiKey = geminiApiKey.trim();
      settings.isGeminiConfigured = geminiApiKey.trim().length > 0;
    }
    
    // Update WhatsApp Number
    if (whatsappNumber !== undefined) {
      settings.whatsappNumber = whatsappNumber.trim();
    }
    
    // Update Twilio Account SID
    if (twilioAccountSid !== undefined) {
      settings.twilioAccountSid = twilioAccountSid.trim();
    }
    
    // Update Twilio Auth Token
    if (twilioAuthToken !== undefined) {
      settings.twilioAuthToken = twilioAuthToken.trim();
    }
    
    // Update Twilio WhatsApp From Number
    if (twilioWhatsAppFrom !== undefined) {
      settings.twilioWhatsAppFrom = twilioWhatsAppFrom.trim();
    }
    
    // Auto-detect if Twilio is fully configured
    settings.isTwilioConfigured = 
      !!(settings.twilioAccountSid && settings.twilioAccountSid.length > 0 &&
      settings.twilioAuthToken && settings.twilioAuthToken.length > 0);
    
    // Update Notification Settings
    if (notificationEnabled !== undefined) {
      settings.notificationEnabled = notificationEnabled;
    }
    
    // Update Auto Sync
    if (autoSync !== undefined) {
      settings.autoSync = autoSync;
    }
    
    // Update Language
    if (language !== undefined) {
      settings.language = language;
    }
    
    await settings.save();
    console.log("✅ Settings saved");
    console.log("📊 Twilio Configured:", settings.isTwilioConfigured);
    console.log("📊 Gemini Configured:", settings.isGeminiConfigured);
    
    const safeSettings = {
      userId: settings.userId,
      geminiApiKey: settings.geminiApiKey ? "••••••••" + settings.geminiApiKey.slice(-4) : "",
      isGeminiConfigured: settings.isGeminiConfigured,
      hasGeminiKey: !!(settings.geminiApiKey && settings.geminiApiKey.length > 0),
      whatsappNumber: settings.whatsappNumber,
      twilioAccountSid: settings.twilioAccountSid ? "••••••••" + settings.twilioAccountSid.slice(-4) : "",
      twilioAuthToken: settings.twilioAuthToken ? "••••••••" + settings.twilioAuthToken.slice(-4) : "",
      twilioWhatsAppFrom: settings.twilioWhatsAppFrom,
      isTwilioConfigured: settings.isTwilioConfigured,
      hasTwilioCredentials: !!(settings.twilioAccountSid && settings.twilioAccountSid.length > 0 && settings.twilioAuthToken && settings.twilioAuthToken.length > 0),
      notificationEnabled: settings.notificationEnabled,
      autoSync: settings.autoSync,
      language: settings.language,
      updatedAt: settings.updatedAt
    };
    
    res.json({ 
      success: true, 
      message: "Settings updated successfully",
      settings: safeSettings 
    });
  } catch (err) {
    console.error("❌ UPDATE Settings Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Validate Gemini API Key
const validateGeminiKey = async (req, res) => {
  try {
    console.log("🔑 Validating Gemini API Key");
    const { apiKey } = req.body;
    
    if (!apiKey || apiKey.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        valid: false,
        error: "API key is required" 
      });
    }
    
    // For now, just check if it starts with expected pattern
    // Real validation would require calling Gemini API
    const isValid = apiKey.startsWith("AIza") && apiKey.length > 30;
    
    res.json({ 
      success: true, 
      valid: isValid,
      message: isValid ? "API key format is valid" : "Invalid API key format"
    });
  } catch (err) {
    console.error("❌ Validate API Key Error:", err);
    res.status(400).json({ 
      success: false, 
      valid: false,
      error: err.message 
    });
  }
};

// Validate Twilio Credentials
const validateTwilioCredentials = async (req, res) => {
  try {
    console.log("🔑 Validating Twilio Credentials");
    const { accountSid, authToken } = req.body;
    
    if (!accountSid || accountSid.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        valid: false,
        error: "Twilio Account SID is required" 
      });
    }
    
    if (!authToken || authToken.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        valid: false,
        error: "Twilio Auth Token is required" 
      });
    }
    
    // Basic format validation
    const isSidValid = accountSid.startsWith("AC") && accountSid.length === 34;
    const isTokenValid = authToken.length === 32;
    
    const isValid = isSidValid && isTokenValid;
    
    res.json({ 
      success: true, 
      valid: isValid,
      message: isValid 
        ? "Twilio credentials format is valid" 
        : "Invalid Twilio credentials format. SID should start with 'AC' and be 34 characters. Token should be 32 characters."
    });
  } catch (err) {
    console.error("❌ Validate Twilio Credentials Error:", err);
    res.status(400).json({ 
      success: false, 
      valid: false,
      error: err.message 
    });
  }
};

// Get Gemini API Key for backend use
const getGeminiKey = async (req, res) => {
  try {
    console.log("🔐 Getting Gemini API Key");
    const userId = "default-user-id";
    
    const settings = await Settings.findOne({ userId });
    
    if (!settings || !settings.geminiApiKey || settings.geminiApiKey.length === 0) {
      return res.status(404).json({ 
        success: false, 
        configured: false,
        message: "Gemini API key not configured" 
      });
    }
    
    res.json({ 
      success: true, 
      configured: true,
      apiKey: settings.geminiApiKey 
    });
  } catch (err) {
    console.error("❌ Get Gemini Key Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

// Get Twilio Credentials for backend use
const getTwilioCredentials = async (req, res) => {
  try {
    console.log("🔐 Getting Twilio Credentials");
    const userId = "default-user-id";
    
    const settings = await Settings.findOne({ userId });
    
    if (!settings || !settings.isTwilioConfigured) {
      return res.status(404).json({ 
        success: false, 
        configured: false,
        message: "Twilio credentials not configured" 
      });
    }
    
    res.json({ 
      success: true, 
      configured: true,
      credentials: {
        accountSid: settings.twilioAccountSid,
        authToken: settings.twilioAuthToken,
        whatsAppFrom: settings.twilioWhatsAppFrom
      }
    });
  } catch (err) {
    console.error("❌ Get Twilio Credentials Error:", err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  validateGeminiKey,
  validateTwilioCredentials,
  getGeminiKey,
  getTwilioCredentials
};