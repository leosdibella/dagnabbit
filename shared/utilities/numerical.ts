export function isNonNegativeInteger(value: number) {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    value >= 0 &&
    (value | 0) === value
  );
}
