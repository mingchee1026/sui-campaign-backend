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
  summary: "Register a new user with zkLogin",
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
  summary: "Register a new user with WebAuthn signature",
  method: "post",
  path: "/api/users/webauthn/register",
  tags: ["Users"],
  request: {
    // headers: z.object({
    //   Authorization: z.string().default("Bearer {jwtData}"), //`Bearer ${jwtData()}`,: z.string()
    // }),
    // params: z.object({
    //   publicKey: z.string(),
    //   challenge: z.string(),
    //   signature: z.string(),
    //   context: z.object({
    //     rpId: z.string(),
    //     rpOrigin: z.string(),
    //     domain: z.string(),
    //   }),
    // }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            publicKey: z.string(),
            challenge: z.string(),
            signature: z.string(),
            context: z.object({
              rpId: z.string(),
              rpOrigin: z.string(),
              domain: z.string(),
            }),
          }),
        },
      },
    },
  },
  responses: createApiResponse(
    z.array(
      z.object({
        userId: z.string(),
        walletAddress: z.string(),
        token: z.string(),
        expiresAt: z.string(),
      })
    ),
    "Success"
  ),
});

// userRegistry.registerPath({
//   method: "post",
//   path: "/api/users/webauthn/check",
//   tags: ["Users"],
//   request: {
//     // headers: z.object({
//     //   Authorization: z.string().default("Bearer {jwtData}"), //`Bearer ${jwtData()}`,: z.string()
//     // }),
//     params: z.object({
//       publicKey: z.string(),
//       context: z.object({
//         rpId: z.string(),
//         rpOrigin: z.string(),
//         domain: z.string(),
//       }),
//     }),
//   },
//   responses: createApiResponse(
//     z.array(z.object({ exists: z.boolean(), walletAddress: z.string() })),
//     "Success"
//   ),
// });

userRegistry.registerPath({
  summary: "Login a user to a custodial wallet using a webauthn signature.",
  method: "post",
  path: "/api/users/webauthn/login",
  tags: ["Users"],
  request: {
    // headers: z.object({
    //   Authorization: z.string().default("Bearer {jwtData}"), //`Bearer ${jwtData()}`,: z.string()
    // }),
    // params: z.object({
    //   publicKey: z.string(),
    //   challenge: z.string(),
    //   signature: z.string(),
    //   context: z.object({
    //     rpId: z.string(),
    //     rpOrigin: z.string(),
    //     domain: z.string(),
    //   }),
    // }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            publicKey: z.string(),
            challenge: z.string(),
            signature: z.string(),
            context: z.object({
              rpId: z.string(),
              rpOrigin: z.string(),
              domain: z.string(),
            }),
          }),
        },
      },
    },
  },
  responses: createApiResponse(
    z.array(
      z.object({
        exists: z.boolean(),
        walletAddress: z.string(),
        token: z.string(),
        expiresAt: z.string(),
      })
    ),
    "Success"
  ),
});

userRegistry.registerPath({
  summary: "Record a user interaction.",
  method: "post",
  path: "/api/users/webauthn/interactions",
  tags: ["Users"],
  request: {
    headers: z.object({
      Authorization: z.string().default("Bearer {jwtData}"), //`Bearer ${jwtData()}`,: z.string()
    }),
    // params: z.object({
    //   type: z.enum(["login", "referral"]),
    //   referrerPublicKey: z.string(),
    //   context: z.object({
    //     rpId: z.string(),
    //     rpOrigin: z.string(),
    //     domain: z.string(),
    //   }),
    // }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            type: z.enum(["login", "referral"]),
            referrerPublicKey: z.string(),
            context: z.object({
              rpId: z.string(),
              rpOrigin: z.string(),
              domain: z.string(),
            }),
          }),
        },
      },
    },
  },
  responses: createApiResponse(z.array(z.object({})), "Success"),
});

userRegistry.registerPath({
  summary: "For testing",
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
  summary: "For testing",
  method: "get",
  path: "/api/users/referred/{attribution_code}",
  tags: ["Users"],
  request: {
    params: z.object({ attribution_code: z.string() }),
  },
  responses: createApiResponse(z.array(z.array(UserResponseSchema)), "Success"),
});

userRouter.get("/profile/:address", userController.getUser);
userRouter.get("/referred/:attribution_code", userController.getReferrals);
userRouter.post("/register", userController.register);
// userRouter.post("/register", userController.registerTest);

userRouter.post("/webauthn/register", userController.registerWebauthn);
// userRouter.post("/webauthn/check", userController.checkWebauthn);
userRouter.post("/webauthn/login", userController.getWebauthnSession);
userRouter.post("/webauthn/interactions", userController.interactionsWebauthn);

userRouter.get("/sponsors", userController.getSponsors);
userRouter.get("/initialize", userController.removeAllUsers);
userRouter.get("/updateCampId/:campaign_id", userController.updateCampId);
