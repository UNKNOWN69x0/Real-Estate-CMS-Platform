import { z } from 'zod';

/**
 * Update schema from a create schema: every field optional and NO defaults applied.
 * (z.partial() would re-apply .default() values and silently reset untouched fields.)
 */
export function toPatchSchema(schema) {
  const shape = Object.fromEntries(
    Object.entries(schema.shape).map(([key, field]) => [
      key,
      (field.def.type === 'default' ? field.def.innerType : field).optional(),
    ]),
  );
  return z.object(shape);
}
