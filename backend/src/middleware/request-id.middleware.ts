import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

// Attaches a unique ID to every incoming request.
//
// Why? When you have 1000 concurrent requests and something fails,
// you need to find ALL log lines for that specific request.
// Every log line will include this ID, so you can grep for it:
//   grep "req_id:abc-123" production.log
// and see the full story: received → validated → DB query → error
//
// Also sent back in response headers so the frontend can include it
// in bug reports: "here's the request ID for the failed call"

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4()
  req.requestId = requestId
  res.setHeader('X-Request-Id', requestId)
  next()
}
