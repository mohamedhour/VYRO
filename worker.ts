import { httpServerHandler } from 'cloudflare:node'
import app from './server'

const port = 8787

// Cloudflare adapts the Express listener to the Workers fetch API.
app.listen(port)
const expressHandler = httpServerHandler({ port })

interface Bindings {
  ASSETS: { fetch(request: Request): Promise<Response> }
  HYPERDRIVE: { host: string; port: number; database: string; user: string; password: string }
}

export default {
  async fetch(request: Request, env: Bindings): Promise<Response> {
    ;(globalThis as typeof globalThis & { __VYRO_HYPERDRIVE?: Bindings['HYPERDRIVE'] }).__VYRO_HYPERDRIVE = env.HYPERDRIVE
    const pathname = new URL(request.url).pathname
    if (pathname === '/health' || pathname.startsWith('/api/') || pathname.startsWith('/uploads/')) {
      return expressHandler.fetch(request, env)
    }

    return env.ASSETS.fetch(request)
  },
}
