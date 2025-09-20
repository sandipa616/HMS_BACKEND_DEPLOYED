import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddleware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import { sendEmail } from "../utils/sendEmail.js";

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
  } else {
    patientMessage = `
      <h2>Medora – Hetauda Hospital</h2>
      <p>Dear ${appointment.firstName},</p>
      <p>Your appointment status has been updated to: <b>${status}</b>.</p>
      <hr>
      <p>Thank you,<br/>Medora Team<br/>Hetauda Hospital</p>
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
