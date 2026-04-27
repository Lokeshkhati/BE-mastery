import{ Document } from "mongoose";

export interface IUser extends Document {
    email: string;
    username: string;
    password: string;
    isPasswordCorrect(password: string): Promise<boolean>;
    generateAccessToken(): Promise<string>;
  }