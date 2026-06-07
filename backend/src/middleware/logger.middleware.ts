import pinoHttp from 'pino-http'
import { env } from '../types/env.schema'

// Pino is the fastest Node.js logger — benchmarks show it's 5x faster than Winston.
// It writes structured JSON logs, not plain text strings.
//
// Plain text log:  "POST /api/donations 201 - 143ms"
// Structured JSON: { "method":"POST", "url":"/api/donations", "statusCode":201,
//                    "responseTime":143, "userId":"uuid...", "reqId":"uuid..." }
//
// Why does JSON matter?
// - Grep works on it: jq '.[] | select(.statusCode >= 500)'
// - Log aggregators (Datadog, Loki, CloudWatch) parse it automatically
// - You can set alerts: "alert if error rate > 1% in last 5 minutes"
// - You can query: "average latency for POST /api/donations today"
//
// None of that is possible with plain text strings.

export const loggerMiddleware = pinoHttp({
  // In development, pretty-print for readability
  // In production, raw JSON for log aggregators
  transport: env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,

  // Customize what gets logged on each request
  customProps: (req) => ({
    requestId: (req as any).requestId,
  }),

  // Don't log health check requests — they'd flood the logs
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
})
