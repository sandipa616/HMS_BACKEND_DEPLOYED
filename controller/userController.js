import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { User } from "../models/userSchema.js";
import { generateToken } from "../utils/jwtToken.js";
import { sendEmail } from "../utils/sendEmail.js";
import pkg from "cloudinary";
const cloudinary = pkg.v2;

// ----------------- PATIENT REGISTER -----------------
export const patientRegister = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    role,
    password,
    confirmPassword,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !password ||
    !confirmPassword ||
    !role
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  if (password !== confirmPassword)
    return next(new ErrorHandler("Passwords do not match!", 400));

  const isRegistered = await User.findOne({ email });
  if (isRegistered)
    return next(new ErrorHandler("User already Registered!", 400));

  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    role: "Patient",
  });

  generateToken(user, "User Registered!", 200, res);
});

// ----------------- LOGIN -----------------
export const login = catchAsyncErrors(async (req, res, next) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role)
    return next(new ErrorHandler("Please Fill Full Form!", 400));

  const user = await User.findOne({ email }).select("+password");
  if (!user) return next(new ErrorHandler("Invalid Email Or Password!", 400));

  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch)
    return next(new ErrorHandler("Invalid Email Or Password!", 400));

  if (role !== user.role)
    return next(new ErrorHandler(`User Not Found With This Role!`, 400));

  generateToken(user, "Login Successfully!", 201, res);
});

// ----------------- ADD NEW ADMIN -----------------
export const addNewAdmin = catchAsyncErrors(async (req, res, next) => {
  const { firstName, lastName, email, phone, dob, gender, password } = req.body;
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !password
  ) {
    return next(new ErrorHandler("Please Fill Full Form!", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered)
    return next(new ErrorHandler("Admin With This Email Already Exists!", 400));

  const admin = await User.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    role: "Admin",
  });

  // Send welcome email
  await sendEmail({
    to: admin.email,
    subject: "Welcome to Medora – Hetauda Hospital",
    html: `
      <h2>Welcome to Medora</h2>
      <p>Dear ${admin.firstName},</p>
      <p>Your account has been created as a <b>Admin</b>.</p>
      <p>Login credentials:</p>
      <ul>
        <li>Email: ${admin.email}</li>
        <li>Password: ${password}</li>
      </ul>
      
      <hr>
      <p>Thank you,<br/>Medora Team</p>
    `,
  });

  res
    .status(200)
    .json({ success: true, message: "New Admin Registered", admin });
});

// ----------------- ADD NEW DOCTOR -----------------
export const addNewDoctor = catchAsyncErrors(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0)
    return next(new ErrorHandler("Doctor Avatar Required", 400));
  const { docAvatar } = req.files;
  const allowedFormats = ["image/png", "image/jpeg", "image/webp"];
  if (!allowedFormats.includes(docAvatar.mimetype))
    return next(new ErrorHandler("File Format Not Supported!", 400));

  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    doctorDepartment,
  } = req.body || {};
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !password ||
    !doctorDepartment
  ) {
    return next(new ErrorHandler("Please Provide Full Details", 400));
  }

  const isRegistered = await User.findOne({ email });
  if (isRegistered)
    return next(
      new ErrorHandler(
        `${isRegistered.role} Already Registered With This Email`,
        400
      )
    );

  const cloudinaryResponse = await cloudinary.uploader.upload(
    docAvatar.tempFilePath
  );
  if (!cloudinaryResponse || cloudinaryResponse.error)
    return next(new ErrorHandler("Failed to upload image", 500));

  const doctor = await User.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    password,
    doctorDepartment,
    role: "Doctor",
    docAvatar: {
      public_id: cloudinaryResponse.public_id,
      url: cloudinaryResponse.secure_url,
    },
  });

  // Send welcome email
  await sendEmail({
  to: doctor.email,
  subject: "Registered with Medora – Hetauda Hospital",
  html: `
    <h2>Welcome to Medora</h2>
    <p>Dear Dr. ${doctor.firstName},</p>
    <p>You have been successfully registered in our system as a <b>Doctor</b>.</p>
    <p>We look forward to working with you.</p>
    <hr>
    <p>Thank you,<br/>Medora Team</p>
  `,
});

  res
    .status(200)
    .json({ success: true, message: "New Doctor Registered!", doctor });
});

// ----------------- OTHER CONTROLLERS -----------------
export const getAllDoctors = catchAsyncErrors(async (req, res, next) => {
  const doctors = await User.find({ role: "Doctor" });
  res.status(200).json({ success: true, doctors });
});

export const getUserDetails = catchAsyncErrors(async (req, res, next) => {
  const user = req.user;
  res.status(200).json({ success: true, user });
});

export const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("adminToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: true,
      sameSite: "None",
    })
    .json({ success: true, message: "Admin Logged Out successfully!" });
});

export const logoutPatient = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("patientToken", "", {
      httpOnly: true,
      expires: new Date(Date.now()),
      secure: true,
      sameSite: "None",
    })
    .json({ success: true, message: "Patient Logged Out successfully!" });
});
