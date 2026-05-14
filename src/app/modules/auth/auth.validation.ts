import { z } from "zod";

const registerValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),

    email: z.email(),

    password: z.string().min(6),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
};
