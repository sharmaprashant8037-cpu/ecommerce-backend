const errorMiddleware = (err, req, res, next) => {
    console.error("Error:", err);

    let statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Mongoose Validation Error
    if (err.name === "ValidationError") {
        statusCode = 400;

        const errors = Object.values(err.errors).map(
            (error) => error.message
        );

        return res.status(statusCode).json({
            success: false,
            message: "Validation failed",
            errors,
        });
    }

    // Mongoose Cast Error
    if (err.name === "CastError") {
        statusCode = 400;

        return res.status(statusCode).json({
            success: false,
            message: "Invalid ID or data format",
        });
    }

    // Duplicate MongoDB field
    if (err.code === 11000) {
        statusCode = 400;

        const field = Object.keys(err.keyValue)[0];

        return res.status(statusCode).json({
            success: false,
            message: `${field} already exists`,
        });
    }

    // JWT Error
    if (err.name === "JsonWebTokenError") {
        statusCode = 401;

        return res.status(statusCode).json({
            success: false,
            message: "Invalid token",
        });
    }

    // JWT Expired
    if (err.name === "TokenExpiredError") {
        statusCode = 401;

        return res.status(statusCode).json({
            success: false,
            message: "Token has expired",
        });
    }

    // Default Error
    res.status(statusCode).json({
        success: false,
        message: err.message || "Internal Server Error",
        ...(process.env.NODE_ENV === "development" && {
            stack: err.stack,
        }),
    });
};

module.exports = errorMiddleware;