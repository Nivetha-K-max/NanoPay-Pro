import { Request, Response, NextFunction } from 'express';
import { ValidationChain } from 'express-validator';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const results = await Promise.all(validations.map((validation) => validation.run(req)));
    const errors = results.flatMap((r) => r.array());

    if (errors.length === 0) {
      return next();
    }

    return res.status(400).json({ errors });
  };
};
