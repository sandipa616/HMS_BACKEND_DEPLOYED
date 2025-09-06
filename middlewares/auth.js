import { catchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMiddleware.js";
import { User } from "../models/userSchema.js";
import jwt from "jsonwebtoken";

// Admin authentication middleware
export const isAdminAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.adminToken;

  if (!token) {
    return next(new ErrorHandler("Admin not authenticated!", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Token is invalid or expired", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user || user.role !== "Admin") {
    return next(new ErrorHandler(`${user?.role || "User"} not authorized for this resource`, 403));
  }

  req.user = user;
  next();
});

// Patient authentication middleware
export const isPatientAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.patientToken;

  if (!token) {
    return next(new ErrorHandler("Patient not authenticated!", 401));
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
  } catch (err) {
    return next(new ErrorHandler("Token is invalid or expired", 401));
  }

  const user = await User.findById(decoded.id);
  if (!user || user.role !== "Patient") {
    return next(new ErrorHandler(`${user?.role || "User"} not authorized for this resource`, 403));
  }

  req.user = user;
  next();
});
