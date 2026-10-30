const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Turns req.query into a Mongo filter + pagination + sort.
 * Only whitelisted filter/sort fields are honoured, so clients can't inject operators.
 */
export function buildListQuery(query, { searchFields = [], filterFields = [], sortFields = [], defaultSort = 'order' }) {
  const filter = {};

  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';
  if (search && searchFields.length) {
    const pattern = new RegExp(escapeRegex(search), 'i');
    filter.$or = searchFields.map((field) => ({ [field]: pattern }));
  }

  for (const field of filterFields) {
    if (typeof query[field] === 'string' && query[field] !== '') filter[field] = query[field];
  }

  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);

  const sortParam = typeof query.sort === 'string' ? query.sort : defaultSort;
  const sort = {};
  for (const part of sortParam.split(',')) {
    const desc = part.startsWith('-');
    const field = desc ? part.slice(1) : part;
    if (sortFields.includes(field)) sort[field] = desc ? -1 : 1;
  }
  if (!Object.keys(sort).length) sort[defaultSort.replace(/^-/, '')] = defaultSort.startsWith('-') ? -1 : 1;

  return { filter, page, limit, sort, skip: (page - 1) * limit };
}

export const paginated = (data, total, page, limit) => ({
  data,
  meta: { total, page, limit, pages: Math.ceil(total / limit) || 1 },
});
