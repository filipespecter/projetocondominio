import jwt from "jsonwebtoken";
import env from "../config/env.js";

class Jwt {
  /**
   * Gera o Access Token.
   */
  static generateAccessToken(user) {
    return jwt.sign(
      {
        sub: user.id,
        condominiumId: user.condominiumId,
        role: user.role,
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      }
    );
  }

  /**
   * Gera o Refresh Token.
   */
  static generateRefreshToken(user) {
    return jwt.sign(
      {
        sub: user.id,
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
      }
    );
  }

  /**
   * Valida um Access Token.
   */
  static verifyAccessToken(token) {
    return jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    );
  }

  /**
   * Valida um Refresh Token.
   */
  static verifyRefreshToken(token) {
    return jwt.verify(
      token,
      env.JWT_REFRESH_SECRET
    );
  }

  /**
   * Decodifica um token sem validar.
   *
   * Útil apenas para logs e depuração.
   */
  static decode(token) {
    return jwt.decode(token);
  }
}

export default Jwt;