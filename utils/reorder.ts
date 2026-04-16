/**
 * Given a reordered array of items that have an `id`,
 * returns an array of { id, order } pairs to write back to SQLite.
 */
export function computeOrder<T extends { id: string }>(
  items: T[]
): Array<{ id: string; order: number }> {
  return items.map((item, index) => ({ id: item.id, order: index }));
}
