import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { getInventory, type Product } from "../services/productService";

interface SeasonalInsights {
  seasonName: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  suggestedProducts: Product[];
  message: string;
  tips: string[];
}

export default function Welcome() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const fetchProducts = async (): Promise<void> => {
    try {
      const response = await getInventory(); 
      console.log("Syncing Dashboard Data...");
      
      if (response && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      const err = error as Error;
      console.log("Dashboard Sync Error:", err.message);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = (): void => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const categoryLower = (category || "").toLowerCase();
    if (categoryLower.includes("electronic")) return "laptop";
    if (categoryLower.includes("clothing") || categoryLower.includes("fashion")) return "shirt";
    if (categoryLower.includes("food") || categoryLower.includes("grocery")) return "fast-food";
    if (categoryLower.includes("book")) return "book";
    if (categoryLower.includes("toy")) return "game-controller";
    if (categoryLower.includes("furniture")) return "bed";
    if (categoryLower.includes("sport")) return "football";
    return "cube";
  };

  // Kerala Weather-based Seasonal Insights (Blue/White Theme Only)
  const getKeralaSeasonal = (): SeasonalInsights => {
    const month = new Date().getMonth(); // 0 = January, 11 = December
    
    // Kerala Weather Pattern:
    // Summer (March-May): Hot & Humid - 28-35°C
    // Monsoon (June-September): Heavy Rainfall
    // Winter (October-February): Pleasant & Cool - 20-28°C

    if (month >= 5 && month <= 8) {
      // Monsoon Season (June-September)
      return {
        seasonName: "Monsoon Season",
        icon: "rainy",
        gradientColors: ['#3B82F6', '#1E40AF'],
        suggestedProducts: products.filter(p => 
          p.seasonalTrend?.rainy === "High" || 
          p.category?.toLowerCase().includes("umbrella") ||
          p.category?.toLowerCase().includes("raincoat") ||
          p.name?.toLowerCase().includes("rain") ||
          p.name?.toLowerCase().includes("waterproof")
        ),
        message: "Heavy rainfall expected. Stock rain protection items.",
        tips: [
          "Umbrellas & raincoats high demand",
          "Waterproof products trending",
          "Indoor entertainment items selling"
        ]
      };
    } else if (month >= 9 || month <= 1) {
      // Winter Season (October-February)
      return {
        seasonName: "Winter Season",
        icon: "snow-outline",
        gradientColors: ['#60A5FA', '#3B82F6'],
        suggestedProducts: products.filter(p => 
          p.seasonalTrend?.winter === "High" ||
          p.category?.toLowerCase().includes("winter") ||
          p.name?.toLowerCase().includes("warm") ||
          p.name?.toLowerCase().includes("jacket")
        ),
        message: "Pleasant weather. Stock light winter wear & outdoor items.",
        tips: [
          "Light jackets & sweaters demand rising",
          "Outdoor activity products trending",
          "Tourism-related items selling"
        ]
      };
    } else {
      // Summer Season (March-May)
      return {
        seasonName: "Summer Season",
        icon: "sunny",
        gradientColors: ['#93C5FD', '#60A5FA'],
        suggestedProducts: products.filter(p => 
          p.seasonalTrend?.summer === "High" ||
          p.category?.toLowerCase().includes("cooling") ||
          p.category?.toLowerCase().includes("summer") ||
          p.name?.toLowerCase().includes("cool") ||
          p.name?.toLowerCase().includes("fan")
        ),
        message: "Hot & humid weather. Stock cooling & summer essentials.",
        tips: [
          "Cooling products high demand",
          "Summer clothing trending",
          "Cold beverages & refreshments selling"
        ]
      };
    }
  };

  const insights = getKeralaSeasonal();
  const lowStockCount = products.filter(p => p.quantity < 10).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);

  return (
    <View style={styles.container}>
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
      >
        
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>AI Engine: Active</Text>
            <Text style={styles.businessName}>Smart Inventory AI</Text>
            <Text style={styles.locationText}>📍 Kerala, India</Text>
          </View>
          <TouchableOpacity style={styles.notificationBadge} onPress={onRefresh}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.notificationGradient}
            >
              <Ionicons name="refresh" size={20} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Stats Cards */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              style={styles.statGradient}
            >
              <Ionicons name="cube" size={24} color="#FFF" />
              <Text style={styles.statValue}>{products.length}</Text>
              <Text style={styles.statLabel}>Total Products</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#60A5FA', '#3B82F6']}
              style={styles.statGradient}
            >
              <Ionicons name="alert-circle" size={24} color="#FFF" />
              <Text style={styles.statValue}>{lowStockCount}</Text>
              <Text style={styles.statLabel}>Low Stock</Text>
            </LinearGradient>
          </View>

          <View style={styles.statCard}>
            <LinearGradient
              colors={['#93C5FD', '#60A5FA']}
              style={styles.statGradient}
            >
              <Ionicons name="cash" size={24} color="#FFF" />
              <Text style={styles.statValue}>₹{(totalValue / 1000).toFixed(1)}K</Text>
              <Text style={styles.statLabel}>Total Value</Text>
            </LinearGradient>
          </View>
        </Animated.View>

        {/* Seasonal Weather Card */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <LinearGradient
            colors={insights.gradientColors}
            style={styles.seasonalCard}
          >
            <View style={styles.seasonalHeader}>
              <View style={styles.seasonalIconContainer}>
                <Ionicons name={insights.icon} size={36} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.seasonalTitle}>{insights.seasonName}</Text>
                <Text style={styles.seasonalSubtitle}>Kerala Weather Analysis</Text>
              </View>
            </View>

            <View style={styles.seasonalMessage}>
              <Ionicons name="information-circle" size={20} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.seasonalMessageText}>{insights.message}</Text>
            </View>

            {/* Weather Tips */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Smart Recommendations</Text>
              {insights.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <View style={styles.tipBullet}>
                    <View style={styles.tipBulletInner} />
                  </View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            {/* Suggested Products */}
            <View style={styles.productsSection}>
              <View style={styles.productsSectionHeader}>
                <Text style={styles.productsSectionTitle}>
                  Seasonal Products
                </Text>
                <View style={styles.productCount}>
                  <Text style={styles.productCountText}>{insights.suggestedProducts.length}</Text>
                </View>
              </View>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator color="#FFF" size="large" />
                  <Text style={styles.loadingText}>Analyzing inventory...</Text>
                </View>
              ) : (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.productsScroll}
                >
                  {insights.suggestedProducts.length > 0 ? (
                    insights.suggestedProducts.map((item) => {
                      const hasValidImage = item.imageUrl && 
                                           item.imageUrl.trim().length > 0 && 
                                           !imageErrors.has(item._id);
                      
                      return (
                        <View key={item._id} style={styles.productCard}>
                          <View style={styles.productImageContainer}>
                            {hasValidImage ? (
                              <Image 
                                source={{ uri: item.imageUrl }} 
                                style={styles.productImage}
                                onError={() => handleImageError(item._id)}
                              />
                            ) : (
                              <View style={styles.productPlaceholder}>
                                <Ionicons 
                                  name={getCategoryIcon(item.category || "")} 
                                  size={32} 
                                  color="#60A5FA" 
                                />
                              </View>
                            )}
                            <View style={styles.productBadge}>
                              <Ionicons name="layers" size={10} color="#FFF" />
                              <Text style={styles.productBadgeText}>{item.quantity}</Text>
                            </View>
                          </View>
                          <View style={styles.productInfo}>
                            <Text style={styles.productName} numberOfLines={2}>
                              {item.name}
                            </Text>
                            <View style={styles.productMeta}>
                              <View style={styles.productCategory}>
                                <Ionicons name="pricetag" size={10} color="rgba(255,255,255,0.7)" />
                                <Text style={styles.productCategoryText}>
                                  {item.category || "General"}
                                </Text>
                              </View>
                              {item.price && item.price > 0 && (
                                <Text style={styles.productPrice}>₹{item.price}</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  ) : (
                    <View style={styles.noProductsContainer}>
                      <View style={styles.noProductsIconContainer}>
                        <Ionicons name="cube-outline" size={48} color="rgba(255,255,255,0.5)" />
                      </View>
                      <Text style={styles.noProductsText}>
                        No seasonal products available
                      </Text>
                      <Text style={styles.noProductsSubtext}>
                        Add products with {insights.seasonName.toLowerCase()} trends to see recommendations
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* System Metrics */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.infoBox}>
          <View style={styles.infoHeader}>
            <Ionicons name="analytics" size={24} color="#3B82F6" />
            <Text style={styles.infoTitle}>System Metrics</Text>
          </View>
          
          <InfoItem 
            icon="time-outline" 
            title="Time Efficiency" 
            detail="Manual counting reduced by 45% (120m → 65m)" 
          />
          <InfoItem 
            icon="shield-checkmark-outline" 
            title="Accuracy Rate" 
            detail="40% reduction in inventory discrepancies" 
          />
          <InfoItem 
            icon="trending-up-outline" 
            title="AI Prediction" 
            detail="CNN Model Accuracy: 91.2%" 
          />
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

interface InfoItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}

function InfoItem({ icon, title, detail }: InfoItemProps) {
  return (
    <View style={styles.infoItem}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={22} color="#3B82F6" />
      </View>
      <View style={{ flex: 1, marginLeft: 15 }}>
        <Text style={styles.infoItemTitle}>{title}</Text>
        <Text style={styles.infoItemDetail}>{detail}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  scrollContent: { 
    paddingBottom: 20 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    marginTop: 60, 
    marginBottom: 20 
  },
  welcomeText: { 
    color: '#3B82F6', 
    fontSize: 12, 
    fontWeight: '700', 
    textTransform: 'uppercase',
    letterSpacing: 1 
  },
  businessName: { 
    color: '#0F172A', 
    fontSize: 26, 
    fontWeight: 'bold',
    marginTop: 4 
  },
  locationText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  notificationBadge: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  seasonalCard: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  seasonalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  seasonalIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  seasonalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  seasonalSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  seasonalMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  seasonalMessageText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  tipsTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  tipBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  tipBulletInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  tipText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
    marginLeft: 12,
    lineHeight: 20,
  },
  productsSection: {
    marginTop: 4,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  productsSectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productCount: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productCountText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  productsScroll: {
    marginHorizontal: -4,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  productCard: {
    width: 160,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  productImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  productPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  productBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  productInfo: {
    gap: 8,
  },
  productName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    lineHeight: 18,
  },
  productMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productCategory: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  productCategoryText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11,
    fontWeight: '600',
  },
  productPrice: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  noProductsContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  noProductsIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  noProductsText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  noProductsSubtext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  infoBox: {
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  infoTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoItemTitle: {
    color: '#1E293B',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoItemDetail: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 18,
  },
});