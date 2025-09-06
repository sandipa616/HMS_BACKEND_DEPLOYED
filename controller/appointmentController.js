import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import nodemailer from "nodemailer";

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,      // your personal Gmail
    pass: process.env.EMAIL_PASS, // 16-character App Password
  },
});

// Create a new appointment
export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    department,
    doctor_firstName,
    doctor_lastName,
    hasVisited,
    address,
  } = req.body;

  // Validate required fields
  if (
    !firstName ||
    !lastName ||
    !email ||
    !phone ||
    !dob ||
    !gender ||
    !appointment_date ||
    !department ||
    !doctor_firstName ||
    !doctor_lastName ||
    !address
  ) {
    return next(new ErrorHandler("Please fill full form", 400));
  }

  // Check if doctor exists
  const isConflict = await User.find({
    firstName: doctor_firstName,
    lastName: doctor_lastName,
    role: "Doctor",
    doctorDepartment: department,
  });

  if (isConflict.length === 0) {
    return next(new ErrorHandler("Doctor not found!", 400));
  }
  if (isConflict.length > 1) {
    return next(
      new ErrorHandler(
        "Doctor Conflict! Please contact through Email or Phone",
        404
      )
    );
  }

  const doctorId = isConflict[0]._id;
  const patientId = req.user._id;

  const appointment = await Appointment.create({
    firstName,
    lastName,
    email,
    phone,
    dob,
    gender,
    appointment_date,
    department,
    doctor: {
      firstName: doctor_firstName,
      lastName: doctor_lastName,
    },
    hasVisited,
    address,
    doctorId,
    patientId,
  });

  res.status(200).json({
    success: true,
    message: "Appointment Sent Successfully!",
    appointment,
  });
});

// Get all appointments (Admin)
export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({
    success: true,
    appointments,
  });
});

// Update appointment status & send email to patient
export const updateAppointmentStatus = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  // Find appointment
  let appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Appointment not found", 404));
  }

  // Update status
  appointment.status = status;
  await appointment.save();

  // Send email to patient
  const mailOptions = {
    from: `"Medora – Hetauda Hospital" <${process.env.EMAIL}>`,
    to: appointment.email,
    subject: "Your Appointment Status Update",
    html: `
      <h2>Medora – Hetauda Hospital</h2>
      <p>Dear ${appointment.firstName},</p>
      <p>Your appointment status has been updated to: <b>${status}</b>.</p>
      <p>We will be happy to serve you at Hetauda Hospital.</p>
      <hr>
      <p>Thank you,<br/>Medora Team<br/>Hetauda Hospital</p>
    `,
  };

  await transporter.sendMail(mailOptions);

  res.status(200).json({
    success: true,
    message: "Appointment Status Updated and Email Sent to Patient!",
    appointment,
  });
});

// Delete appointment
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  let appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Appointment Not Found", 404));
  }

  await appointment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Appointment Deleted",
  });
});
