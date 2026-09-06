const express = require("express");

const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
} = require("../controllers/productController");

const { protect, admin } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getProducts);

router.get("/featured", getFeaturedProducts);

router.get("/:id", getProductById);

router.post("/", protect, admin, createProduct);

router.put("/:id", protect, admin, updateProduct);

router.delete("/:id", protect, admin, deleteProduct);

module.exports = router;