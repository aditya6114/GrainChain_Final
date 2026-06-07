import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import { ApiError } from '../utils/api-error'

// Global error handler — Express calls this when any route calls next(error)
// or when an async handler throws.
//
// Every error in the entire app funnels through here, which means:
// - Error responses always have the same shape (frontend can rely on it)
// - All errors are logged with full context in one place
// - You never accidentally leak stack traces to clients in production
//
// Express identifies this as an error handler because it takes 4 arguments.
// The signature (err, req, res, next) is how Express knows this is special.

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction, // required by Express even if unused
): void {
  // Log every error with the request context so you can trace what happened
  req.log?.error({ err, requestId: req.requestId }, 'Request failed')

  // Case 1: Zod validation error (invalid request body/params)
  // Shape: { success: false, error: { code: 'VALIDATION_ERROR', message: '...', details: [...] } }
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    })
    return
  }

  // Case 2: Our own ApiError (thrown intentionally from services)
  // e.g. throw new ApiError(404, 'DONATION_NOT_FOUND', 'Donation not found')
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
      },
    })
    return
  }

  // Case 3: Unexpected error — don't leak details to client in production
  const message = process.env.NODE_ENV === 'development' && err instanceof Error
    ? err.message
    : 'Internal server error'

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message,
    },
  })
}
