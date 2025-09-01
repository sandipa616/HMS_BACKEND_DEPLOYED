class ErrorHandler extends Error {
    constructor(message, statusCode) {
        super(message); // Inherit from the Error class
        this.statusCode = statusCode; // Set the status code
    }
}

// Error Middleware to handle different types of errors
export const errorMiddleware = (err, req, res, next) => {
    err.message = err.message || "Internal server error"; // Default message
    err.statusCode = err.statusCode || 500; // Default status code

    // Handle MongoDB duplicate key error (e.g., for unique constraints)
    if (err.code === 11000) {
        const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
        err = new ErrorHandler(message, 400);
    }

    // Handle invalid JWT token error
    if (err.name === "JsonWebTokenError") {
        const message = "Json Web Token is invalid, Try Again!";
        err = new ErrorHandler(message, 400);
    }

    // Handle expired JWT token error
    if (err.name === "TokenExpiredError") {
        const message = "Json Web Token is expired, Try Again!";
        err = new ErrorHandler(message, 400);
    }

    // Handle invalid object ID errors (for instance, in MongoDB)
    if (err.name === "CastError") {
        const message = `Invalid ${err.path}`;
        err = new ErrorHandler(message, 400);
    }
    const errorMessage=err.errors?Object.values(err.errors).map(error=>error.message).join(" "):err.message

    // Return the error response with the status code and message
    return res.status(err.statusCode).json({
        success: false,
        message: errorMessage, // Send the error message
    });
};

export default ErrorHandler;
