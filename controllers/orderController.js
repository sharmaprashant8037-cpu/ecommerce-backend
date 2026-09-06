
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

// ==========================================
// Create Order
// ==========================================

const createOrder = async (req, res) => {
    try {
        const { shippingAddress, paymentMethod = "COD" } = req.body;

        // Check shipping address
        if (
            !shippingAddress ||
            !shippingAddress.fullName ||
            !shippingAddress.phone ||
            !shippingAddress.address ||
            !shippingAddress.city ||
            !shippingAddress.state ||
            !shippingAddress.pincode
        ) {
            return res.status(400).json({
                success: false,
                message: "Complete shipping address is required",
            });
        }

        // Find user's cart
        const cart = await Cart.findOne({
            user: req.user.id,
        }).populate("items.product");

        if (!cart || cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Your cart is empty",
            });
        }

        // Prepare order items
        const orderItems = [];

        let subtotal = 0;

        for (const item of cart.items) {
            const product = item.product;

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: "One of the products no longer exists",
                });
            }

            // Check stock
            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} has only ${product.stock} items in stock`,
                });
            }

            // Use discount price if available
            const price =
                product.discountPrice > 0
                    ? product.discountPrice
                    : product.price;

            subtotal += price * item.quantity;

            orderItems.push({
                product: product._id,
                name: product.name,
                image: product.images?.[0] || "",
                quantity: item.quantity,
                price,
            });
        }

        // Shipping charge
        const shippingCharge = subtotal >= 1000 ? 0 : 100;

        // Discount
        const discount = 0;

        // Final amount
        const totalAmount =
            subtotal + shippingCharge - discount;

        // Create order
        const order = await Order.create({
            user: req.user.id,
            orderItems,
            shippingAddress,
            paymentMethod,
            paymentStatus:
                paymentMethod === "COD"
                    ? "Pending"
                    : "Pending",
            orderStatus: "Pending",
            subtotal,
            shippingCharge,
            discount,
            totalAmount,
        });

        // Reduce product stock
        for (const item of cart.items) {
            await Product.findByIdAndUpdate(
                item.product._id,
                {
                    $inc: {
                        stock: -item.quantity,
                    },
                }
            );
        }

        // Clear cart
        cart.items = [];
        await cart.save();

        res.status(201).json({
            success: true,
            message: "Order created successfully",
            order,
        });
    } catch (error) {
        console.error("Create Order Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Get My Orders
// ==========================================

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            user: req.user.id,
        })
            .populate(
                "orderItems.product",
                "name price images stock"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Get My Orders Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Get Single Order
// ==========================================

const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate(
                "user",
                "name email phone"
            )
            .populate(
                "orderItems.product",
                "name price images"
            );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // User can only see their own order
        if (
            order.user._id.toString() !==
                req.user.id.toString() &&
            req.user.role !== "admin"
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to view this order",
            });
        }

        res.status(200).json({
            success: true,
            order,
        });
    } catch (error) {
        console.error("Get Order Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
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
// Cancel Order
// ==========================================

const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Check ownership
        if (
            order.user.toString() !==
            req.user.id.toString()
        ) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to cancel this order",
            });
        }

        // Only pending/confirmed orders can be cancelled
        if (
            !["Pending", "Confirmed"].includes(
                order.orderStatus
            )
        ) {
            return res.status(400).json({
                success: false,
                message: "This order cannot be cancelled",
            });
        }

        // Restore stock
        for (const item of order.orderItems) {
            await Product.findByIdAndUpdate(
                item.product,
                {
                    $inc: {
                        stock: item.quantity,
                    },
                }
            );
        }

        order.orderStatus = "Cancelled";
        order.cancelledAt = new Date();

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            order,
        });
    } catch (error) {
        console.error("Cancel Order Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Admin - Get All Orders
// ==========================================

const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find()
            .populate(
                "user",
                "name email phone"
            )
            .populate(
                "orderItems.product",
                "name price images"
            )
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders,
        });
    } catch (error) {
        console.error("Get All Orders Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Admin - Update Order Status
// ==========================================

const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;

        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Processing",
            "Shipped",
            "Delivered",
            "Cancelled",
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid order status",
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Restore stock if admin cancels order
        if (
            status === "Cancelled" &&
            order.orderStatus !== "Cancelled"
        ) {
            for (const item of order.orderItems) {
                await Product.findByIdAndUpdate(
                    item.product,
                    {
                        $inc: {
                            stock: item.quantity,
                        },
                    }
                );
            }

            order.cancelledAt = new Date();
        }

        // Delivered date
        if (
            status === "Delivered" &&
            order.orderStatus !== "Delivered"
        ) {
            order.deliveredAt = new Date();
        }

        order.orderStatus = status;

        await order.save();

        res.status(200).json({
            success: true,
            message: "Order status updated successfully",
            order,
        });
    } catch (error) {
        console.error("Update Order Status Error:", error);

        if (error.name === "CastError") {
            return res.status(400).json({
                success: false,
                message: "Invalid order ID",
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
// Admin - Update Payment Status
// ==========================================

const updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus } = req.body;

        const allowedStatuses = [
            "Pending",
            "Paid",
            "Failed",
        ];

        if (
            !paymentStatus ||
            !allowedStatuses.includes(paymentStatus)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment status",
            });
        }

        const order = await Order.findById(req.params.id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        order.paymentStatus = paymentStatus;

        await order.save();

        res.status(200).json({
            success: true,
            message: "Payment status updated successfully",
            order,
        });
    } catch (error) {
        console.error(
            "Update Payment Status Error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrder,
    getAllOrders,
    updateOrderStatus,
    updatePaymentStatus,
};
