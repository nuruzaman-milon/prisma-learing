import express from "express";

import validateRequest from "../../middlewares/validateRequest";

import { UserController } from "./user.controller";

import { UserValidation } from "./user.validation";
import auth from "../../middlewares/auth";
import { upload } from "../../config/multer.config";

const router = express.Router();

// Create a new user
router.post(
  "/create-user",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser,
);

router.get("/me", auth(), UserController.getMe);

// Get all users
router.get("/", UserController.getAllUsers);

// Get a single user by ID
router.get("/:id", UserController.getSingleUser);

router.patch(
  "/update-profile",
  upload.single("file"),
  UserController.updateProfile,
);

// Update a user by ID
router.patch(
  "/:id",
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser,
);

// Delete a user by ID
router.delete("/:id", auth("ADMIN"), UserController.deleteUser);

//got my profile with auth middleware

export const UserRoutes = router;
