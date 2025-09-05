import mongoose from "mongoose";
import validator from "validator";

const messageSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: [3, "First Name must contain at least 3 characters!"],
    match: [/^[A-Za-z ]+$/, "First Name must contain only letters"],
  },
  lastName: {
    type: String,
    required: true,
    minLength: [3, "Last Name must contain at least 3 characters!"],
    match: [/^[A-Za-z ]+$/, "Last Name must contain only letters"],
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Please provide a valid Email"],
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Phone number must contain exactly 10 digits"],
  },
  message: {
    type: String,
    required: true,
    minLength: [10, "Message must contain at least 10 characters"],
  },
});

export const Message = mongoose.model("Message", messageSchema);
