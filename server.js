const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");

// Database
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Error Middleware
const errorMiddleware = require("./middleware/errorMiddleware");


// Load environment variables
dotenv.config();


// Connect MongoDB
connectDB();


// Create Express App
const app = express();


// ==================== MIDDLEWARE ====================

// Enable CORS
app.use(
    cors({
        origin: "http://localhost:5173",
        credentials: true,
    })
);

// Parse JSON
app.use(express.json());

// Parse URL encoded data
app.use(express.urlencoded({ extended: true }));

// Cookie Parser
app.use(cookieParser());

// HTTP request logger
app.use(morgan("dev"));


// ==================== ROOT ROUTE ====================

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "E-commerce API is running 🚀",
    });
});


// ==================== API ROUTES ====================

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);


// ==================== 404 ROUTE ====================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
    });
});


// ==================== ERROR HANDLER ====================

app.use(errorMiddleware);


// ==================== SERVER ====================

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});