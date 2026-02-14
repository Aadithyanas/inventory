const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    lowercase: true  // Auto-convert to lowercase for consistency
  },
  
  category: { 
    type: String, 
    default: "General",
    enum: ["Electronics", "Clothing", "Food", "Beverages", "General", "Household", "Personal Care", "Stationery"]
  },
  
  quantity: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0  // Prevent negative stock
  },
  
  price: { 
    type: Number, 
    default: 0,
    min: 0
  },
  
  unit: { 
    type: String, 
    default: "pcs",
    enum: ["pcs", "kg", "ltr", "box", "pack"]
  },
  
  // Metadata for Predictive Analytics 
  seasonalTrend: {
    summer: { 
      type: String, 
      default: "Normal",
      enum: ["High", "Normal", "Low"]
    },
    winter: { 
      type: String, 
      default: "Normal",
      enum: ["High", "Normal", "Low"]
    },
    rainy: { 
      type: String, 
      default: "Normal",
      enum: ["High", "Normal", "Low"]
    }
  },
  
  imageUrl: { 
    type: String,
    default: "https://via.placeholder.com/150"
  },
  
  // AI/ML Metadata
  confidenceScore: { 
    type: Number,
    min: 0,
    max: 100  // Percentage from Edge Impulse/CNN detection
  },
  
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  
  // Additional fields for better inventory management
  reorderLevel: {
    type: Number,
    default: 5  // Trigger reorder when stock falls below this
  },
  
  supplier: {
    type: String,
    default: ""
  },
  
  barcode: {
    type: String,
    default: ""
  },
  
  description: {
    type: String,
    default: ""
  },
  
  isActive: {
    type: Boolean,
    default: true  // For soft delete functionality
  }
  
}, { 
  timestamps: true  // Automatically creates createdAt and updatedAt
});

// Index for faster queries
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ quantity: 1 });

// Virtual field for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'Out of Stock';
  if (this.quantity <= this.reorderLevel) return 'Low Stock';
  return 'In Stock';
});

// Method to check if reorder is needed
productSchema.methods.needsReorder = function() {
  return this.quantity <= this.reorderLevel;
};

// Static method to get low stock products
productSchema.statics.getLowStock = function(threshold = 5) {
  return this.find({ quantity: { $lte: threshold }, isActive: true });
};

// Pre-save middleware to update lastUpdated
productSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Pre-update middleware
productSchema.pre('findOneAndUpdate', function(next) {
  this.set({ lastUpdated: new Date() });
  next();
});

module.exports = mongoose.model("Product", productSchema);