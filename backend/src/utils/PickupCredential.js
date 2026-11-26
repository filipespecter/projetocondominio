import crypto from "node:crypto";
import env from "../config/env.js";

class PickupCredential {
  static hash(value) {
    return crypto
      .createHash("sha256")
      .update(String(value))
      .digest("hex");
  }

  /**
   * Hash do código de 6 dígitos. Usa HMAC com chave do servidor:
   * com SHA-256 puro, o código poderia ser descoberto testando
   * as 1.000.000 combinações a partir do hash.
   */
  static hashCode(code) {
    const secret = crypto
      .createHash("sha256")
      .update(`pickup-code:${env.JWT_REFRESH_SECRET}`)
      .digest();
    return crypto
      .createHmac("sha256", secret)
      .update(String(code))
      .digest("hex");
  }

  /**
   * Hashes aceitos na validação do código: o atual (HMAC) e o
   * legado (SHA-256), para códigos gerados antes da atualização.
   */
  static codeHashCandidates(code) {
    return [this.hashCode(code), this.hash(code)];
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
