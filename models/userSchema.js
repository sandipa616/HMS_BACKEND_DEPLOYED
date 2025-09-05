import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, "First Name Is Required!"],
      minLength: [3, "First Name Must Contain At Least 3 Characters!"],
      match: [/^[A-Za-z ]+$/, "First Name must contain only letters"],
    },
    lastName: {
      type: String,
      required: [true, "Last Name Is Required!"],
      minLength: [3, "Last Name Must Contain At Least 3 Characters!"],
      match: [/^[A-Za-z ]+$/, "Last Name must contain only letters"],
    },
    email: {
      type: String,
      required: [true, "Email Is Required!"],
      lowercase: true,
      validate: [validator.isEmail, "Provide A Valid Email!"],
    },
    phone: {
      type: String,
      required: [true, "Phone Is Required!"],
      match: [/^\d{10}$/, "Phone Number Must Contain Exactly 10 Digits!"],
    },
    dob: {
      type: Date,
      required: [true, "DOB Is Required!"],
    },
    gender: {
      type: String,
      required: [true, "Gender Is Required!"],
      enum: ["Male", "Female"],
    },
    password: {
      type: String,
      required: [true, "Password Is Required!"],
      minLength: [8, "Password Must Contain At Least 8 Characters!"],
      select: false,
    },
    role: {
      type: String,
      required: [true, "User Role Required!"],
      enum: ["Patient", "Doctor", "Admin"],
    },
    doctorDepartment: {
      type: String,
      required: function () {
        return this.role === "Doctor";
      },
    },
    docAvatar: {
      public_id: String,
      url: String,
    },
  },
  { timestamps: true } // automatically adds createdAt and updatedAt
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT
userSchema.methods.generateJsonWebToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

export const User = mongoose.model("User", userSchema);
