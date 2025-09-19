import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export const validateRegister = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required(),
    username: Joi.string().alphanum().min(3).max(30).optional(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    phone: Joi.string().pattern(/^[0-9]{10}$/).optional(),
    role: Joi.string().valid('CUSTOMER', 'MALL_MANAGER').default('CUSTOMER')
  });

  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    });
    return;
  }
  next();
};

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    emailOrUsername: Joi.string().required(),
    password: Joi.string().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    });
    return;
  }
  next();
};

export const validateForgotPassword = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    email: Joi.string().email().required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    });
    return;
  }
  next();
};

export const validateResetPassword = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required()
  });

  const { error } = schema.validate(req.body);
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    });
    return;
  }
  next();
};

export const validateSpaceSearch = (req: Request, res: Response, next: NextFunction): void => {
  const schema = Joi.object({
    city: Joi.string().optional(),
    sector: Joi.string().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    minSize: Joi.number().min(0).optional(),
    maxSize: Joi.number().min(0).optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    availability: Joi.string().valid('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED').optional(),
    page: Joi.number().min(1).default(1),
    limit: Joi.number().min(1).max(100).default(20)
  });

  const { error } = schema.validate(req.query);
  if (error) {
    res.status(400).json({
      success: false,
      error: error.details[0].message
    });
    return;
  }
  next();
};
