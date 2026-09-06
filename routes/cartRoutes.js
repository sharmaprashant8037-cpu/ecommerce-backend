const express = require("express");

const {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
} = require("../controllers/cartController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();


// ==================== CART ROUTES ====================

// Get logged-in user's cart
router.get("/", protect, getCart);

// Add product to cart
router.post("/", protect, addToCart);

// Update product quantity
router.put("/:productId", protect, updateCartQuantity);

// Remove product from cart
router.delete("/:productId", protect, removeFromCart);

// Clear entire cart
router.delete("/", protect, clearCart);


module.exports = router;