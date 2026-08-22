import crypto from "node:crypto";

class PickupCredential {
  static hash(value) {
    return crypto
      .createHash("sha256")
      .update(String(value))
      .digest("hex");
  }

  static generateToken() {
    return crypto
      .randomBytes(32)
      .toString("base64url");
  }

  static generateCode() {
    return crypto
      .randomInt(0, 1000000)
      .toString()
      .padStart(6, "0");
  }

  static normalizeCode(value) {
    return String(value ?? "")
      .replace(/\D/g, "");
  }

  static safeEqualHash(
    expectedHash,
    value
  ) {
    if (!expectedHash || !value) {
      return false;
    }

    const actualHash =
      this.hash(value);

    const expected =
      Buffer.from(
        expectedHash,
        "hex"
      );

    const actual =
      Buffer.from(
        actualHash,
        "hex"
      );

    if (
      expected.length !==
      actual.length
    ) {
      return false;
    }

    return crypto.timingSafeEqual(
      expected,
      actual
    );
  }
}

export default PickupCredential;
