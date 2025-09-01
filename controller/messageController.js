import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import { Message } from "../models/messageSchema.js";
import ErrorHandler from "../middlewares/errorMiddleware.js"; // Import ErrorHandler

export const sendMessage = catchAsyncErrors(async (req, res, next) => {
    const { firstName, lastName, email, phone, message } = req.body;

    // Validation check: If any field is missing, throw an error
    if (!firstName || !lastName || !email || !phone || !message) {
        return next(new ErrorHandler("Please fill the full form", 400)); 
    }

    // If all fields are present, create the message in the database
    await Message.create({
        firstName,
        lastName,
        email,
        phone,
        message,
    });

    // If the message is sent successfully, return success response
    res.status(200).json({
        success: true,
        message: "Message sent successfully",
    });
});
export const getAllMessages=catchAsyncErrors(async(req,res,next)=>{
    const messages= await Message.find();
    res.status(200).json({
        success:true,
        messages,
    });
})
