import { Request, Response, NextFunction } from 'express'
import { supabaseAdmin } from '../lib/supabase'
import { ApiError } from '../utils/api-error'

// Extend Express Request type so TypeScript knows req.user exists
// after this middleware runs
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        email: string
        role: 'donor' | 'recipient' | 'volunteer'
      }
    }
  }
}

// requireAuth: verifies the JWT from the Authorization header.
//
// Flow:
//   1. Extract Bearer token from "Authorization: Bearer <token>" header
//   2. Ask Supabase to verify the token (Supabase checks signature + expiry)
//   3. Read the user's role from the JWT's user_metadata
//   4. Attach user info to req.user for downstream handlers
//
// Why ask Supabase to verify instead of verifying locally with a JWT library?
// Supabase rotates signing keys and handles token revocation. Verifying locally
// would miss revoked tokens. For a production system, the network call is worth it.

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new ApiError(401, 'MISSING_TOKEN', 'Authorization header required'))
  }

  const token = authHeader.split(' ')[1]

  const { data, error } = await supabaseAdmin.auth.getUser(token)

  if (error || !data.user) {
    return next(new ApiError(401, 'INVALID_TOKEN', 'Invalid or expired token'))
  }

  const role = data.user.user_metadata?.role as string

  if (!['donor', 'recipient', 'volunteer'].includes(role)) {
    return next(new ApiError(403, 'INVALID_ROLE', 'User has no valid role assigned'))
  }

  // Attach to request — every downstream handler can now read req.user
  req.user = {
    id: data.user.id,
    email: data.user.email!,
    role: role as 'donor' | 'recipient' | 'volunteer',
  }

  next()
}

// requireRole: role guard middleware, used after requireAuth.
// Usage: router.post('/', requireAuth, requireRole('donor'), controller.create)
//
// Why separate from requireAuth?
// Some routes need auth but not a specific role (e.g. GET /donations).
// Separating them lets you compose: requireAuth alone, or requireAuth + requireRole.

export function requireRole(...roles: Array<'donor' | 'recipient' | 'volunteer'>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'MISSING_TOKEN', 'Authentication required'))
    }

    if (!roles.includes(req.user.role)) {
      return next(new ApiError(403, 'FORBIDDEN', `This action requires role: ${roles.join(' or ')}`))
    }

    next()
  }
}
