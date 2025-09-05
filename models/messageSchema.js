import mongoose from "mongoose";
import validator from "validator";

const messageSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: [3, "First Name must contain at least 3 characters!"],
    // Regex removed
  },
  lastName: {
    type: String,
    required: true,
    minLength: [3, "Last Name must contain at least 3 characters!"],
    // Regex removed
  },
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, "Please provide a valid Email"],
  },
  phone: {
    type: String,
    required: true,
    minLength: [10, "Phone number must contain at least 10 digits"],
    maxLength: [10, "Phone number must contain at most 10 digits"],
    // Regex removed
  },
  message: {
    type: String,
    required: true,
    minLength: [10, "Message must contain at least 10 characters"],
  },
});

export const Message = mongoose.model("Message", messageSchema);
