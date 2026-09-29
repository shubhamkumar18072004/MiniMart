const Product = require("../models/Product");

// 1. Add Product (Admin/Vendor)
exports.addProduct = async (req, res) => {
    try {
        //  req.body se vendorId bhi nikaala (Frontend se bhejni padegi)
        const { name, price, category, unitType, weight, quantity, expiryDate, vendorId } = req.body;

        // Image URL handle karne ka safe tareeka
        let imageUrl = "";
        if (req.file) {
            imageUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
        }

        const ut = String(unitType || "weight").trim().toLowerCase();
        const safeUnit = ["weight", "quantity", "packet"].includes(ut) ? ut : "weight";
        const qtyParsed =
            quantity === "" || quantity === undefined || quantity === null
                ? 0
                : Number(quantity);
        const qtyNum = Number.isFinite(qtyParsed) ? qtyParsed : 0;

        //  Naye fields ke saath vendorId ko bhi save kar rahe hain
        const newProduct = new Product({
            name,
            price,
            category,
            unitType: safeUnit,
            weight,
            quantity: qtyNum,
            expiryDate,
            imageUrl,
            vendor: vendorId
        });

        await newProduct.save();
        res.status(201).json({ success: true, message: "Product added!" });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 2. Get All Products (Ye sabke liye hai, jaise Customer Home page)
exports.getAllProducts = async (req, res) => {
    try {
        // Old products may not have isHidden/isBanned fields.
        // $ne true ensures visible products are returned even when fields are missing.
        const products = await Product.find({
            isHidden: { $ne: true },
            isBanned: { $ne: true }
        }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getVendorProducts = async (req, res) => {
    try {
        const { vendorId } = req.params;
        // Sirf wahi products dhundo jinka vendor match kare
        const products = await Product.find({ vendor: vendorId }).sort({ createdAt: -1 });
        res.json(products);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 3. Update Stock Status
exports.updateStock = async (req, res) => {
    try {
        const { inStock } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { inStock: Boolean(inStock) },
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found!" });
        }
        res.json({ success: true, message: "Stock Updated!", product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Vendor: inline weight / quantity / packet (sell unit) updates
exports.updateSellUnit = async (req, res) => {
    try {
        const { weight, quantity, unitType } = req.body;
        const updates = {};
        if (unitType !== undefined && unitType !== null && unitType !== "") {
            const ut = String(unitType).trim().toLowerCase();
            if (["weight", "quantity", "packet"].includes(ut)) {
                updates.unitType = ut;
            }
        }
        if (weight !== undefined) updates.weight = String(weight).trim();
        if (quantity !== undefined && quantity !== null && quantity !== "") {
            const n = Number(quantity);
            if (!Number.isNaN(n) && n >= 0) updates.quantity = n;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: "Nothing to update." });
        }

        const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found!" });
        }
        res.json({ success: true, message: "Unit updated!", product });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 4.  NEW FEATURE: Update Price, Discount & Deal
exports.updatePrice = async (req, res) => {
    try {
        const { price, discount, isDealOfTheDay } = req.body;

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                price: Number(price),
                discount: Number(discount),
                isDealOfTheDay: isDealOfTheDay
            },
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: "Product not found!" });
        }

        res.json({ success: true, message: "Price & Discount Updated!", product: updatedProduct });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 5. Nearby products by location text (basic nearest matching)
exports.getNearbyProducts = async (req, res) => {
    try {
        const location = String(req.query.location || "").trim().toLowerCase();
        if (!location) {
            return res.status(400).json({ success: false, message: "Location is required." });
        }

        const products = await Product.find({
            isHidden: { $ne: true },
            isBanned: { $ne: true }
        })
            .populate("vendor", "address shopName serviceableRadius")
            .sort({ createdAt: -1 })
            .lean();

        const stopWords = new Set([
            "road", "street", "near", "behind", "front", "sector", "colony", "block", "lane",
            "nagar", "area", "village", "city", "district", "state", "india", "pin", "pincode"
        ]);

        const locationTokens = location
            .split(/[\s,.-]+/)
            .map((t) => t.trim())
            .filter((t) => t.length > 2 && !stopWords.has(t));

        const scored = products.map((product) => {
            const vendorAddress = String(product?.vendor?.address || "").toLowerCase();
            const scoreFromTokens = locationTokens.reduce((acc, token) => {
                return acc + (vendorAddress.includes(token) ? 1 : 0);
            }, 0);
            const score = scoreFromTokens + (vendorAddress.includes(location) ? 2 : 0);
            return { ...product, _nearScore: score };
        });

        let nearby = scored
            .filter((p) => p._nearScore > 0)
            .sort((a, b) => b._nearScore - a._nearScore);

        // Fallback: if no strict matches, return latest products so UI doesn't go empty
        if (nearby.length === 0) {
            nearby = scored.slice(0, 40);
        }

        res.json({ success: true, products: nearby.map(({ _nearScore, ...rest }) => rest) });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};