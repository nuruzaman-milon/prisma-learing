import express from "express";

import validateRequest from "../../middlewares/validateRequest";

import { UserController } from "./user.controller";

import { UserValidation } from "./user.validation";

const router = express.Router();

router.post(
  "/create-user",
  validateRequest(UserValidation.createUserValidationSchema),
  UserController.createUser,
);

router.get("/", UserController.getAllUsers);

router.get("/:id", UserController.getSingleUser);

router.patch(
  "/:id",
  validateRequest(UserValidation.updateUserValidationSchema),
  UserController.updateUser,
);

router.delete("/:id", UserController.deleteUser);

export const UserRoutes = router;
