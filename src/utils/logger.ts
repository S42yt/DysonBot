import chalk from "chalk";

type LogLevel = "LOG" | "INFO" | "WARNING" | "ERROR";

class Logger {
  private static getTimestamp(): string {
    const now = new Date();
    return `[${now.toISOString()}]`;
  }

  private static logWithColor(
    level: LogLevel,
    message: string,
    ...args: any[]
  ): void {
    const timestamp = this.getTimestamp();
    let coloredLevel: string;

    switch (level) {
      case "LOG":
        coloredLevel = chalk.white(`[${level}]`);
        break;
      case "INFO":
        coloredLevel = chalk.blue(`[${level}]`);
        break;
      case "WARNING":
        coloredLevel = chalk.yellow(`[${level}]`);
        break;
      case "ERROR":
        coloredLevel = chalk.red(`[${level}]`);
        break;
    }

    console.log(chalk.gray(timestamp), coloredLevel, message, ...args);
  }

  public static log(message: string, ...args: any[]): void {
    this.logWithColor("LOG", message, ...args);
  }

  public static info(message: string, ...args: any[]): void {
    this.logWithColor("INFO", message, ...args);
  }

  public static warn(message: string, ...args: any[]): void {
    this.logWithColor("WARNING", message, ...args);
  }

  public static error(message: string, ...args: any[]): void {
    this.logWithColor("ERROR", message, ...args);
  }
}

export default Logger;
