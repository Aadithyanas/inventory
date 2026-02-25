import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ActivityIndicator, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { getInventory, addProduct, updateProduct, deleteProduct, type Product } from "../services/productService";
import { LinearGradient } from "expo-linear-gradient";

interface FormData {
  name: string;
  quantity: string;
  category: string;
  price: string;
  imageUrl: string;
}

const CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food",
  "Beverages",
  "General",
  "Household",
  "Personal Care",
  "Stationery"
];

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const [imageLoading, setImageLoading] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    quantity: "",
    category: "General",
    price: "",
    imageUrl: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (): Promise<void> => {
    try {
      const response = await getInventory();
      if (response && response.data) {
        setProducts(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error("Product fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = (): void => {
    setEditMode(false);
    setFormData({
      name: "",
      quantity: "",
      category: "General",
      price: "",
      imageUrl: "",
    });
    setModalVisible(true);
  };

  const handleEditProduct = (product: Product): void => {
    setEditMode(true);
    setCurrentProduct(product);
    setFormData({
      name: product.name,
      quantity: product.quantity.toString(),
      category: product.category || "General",
      price: product.price?.toString() || "",
      imageUrl: product.imageUrl || "",
    });
    setModalVisible(true);
  };

  const handleCategorySelect = (category: string): void => {
    setFormData({ ...formData, category });
    setCategoryModalVisible(false);
  };

  const handleSubmit = async (): Promise<void> => {
    try {
      if (!formData.name || !formData.quantity) {
        Alert.alert("Error", "Name and quantity are required");
        return;
      }

      const productData = {
        name: formData.name,
        quantity: parseInt(formData.quantity),
        category: formData.category,
        price: parseFloat(formData.price) || 0,
        imageUrl: formData.imageUrl || "",
      };

      if (editMode && currentProduct) {
        await updateProduct(currentProduct._id, productData);
        Alert.alert("Success", "Product updated successfully");
      } else {
        await addProduct(productData);
        Alert.alert("Success", "Product added successfully");
      }

      setModalVisible(false);
      fetchData();
    } catch (error) {
      const err = error as Error;
      Alert.alert("Error", err.message || "Failed to save product");
    }
  };

  const handleDelete = (product: Product): void => {
    Alert.alert(
      "Delete Product",
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(product._id);
              Alert.alert("Success", "Product deleted successfully");
              fetchData();
            } catch (error) {
              Alert.alert("Error", "Failed to delete product");
            }
          },
        },
      ]
    );
  };

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set(prev).add(productId));
    setImageLoading(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const handleImageLoadStart = (productId: string) => {
    setImageLoading(prev => new Set(prev).add(productId));
  };

  const handleImageLoadEnd = (productId: string) => {
    setImageLoading(prev => {
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const categoryLower = (category || "").toLowerCase();
    if (categoryLower.includes("electronic")) return "laptop";
    if (categoryLower.includes("clothing")) return "shirt";
    if (categoryLower.includes("food")) return "fast-food";
    if (categoryLower.includes("beverage")) return "cafe";
    if (categoryLower.includes("household")) return "home";
    if (categoryLower.includes("personal")) return "person";
    if (categoryLower.includes("stationery")) return "pencil";
    return "cube";
  };

  const isValidImageUrl = (url: string): boolean => {
    if (!url || url.trim().length === 0) return false;
    return url.startsWith('data:image/') || url.startsWith('http://') || url.startsWith('https://');
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.category || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading products...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#2563EB']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerTitle}>Products</Text>
            <Text style={styles.headerSubtitle}>{products.length} items</Text>
          </View>
          <TouchableOpacity style={styles.addButtonFloating} onPress={handleAddProduct}>
            <LinearGradient
              colors={['#FFFFFF', '#F8FAFC']}
              style={styles.addButtonGradient}
            >
              <Ionicons name="add" size={28} color="#3B82F6" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748B" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Product Grid */}
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="cube-outline" size={64} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyText}>
              {searchQuery ? "No products found" : "No products yet"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? "Try a different search term" : "Add your first product to get started"}
            </Text>
            {!searchQuery && (
              <TouchableOpacity style={styles.emptyButton} onPress={handleAddProduct}>
                <Text style={styles.emptyButtonText}>Add First Product</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.productGrid}>
            {filteredProducts.map((product) => {
              const hasValidImageUrl = isValidImageUrl(product.imageUrl || "");
              const imageHasError = imageErrors.has(product._id);
              const isImageCurrentlyLoading = imageLoading.has(product._id);
              const shouldShowImage = hasValidImageUrl && !imageHasError;
              
              return (
                <View key={product._id} style={styles.gridItem}>
                  <TouchableOpacity 
                    style={styles.productCard}
                    activeOpacity={0.7}
                  >
                    {/* Product Image */}
                    <View style={styles.imageWrapper}>
                      {shouldShowImage ? (
                        <>
                          <Image 
                            source={{ uri: product.imageUrl }}
                            style={styles.productImage}
                            onLoadStart={() => handleImageLoadStart(product._id)}
                            onLoadEnd={() => handleImageLoadEnd(product._id)}
                            onError={() => handleImageError(product._id)}
                            resizeMode="contain"
                          />
                          {isImageCurrentlyLoading && (
                            <View style={styles.imageLoadingOverlay}>
                              <ActivityIndicator size="small" color="#3B82F6" />
                            </View>
                          )}
                        </>
                      ) : (
                        <View style={styles.placeholderContainer}>
                          <LinearGradient
                            colors={['#EFF6FF', '#DBEAFE']}
                            style={styles.placeholderGradient}
                          >
                            <Ionicons 
                              name={getCategoryIcon(product.category || "")} 
                              size={40} 
                              color="#3B82F6" 
                            />
                          </LinearGradient>
                        </View>
                      )}
                      
                      {/* Stock Badge */}
                      <View style={styles.stockBadge}>
                        <Text style={styles.stockBadgeText}>{product.quantity}</Text>
                      </View>
                    </View>

                    {/* Product Info */}
                    <View style={styles.productInfo}>
                      <Text style={styles.productName} numberOfLines={2}>
                        {product.name}
                      </Text>
                      
                      <View style={styles.categoryBadge}>
                        <Text style={styles.categoryBadgeText}>{product.category || "General"}</Text>
                      </View>
                      
                      {product.price && product.price > 0 && (
                        <View style={styles.priceRow}>
                          <Text style={styles.priceSymbol}>₹</Text>
                          <Text style={styles.priceValue}>{product.price}</Text>
                        </View>
                      )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => handleEditProduct(product)}
                      >
                        <Ionicons name="pencil" size={18} color="#3B82F6" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.iconButton}
                        onPress={() => handleDelete(product)}
                      >
                        <Ionicons name="trash" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <LinearGradient
              colors={editMode ? ['#3B82F6', '#2563EB'] : ['#10B981', '#059669']}
              style={styles.modalHeaderGradient}
            >
              <View style={styles.modalHeader}>
                <View style={styles.modalHeaderLeft}>
                  <View style={styles.modalIconContainer}>
                    <Ionicons 
                      name={editMode ? "pencil" : "add-circle"} 
                      size={24} 
                      color="#FFF" 
                    />
                  </View>
                  <View>
                    <Text style={styles.modalTitle}>
                      {editMode ? "Edit Product" : "Add New Product"}
                    </Text>
                    <Text style={styles.modalSubtitle}>
                      {editMode ? "Update product details" : "Fill in product information"}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.closeButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Ionicons name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.formScroll}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons name="cube" size={14} color="#3B82F6" /> Product Name *
                </Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  placeholder="e.g., Wireless Headphones"
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>
                    <Ionicons name="layers" size={14} color="#3B82F6" /> Quantity *
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.quantity}
                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                    placeholder="0"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>
                    <Ionicons name="cash" size={14} color="#10B981" /> Price
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.price}
                    onChangeText={(text) => setFormData({ ...formData, price: text })}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons name="pricetag" size={14} color="#8B5CF6" /> Category *
                </Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setCategoryModalVisible(true)}
                >
                  <Text style={styles.dropdownButtonText}>{formData.category}</Text>
                  <Ionicons name="chevron-down" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  <Ionicons name="image" size={14} color="#F59E0B" /> Image URL (Optional)
                </Text>
                <TextInput
                  style={[styles.input, { minHeight: 80 }]}
                  value={formData.imageUrl}
                  onChangeText={(text) => setFormData({ ...formData, imageUrl: text })}
                  placeholder="https://example.com/image.jpg"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline
                  numberOfLines={3}
                />
                <Text style={styles.helpText}>
                  📷 Camera scanner images supported
                </Text>
              </View>

              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleSubmit}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={editMode ? ['#3B82F6', '#2563EB'] : ['#10B981', '#059669']}
                  style={styles.submitGradient}
                >
                  <Ionicons 
                    name={editMode ? "checkmark-circle" : "add-circle"} 
                    size={20} 
                    color="#FFF" 
                  />
                  <Text style={styles.submitButtonText}>
                    {editMode ? "Update Product" : "Add Product"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Selection Modal */}
      <Modal
        visible={categoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.categoryModalContent}>
            <View style={styles.categoryModalHeader}>
              <Text style={styles.categoryModalTitle}>Select Category</Text>
              <TouchableOpacity onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.categoryList}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryItem,
                    formData.category === category && styles.categoryItemSelected
                  ]}
                  onPress={() => handleCategorySelect(category)}
                >
                  <View style={styles.categoryItemLeft}>
                    <Ionicons 
                      name={getCategoryIcon(category)} 
                      size={24} 
                      color={formData.category === category ? "#3B82F6" : "#64748B"} 
                    />
                    <Text style={[
                      styles.categoryItemText,
                      formData.category === category && styles.categoryItemTextSelected
                    ]}>
                      {category}
                    </Text>
                  </View>
                  {formData.category === category && (
                    <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8FAFC" 
  },
  centerContent: { 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: { 
    marginTop: 10, 
    color: "#64748B", 
    fontSize: 14 
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: "bold", 
    color: "#FFF",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#E0E7FF",
    marginTop: 4,
  },
  addButtonFloating: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
  },
  scrollView: { 
    flex: 1,
  },
  scrollContent: {
    padding: 12,
  },
  productGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  gridItem: {
    width: "48%",
  },
  productCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
    backgroundColor: "#FAFAFA",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
  },
  placeholderGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  stockBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(59, 130, 246, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stockBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  productInfo: { 
    padding: 12,
  },
  productName: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#0F172A", 
    marginBottom: 6,
    lineHeight: 18,
    minHeight: 36,
  },
  categoryBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    color: "#64748B",
    fontWeight: "600",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  priceSymbol: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "700",
    marginRight: 2,
  },
  priceValue: {
    fontSize: 18,
    color: "#10B981",
    fontWeight: "700",
  },
  actionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  iconButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: { 
    alignItems: "center", 
    marginTop: 80,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyText: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#475569", 
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtext: { 
    fontSize: 14, 
    color: "#94A3B8", 
    marginTop: 8,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: "#3B82F6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: "92%",
  },
  modalHeaderGradient: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  modalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#FFF",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  formGroup: { 
    marginBottom: 20,
  },
  formRow: {
    flexDirection: "row",
    marginBottom: 0,
  },
  label: { 
    fontSize: 14, 
    fontWeight: "600", 
    color: "#475569", 
    marginBottom: 10,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#0F172A",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
  },
  helpText: {
    fontSize: 12,
    color: "#94A3B8",
    marginTop: 6,
  },
  submitButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginTop: 8,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: { 
    color: "#FFF", 
    fontSize: 17, 
    fontWeight: "700",
  },
  categoryModalContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "70%",
    paddingBottom: 20,
  },
  categoryModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  categoryModalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0F172A",
  },
  categoryList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    backgroundColor: "#F8FAFC",
  },
  categoryItemSelected: {
    backgroundColor: "#EFF6FF",
    borderWidth: 2,
    borderColor: "#3B82F6",
  },
  categoryItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  categoryItemText: {
    fontSize: 16,
    color: "#64748B",
    fontWeight: "500",
  },
  categoryItemTextSelected: {
    color: "#3B82F6",
    fontWeight: "700",
  },
});