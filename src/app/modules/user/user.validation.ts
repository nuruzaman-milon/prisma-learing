import { z } from "zod";

const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),

    email: z.email(),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),

    email: z.email().optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
