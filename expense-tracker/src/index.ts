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

// app.get('/fullname', (req:Request, res:Response) => {
//     const {firstName, lastName} = req.query ??''
//     const fullName = `${firstName ??""}  ${lastName ??""}`
//     console.log(res.send)
//   res.send(`Fullname : ${fullName}`, )
// })

// app.get('/calculateSalary', (req:Request, res:Response) => {
//     const { salary1, salary2 } = req.query
//     const totalSalary = parseInt(salary1) + parseInt(salary2)
//     res.send(`Total salary is ${totalSalary}`)
// })

// app.get("/average-sales", (req:Request, res:Response) => {
//     const { salary1, salary2 } = req.query;
//     const avgSales =
//       parseInt(salary1) + parseInt(salary2);

//     res.send(avgSales.toString());
//   });

// Expense tracker

// CRUD filters, sorting, pagination, analytics , Export as excel,

{
  /*
    auth --> /register  | /login | logout | currentUser
    expense --> /create | update | delete | get | single expense | 

    */
}

// Connect with DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI ?? "");
    console.log("Mongodb connected");
  } catch (error) {
    console.log("Mongodb connection failed", error);
    process.exit(1);
  }
};

// connectDB().then((res) => {
//     app.listen(process.env.PORT, () => {
//         console.log(`Expense tracker app listening on port ${process.env.PORT}`)
//       })
// }).catch(error => {
//     console.log("Mongodb connection error", error)
//      process.exit(1)
// })

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
    name: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
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

app.get("/expense", (req, res) => {});

app.listen(process.env.PORT, () => {
  console.log(`Expense tracker app listening on port ${process.env.PORT}`);
});
