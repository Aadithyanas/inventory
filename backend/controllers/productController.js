const Product = require("../models/Product");
const { sendStockAlert } = require("../services/whatsappService");

// 1. Get All Products
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 }); // Latest first
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. Get Single Product by ID
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }
        res.json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. Add New Product (Manual)
exports.addProduct = async (req, res) => {
    try {
        const { name, quantity, category, price, imageUrl, seasonalTrend } = req.body;
        
        // Check if product already exists
        const existingProduct = await Product.findOne({ 
            name: name.toLowerCase().trim() 
        });
        
        if (existingProduct) {
            return res.status(400).json({ 
                error: "Product already exists",
                product: existingProduct 
            });
        }

        const newProduct = new Product({
            name: name.toLowerCase().trim(),
            quantity: quantity || 0,
            category: category || "General",
            price: price || 0,
            imageUrl: imageUrl || "https://via.placeholder.com/150",
            seasonalTrend: seasonalTrend || { summer: "Normal", winter: "Normal", rainy: "Normal" }
        });
        
        await newProduct.save();
        res.status(201).json({ 
            success: true, 
            message: "Product added successfully",
            product: newProduct 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 4. Update Product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        
        // If name is being updated, format it
        if (updates.name) {
            updates.name = updates.name.toLowerCase().trim();
        }

        const product = await Product.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({ 
            success: true, 
            message: "Product updated successfully",
            product 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. Delete Product
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        
        const product = await Product.findByIdAndDelete(id);

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        res.json({ 
            success: true, 
            message: "Product deleted successfully",
            product 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. AI Sync Inventory (The core logic)
exports.syncInventory = async (req, res) => {
    const { name, detectedCount, season } = req.body;
    
    try {
        // Lowercase name prevents duplicates like "Matchbox" and "matchbox"
        const formattedName = name.toLowerCase().trim();

        const product = await Product.findOneAndUpdate(
            { name: formattedName }, 
            { 
                quantity: detectedCount,
                lastUpdated: new Date()
            },   
            { 
                new: true, 
                upsert: true,                // ✅ Auto-Add magic
                setDefaultsOnInsert: true    // Uses defaults from Schema
            }
        );

        // Summer threshold logic for 45% efficiency thesis
        const threshold = season === "Summer" ? 10 : 5;
        if (detectedCount < threshold) {
            await sendStockAlert(formattedName, detectedCount, season);
            console.log(`Alert: Low stock for ${formattedName}`);
        }

        res.json({ success: true, product });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 7. Bulk Update Stock Levels
exports.bulkUpdateStock = async (req, res) => {
    try {
        const { updates } = req.body; // Array of { id, quantity }
        
        const updatePromises = updates.map(({ id, quantity }) =>
            Product.findByIdAndUpdate(id, { quantity }, { new: true })
        );

        const updatedProducts = await Promise.all(updatePromises);

        res.json({ 
            success: true, 
            message: "Bulk update completed",
            products: updatedProducts 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 8. Get Low Stock Products
exports.getLowStockProducts = async (req, res) => {
    try {
        const threshold = req.query.threshold || 5;
        const products = await Product.find({ quantity: { $lt: threshold } });
        
        res.json({ 
            success: true, 
            count: products.length,
            products 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};