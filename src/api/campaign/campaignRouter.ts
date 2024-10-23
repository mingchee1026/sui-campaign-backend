import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
import { validateRequest } from "@/common/utils/httpHandlers";
import { campaignController } from "./campaignController";

export const campaignRegistry = new OpenAPIRegistry();
export const campaignRouter: Router = express.Router();

extendZodWithOpenApi(z);

const CampaignResponseSchema = z.object({
  campaign_id: z.string(),
  title: z.string(),
  about: z.string(),
  active: z.boolean(),
  started_at: z.date(),
  ebded_at: z.date(),
});

campaignRegistry.registerPath({
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
    z.array(z.object({ digest: z.string(), user: CampaignResponseSchema })),
    "Success"
  ),
});

campaignRegistry.registerPath({
  method: "get",
  path: "/api/users/profile/{campaign_id}/{subject}",
  tags: ["Users"],
  request: {
    params: z.object({ campaign_id: z.string(), subject: z.string() }),
    headers: z.object({ campaign_id: z.string(), subject: z.string() }),
  },
  responses: createApiResponse(z.array(CampaignResponseSchema), "Success"),
});

campaignRegistry.registerPath({
  method: "get",
  path: "/api/users/referred/{attribution_code}",
  tags: ["Users"],
  request: {
    params: z.object({ attribution_code: z.string() }),
  },
  responses: createApiResponse(
    z.array(z.array(CampaignResponseSchema)),
    "Success"
  ),
});

campaignRouter.get("/registerPkg", campaignController.registerPackage);
campaignRouter.get("/", campaignController.create);
