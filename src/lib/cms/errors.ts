export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Sign in required") {
    super(message, 401);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Not found") {
    super(message, 404);
  }
}
export class ConflictError extends AppError {
  constructor(message = "Already exists") {
    super(message, 409);
  }
}
export class ValidationError extends AppError {
  constructor(message = "Invalid input") {
    super(message, 400);
  }
}

/** Maps service errors to JSON responses; unknown errors become a generic 500. */
export function errorResponse(err: unknown): Response {
  if (err instanceof AppError) return Response.json({ error: err.message }, { status: err.status });
  console.error(err);
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
