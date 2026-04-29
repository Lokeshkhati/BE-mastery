import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    accountType: { type: String, required: true },
    expenseType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    author: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export const Expense = mongoose.model("Expense", expenseSchema);
