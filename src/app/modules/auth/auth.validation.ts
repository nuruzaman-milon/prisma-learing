import { z } from "zod";

const registerValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.email(),
    password: z.string().min(6),
  }),
});

const loginValidationSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6),
  }),
});

const loginOrRegisterWithSocialsValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.email(),
    authProvider: z.string(),
    providerId: z.string(),
  }),
});

export const AuthValidation = {
  registerValidationSchema,
  loginValidationSchema,
  loginOrRegisterWithSocialsValidationSchema,
};
