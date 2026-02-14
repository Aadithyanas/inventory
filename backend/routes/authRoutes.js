const express = require("express");
const router = express.Router();

const {login,signup} = require("../controllers/authController")

// Import Product Controllers 
const {
    getAllProducts,
    getProductById,
    addProduct,
    updateProduct,
    deleteProduct,
    syncInventory,
    bulkUpdateStock,
    getLowStockProducts
} = require("../controllers/productController");

// Import Settings Controller
const { 
    getSettings, 
    updateSettings, 
    validateGeminiKey,
    validateTwilioCredentials,  // NEW
    getGeminiKey,
    getTwilioCredentials        // NEW
} = require("../controllers/settingsController");

// ==================== AUTH ROUTES ====================
router.post("/signup", signup);
router.post("/login", login);


// ==================== SETTINGS ROUTES ====================
router.get("/settings", getSettings);
router.put("/settings", updateSettings);

// Gemini API Routes
router.post("/settings/validate-gemini", validateGeminiKey);
router.get("/settings/gemini-key", getGeminiKey);

// Twilio Routes (NEW)
router.post("/settings/validate-twilio", validateTwilioCredentials);
router.get("/settings/twilio-credentials", getTwilioCredentials);

// ==================== PRODUCT ROUTES ====================
router.get("/all", getAllProducts);
router.get("/low-stock", getLowStockProducts);

router.get("/:id", getProductById);  // KEEP THIS LAST

router.post("/add", addProduct);
router.post("/sync-inventory", syncInventory);
router.post("/bulk-update", bulkUpdateStock);

router.put("/:id", updateProduct);
router.patch("/:id", updateProduct);
router.delete("/:id", deleteProduct);

// ==================== WHATSAPP ROUTES ====================
// Only add if whatsappController exists
try {
  const { sendStockAlert } = require("../services/whatsappService");
  router.post("/whatsapp/send-alert", sendStockAlert);
} catch (err) {
  console.log("⚠️  WhatsApp controller not found, skipping route");
}

module.exports = router;