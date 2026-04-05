export function paginate(items, page = 1, limit = 10) {
  const currentPage = Math.max(Number(page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(limit) || 10, 1), 100);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;

  return {
    items: items.slice(start, end),
    meta: {
      page: currentPage,
      limit: pageSize,
      total: items.length,
      totalPages: Math.max(Math.ceil(items.length / pageSize), 1)
    }
  };
}
