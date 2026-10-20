// Preserva precisão de BigInt e o formato JSON de Date e Decimal.
export function jsonSafe(value) {
  return JSON.parse(JSON.stringify(value, (_key, item) => {
    if (typeof item !== "bigint") return item;
    return item <= BigInt(Number.MAX_SAFE_INTEGER) && item >= BigInt(Number.MIN_SAFE_INTEGER) ? Number(item) : item.toString();
  }));
}
