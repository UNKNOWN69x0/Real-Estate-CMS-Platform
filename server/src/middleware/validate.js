// Validates req.body with a Zod schema and replaces it with the parsed (stripped, coerced) value.
// ZodErrors bubble to errorHandler, which maps them to { errors: { field: message } }.
export const validate = (schema) => (req, res, next) => {
  req.body = schema.parse(req.body ?? {});
  next();
};
