import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
// import { GetUserSchema, UserSchema } from "@/api/user/userModel";
// import { validateRequest } from "@/common/utils/httpHandlers";
import { authController } from "./authController";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

// authRegistry.register("Authentication", UserSchema);

// authRegistry.registerPath({
//   method: "get",
//   path: "/users",
//   tags: ["User"],
//   responses: createApiResponse(z.array(UserSchema), "Success"),
// });

authRouter.post("/salt", authController.getSalt);
