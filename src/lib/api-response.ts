import { NextResponse } from "next/server";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]> | string[] | unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  timestamp: string;
}

/**
 * Standard Success Response (200 OK)
 */
export function apiSuccess<T>(
  data: T,
  message?: string,
  meta?: ApiResponse["meta"]
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}

/**
 * Standard Created Response (201 Created)
 */
export function apiCreated<T>(
  data: T,
  message = "সফলভাবে তৈরি করা হয়েছে।"
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  );
}

/**
 * Standard Error Response
 */
export function apiError(
  message = "একটি সমস্যা ঘটেছে।",
  statusCode = 500,
  errors?: unknown
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  );
}

/**
 * Standard Validation Error (422)
 */
export function apiValidationError(
  errors: unknown,
  message = "প্রদত্ত তথ্যে কিছু ভুল রয়েছে।"
): NextResponse<ApiResponse<null>> {
  return NextResponse.json(
    {
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString(),
    },
    { status: 422 }
  );
}
