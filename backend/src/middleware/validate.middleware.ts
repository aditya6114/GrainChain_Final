import { Request, Response, NextFunction } from 'express'
import { ZodSchema } from 'zod'

// Reusable validation middleware factory.
// Takes a Zod schema, returns an Express middleware that validates
// the specified part of the request against that schema.
//
// Usage in routes:
//   router.post('/', validate('body', CreateDonationSchema), controller.create)
//
// If validation fails → Zod throws → global error handler catches it → 400 response
// If validation passes → req.body/query/params is replaced with the parsed,
//   type-safe result (Zod strips unknown fields automatically)

export function validate(
  target: 'body' | 'query' | 'params',
  schema: ZodSchema,
) {
  return (req: Request, _res: Response, next: NextFunction) => {
    // parse() throws ZodError on failure — caught by error handler
    // It also transforms values: e.g. coerces "123" string to number if schema says z.number()
    const parsed = schema.parse(req[target])
    req[target] = parsed
    next()
  }
}
