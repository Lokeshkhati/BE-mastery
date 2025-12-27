import express, { Request, Response } from "express";
import mongoose, { Schema } from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

const app = express();

// middleware to hanlde cors issue, accepts json with 16 kn limit
app.use(express.json({ limit: "16kb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: "16kb",
  }),
);
app.use(
  cors({
    origin: "", //allowed FE urls here,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  }),
);

dotenv.config({
  path: "./.env",
});

app.get("/", (req: Request, res: Response) => {
  res.send(`Hello Expense `);
});

// Expense tracker

// CRUD filters, sorting, pagination, analytics , Export as excel,

{
  /*
    auth --> /register  | /login | logout | currentUser
    expense --> /create | update | delete | get | single expense | 
// pagination sorting, filtering
    */
}

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI ?? "");
    console.log("Mongodb connected");
  } catch (error) {
    console.log("Mongodb connection failed", error);
    process.exit(1);
  }
};

connectDB();

const userSchema = new Schema(
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
    fullName: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
  },
  {
    timestamps: true,
  },
);

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

const User = mongoose.model("User", userSchema);

const Expense = mongoose.model("Expense", expenseSchema);

// auth
app.get("/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  // validation for required fileds
  if (!username || !email || !password) {
    throw new Error();
  }

  // check in DB if user alredy exists with the same email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new Error("409, User with email or username already exists");
  }

  // haspassword before saving
  // create user
  const user = await User.create({
    email,
    password,
    username,
  });

  await user.save({
    validateBeforeSave: false,
  });

  const createdUser = User.findById(user._id).select("-password");
  if (!createdUser) {
    throw new Error("500, Something went wrong");
  }

  // geberate token

  return res.status(201).json({
    user: createdUser,
    message: "User created successfully",
  });
});

app.get("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // validation for required fileds
  if (!email || !password) {
    throw new Error("Email or password is missing");
  }

  const existedUser = User.findOne({
    email,
  });

  if (!existedUser) {
    throw new Error("blablablab");
  }

  //   if (existedUser?.password !== password) {
  //     throw new Error("Password does not match");
  //   }

  return res.status(201).json({
    //   user,
    message: "User created successfully",
  });
});

// expense
app.post("/expense", async (req: Request, res: Response) => {
  const { amount, accountType, category, expenseType } = req.body;

  console.log(amount, accountType, category, expenseType);

  if (!amount || !accountType || !category || !expenseType) {
    throw new Error("fields missing");
  }

  const createdExpense = await Expense.create({
    amount,
    accountType,
    category,
    expenseType,
  });

  const expense = await createdExpense.save();

  res.status(201).json({
    expense,
    message: "Expense created successfully",
  });
});

app.get("/expense", async (req: Request, res: Response) => {
  const expenses = await Expense.find({});

  res.status(200).json({
    expenses,
    message: "Expenses fetched successfully",
  });
});

app.get("/expense/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log({ id });
  if (!id) {
    throw new Error("Expense id not found");
  }

  const foundExpense = await Expense.findById({ _id: id });
  console.log({ foundExpense });

  res.status(200).json({
    expense: foundExpense,
    message: "Expense fetched successfully",
  });
});

app.put("/expense/:expenseId", async (req: Request, res: Response) => {
  const { expenseId } = req.params;
  const { amount, accountType, category, expenseType } = req.body;
  console.log({ expenseId });

  if (!expenseId) {
    throw new Error("Expense expenseId not found");
  }

  const updatedExpense = await Expense.findByIdAndUpdate(
    expenseId,
    {
      amount,
      accountType,
      category,
      expenseType,
    },
    { new: true },
  );

  res.status(200).json({
    expense: updatedExpense,
    message: "Expense updated successfully",
  });
});

app.delete("/expense/:expenseId", async (req: Request, res: Response) => {
    const { expenseId } = req.params;

  if (!expenseId) {
    throw new Error("NO expense id found");
  }

    const data = await Expense.findByIdAndDelete(expenseId);
    console.log({data})

  res.status(200).json({
    deleted: true,
    message: "Expense deleted successfully",
  });
});


app.listen(process.env.PORT, () => {
  console.log(`Expense tracker app listening on port ${process.env.PORT}`);
});
