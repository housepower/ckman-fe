export interface SortState {
  property?: string;
  order?: 'asc' | 'desc' | null;
}

export function sortRows<T extends Record<string, any>>(rows: T[], sort: SortState): T[] {
  const { property, order } = sort || {};
  if (!property || !order) return rows.slice();
  const copy = rows.slice();
  copy.sort((a, b) => {
    const av = a[property];
    const bv = b[property];
    let flag = 0;
    if (typeof av === 'number' && typeof bv === 'number') {
      flag = av - bv;
    } else {
      const as = String(av ?? '');
      const bs = String(bv ?? '');
      flag = as.length === bs.length ? as.localeCompare(bs) : as.length - bs.length;
    }
    return order === 'asc' ? flag : -flag;
  });
  return copy;
}
