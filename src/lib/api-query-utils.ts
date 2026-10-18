import mongoose, { ClientSession } from "mongoose";

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sortBy: string;
  sortOrder: 1 | -1;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Parse standard pagination, sorting, and search query parameters from URLSearchParams
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultSortBy = "createdAt",
  defaultLimit = 10,
  maxLimit = 100
): PaginationParams {
  const pageStr = searchParams.get("page");
  const limitStr = searchParams.get("limit");
  const sortBy = searchParams.get("sortBy") || defaultSortBy;
  const sortOrderStr = searchParams.get("sortOrder") || "desc";

  const page = Math.max(1, parseInt(pageStr || "1", 10) || 1);
  const rawLimit = Math.max(
    1,
    parseInt(limitStr || String(defaultLimit), 10) || defaultLimit
  );
  const limit = Math.min(rawLimit, maxLimit);
  const skip = (page - 1) * limit;
  const sortOrder = sortOrderStr.toLowerCase() === "asc" ? 1 : -1;

  return { page, limit, skip, sortBy, sortOrder };
}

/**
 * Format pagination metadata response
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Run a multi-document database operation in a transaction if supported,
 * otherwise execute directly with graceful standalone fallback.
 */
export async function runWithTransaction<T>(
  callback: (session?: ClientSession) => Promise<T>
): Promise<T> {
  let session: ClientSession | undefined;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await callback(session);

    await session.commitTransaction();
    return result;
  } catch (err: unknown) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }
    // If transactions are not supported on this MongoDB deployment (e.g. standalone server)
    const errMessage = err instanceof Error ? err.message : String(err);
    if (
      errMessage.includes("Transactions are not supported") ||
      errMessage.includes("replica set") ||
      errMessage.includes("standalone")
    ) {
      // Retry without transaction
      return await callback(undefined);
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
