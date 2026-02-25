import { View, Text, ScrollView, StyleSheet, TextInput, TouchableOpacity, Switch, Alert, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { 
  getSettings, 
  updateSettings, 
  validateGeminiKey,
  validateTwilioCredentials,
  type Settings,
  type SettingsResponse,
  type ValidationResponse 
} from "../services/settingsService";
import { LinearGradient } from "expo-linear-gradient";

export default function SettingsScreen() {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [validating, setValidating] = useState<boolean>(false);
  
  // Gemini Settings
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [maskedApiKey, setMaskedApiKey] = useState<string>("");
  const [isGeminiConfigured, setIsGeminiConfigured] = useState<boolean>(false);
  
  // WhatsApp & Twilio Settings
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [showTwilioConfig, setShowTwilioConfig] = useState<boolean>(false);
  const [twilioAccountSid, setTwilioAccountSid] = useState<string>("");
  const [twilioAuthToken, setTwilioAuthToken] = useState<string>("");
  const [twilioWhatsAppFrom, setTwilioWhatsAppFrom] = useState<string>("whatsapp:+14155238886");
  const [maskedTwilioSid, setMaskedTwilioSid] = useState<string>("");
  const [maskedTwilioToken, setMaskedTwilioToken] = useState<string>("");
  const [isTwilioConfigured, setIsTwilioConfigured] = useState<boolean>(false);
  
  // Other Settings
  const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);
  const [autoSync, setAutoSync] = useState<boolean>(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async (): Promise<void> => {
    try {
      const response: SettingsResponse = await getSettings();
      if (response.success && response.settings) {
        const settings = response.settings;
        
        // Gemini
        setMaskedApiKey(settings.geminiApiKey || "");
        setIsGeminiConfigured(settings.isGeminiConfigured || false);
        
        // WhatsApp & Twilio
        setWhatsappNumber(settings.whatsappNumber || "");
        setMaskedTwilioSid(settings.twilioAccountSid || "");
        setMaskedTwilioToken(settings.twilioAuthToken || "");
        setTwilioWhatsAppFrom(settings.twilioWhatsAppFrom || "whatsapp:+14155238886");
        setIsTwilioConfigured(settings.isTwilioConfigured || false);
        
        // Other
        setNotificationEnabled(settings.notificationEnabled ?? true);
        setAutoSync(settings.autoSync ?? true);
      }
    } catch (error) {
      console.error("Fetch settings error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAndSaveGemini = async (): Promise<void> => {
    if (!geminiApiKey || geminiApiKey.trim().length === 0) {
      Alert.alert("Error", "Please enter a Gemini API key");
      return;
    }

    setValidating(true);

    try {
      const validationResult: ValidationResponse = await validateGeminiKey(geminiApiKey);
      
      if (!validationResult.valid) {
        Alert.alert(
          "Invalid API Key",
          validationResult.error || "The API key you entered is not valid. Please check and try again."
        );
        setValidating(false);
        return;
      }

      setSaving(true);
      const result: SettingsResponse = await updateSettings({ geminiApiKey });
      
      if (result.success && result.settings) {
        Alert.alert("Success", "Gemini API key saved successfully!");
        setIsGeminiConfigured(true);
        setMaskedApiKey(result.settings.geminiApiKey);
        setGeminiApiKey("");
      } else {
        Alert.alert("Error", "Failed to save settings");
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert("Error", err.message || "Failed to validate API key");
    } finally {
      setValidating(false);
      setSaving(false);
    }
  };

  const handleValidateAndSaveTwilio = async (): Promise<void> => {
    if (!twilioAccountSid || twilioAccountSid.trim().length === 0) {
      Alert.alert("Error", "Please enter Twilio Account SID");
      return;
    }

    if (!twilioAuthToken || twilioAuthToken.trim().length === 0) {
      Alert.alert("Error", "Please enter Twilio Auth Token");
      return;
    }

    setValidating(true);

    try {
      const validationResult: ValidationResponse = await validateTwilioCredentials(
        twilioAccountSid,
        twilioAuthToken
      );
      
      if (!validationResult.valid) {
        Alert.alert(
          "Invalid Credentials",
          validationResult.message || "The Twilio credentials you entered are not valid."
        );
        setValidating(false);
        return;
      }

      setSaving(true);
      const result: SettingsResponse = await updateSettings({ 
        twilioAccountSid,
        twilioAuthToken,
        twilioWhatsAppFrom
      });
      
      if (result.success && result.settings) {
        Alert.alert("Success", "Twilio credentials saved successfully!");
        setIsTwilioConfigured(true);
        setMaskedTwilioSid(result.settings.twilioAccountSid);
        setMaskedTwilioToken(result.settings.twilioAuthToken);
        setTwilioAccountSid("");
        setTwilioAuthToken("");
        setShowTwilioConfig(false);
      } else {
        Alert.alert("Error", "Failed to save Twilio credentials");
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert("Error", err.message || "Failed to validate Twilio credentials");
    } finally {
      setValidating(false);
      setSaving(false);
    }
  };

  const handleSaveOtherSettings = async (): Promise<void> => {
    setSaving(true);
    try {
      const result: SettingsResponse = await updateSettings({
        whatsappNumber,
        notificationEnabled,
        autoSync,
      });

      if (result.success) {
        Alert.alert("Success", "Settings saved successfully!");
      } else {
        Alert.alert("Error", "Failed to save settings");
      }
    } catch (error) {
      const err = error as Error;
      Alert.alert("Error", err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveApiKey = (): void => {
    Alert.alert(
      "Remove API Key",
      "Are you sure you want to remove your Gemini API key? The camera scanner will not work without it.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const result: SettingsResponse = await updateSettings({ geminiApiKey: "" });
              if (result.success) {
                setIsGeminiConfigured(false);
                setMaskedApiKey("");
                setGeminiApiKey("");
                Alert.alert("Success", "API key removed");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to remove API key");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveTwilioCredentials = (): void => {
    Alert.alert(
      "Remove Twilio Credentials",
      "Are you sure you want to remove your Twilio credentials? WhatsApp notifications will not work without them.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
              const result: SettingsResponse = await updateSettings({ 
                twilioAccountSid: "",
                twilioAuthToken: "",
                twilioWhatsAppFrom: "whatsapp:+14155238886"
              });
              if (result.success) {
                setIsTwilioConfigured(false);
                setMaskedTwilioSid("");
                setMaskedTwilioToken("");
                setTwilioAccountSid("");
                setTwilioAuthToken("");
                Alert.alert("Success", "Twilio credentials removed");
              }
            } catch (error) {
              Alert.alert("Error", "Failed to remove Twilio credentials");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Gemini API Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sparkles" size={22} color="#3B82F6" />
            <Text style={styles.sectionTitle}>AI Configuration</Text>
          </View>

          {isGeminiConfigured ? (
            <View style={styles.configuredCard}>
              <View style={styles.configuredHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <Text style={styles.configuredTitle}>Gemini AI Connected</Text>
              </View>
              <Text style={styles.configuredSubtext}>API Key: {maskedApiKey}</Text>
              <TouchableOpacity 
                style={styles.removeButton}
                onPress={handleRemoveApiKey}
              >
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
                <Text style={styles.removeButtonText}>Remove API Key</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>Gemini API Key *</Text>
              <Text style={styles.inputHelp}>
                Get your free API key from Google AI Studio
              </Text>
              <TextInput
                style={styles.input}
                value={geminiApiKey}
                onChangeText={setGeminiApiKey}
                placeholder="Enter your Gemini API key"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity 
                style={styles.linkButton}
                onPress={() => Alert.alert("Get API Key", "Visit: https://makersuite.google.com/app/apikey")}
              >
                <Text style={styles.linkText}>Get Free API Key →</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.validateButton}
                onPress={handleValidateAndSaveGemini}
                disabled={validating || saving}
              >
                <LinearGradient
                  colors={['#3B82F6', '#2563EB']}
                  style={styles.validateGradient}
                >
                  {validating || saving ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                      <Text style={styles.validateButtonText}>Validate & Save</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* WhatsApp Configuration */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
            <Text style={styles.sectionTitle}>WhatsApp Alerts</Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>WhatsApp Number</Text>
            <Text style={styles.inputHelp}>
              Number that will receive low stock alerts
            </Text>
            <TextInput
              style={styles.input}
              value={whatsappNumber}
              onChangeText={setWhatsappNumber}
              placeholder="+919876543210"
              placeholderTextColor="#94A3B8"
              keyboardType="phone-pad"
            />

            {/* Twilio Configuration Toggle */}
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() => setShowTwilioConfig(!showTwilioConfig)}
            >
              <View style={styles.expandButtonContent}>
                <Ionicons name="settings-outline" size={18} color="#3B82F6" />
                <Text style={styles.expandButtonText}>
                  {isTwilioConfigured ? "Twilio Configured ✓" : "Configure Twilio Credentials"}
                </Text>
              </View>
              <Ionicons 
                name={showTwilioConfig ? "chevron-up" : "chevron-down"} 
                size={20} 
                color="#3B82F6" 
              />
            </TouchableOpacity>

            {/* Expandable Twilio Configuration */}
            {showTwilioConfig && (
              <View style={styles.twilioExpandedSection}>
                {isTwilioConfigured ? (
                  <View style={styles.twilioConfiguredCard}>
                    <View style={styles.configuredHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={styles.twilioConfiguredTitle}>Twilio Connected</Text>
                    </View>
                    <Text style={styles.twilioConfiguredText}>Account SID: {maskedTwilioSid}</Text>
                    <Text style={styles.twilioConfiguredText}>Auth Token: {maskedTwilioToken}</Text>
                    <Text style={styles.twilioConfiguredText}>From: {twilioWhatsAppFrom}</Text>
                    <TouchableOpacity 
                      style={styles.removeButton}
                      onPress={handleRemoveTwilioCredentials}
                    >
                      <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      <Text style={styles.removeButtonText}>Remove Credentials</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.twilioHelp}>
                      Configure Twilio to enable WhatsApp notifications
                    </Text>

                    <Text style={styles.inputLabel}>Twilio Account SID *</Text>
                    <TextInput
                      style={styles.input}
                      value={twilioAccountSid}
                      onChangeText={setTwilioAccountSid}
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />

                    <Text style={styles.inputLabel}>Twilio Auth Token *</Text>
                    <TextInput
                      style={styles.input}
                      value={twilioAuthToken}
                      onChangeText={setTwilioAuthToken}
                      placeholder="Your Twilio Auth Token"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      autoCorrect={false}
                      secureTextEntry
                    />

                    <Text style={styles.inputLabel}>Twilio WhatsApp From Number</Text>
                    <TextInput
                      style={styles.input}
                      value={twilioWhatsAppFrom}
                      onChangeText={setTwilioWhatsAppFrom}
                      placeholder="whatsapp:+14155238886"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                    />

                    <TouchableOpacity 
                      style={styles.linkButton}
                      onPress={() => Alert.alert("Get Twilio Credentials", "Visit: https://console.twilio.com/")}
                    >
                      <Text style={styles.linkText}>Get Twilio Credentials →</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.validateButton}
                      onPress={handleValidateAndSaveTwilio}
                      disabled={validating || saving}
                    >
                      <LinearGradient
                        colors={['#25D366', '#128C7E']}
                        style={styles.validateGradient}
                      >
                        {validating || saving ? (
                          <ActivityIndicator color="#FFF" />
                        ) : (
                          <>
                            <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                            <Text style={styles.validateButtonText}>Validate & Save Twilio</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            )}
          </View>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="settings-outline" size={22} color="#3B82F6" />
            <Text style={styles.sectionTitle}>App Settings</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Notifications</Text>
                <Text style={styles.settingSubtext}>Receive low stock alerts</Text>
              </View>
              <Switch
                value={notificationEnabled}
                onValueChange={setNotificationEnabled}
                trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                thumbColor={notificationEnabled ? "#3B82F6" : "#CBD5E1"}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Auto-Sync</Text>
                <Text style={styles.settingSubtext}>Automatically update inventory</Text>
              </View>
              <Switch
                value={autoSync}
                onValueChange={setAutoSync}
                trackColor={{ false: "#E2E8F0", true: "#93C5FD" }}
                thumbColor={autoSync ? "#3B82F6" : "#CBD5E1"}
              />
            </View>
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveOtherSettings}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.saveButtonText}>Save Settings</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  centerContent: { justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 10, color: "#64748B", fontSize: 14 },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: { fontSize: 24, fontWeight: "bold", color: "#0F172A" },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  inputCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  configuredCard: {
    backgroundColor: "#D1FAE5",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  configuredHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  configuredTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#065F46",
  },
  configuredSubtext: {
    fontSize: 14,
    color: "#047857",
    marginBottom: 12,
  },
  removeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE2E2",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
    alignSelf: "flex-start",
  },
  removeButtonText: {
    color: "#EF4444",
    fontSize: 14,
    fontWeight: "600",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 6,
  },
  inputHelp: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0F172A",
    marginBottom: 12,
  },
  linkButton: {
    marginBottom: 16,
  },
  linkText: {
    color: "#3B82F6",
    fontSize: 14,
    fontWeight: "600",
  },
  validateButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  validateGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 8,
  },
  validateButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  expandButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F5F9",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
  },
  expandButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3B82F6",
  },
  twilioExpandedSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  twilioHelp: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
    fontStyle: "italic",
  },
  twilioConfiguredCard: {
    backgroundColor: "#DBEAFE",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#93C5FD",
  },
  twilioConfiguredTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E40AF",
  },
  twilioConfiguredText: {
    fontSize: 12,
    color: "#1E3A8A",
    marginTop: 6,
  },
  settingCard: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  settingInfo: { flex: 1, marginRight: 16 },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 4,
  },
  settingSubtext: {
    fontSize: 13,
    color: "#64748B",
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 16,
  },
  saveButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});