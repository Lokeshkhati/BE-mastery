import express, { Request, Response } from "express";
import mongoose, { Document, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import cors from "cors";

const app = express();

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

app.use(cookieParser());

dotenv.config({
  path: "./.env",
});

app.get("/", (req: Request, res: Response) => {
  res.send(`Hello Expense `);
});

interface IUser extends Document {
  email: string;
  username: string;
  password: string;
  isPasswordCorrect(password: string): Promise<boolean>;
  generateAccessToken(): Promise<string>;
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
    //   type: String,
    //   trim: true,
    // },
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

userSchema.pre("save", async function (next: any) {
  if (!this.isModified("password")) return; //next();
  this.password = await bcrypt.hash(this.password, 10);
  //   next();
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

const User = mongoose.model<IUser>("User", userSchema);
const Expense = mongoose.model("Expense", expenseSchema);

// auth
app.post("/register", async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    throw new Error();
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new Error("409, User with email or username already exists");
  }

  const user = await User.create({
    email,
    password,
    username,
  });

  await user.save({
    validateBeforeSave: false,
  });

  const createdUser = await User.findById(user._id).select("-password");
  if (!createdUser) {
    throw new Error("500, Something went wrong");
  }

  return res.status(201).json({
    user: createdUser,
    message: "User created successfully",
  });
});

app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({
      message: "Email is required",
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({
      message: "User with provided email does not exist",
    });
  }

    const isPasswordValid = await user.isPasswordCorrect(password);
    
  if (!isPasswordValid) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  const accessToken = await user.generateAccessToken();
  const loggedInUser = await User.findById(user._id).select("-password");

  return res
    .status(200)
    .cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict", //CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    })
    .json({
      user: loggedInUser,
      accessToken,
      message: "User logged in successfully",
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

// /expense?search=abacaa&filter=custom&startDate=2024-01-01&endDate=2024-03-31&sort="a-z"
// /expense?page=1&limit=10
// /expense?search=food&filter=past_month&sort=amount-high&page=1&limit=20
// /expense?filter=custom&startDate=2024-01-01&endDate=2024-03-31&page=2

enum FilterEnum {
  TODAY = "today",
  YESTERDAY = "yesterday",
  PAST_WEEK = "past_week",
  PAST_MONTH = "past_month",
  LAST_3_MONTHS = "last_3_months",
  CUSTOM = "custom",
}

enum SortOptionEnum {
  A_Z = "a-z",
  Z_A = "z-a",
  AMOUNT_HIGH = "amount_high",
  AMOUNT_LOW = "amount_low",
  NEWEST_DATE = "newest_date",
  OLDEST_DATE = "oldest_date",
}

const SORT_OPTIONS: Record<SortOptionEnum, Record<string, 1 | -1>> = {
  [SortOptionEnum.A_Z]: { description: 1 },
  [SortOptionEnum.Z_A]: { description: -1 },
  [SortOptionEnum.AMOUNT_HIGH]: { amount: -1 },
  [SortOptionEnum.AMOUNT_LOW]: { amount: 1 },
  [SortOptionEnum.NEWEST_DATE]: { createdAt: -1 },
  [SortOptionEnum.OLDEST_DATE]: { createdAt: 1 },
};

app.get("/expense", async (req: Request, res: Response) => {
  const {
    search,
    filter,
    startDate,
    endDate,
    sort,
    page = 1,
    limit = 10,
  } = req.query;

  const query: any = {};
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: "i" } },
      { category: { $regex: search, $options: "i" } },
    ];
  }

  let dateQuery: any = {};
  const now = new Date();
  console.log({ filter });

  if (filter === FilterEnum.TODAY) {
    const startOfTheDay = new Date(now);
    const endOfTheDay = new Date(now);
    startOfTheDay.setHours(0, 0, 0, 0);
    endOfTheDay.setHours(23, 59, 59, 999);
    dateQuery = {
      $gte: startOfTheDay,
      $lte: endOfTheDay,
    };
  }

  if (filter === FilterEnum.YESTERDAY) {
    const startOfYesterday = new Date(now);
    const endOfYesterday = new Date(now);

    startOfYesterday.setDate(now.getDate() - 1);
    endOfYesterday.setDate(now.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);
    endOfYesterday.setHours(23, 59, 59, 999);

    dateQuery = {
      $gte: startOfYesterday,
      $lte: endOfYesterday,
    };
  }

  if (filter === FilterEnum.PAST_WEEK) {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    dateQuery = { $gte: weekAgo };
  }
  if (filter === FilterEnum.PAST_MONTH) {
    const monthAgo = new Date(now);
    monthAgo.setMonth(now.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);
    dateQuery = { $gte: monthAgo };
  }
  if (filter === FilterEnum.LAST_3_MONTHS) {
    const threeMonthsAgo = new Date(now);
    threeMonthsAgo.setMonth(now.getMonth() - 3);
    threeMonthsAgo.setHours(0, 0, 0, 0);
    dateQuery = { $gte: threeMonthsAgo };
  }
  if (filter === FilterEnum.CUSTOM) {
    if (!startDate && !endDate) {
      throw new Error("start date and end date both are required fields.");
    }
    const start = new Date(startDate as string);
    start.setHours(0, 0, 0, 0);

    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    if (start > end) {
      return res.status(400).json({
        message: "startDate must be before or equal to endDate",
      });
    }

    dateQuery = {
      $gte: start,
      $lte: end,
    };
  }

  if (Object.keys(dateQuery).length > 0) {
    query.createdAt = dateQuery;
  }

  const sortOption = SORT_OPTIONS[sort as SortOptionEnum] || { createdAt: -1 };

  const pageNumber = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNumber - 1) * limitNum;
  console.log([query]);
  const expenses = await Expense.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limitNum);

  const totalExpenses = await Expense.countDocuments(query);
  const totalPages = Math.ceil(totalExpenses / limitNum);

  res.status(200).json({
    data: expenses,
    totalPages,
    page: pageNumber,
    totalElements: totalExpenses,
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
  console.log({ data });

  res.status(200).json({
    deleted: true,
    message: "Expense deleted successfully",
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Expense tracker app listening on port ${process.env.PORT}`);
});
