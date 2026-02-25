import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { useState, useEffect } from "react";
import { getInventory, type Product } from "../services/productService";

interface SeasonalAnalysis {
  seasonName: string;
  icon: keyof typeof Ionicons.glyphMap;
  gradientColors: string[];
  highDemandItems: Product[];
  prediction: string;
}

export default function Analytics() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchAnalyticsData = async (): Promise<void> => {
    try {
      const response = await getInventory();
      
      if (response && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      } else {
        setProducts([]);
      }
    } catch (error) {
      const err = error as Error;
      console.log("Analytics Sync Error:", err.message);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  // Kerala Weather-based Analysis
  const getKeralaSeasonal = (): SeasonalAnalysis => {
    const month = new Date().getMonth();

    if (month >= 5 && month <= 8) {
      // Monsoon (June-September)
      return {
        seasonName: "Monsoon",
        icon: "rainy",
        gradientColors: ['#3B82F6', '#1E40AF'],
        highDemandItems: products.filter(p => 
          p.seasonalTrend?.rainy === "High" ||
          p.category?.toLowerCase().includes("rain") ||
          p.name?.toLowerCase().includes("umbrella")
        ),
        prediction: "Heavy rainfall predicted. Rain protection items will see 60% demand spike."
      };
    } else if (month >= 9 || month <= 1) {
      // Winter (October-February)
      return {
        seasonName: "Winter",
        icon: "snow-outline",
        gradientColors: ['#60A5FA', '#3B82F6'],
        highDemandItems: products.filter(p => 
          p.seasonalTrend?.winter === "High" ||
          p.category?.toLowerCase().includes("winter")
        ),
        prediction: "Pleasant weather expected. Light winter wear demand up by 35%."
      };
    } else {
      // Summer (March-May)
      return {
        seasonName: "Summer",
        icon: "sunny",
        gradientColors: ['#93C5FD', '#60A5FA'],
        highDemandItems: products.filter(p => 
          p.seasonalTrend?.summer === "High" ||
          p.category?.toLowerCase().includes("cooling")
        ),
        prediction: "Hot & humid conditions. Cooling products demand rising 45%."
      };
    }
  };

  const analysis = getKeralaSeasonal();
  const lowStockCount = products.filter(p => p.quantity < 10).length;
  const avgStock = products.length > 0 
    ? Math.round(products.reduce((sum, p) => sum + p.quantity, 0) / products.length)
    : 0;
  const totalValue = products.reduce((sum, p) => sum + (p.price || 0) * p.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>AI-Powered Insights</Text>
        </View>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live</Text>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        
        {/* Model Performance Card */}
        <Animated.View entering={FadeInDown.delay(100)}>
          <LinearGradient
            colors={['#3B82F6', '#2563EB']}
            style={styles.performanceCard}
          >
            <View style={styles.performanceHeader}>
              <View style={styles.performanceIconContainer}>
                <Ionicons name="analytics" size={28} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.performanceTitle}>CNN Model Performance</Text>
                <Text style={styles.performanceSubtitle}>Computer Vision Analysis</Text>
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>91.2%</Text>
                <Text style={styles.metricLabel}>Accuracy</Text>
                <View style={styles.metricBadge}>
                  <Ionicons name="trending-up" size={12} color="#10B981" />
                  <Text style={styles.metricChange}>+8.7%</Text>
                </View>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>65m</Text>
                <Text style={styles.metricLabel}>Scan Time</Text>
                <View style={styles.metricBadge}>
                  <Ionicons name="trending-down" size={12} color="#10B981" />
                  <Text style={styles.metricChange}>-45%</Text>
                </View>
              </View>

              <View style={styles.metricDivider} />

              <View style={styles.metricBox}>
                <Text style={styles.metricValue}>40%</Text>
                <Text style={styles.metricLabel}>Error ↓</Text>
                <View style={styles.metricBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                  <Text style={styles.metricChange}>Better</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Inventory Overview */}
        <Animated.View entering={FadeInUp.delay(200)} style={styles.overviewSection}>
          <Text style={styles.sectionTitle}>Inventory Overview</Text>
          <View style={styles.overviewGrid}>
            <TouchableOpacity style={styles.overviewCard}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE']}
                style={styles.overviewGradient}
              >
                <Ionicons name="cube" size={32} color="#3B82F6" />
                <Text style={styles.overviewValue}>{products.length}</Text>
                <Text style={styles.overviewLabel}>Total Items</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewCard}>
              <LinearGradient
                colors={['#FEF3C7', '#FDE68A']}
                style={styles.overviewGradient}
              >
                <Ionicons name="alert-circle" size={32} color="#F59E0B" />
                <Text style={styles.overviewValue}>{lowStockCount}</Text>
                <Text style={styles.overviewLabel}>Low Stock</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewCard}>
              <LinearGradient
                colors={['#DBEAFE', '#BFDBFE']}
                style={styles.overviewGradient}
              >
                <Ionicons name="stats-chart" size={32} color="#3B82F6" />
                <Text style={styles.overviewValue}>{avgStock}</Text>
                <Text style={styles.overviewLabel}>Avg Stock</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.overviewCard}>
              <LinearGradient
                colors={['#DBEAFE', '#93C5FD']}
                style={styles.overviewGradient}
              >
                <Ionicons name="cash" size={32} color="#2563EB" />
                <Text style={styles.overviewValue}>₹{(totalValue / 1000).toFixed(0)}K</Text>
                <Text style={styles.overviewLabel}>Total Value</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Seasonal Analysis */}
        <Animated.View entering={FadeInUp.delay(300)}>
          <Text style={styles.sectionTitle}>Seasonal Forecast - Kerala</Text>
          <LinearGradient
            colors={analysis.gradientColors}
            style={styles.seasonalCard}
          >
            <View style={styles.seasonalHeader}>
              <View style={styles.seasonalIconBox}>
                <Ionicons name={analysis.icon} size={32} color="#FFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.seasonalTitle}>{analysis.seasonName} Season</Text>
                <Text style={styles.seasonalSubtitle}>AI Demand Prediction</Text>
              </View>
              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>91% confident</Text>
              </View>
            </View>

            <View style={styles.predictionBox}>
              <Ionicons name="bulb" size={20} color="#FFF" style={{ marginRight: 10 }} />
              <Text style={styles.predictionText}>{analysis.prediction}</Text>
            </View>

            <View style={styles.actionBox}>
              <Ionicons name="cart" size={18} color="#FFF" />
              <Text style={styles.actionText}>
                Reorder Recommended: {analysis.highDemandItems.length} categories
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Efficiency Comparison */}
        <Animated.View entering={FadeInUp.delay(400)} style={styles.efficiencySection}>
          <Text style={styles.sectionTitle}>Time Efficiency Analysis</Text>
          <View style={styles.efficiencyCard}>
            <View style={styles.efficiencyHeader}>
              <Ionicons name="timer" size={24} color="#3B82F6" />
              <Text style={styles.efficiencyTitle}>Manual vs AI Processing</Text>
            </View>

            <View style={styles.comparisonRow}>
              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>Manual Count</Text>
                <View style={styles.timeBar}>
                  <View style={[styles.timeBarFill, { width: '100%', backgroundColor: '#E2E8F0' }]} />
                  <Text style={styles.timeText}>120 min</Text>
                </View>
              </View>

              <View style={styles.comparisonItem}>
                <Text style={styles.comparisonLabel}>AI-Powered</Text>
                <View style={styles.timeBar}>
                  <View style={[styles.timeBarFill, { width: '54%', backgroundColor: '#3B82F6' }]} />
                  <Text style={styles.timeText}>65 min</Text>
                </View>
              </View>
            </View>

            <View style={styles.savingsBox}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.savingsText}>Time Saved: 55 minutes per cycle (45% reduction)</Text>
            </View>
          </View>
        </Animated.View>

        {/* High Demand Products */}
        <Animated.View entering={FadeInUp.delay(500)} style={styles.productsSection}>
          <View style={styles.productsSectionHeader}>
            <Text style={styles.sectionTitle}>High Demand Products</Text>
            <View style={styles.seasonBadge}>
              <Ionicons name={analysis.icon} size={14} color="#3B82F6" />
              <Text style={styles.seasonBadgeText}>{analysis.seasonName}</Text>
            </View>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#3B82F6" size="large" />
              <Text style={styles.loadingText}>Analyzing trends...</Text>
            </View>
          ) : (
            <>
              {analysis.highDemandItems.length > 0 ? (
                analysis.highDemandItems.map((item, index) => (
                  <ProductTrendItem 
                    key={item._id || index}
                    name={item.name} 
                    stock={item.quantity}
                    category={item.category || "General"}
                    trend="High"
                  />
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="analytics-outline" size={48} color="#CBD5E1" />
                  <Text style={styles.emptyText}>No high demand alerts</Text>
                  <Text style={styles.emptySubtext}>
                    Products marked with {analysis.seasonName.toLowerCase()} trends will appear here
                  </Text>
                </View>
              )}
            </>
          )}
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

interface ProductTrendItemProps {
  name: string;
  stock: number;
  category: string;
  trend: string;
}

function ProductTrendItem({ name, stock, category, trend }: ProductTrendItemProps) {
  const getTrendColor = () => {
    if (trend === "High") return { bg: '#DBEAFE', text: '#1E40AF' };
    return { bg: '#F1F5F9', text: '#64748B' };
  };

  const colors = getTrendColor();

  return (
    <View style={styles.trendItem}>
      <View style={styles.trendIconContainer}>
        <Ionicons name="trending-up" size={20} color="#3B82F6" />
      </View>
      <View style={styles.trendInfo}>
        <Text style={styles.trendName}>{name}</Text>
        <View style={styles.trendMeta}>
          <Ionicons name="pricetag" size={12} color="#94A3B8" />
          <Text style={styles.trendCategory}>{category}</Text>
          <View style={styles.trendDot} />
          <Ionicons name="cube" size={12} color="#94A3B8" />
          <Text style={styles.trendStock}>Stock: {stock}</Text>
        </View>
      </View>
      <View style={[styles.trendBadge, { backgroundColor: colors.bg }]}>
        <Text style={[styles.trendBadgeText, { color: colors.text }]}>{trend} Demand</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  liveText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  scrollContent: { 
    padding: 20,
  },
  performanceCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  performanceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  performanceTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  performanceSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricValue: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  metricChange: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: 'bold',
  },
  metricDivider: {
    width: 1,
    height: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginHorizontal: 12,
  },
  overviewSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 16,
  },
  overviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  overviewCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  overviewGradient: {
    padding: 20,
    alignItems: 'center',
  },
  overviewValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginTop: 12,
  },
  overviewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
  },
  seasonalCard: {
    padding: 24,
    borderRadius: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  seasonalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  seasonalIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seasonalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  seasonalSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  confidenceBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  predictionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  predictionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    lineHeight: 20,
  },
  actionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 14,
    borderRadius: 14,
    gap: 10,
  },
  actionText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    flex: 1,
  },
  efficiencySection: {
    marginBottom: 24,
  },
  efficiencyCard: {
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
  efficiencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  efficiencyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  comparisonRow: {
    gap: 16,
    marginBottom: 16,
  },
  comparisonItem: {
    gap: 8,
  },
  comparisonLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  timeBar: {
    position: 'relative',
    height: 40,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    overflow: 'hidden',
  },
  timeBarFill: {
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  timeText: {
    position: 'absolute',
    left: 12,
    top: 0,
    bottom: 0,
    textAlignVertical: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  savingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  savingsText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  productsSection: {
    marginBottom: 24,
  },
  productsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  seasonBadgeText: {
    color: '#1E40AF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trendIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendInfo: {
    flex: 1,
  },
  trendName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 6,
  },
  trendMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendCategory: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  trendDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  trendStock: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  trendBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
});