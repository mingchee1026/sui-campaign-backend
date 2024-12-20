import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { authRouter } from "./api/auth/authRouter";
import { userRouter } from "@/api/user/userRouter";
import { analyticsRouter } from "./api/analytics/analyticsRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";

const logger = pino({ name: "server start" });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(cors());
app.use(helmet());
// app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/api/health-check", healthCheckRouter);
app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/analytics", analyticsRouter);

// Swagger UI
app.use("/api", openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
