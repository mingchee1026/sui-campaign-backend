import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
// import { GetUserSchema, UserSchema } from "@/api/user/userModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userController } from "./userController";

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

// userRegistry.register("User", UserSchema);

// userRegistry.registerPath({
//   method: "get",
//   path: "/users",
//   tags: ["User"],
//   responses: createApiResponse(z.array(UserSchema), "Success"),
// });

// userRouter.get("/", userController.getUsers);

// userRegistry.registerPath({
//   method: "get",
//   path: "/users/{id}",
//   tags: ["User"],
//   request: { params: GetUserSchema.shape.params },
//   responses: createApiResponse(UserSchema, "Success"),
// });

userRouter.get("/profile/:campaign_id/:subject", userController.getUser);
userRouter.get("/referred/:attribution_code", userController.getReferrals);
userRouter.post("/register", userController.register);

userRouter.get("/sponsors", userController.getSponsors);
userRouter.get("/sponsors/create", userController.createSponsors);
