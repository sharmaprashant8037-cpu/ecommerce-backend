const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },

        description: {
            type: String,
            required: [true, "Product description is required"],
            trim: true,
        },

        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: 0,
        },

        discountPrice: {
            type: Number,
            default: 0,
            min: 0,
        },

        category: {
            type: String,
            required: [true, "Product category is required"],
            trim: true,
        },

        brand: {
            type: String,
            trim: true,
        },

        stock: {
            type: Number,
            required: [true, "Stock is required"],
            default: 0,
            min: 0,
        },

        images: [
            {
                type: String,
            },
        ],

        rating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },

        numReviews: {
            type: Number,
            default: 0,
        },

        isFeatured: {
            type: Boolean,
            default: false,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model("Product", productSchema);

module.exports = Product;