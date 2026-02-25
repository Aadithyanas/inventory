const BASE_URL = "https://inventory-jtvu.onrender.com/api/products"; // Update your IP

// Types/Interfaces
export interface Settings {
  _id?: string;
  userId?: string;
  geminiApiKey: string;
  isGeminiConfigured: boolean;
  hasGeminiKey?: boolean;
  whatsappNumber: string;
  // Twilio Configuration
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioWhatsAppFrom: string;
  isTwilioConfigured: boolean;
  hasTwilioCredentials?: boolean;
  // Other Settings
  notificationEnabled: boolean;
  autoSync: boolean;
  language: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SettingsResponse {
  success: boolean;
  settings?: Settings;
  message?: string;
  error?: string;
}

export interface ValidationResponse {
  success: boolean;
  valid: boolean;
  message?: string;
  error?: string;
}

export interface GeminiConfigResponse {
  success: boolean;
  configured: boolean;
  apiKey?: string;
  message?: string;
  error?: string;
}

export interface TwilioConfigResponse {
  success: boolean;
  configured: boolean;
  credentials?: {
    accountSid: string;
    authToken: string;
    whatsAppFrom: string;
  };
  message?: string;
  error?: string;
}

// Get user settings
export const getSettings = async (): Promise<SettingsResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/settings`);
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    return await res.json();
  } catch (e) {
    console.error("Get Settings Error:", e);
    throw e;
  }
};

// Update settings
export const updateSettings = async (settingsData: Partial<Settings>): Promise<SettingsResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settingsData),
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (e) {
    console.error("Update Settings Error:", e);
    throw e;
  }
};

// Validate Gemini API Key
export const validateGeminiKey = async (apiKey: string): Promise<ValidationResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/settings/validate-gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });

    const data: ValidationResponse = await res.json();
    return data;
  } catch (e) {
    console.error("Validate API Key Error:", e);
    const error = e as Error;
    return { success: false, valid: false, error: error.message };
  }
};

// Validate Twilio Credentials
export const validateTwilioCredentials = async (
  accountSid: string, 
  authToken: string
): Promise<ValidationResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/settings/validate-twilio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountSid, authToken }),
    });

    const data: ValidationResponse = await res.json();
    return data;
  } catch (e) {
    console.error("Validate Twilio Credentials Error:", e);
    const error = e as Error;
    return { success: false, valid: false, error: error.message };
  }
};

// Check if Gemini is configured
export const checkGeminiConfigured = async (): Promise<GeminiConfigResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/settings/gemini-key`);
    const data: GeminiConfigResponse = await res.json();
    return data;
  } catch (e) {
    console.error("Check Gemini Config Error:", e);
    return { success: false, configured: false };
  }
};

// Check if Twilio is configured
export const checkTwilioConfigured = async (): Promise<TwilioConfigResponse> => {
  try {
    const res = await fetch(`${BASE_URL}/settings/twilio-credentials`);
    const data: TwilioConfigResponse = await res.json();
    return data;
  } catch (e) {
    console.error("Check Twilio Config Error:", e);
    return { success: false, configured: false };
  }
};