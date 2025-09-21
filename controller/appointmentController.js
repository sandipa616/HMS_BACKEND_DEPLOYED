import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

// ----------------- CREATE NEW APPOINTMENT -----------------
export const postAppointment = catchAsyncErrors(async (req, res, next) => {
  const { appointment_date, department, doctor_firstName, doctor_lastName } = req.body;

  // ✅ get logged-in patient
  const patient = await User.findById(req.user._id);
  if (!patient) {
    return next(new ErrorHandler("Patient not found", 404));
  }

  // ✅ validate date
  const today = new Date();
  const selectedDate = new Date(appointment_date);
  if (selectedDate < today.setHours(0, 0, 0, 0)) {
    return next(new ErrorHandler("Appointment date cannot be in the past", 400));
  }

  // ✅ check doctor
  const doctor = await User.findOne({
    firstName: doctor_firstName,
    lastName: doctor_lastName,
    role: "Doctor",
    doctorDepartment: department,
  });
  if (!doctor) {
    return next(new ErrorHandler("Doctor not found!", 400));
  }

  // ✅ create appointment (patient info comes from logged-in user, not form)
  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId: doctor._id,
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email,
    phone: patient.phone,
    dob: patient.dob,
    gender: patient.gender,
    address: patient.address,
    appointment_date,
    department,
    doctor: {
      firstName: doctor.firstName,
      lastName: doctor.lastName,
    },
    hasVisited: false,
  });

  // ✅ send confirmation email
  await sendEmail({
    to: patient.email,
    subject: "Appointment Request Submitted",
    html: `
      <h2>Medora – Hetauda Hospital</h2>
      <p>Dear ${patient.firstName},</p>
      <p>Your appointment request with Dr. ${doctor.firstName} ${doctor.lastName}
      on <b>${appointment_date}</b> has been submitted successfully.</p>
      <p>Please wait for confirmation from our admin team.</p>
      <hr>
      <p>Thank you,<br/>Medora Team<br/>Hetauda Hospital</p>
    `,
  });

  res.status(200).json({
    success: true,
    message: "Appointment Sent Successfully & Email Notification Sent!",
    appointment,
  });
});


// ----------------- GET ALL APPOINTMENTS (ADMIN) -----------------
export const getAllAppointments = catchAsyncErrors(async (req, res, next) => {
  const appointments = await Appointment.find();
  res.status(200).json({
    success: true,
    appointments,
  });
});

// ----------------- UPDATE APPOINTMENT STATUS -----------------
// ----------------- UPDATE APPOINTMENT STATUS -----------------
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

  // Prepare patient email message based on status
  let patientMessage = "";
  if (status === "Accepted") {
    patientMessage = `
      <h2>Medora – Hetauda Hospital</h2>
      <p>Dear ${appointment.firstName},</p>
      <p>Good news! Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} 
      scheduled on <b>${appointment.appointment_date}</b> in the <b>${appointment.department}</b> department 
      has been <b>accepted</b>.</p>
      <p>Please arrive on time for your appointment. Contact us if you need to reschedule.</p>
      <hr>
      <p>Thank you,<br/>Medora Team<br/>Hetauda Hospital</p>
    `;
  } else if (status === "Rejected") {
    patientMessage = `
      <h2>Medora – Hetauda Hospital</h2>
      <p>Dear ${appointment.firstName},</p>
      <p>We regret to inform you that your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} 
      scheduled on <b>${appointment.appointment_date}</b> in the <b>${appointment.department}</b> department 
      has been <b>rejected</b>.</p>
      <p>Please contact our support team for further assistance or to reschedule.</p>
      <hr>
      <p>Thank you,<br/>Medora Team<br/>Hetauda Hospital</p>
    `;
  } 
  else if (status === "Pending") {
  patientMessage = `
    <h2>Medora – Hetauda Hospital</h2>
    <p>Dear ${appointment.firstName},</p>
    <p>Your appointment request with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} 
    scheduled on <b>${appointment.appointment_date}</b> in the <b>${appointment.department}</b> department 
    is currently <b>pending review</b>.</p>
    <p>Our admin team will review and update you soon. Please check your email for further updates.</p>
    <hr>
    <p>Thank you for your patience,<br/>Medora Team<br/>Hetauda Hospital</p>
  `;
}

  // Send patient email
  await sendEmail({
    to: appointment.email,
    subject: "Your Appointment Status Update",
    html: patientMessage,
  });

  // Notify doctor if status is "Accepted"
  if (status === "Accepted") {
    const doctor = await User.findById(appointment.doctorId);
    if (doctor && doctor.email) {
      await sendEmail({
        to: doctor.email,
        subject: "New Patient Assigned",
        html: `
          <h2>Medora – Hetauda Hospital</h2>
          <p>Dear Dr. ${doctor.firstName},</p>
          <p>A new patient has been assigned to you:</p>
          <ul>
            <li>Name: ${appointment.firstName} ${appointment.lastName}</li>
            <li>Email: ${appointment.email}</li>
            <li>Phone: ${appointment.phone}</li>
            <li>Appointment Date: ${appointment.appointment_date}</li>
            <li>Department: ${appointment.department}</li>
          </ul>
          <hr>
          <p>Thank you,<br/>Medora Team<br/>Hetauda Hospital</p>
        `,
      });
    }
  }

  res.status(200).json({
    success: true,
    message: "Appointment Status Updated and Emails Sent!",
    appointment,
  });
});

// ----------------- DELETE APPOINTMENT -----------------
export const deleteAppointment = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  let appointment = await Appointment.findById(id);
  if (!appointment) {
    return next(new ErrorHandler("Appointment Not Found", 404));
  }

  
  await appointment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Appointment Deleted!",
  });
});
