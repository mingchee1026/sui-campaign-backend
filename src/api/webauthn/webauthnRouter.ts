import { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import express, { type Router } from "express";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { createApiResponse } from "@/api-docs/openAPIResponseBuilders";
// import { validateRequest } from "@/common/utils/httpHandlers";
import { webauthnController } from "./webauthnController";

export const webauthnRegistry = new OpenAPIRegistry();
export const webauthnRouter: Router = express.Router();

extendZodWithOpenApi(z);

webauthnRouter.post("/register", webauthnController.register);
webauthnRouter.post("/login", webauthnController.login);
webauthnRouter.post("/response", webauthnController.response);
