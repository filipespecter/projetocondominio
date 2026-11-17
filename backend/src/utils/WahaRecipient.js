// Accept only direct-recipient IDs returned by the authenticated tenant WAHA instance.
export function isWahaRecipientChat(value) {
  return typeof value === "string" && /^\d{5,30}@(c\.us|lid)$/.test(value);
}
