import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { IUser } from "../types";


const userSchema = new Schema<IUser>(
    {
      username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
      },
      password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6,
      },
    },
    {
      timestamps: true,
    },
);

userSchema.pre("save", async function (next: any) {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  console.log(password, this.password);
  return bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    "process.env.ACCESS_TOKEN_SECRET",
    { expiresIn: 1 },
  );
};

export const User = mongoose.model<IUser>("User", userSchema);