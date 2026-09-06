
const Product = require("../models/Product");

// ==========================================
// Create Product
// ==========================================

const createProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            discountPrice,
            category,
            brand,
            stock,
            images,
            isFeatured,
        } = req.body;

        // Required fields
        if (!name || !description || price === undefined || !category) {
            return res.status(400).json({
                success: false,
                message: "Name, description, price and category are required",
            });
        }

        // Create product
        const product = await Product.create({
            name,
            description,
            price,
            discountPrice,
            category,
            brand,
            stock,
            images,
            isFeatured,
            createdBy: req.user.id,
        });

        res.status(201).json({
            success: true,
            message: "Product created successfully",
            product,
        });
    } catch (error) {
        console.error("Create Product Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Get All Products
// ==========================================

const getProducts = async (req, res) => {
    try {
        const {
            search,
            category,
            brand,
            minPrice,
            maxPrice,
            page = 1,
            limit = 10,
            sort = "newest",
        } = req.query;

        // Filter
        const filter = {
            isActive: true,
        };

        // Search by product name
        if (search) {
            filter.name = {
                $regex: search,
                $options: "i",
            };
        }

        // Category filter
        if (category) {
            filter.category = {
                $regex: category,
                $options: "i",
            };
        }

        // Brand filter
        if (brand) {
            filter.brand = {
                $regex: brand,
                $options: "i",
            };
        }

        // Price filter
        if (minPrice || maxPrice) {
            filter.price = {};

            if (minPrice) {
                filter.price.$gte = Number(minPrice);
            }

            if (maxPrice) {
                filter.price.$lte = Number(maxPrice);
            }
        }

        // Pagination
        const pageNumber = Math.max(Number(page), 1);
        const limitNumber = Math.max(Number(limit), 1);
        const skip = (pageNumber - 1) * limitNumber;

        // Sorting
        let sortOption = {};

        switch (sort) {
            case "priceLow":
                sortOption = { price: 1 };
                break;

            case "priceHigh":
                sortOption = { price: -1 };
                break;

            case "rating":
                sortOption = { rating: -1 };
                break;

            case "oldest":
                sortOption = { createdAt: 1 };
                break;

            default:
                sortOption = { createdAt: -1 };
        }

        // Get products
        const products = await Product.find(filter)
            .populate("createdBy", "name email")
            .sort(sortOption)
            .skip(skip)
            .limit(limitNumber);

        // Total products
        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: products.length,
            totalProducts,
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProducts / limitNumber),
            products,
        });
    } catch (error) {
        console.error("Get Products Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

// ==========================================
// Get Single Product
// ==========================================

const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate("createdBy", "name email");

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        console.error("Get Product Error:", error);

        // Invalid MongoDB ID
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
// Update Product
// ==========================================

const updateProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        const {
            name,
            description,
            price,
            discountPrice,
            category,
            brand,
            stock,
            images,
            rating,
            numReviews,
            isFeatured,
            isActive,
        } = req.body;

        // Update only provided fields
        if (name !== undefined) product.name = name;
        if (description !== undefined) product.description = description;
        if (price !== undefined) product.price = price;
        if (discountPrice !== undefined) {
            product.discountPrice = discountPrice;
        }
        if (category !== undefined) product.category = category;
        if (brand !== undefined) product.brand = brand;
        if (stock !== undefined) product.stock = stock;
        if (images !== undefined) product.images = images;
        if (rating !== undefined) product.rating = rating;
        if (numReviews !== undefined) product.numReviews = numReviews;
        if (isFeatured !== undefined) product.isFeatured = isFeatured;
        if (isActive !== undefined) product.isActive = isActive;

        const updatedProduct = await product.save();

        res.status(200).json({
            success: true,
            message: "Product updated successfully",
            product: updatedProduct,
        });
    } catch (error) {
        console.error("Update Product Error:", error);

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
// Delete Product
// ==========================================

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

        await product.deleteOne();

        res.status(200).json({
            success: true,
            message: "Product deleted successfully",
        });
    } catch (error) {
        console.error("Delete Product Error:", error);

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
// Get Featured Products
// ==========================================

const getFeaturedProducts = async (req, res) => {
    try {
        const products = await Product.find({
            isFeatured: true,
            isActive: true,
        })
            .sort({ createdAt: -1 })
            .limit(10);

        res.status(200).json({
            success: true,
            count: products.length,
            products,
        });
    } catch (error) {
        console.error("Featured Products Error:", error);

        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getFeaturedProducts,
};
