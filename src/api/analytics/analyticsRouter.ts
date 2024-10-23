import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { analyticsController } from "./analyticsController";

export const analyticsRegistry = new OpenAPIRegistry();
export const analyticsRouter: Router = express.Router();

extendZodWithOpenApi(z);

analyticsRegistry.registerPath({
  method: "get",
  path: "/api/users/register",
  tags: ["Analytics"],
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
    z.array(z.object({ digest: z.string() })),
    "Success"
  ),
});

analyticsRouter.get(
  "/test/activity/:count",
  analyticsController.testActivityLog
);
