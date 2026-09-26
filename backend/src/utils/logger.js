export class Logger {
  static sanitize(value){const blocked=/password|senha|token|authorization|cookie|secret|api.?key|database_url/i;if(Array.isArray(value))return value.map(item=>this.sanitize(item));if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value).map(([key,item])=>[key,blocked.test(key)?"[REDACTED]":this.sanitize(item)]));return value;}
  static info(message, data = null) {
    console.log(
      `[INFO] ${new Date().toISOString()} - ${message}`,
      this.sanitize(data) ?? ""
    );
  }

  static warn(message, data = null) {
    console.warn(
      `[WARN] ${new Date().toISOString()} - ${message}`,
      this.sanitize(data) ?? ""
    );
  }

  static error(message, error = null) {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      this.sanitize(error) ?? ""
    );
  }

  static debug(message, data = null) {
    if (process.env.NODE_ENV === "development") {
      console.log(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        this.sanitize(data) ?? ""
      );
    }
  }
}
