import express from "express";

import validateRequest from "../../middlewares/validateRequest";

import { AuthController } from "./auth.controller";

import { AuthValidation } from "./auth.validation";
import auth from "../../middlewares/auth";
import { loginLimiter, otpLimiter } from "../../middlewares/rateLimiter";

const router = express.Router();

// Register a new user
router.post(
  "/register",
  validateRequest(AuthValidation.registerValidationSchema),
  AuthController.registerUser,
);

// Login an existing user
router.post(
  "/login",
  loginLimiter,
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser,
);

// Login or register user with socials
router.post(
  "/login-or-register-with-socials",
  validateRequest(AuthValidation.loginOrRegisterWithSocialsValidationSchema),
  AuthController.loginOrRegisterUserWithSocials,
);

// Refresh token
router.post("/refresh-token", AuthController.refreshToken);

// Logout user
router.post("/logout", AuthController.logoutUser);

router.get("/verify-email", AuthController.verifyEmail);

router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);
router.post(
  "/change-password",
  auth("USER", "ADMIN"),
  AuthController.changePassword,
);

router.post("/send-otp", otpLimiter, AuthController.sendOTP);
router.post("/verify-otp", AuthController.verifyOTP);

export const AuthRoutes = router;
