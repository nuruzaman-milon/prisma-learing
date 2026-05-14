import type { NextFunction, Request, Response } from "express";

import type { ZodType } from "zod";

const validateRequest =
  (schema: ZodType) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
      });

      next();
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.errors,
      });
    }
  };

export default validateRequest;
