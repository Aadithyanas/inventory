import { View, Text, StyleSheet, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView } from "react-native";
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { useState, useRef } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getInventory, syncInventory, type Product } from "../services/productService";
import { checkGeminiConfigured } from "../services/settingsService";
import { router } from "expo-router";

interface CapturedImageType {
  uri: string;
  base64?: string;
}

interface DetectedProduct {
  name: string;
  count: number;
}

interface DetectionResult {
  name: string;
  count: number;
  synced: boolean;
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<CapturedImageType | null>(null);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const cameraRef = useRef<CameraView>(null);

  // Request camera permission
  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={80} color="#94A3B8" />
          <Text style={styles.permissionText}>Camera access required</Text>
          <Text style={styles.permissionSubtext}>
            We need camera permission to detect products
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Capture photo from camera
  const takePicture = async (): Promise<void> => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.7,
          base64: true,
        });
        if (photo) {
          setCapturedImage(photo);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
        console.error(error);
      }
    }
  };

  // Pick image from gallery
  const pickImage = async (): Promise<void> => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setCapturedImage({
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
        });
      }
    } catch (error) {
      Alert.alert("Error", "Failed to pick image");
      console.error(error);
    }
  };

  // Check Gemini setup
  const checkGeminiSetup = async (): Promise<string | false> => {
    try {
      const result = await checkGeminiConfigured();
      if (!result.configured) {
        Alert.alert(
          "Gemini API Not Configured",
          "Please add your Gemini API key in Settings to use the AI scanner.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Go to Settings", 
              onPress: () => router.push("/settings") 
            }
          ]
        );
        return false;
      }
      return result.apiKey || false;
    } catch (error) {
      Alert.alert("Error", "Failed to check API configuration");
      return false;
    }
  };

  // Analyze image with Gemini AI
  const analyzeImage = async (): Promise<void> => {
    if (!capturedImage) return;

    // CHECK API KEY FIRST
    const apiKey = await checkGeminiSetup();
    if (!apiKey) {
      return; // Stop if no API key
    }

    setAnalyzing(true);
    setDetectionResults([]);

    try {
      // Get all products from database
      const inventoryResponse = await getInventory();
      const products: Product[] = inventoryResponse.data || [];
      
      if (products.length === 0) {
        Alert.alert("Error", "No products found in database");
        setAnalyzing(false);
        return;
      }

      // Create list of product names for Gemini
      const productNames = products.map(p => p.name).join(", ");

      // Initialize Gemini model with user's API key
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      // Create prompt for Gemini
      const prompt = `You are a product detection AI for inventory management. 
      
Analyze this image and detect ONLY these products: ${productNames}

For each product you detect:
1. Product name (must match exactly from the list above)
2. Count (how many items)

Return ONLY a JSON array in this exact format:
[
  {"name": "matchbox", "count": 5},
  {"name": "soap", "count": 3}
]

Rules:
- Use lowercase product names
- Only include products you can clearly see
- Be accurate with counts
- If no products found, return empty array []
- Return ONLY the JSON array, no other text`;

      // Convert image to base64 for Gemini
      const imagePart = {
        inlineData: {
          data: capturedImage.base64 || "",
          mimeType: "image/jpeg",
        },
      };

      // Send to Gemini
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();

      console.log("Gemini Response:", text);

      // Parse JSON response
      let detectedProducts: DetectedProduct[] = [];
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          detectedProducts = JSON.parse(jsonMatch[0]);
        } else {
          detectedProducts = JSON.parse(text);
        }
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        Alert.alert("Error", "Failed to parse AI response. Please try again.");
        setAnalyzing(false);
        return;
      }

      if (!Array.isArray(detectedProducts) || detectedProducts.length === 0) {
        Alert.alert("No Products Found", "No matching products detected in the image.");
        setAnalyzing(false);
        return;
      }

      // Process detected products
      const results: DetectionResult[] = [];
      for (const detected of detectedProducts) {
        const productName = detected.name.toLowerCase().trim();
        const count = parseInt(detected.count.toString()) || 0;

        if (count > 0) {
          // Sync with database
          const syncResult = await syncInventory(productName, count);
          
          results.push({
            name: productName,
            count: count,
            synced: syncResult.success || false,
          });

          // Send WhatsApp alert if low stock (count is 1 or below threshold)
          if (count <= 1) {
            await sendLowStockAlert(productName, count);
          }
        }
      }

      setDetectionResults(results);
      
      if (results.length > 0) {
        Alert.alert(
          "Detection Complete",
          `Found ${results.length} product(s). Inventory updated!`
        );
      }

    } catch (error) {
      const err = error as Error;
      console.error("Analysis Error:", error);
      Alert.alert("Error", `Failed to analyze image: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  // Send low stock alert (use your existing WhatsApp service)
  const sendLowStockAlert = async (productName: string, count: number): Promise<void> => {
    try {
      // This calls your existing WhatsApp service
      const response = await fetch("http://192.168.68.110:5000/api/products/whatsapp/send-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: productName,
          currentStock: count,
          message: `⚠️ LOW STOCK ALERT\n\nProduct: ${productName}\nCurrent Stock: ${count}\nAction Required: Reorder immediately!`,
        }),
      });

      if (response.ok) {
        console.log(`WhatsApp alert sent for ${productName}`);
      }
    } catch (error) {
      console.error("WhatsApp Alert Error:", error);
    }
  };

  // Reset and take new photo
  const resetCapture = (): void => {
    setCapturedImage(null);
    setDetectionResults([]);
  };

  // If image is captured, show preview and analyze
  if (capturedImage) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={resetCapture} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Product Detection</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.previewContainer}>
          <Image source={{ uri: capturedImage.uri }} style={styles.previewImage} />

          {analyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text style={styles.analyzingText}>Analyzing image with AI...</Text>
            </View>
          ) : detectionResults.length > 0 ? (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Detection Results:</Text>
              {detectionResults.map((result, index) => (
                <View key={index} style={styles.resultCard}>
                  <View style={styles.resultInfo}>
                    <Text style={styles.resultName}>{result.name}</Text>
                    <Text style={styles.resultCount}>Count: {result.count}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    result.synced ? styles.successBadge : styles.errorBadge
                  ]}>
                    <Ionicons 
                      name={result.synced ? "checkmark-circle" : "close-circle"} 
                      size={16} 
                      color={result.synced ? "#10B981" : "#EF4444"} 
                    />
                    <Text style={[
                      styles.statusText,
                      result.synced ? styles.successText : styles.errorText
                    ]}>
                      {result.synced ? "Synced" : "Failed"}
                    </Text>
                  </View>
                  
                  {result.count <= 1 && (
                    <View style={styles.alertBadge}>
                      <Ionicons name="warning" size={14} color="#F59E0B" />
                      <Text style={styles.alertText}>Low Stock Alert Sent</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : null}

          {!analyzing && detectionResults.length === 0 && (
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
              <LinearGradient
                colors={['#3B82F6', '#2563EB']}
                style={styles.analyzeGradient}
              >
                <Ionicons name="scan" size={20} color="#FFF" />
                <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <View style={styles.cameraHeader}>
          <Text style={styles.cameraTitle}>AI Product Scanner</Text>
          <Text style={styles.cameraSubtitle}>Point camera at products</Text>
        </View>

        <View style={styles.cameraOverlay}>
          <View style={styles.scanFrame} />
        </View>

        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
            <Ionicons name="images" size={28} color="#FFF" />
            <Text style={styles.galleryText}>Gallery</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={{ width: 80 }} />
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8FAFC',
  },
  permissionText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginTop: 20,
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 10,
  },
  permissionButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 30,
  },
  permissionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  camera: { flex: 1 },
  cameraHeader: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  cameraTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  cameraSubtitle: {
    fontSize: 14,
    color: '#E2E8F0',
    marginTop: 5,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderWidth: 3,
    borderColor: '#3B82F6',
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingTop: 20,
  },
  galleryButton: {
    alignItems: 'center',
    width: 80,
  },
  galleryText: {
    color: '#FFF',
    fontSize: 12,
    marginTop: 5,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#3B82F6',
  },
  previewContainer: {
    padding: 20,
    backgroundColor: '#F8FAFC',
  },
  previewImage: {
    width: '100%',
    height: 400,
    borderRadius: 16,
    marginBottom: 20,
  },
  analyzingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#64748B',
  },
  analyzeButton: {
    marginTop: 10,
    borderRadius: 16,
    overflow: 'hidden',
  },
  analyzeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  analyzeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 15,
  },
  resultCard: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  resultInfo: {
    marginBottom: 10,
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    textTransform: 'capitalize',
  },
  resultCount: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 5,
  },
  successBadge: {
    backgroundColor: '#D1FAE5',
  },
  errorBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  successText: {
    color: '#10B981',
  },
  errorText: {
    color: '#EF4444',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 10,
    gap: 5,
  },
  alertText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '600',
  },
});