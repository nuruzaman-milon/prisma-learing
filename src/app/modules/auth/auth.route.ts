import express from "express";

import validateRequest from "../../middlewares/validateRequest";

import { AuthController } from "./auth.controller";

import { AuthValidation } from "./auth.validation";

const router = express.Router();

router.post(
  "/register",

  validateRequest(AuthValidation.registerValidationSchema),

  AuthController.registerUser,
);

export const AuthRoutes = router;
