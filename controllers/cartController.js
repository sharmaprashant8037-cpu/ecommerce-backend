
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ==========================================
// Get My Cart
// ==========================================

const getCart = async (req, res) => {
    try {
        let cart = await Cart.findOne({
            user: req.user.id,
        }).populate(
            "items.product",
            "name price discountPrice images stock category brand"
        );

        // Create empty cart if it doesn't exist
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [],
            });
        }

        res.status(200).json({
            success: true,
            cart,
        });
    } catch (error) {
        console.error("Get Cart Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Add Product To Cart
// ==========================================

const addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;

        if (!productId) {
            return res.status(400).json({
                success: false,
                message: "Product ID is required",
            });
        }

        const productQuantity = Number(quantity);

        if (
            !Number.isInteger(productQuantity) ||
            productQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1",
            });
        }

        // Find product
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Check stock
        if (product.stock < productQuantity) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items are available`,
            });
        }

        // Find user's cart
        let cart = await Cart.findOne({
            user: req.user.id,
        });

        // Create cart if not exists
        if (!cart) {
            cart = await Cart.create({
                user: req.user.id,
                items: [],
            });
        }

        // Check if product already exists
        const existingItem = cart.items.find(
            (item) =>
                item.product.toString() === productId.toString()
        );

        if (existingItem) {
            const newQuantity =
                existingItem.quantity + productQuantity;

            if (newQuantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    message: `Only ${product.stock} items are available`,
                });
            }

            existingItem.quantity = newQuantity;
        } else {
            cart.items.push({
                product: productId,
                quantity: productQuantity,
            });
        }

        await cart.save();

        // Populate product information
        await cart.populate(
            "items.product",
            "name price discountPrice images stock category brand"
        );

        res.status(200).json({
            success: true,
            message: "Product added to cart",
            cart,
        });
    } catch (error) {
        console.error("Add To Cart Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Update Cart Item Quantity
// ==========================================

const updateCartQuantity = async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;

        const newQuantity = Number(quantity);

        if (
            !Number.isInteger(newQuantity) ||
            newQuantity < 1
        ) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be at least 1",
            });
        }

        // Check product
        const product = await Product.findById(productId);

        if (!product || !product.isActive) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        // Check stock
        if (newQuantity > product.stock) {
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items are available`,
            });
        }

        const cart = await Cart.findOne({
            user: req.user.id,
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        const cartItem = cart.items.find(
            (item) =>
                item.product.toString() === productId.toString()
        );

        if (!cartItem) {
            return res.status(404).json({
                success: false,
                message: "Product is not in your cart",
            });
        }

        cartItem.quantity = newQuantity;

        await cart.save();

        await cart.populate(
            "items.product",
            "name price discountPrice images stock category brand"
        );

        res.status(200).json({
            success: true,
            message: "Cart quantity updated",
            cart,
        });
    } catch (error) {
        console.error(
            "Update Cart Quantity Error:",
            error
        );

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID",
            });
        }

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Remove Product From Cart
// ==========================================

const removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;

        const cart = await Cart.findOne({
            user: req.user.id,
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        const itemExists = cart.items.some(
            (item) =>
                item.product.toString() === productId.toString()
        );

        if (!itemExists) {
            return res.status(404).json({
                success: false,
                message: "Product is not in your cart",
            });
        }

        cart.items = cart.items.filter(
            (item) =>
                item.product.toString() !== productId.toString()
        );

        await cart.save();

        await cart.populate(
            "items.product",
            "name price discountPrice images stock category brand"
        );

        res.status(200).json({
            success: true,
            message: "Product removed from cart",
            cart,
        });
    } catch (error) {
        console.error("Remove Cart Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Clear Cart
// ==========================================

const clearCart = async (req, res) => {
    try {
        const cart = await Cart.findOne({
            user: req.user.id,
        });

        if (!cart) {
            return res.status(404).json({
                success: false,
                message: "Cart not found",
            });
        }

        cart.items = [];

        await cart.save();

        res.status(200).json({
            success: true,
            message: "Cart cleared successfully",
            cart,
        });
    } catch (error) {
        console.error("Clear Cart Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
};
