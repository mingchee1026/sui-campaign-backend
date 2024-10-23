import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
// import { GetUserSchema, UserSchema } from "@/api/user/userModel";
import { validateRequest } from "@/common/utils/httpHandlers";
import { userController } from "./userController";

export const userRegistry = new OpenAPIRegistry();
export const userRouter: Router = express.Router();

extendZodWithOpenApi(z);

const UserResponseSchema = z.object({
  campaign_id: z.string(),
  subject: z.string(),
  email: z.string(),
  // salt: string;
  wallet_address: z.string(),
  custodial_address: z.string(),
  attribution_code: z.string(),
  referred_by: z.string(),
  user_name: z.string(),
  avatar: z.string(),
  //   digest: z.string(),
  //   user: z.object({
  //     campaign_id: z.string(),
  //     subject: z.string(),
  //     email: z.string(),
  //     // salt: string;
  //     wallet_address: z.string(),
  //     custodial_address: z.string(),
  //     attribution_code: z.string(),
  //     referred_by: z.string(),
  //     user_name: z.string(),
  //     avatar: z.string(),
  //   }),
});

// userRegistry.register("User", UserSchema);

userRegistry.registerPath({
  method: "post",
  path: "/api/users/register",
  tags: ["Users"],
  request: {
    headers: z.object({
      Authorization: z.string().default("Bearer {jwtData}"), //`Bearer ${jwtData()}`,: z.string()
    }),
    params: z.object({
      campaign_id: z.string(),
      wallet_address: z.string(),
      referred_by: z.string(),
    }),
  },
  responses: createApiResponse(
    z.array(z.object({ digest: z.string(), user: UserResponseSchema })),
    "Success"
  ),
});

userRegistry.registerPath({
  method: "get",
  path: "/api/users/profile/{campaign_id}/{subject}",
  tags: ["Users"],
  request: {
    params: z.object({ campaign_id: z.string(), subject: z.string() }),
    headers: z.object({ campaign_id: z.string(), subject: z.string() }),
  },
  responses: createApiResponse(z.array(UserResponseSchema), "Success"),
});

userRegistry.registerPath({
  method: "get",
  path: "/api/users/referred/{attribution_code}",
  tags: ["Users"],
  request: {
    params: z.object({ attribution_code: z.string() }),
  },
  responses: createApiResponse(z.array(z.array(UserResponseSchema)), "Success"),
});

userRouter.get("/profile/:campaign_id/:subject", userController.getUser);
userRouter.get("/referred/:attribution_code", userController.getReferrals);
userRouter.post("/register", userController.register);

userRouter.get("/sponsors", userController.getSponsors);
userRouter.get("/initialize", userController.removeAllUsers);
