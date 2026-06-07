// ApiError is a custom error class that carries an HTTP status code
// and a machine-readable code alongside the human message.
//
// Why a custom class instead of just throwing Error?
// - Regular Error has no status code — the error handler can't know
//   whether to send 400, 401, 403, or 500
// - The 'code' string (e.g. 'DONATION_NOT_FOUND') lets frontends
//   show specific UI without parsing error message strings
//
// Usage in services:
//   throw new ApiError(404, 'DONATION_NOT_FOUND', 'Donation not found')
//
// The global error handler catches this and sends:
//   { success: false, error: { code: 'DONATION_NOT_FOUND', message: 'Donation not found' } }

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
    // Restore prototype chain — required when extending built-in classes in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype)
  }
}
