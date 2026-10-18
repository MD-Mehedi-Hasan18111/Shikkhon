/**
 * Application Error Class with HTTP status codes and bilingual support
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly banglaMessage: string;
  public readonly errors?: Record<string, string[]> | string[] | unknown;

  constructor(
    message: string,
    statusCode = 500,
    banglaMessage = "একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
    errors?: Record<string, string[]> | string[] | unknown
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.banglaMessage = banglaMessage;
    this.errors = errors;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(
    message = "Bad Request",
    banglaMessage = "অনুরোধটি সঠিক নয়।",
    errors?: unknown
  ) {
    return new AppError(message, 400, banglaMessage, errors);
  }

  static unauthorized(
    message = "Unauthorized",
    banglaMessage = "লগইন প্রয়োজন অথবা সেশন মেয়াদোত্তীর্ণ।"
  ) {
    return new AppError(message, 401, banglaMessage);
  }

  static forbidden(
    message = "Forbidden",
    banglaMessage = "এই তথ্য বা কার্যক্রমে আপনার প্রবেশের অনুমতি নেই।"
  ) {
    return new AppError(message, 403, banglaMessage);
  }

  static notFound(
    message = "Resource not found",
    banglaMessage = "অনুরোধকৃত তথ্য খুঁজে পাওয়া যায়নি।"
  ) {
    return new AppError(message, 404, banglaMessage);
  }

  static conflict(
    message = "Resource already exists",
    banglaMessage = "তথ্যটি ইতিমধ্যে বিদ্যমান রয়েছে।"
  ) {
    return new AppError(message, 409, banglaMessage);
  }

  static validation(
    errors: Record<string, string[]> | string[],
    message = "Validation Failed",
    banglaMessage = "তথ্য যাচাইকরণ ব্যর্থ হয়েছে। সঠিক তথ্য প্রদান করুন।"
  ) {
    return new AppError(message, 422, banglaMessage, errors);
  }

  static tooManyRequests(
    message = "Too Many Requests",
    banglaMessage = "আপনি খুব দ্রুত বা ঘন ঘন অনুরোধ পাঠাচ্ছেন। কিছুক্ষণ অপেক্ষা করুন।"
  ) {
    return new AppError(message, 429, banglaMessage);
  }

  static internal(
    message = "Internal Server Error",
    banglaMessage = "সার্ভারে সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।"
  ) {
    return new AppError(message, 500, banglaMessage);
  }
}
