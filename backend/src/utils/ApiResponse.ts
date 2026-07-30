export class ApiResponse<T = unknown> {
  public readonly success: boolean;
  public readonly statusCode: number;
  public readonly message: string;
  public readonly data: T | null;
  public readonly timestamp: string;

  constructor(statusCode: number, message: string, data: T | null = null) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.timestamp = new Date().toISOString();
  }

  static success<T>(
    message: string,
    data: T | null = null,
    statusCode = 200,
  ): ApiResponse<T> {
    return new ApiResponse<T>(statusCode, message, data);
  }

  static created<T>(message: string, data: T | null = null): ApiResponse<T> {
    return new ApiResponse<T>(201, message, data);
  }
}