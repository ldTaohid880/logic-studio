/** Unique id for new parts, wires and components: prefix, timestamp and a random suffix. */
export const makeId = (prefix: string): string => {
  const unique = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 8)
    : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now()}-${unique}`;
};
