import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "./api-error";
import { apiError, apiValidationError } from "./api-response";
import { connectToDatabase } from "./mongodb";

type RouteHandler<T = unknown> = (
  req: NextRequest,
  context?: unknown
) => Promise<NextResponse<T>> | NextResponse<T>;

interface HandlerOptions {
  requireDb?: boolean;
}

interface MongoDuplicateKeyError {
  code: number;
  keyPattern?: Record<string, number>;
}

/**
 * Higher-order function to wrap Next.js Route Handlers with automatic database connection
 * and centralized error handling (Zod, Mongoose, AppError, etc.)
 */
export function createApiHandler(
  handler: RouteHandler,
  options: HandlerOptions = { requireDb: true }
): RouteHandler {
  return async (req: NextRequest, context?: unknown) => {
    try {
      if (options.requireDb) {
        await connectToDatabase();
      }
      return await handler(req, context);
    } catch (error: unknown) {
      console.error("API Error caught in handler:", error);

      // AppError (Our custom operational errors)
      if (error instanceof AppError) {
        return apiError(
          error.banglaMessage || error.message,
          error.statusCode,
          error.errors
        );
      }

      // Zod Validation Errors
      if (error instanceof ZodError) {
        const formattedErrors: Record<string, string[]> = {};
        for (const issue of error.issues) {
          const path = issue.path.join(".");
          if (!formattedErrors[path]) {
            formattedErrors[path] = [];
          }
          formattedErrors[path].push(issue.message);
        }
        return apiValidationError(formattedErrors, "ইনপুট তথ্যের ফরম্যাট সঠিক নয়।");
      }

      // Mongoose Duplicate Key Error (E11000)
      if (typeof error === "object" && error !== null && "code" in error) {
        const mongoErr = error as MongoDuplicateKeyError;
        if (mongoErr.code === 11000) {
          const field = Object.keys(mongoErr.keyPattern || {})[0] || "তথ্য";
          return apiError(
            `এই ${field} ইতিমধ্যে ব্যবহৃত হয়েছে। নতুন মান ব্যবহার করুন।`,
            409
          );
        }
      }

      // Mongoose CastError (e.g. invalid ObjectId)
      if (
        typeof error === "object" &&
        error !== null &&
        "name" in error &&
        (error as { name: string }).name === "CastError"
      ) {
        return apiError("প্রদত্ত আইডি বা ফরম্যাটটি সঠিক নয়।", 400);
      }

      // Catch-all generic error
      const errorMessage =
        error instanceof Error ? error.message : "সার্ভারে একটি অভ্যন্তরীণ ত্রুটি হয়েছে।";
      const message =
        process.env.NODE_ENV === "development"
          ? errorMessage
          : "সার্ভারে একটি অভ্যন্তরীণ ত্রুটি হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর চেষ্টা করুন।";

      return apiError(message, 500);
    }
  };
}
