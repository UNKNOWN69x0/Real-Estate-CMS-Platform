import { ZodError } from 'zod';
import mongoose from 'mongoose';
import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const zodFieldErrors = (error) => {
  const errors = {};
  for (const issue of error.issues) {
    const field = issue.path.join('.') || '_';
    if (!errors[field]) errors[field] = issue.message;
  }
  return errors;
};

export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let status = 500;
  let message = 'Something went wrong';
  let errors;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    errors = zodFieldErrors(err);
  } else if (err instanceof ApiError) {
    ({ status, message, errors } = err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    message = 'Validation failed';
    errors = Object.fromEntries(Object.entries(err.errors).map(([k, v]) => [k, v.message]));
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    message = `Invalid ${err.path}`;
  } else if (err?.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = `${field} already exists`;
    errors = { [field]: `This ${field} is already in use` };
  } else if (err instanceof multer.MulterError) {
    status = 400;
    message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 10 MB)' : err.message;
  } else if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') {
    status = err.status || 400;
    message = err.type === 'entity.too.large' ? 'Request body too large' : 'Malformed JSON body';
  }

  const unexpected = status >= 500 && !(err instanceof ApiError);
  if (unexpected) console.error(err);

  const body = { success: false, message };
  if (errors) body.errors = errors;
  // Stack traces only outside production, and only for unexpected errors
  if (!env.isProd && unexpected) body.stack = err.stack;
  res.status(status).json(body);
}
