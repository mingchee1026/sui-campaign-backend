import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
// import { validateRequest } from "@/common/utils/httpHandlers";
import { authController } from "./authController";

export const authRegistry = new OpenAPIRegistry();
export const authRouter: Router = express.Router();

extendZodWithOpenApi(z);

authRegistry.registerPath({
  method: "post",
  path: "/api/auth/salt",
  tags: ["Users"],
  request: {
    headers: z.object({
      Authorization: z.string().default("Bearer {jwtData}"), //`Bearer ${jwtData()}`,: z.string()
    }),
    params: z.object({
      subject: z.string(),
      salt: z.string(),
    }),
  },
  responses: createApiResponse(
    z.array(z.object({ subject: z.string(), salt: z.string() })),
    "Success"
  ),
});

authRouter.post("/salt", authController.getSalt);
