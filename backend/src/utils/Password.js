import bcrypt from "bcryptjs";
import env from "../config/env.js";

class Password {
  static async hash(value) {
    if (!value || typeof value !== "string") {
      throw new Error(
        "A senha informada para criptografia é inválida."
      );
    }

    return bcrypt.hash(
      value,
      env.BCRYPT_ROUNDS
    );
  }

  static async compare(value, passwordHash) {
    if (
      !value ||
      !passwordHash ||
      typeof value !== "string" ||
      typeof passwordHash !== "string"
    ) {
      return false;
    }

    return bcrypt.compare(
      value,
      passwordHash
    );
  }
}

export default Password;