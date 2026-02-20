import express from "express";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { errorHandler } from "./middleware/errorHandler";

/* ROUTE IMPORTS */
import authRoutes from "./routes/authRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import expenseRoutes from "./routes/expenseRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import auditRoutes from "./routes/auditRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import salesRoutes from "./routes/salesRoutes";
import purchasesRoutes from "./routes/purchasesRoutes";

/* CONFIGURATIONS */
dotenv.config();
const app = express();

// Security middleware
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));

// CORS configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests) only in development
      if (!origin) {
        if (process.env.NODE_ENV === "development") {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      }
      
      // In production, only allow configured origins
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else if (process.env.NODE_ENV === "development") {
        // In development, allow localhost
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("common"));
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/audit-logs", auditRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/purchases", purchasesRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: "Route not found",
      name: "NotFoundError",
    },
  });
});

// Error handler (must be last)
app.use(errorHandler);

/* SERVER */
const port = Number(process.env.PORT) || 8000;

// Validate required environment variables in production
if (process.env.NODE_ENV === "production") {
  const requiredVars = ["DATABASE_URL", "JWT_SECRET", "CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET", "CLIENT_URL"];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error(`Missing required environment variables: ${missingVars.join(", ")}`);
    process.exit(1);
  }
}

app.listen(port, "0.0.0.0", () => {
  if (process.env.NODE_ENV !== "production") {
    console.log(`Server running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  } else {
    console.log(`Server started on port ${port}`);
  }
});
