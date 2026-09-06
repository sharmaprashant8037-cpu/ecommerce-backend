const express = require("express");

const {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
} = require("../controllers/orderController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();


// ==================== USER ROUTES ====================

// Create new order
router.post("/", protect, createOrder);

// Get logged-in user's orders
router.get("/my-orders", protect, getMyOrders);

// Get single order
router.get("/:id", protect, getOrderById);

// Cancel order
router.put("/:id/cancel", protect, cancelOrder);


// ==================== ADMIN ROUTES ====================

// Get all orders
router.get("/admin/all", protect, admin, getAllOrders);

// Update order status
router.put(
    "/admin/:id/status",
    protect,
    admin,
    updateOrderStatus
);

// Update payment status
router.put(
    "/admin/:id/payment",
    protect,
    admin,
    updatePaymentStatus
);


module.exports = router;