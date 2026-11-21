import { httpServerHandler } from 'cloudflare:node'
import { connect as connectTidb } from '@tidbcloud/serverless'
import app from './server'

const port = 8787

;(globalThis as typeof globalThis & { __VYRO_TIDB_CONNECT?: typeof connectTidb }).__VYRO_TIDB_CONNECT = connectTidb

// Cloudflare adapts the Express listener to the Workers fetch API.
app.listen(port)
const expressHandler = httpServerHandler({ port })

interface Bindings {
  ASSETS: { fetch(request: Request): Promise<Response> }
  TIDB_HOST: string
  TIDB_DATABASE: string
  TIDB_USERNAME: string
  TIDB_PASSWORD: string
}

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    ;(globalThis as typeof globalThis & { __VYRO_TIDB_CONFIG?: Record<string, string> }).__VYRO_TIDB_CONFIG = {
      host: env.TIDB_HOST,
      database: env.TIDB_DATABASE,
      username: env.TIDB_USERNAME,
      password: env.TIDB_PASSWORD,
    }
    const pathname = new URL(request.url).pathname
    if (pathname === '/health' || pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) {
      return expressHandler.fetch(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}
