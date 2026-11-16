import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { createRequire } from 'node:module'
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { GoogleGenAI } from '@google/genai'

const app = express()
const port = Number(process.env.PORT || process.env.CHAT_PORT || 3001)
const productsApiBase = (process.env.DATABASE_API_URL || (process.env.NODE_ENV === 'production' ? `http://127.0.0.1:${port}` : process.env.VITE_API_BASE_URL || 'http://localhost:8000')).replace(/\/+$/, '')
const modelName = 'gemini-3.8-flash'
const tryOnModelName = 'gemini-3.1-flash-image'
const fallbackModelNames = ['gemini-3.7-flash', 'gemini-3.6-flash']
const maxMessageLength = 2000
const hourPromoLimit = 20
const hourPromoFile = path.resolve(process.cwd(), 'data', 'promo-hour-claims.json')
const customerStoreFile = path.resolve(process.cwd(), 'data', 'customer-accounts.json')
const welcomeDiscountOrders = 5
const welcomeDiscountPercent = 20
let promoClaimQueue: Promise<unknown> = Promise.resolve()
let customerStoreQueue: Promise<unknown> = Promise.resolve()

type CustomerAccount = {
  id: string
  fullName: string
  email: string
  passwordSalt: string
  passwordHash: string
  discountedOrdersUsed: number
}
type CustomerStore = {
  accounts: Record<string, CustomerAccount>
  sessions: Record<string, { email: string; expiresAt: number }>
  orders: Record<string, { email: string; orderNumber: string; createdAt: number; subtotalMad: number; discountMad: number; totalMad: number }>
}
type CustomerProfile = { fullName: string; email: string; discountPercent: number; discountedOrdersRemaining: number }

function derivePassword(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) => {
    scryptCallback(password, salt, 64, (error, key) => error ? reject(error) : resolve(key as Buffer))
  })
}

function tokenDigest(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

async function loadCustomerStore(): Promise<CustomerStore> {
  try {
    const stored = JSON.parse(await readFile(customerStoreFile, 'utf8')) as Partial<CustomerStore>
    return {
      accounts: stored.accounts && typeof stored.accounts === 'object' ? stored.accounts : {},
      sessions: stored.sessions && typeof stored.sessions === 'object' ? stored.sessions : {},
      orders: stored.orders && typeof stored.orders === 'object' ? stored.orders : {},
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    return { accounts: {}, sessions: {}, orders: {} }
  }
}

function withCustomerStore<T>(operation: (store: CustomerStore) => Promise<T> | T, save = false): Promise<T> {
  const queued = customerStoreQueue.then(async () => {
    const store = await loadCustomerStore()
    const result = await operation(store)
    if (save) {
      await mkdir(path.dirname(customerStoreFile), { recursive: true })
      const tempFile = `${customerStoreFile}.tmp`
      await writeFile(tempFile, JSON.stringify(store, null, 2), 'utf8')
      await rename(tempFile, customerStoreFile)
    }
    return result
  })
  customerStoreQueue = queued.then(() => undefined, () => undefined)
  return queued
}

function customerProfile(account: CustomerAccount): CustomerProfile {
  const remaining = Math.max(0, welcomeDiscountOrders - account.discountedOrdersUsed)
  return { fullName: account.fullName, email: account.email, discountPercent: remaining ? welcomeDiscountPercent : 0, discountedOrdersRemaining: remaining }
}

function authenticatedAccount(request: Request, store: CustomerStore) {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (!token) return null
  const session = store.sessions[tokenDigest(token)]
  if (!session || session.expiresAt <= Date.now()) return null
  return store.accounts[session.email] ?? null
}

app.use(express.json({ limit: '18mb' }))

const baseInstructions = `You are the VYRO Fashion Stylist, the official shopping assistant for VYRO Kids Fashion in Morocco.
Always reply in English. Help parents choose children's clothing, coordinate outfits, and find suitable sizes using each product's available sizes.
Use the supplied catalog data for product names, colors, sizes, prices, and stock. Never invent a product, price, or stock status. If information is missing, say so clearly and suggest contacting the store team.
For sizing advice, ask for the child's age and height when useful. Make clear that recommendations are approximate when an exact size chart is unavailable.
Cash on delivery is available throughout Morocco. Do not promise delivery times or return policies unless they appear in the store data.
Keep replies concise, friendly, and ask only one clarifying question at a time.`

let ai: GoogleGenAI | null = null
let lastGeminiError: { status: number | null; message: string } | null = null
let lastTryOnError: { status: number | null; message: string } | null = null

function getAI() {
  const apiKey = process.env.GEMINI_API_KEY?.trim()
  if (!apiKey || apiKey === 'your_gemini_api_key') return null
  ai ??= new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 120000,
      retryOptions: { attempts: 1 },
    },
  })
  return ai
}

function toText(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback
}

async function loadCatalogContext() {
  const response = await fetch(`${productsApiBase}/api/products/list.php`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) throw new Error(`Products API returned ${response.status}`)

  const body = await response.json() as { products?: unknown[]; data?: { products?: unknown[] } }
  const rows = Array.isArray(body.products) ? body.products : body.data?.products
  if (!Array.isArray(rows)) throw new Error('Products API response was invalid')

  return rows.slice(0, 100).map((value) => {
    const product = value as Record<string, unknown>
    const price = product.price ?? product.priceValue ?? product.price_value
    const stock = Number(product.stock)
    return {
      name: toText(product.name, 'Unnamed product'),
      category: toText(product.category_name) || toText(product.category, 'Other'),
      price: typeof price === 'number' ? `MAD ${price}` : toText(price, 'Price not listed'),
      sizes: Array.isArray(product.sizes) ? product.sizes : toText(product.sizes, 'Not listed'),
      colors: Array.isArray(product.colors) ? product.colors : toText(product.colors, 'Not listed'),
      availability: Number.isFinite(stock) ? (stock > 0 ? `In stock (${stock})` : 'Out of stock') : 'Not listed',
      description: toText(product.description).slice(0, 300),
    }
  })
}

function normalizeHistory(value: unknown) {
  if (!Array.isArray(value)) return []

  const normalized: { role: 'user' | 'model'; parts: { text: string }[] }[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const record = entry as { role?: unknown; parts?: unknown[]; text?: unknown }
    const role = record.role === 'assistant' ? 'model' : record.role
    if (role !== 'user' && role !== 'model') continue
    const firstPart = Array.isArray(record.parts) ? record.parts[0] as { text?: unknown } : null
    const text = toText(firstPart?.text ?? record.text)
    if (!text) continue

    const previous = normalized[normalized.length - 1]
    if (previous?.role === role) previous.parts[0].text += `\n${text}`
    else normalized.push({ role, parts: [{ text }] })
  }

  const recent = normalized.slice(-20)
  if (recent[0]?.role === 'model') recent.shift()
  if (recent[recent.length - 1]?.role === 'user') recent.pop()
  return recent
}

function statusFromError(error: unknown) {
  return typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number'
    ? error.status
    : null
}

function createChat(client: GoogleGenAI, model: string, history: ReturnType<typeof normalizeHistory>, systemInstruction: string) {
  return client.chats.create({
    model,
    history,
    config: {
      systemInstruction,
      thinkingConfig: { thinkingLevel: 'low' },
      maxOutputTokens: 512,
    },
  })
}

app.get('/health', (_request, response) => {
  response.json({ success: true, model: modelName, tryOnModel: tryOnModelName, apiKeyConfigured: Boolean(getAI()), lastGeminiError, lastTryOnError })
})

app.post('/api/auth/register', async (request: Request, response: Response) => {
  const fullName = toText(request.body?.fullName)
  const email = toText(request.body?.email).toLowerCase()
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  if (fullName.length < 2 || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8 || password.length > 200) {
    response.status(400).json({ error: 'Enter a valid name and email, and use a password with at least 8 characters.' })
    return
  }

  try {
    const result = await withCustomerStore(async (store) => {
      if (store.accounts[email]) return { conflict: true as const }
      const salt = randomBytes(16).toString('hex')
      const passwordHash = (await derivePassword(password, salt)).toString('hex')
      const account: CustomerAccount = {
        id: randomBytes(16).toString('hex'),
        fullName: fullName.trim(),
        email,
        passwordSalt: salt,
        passwordHash,
        discountedOrdersUsed: 0,
      }
      const token = randomBytes(32).toString('base64url')
      store.accounts[email] = account
      store.sessions[tokenDigest(token)] = { email, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }
      return { conflict: false as const, token, profile: customerProfile(account) }
    }, true)
    if (result.conflict) {
      response.status(409).json({ error: 'An account with this email already exists. Sign in instead.' })
      return
    }
    response.status(201).json(result)
  } catch (error) {
    console.error('Could not create VYRO customer account:', error)
    response.status(500).json({ error: 'Could not create the account right now. Please try again.' })
  }
})

app.post('/api/auth/login', async (request: Request, response: Response) => {
  const email = toText(request.body?.email).toLowerCase()
  const password = typeof request.body?.password === 'string' ? request.body.password : ''
  try {
    const result = await withCustomerStore(async (store) => {
      const account = store.accounts[email]
      if (!account || !password) return null
      const candidate = await derivePassword(password, account.passwordSalt)
      const expected = Buffer.from(account.passwordHash, 'hex')
      if (candidate.length !== expected.length || !timingSafeEqual(candidate, expected)) return null
      const token = randomBytes(32).toString('base64url')
      store.sessions[tokenDigest(token)] = { email, expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000 }
      return { token, profile: customerProfile(account) }
    }, true)
    if (!result) {
      response.status(401).json({ error: 'Incorrect email or password.' })
      return
    }
    response.json(result)
  } catch (error) {
    console.error('Could not sign in VYRO customer:', error)
    response.status(500).json({ error: 'Could not sign in right now. Please try again.' })
  }
})

app.get('/api/auth/me', async (request: Request, response: Response) => {
  try {
    const profile = await withCustomerStore((store) => {
      const account = authenticatedAccount(request, store)
      return account ? customerProfile(account) : null
    })
    if (!profile) {
      response.status(401).json({ error: 'Your session has expired. Sign in again.' })
      return
    }
    response.json({ profile })
  } catch {
    response.status(500).json({ error: 'Could not load your account right now.' })
  }
})

app.post('/api/auth/logout', async (request: Request, response: Response) => {
  const token = request.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]
  if (token) {
    await withCustomerStore((store) => { delete store.sessions[tokenDigest(token)] }, true)
  }
  response.json({ success: true })
})

app.post('/api/orders/confirm', async (request: Request, response: Response) => {
  const subtotalMad = Number(request.body?.subtotalMad)
  const deliveryFeeMad = Number(request.body?.deliveryFeeMad)
  if (!Number.isFinite(subtotalMad) || subtotalMad <= 0 || !Number.isFinite(deliveryFeeMad) || deliveryFeeMad < 0) {
    response.status(400).json({ error: 'The order total is invalid.' })
    return
  }
  try {
    const order = await withCustomerStore((store) => {
      const account = authenticatedAccount(request, store)
      if (!account) return null
      const remainingBefore = Math.max(0, welcomeDiscountOrders - account.discountedOrdersUsed)
      const discountMad = remainingBefore ? Math.round(subtotalMad * welcomeDiscountPercent / 100) : 0
      const totalMad = Math.max(0, subtotalMad - discountMad) + deliveryFeeMad
      const orderNumber = `VY-${Date.now().toString(36).toUpperCase()}-${randomBytes(2).toString('hex').toUpperCase()}`
      account.discountedOrdersUsed += 1
      store.orders[orderNumber] = {
        email: account.email,
        orderNumber,
        createdAt: Date.now(),
        subtotalMad,
        discountMad,
        totalMad,
      }
      return { orderNumber, subtotalMad, discountMad, totalMad, profile: customerProfile(account) }
    }, true)
    if (!order) {
      response.status(401).json({ error: 'Sign in to use your account order benefit.' })
      return
    }
    response.json(order)
  } catch (error) {
    console.error('Could not confirm VYRO account order:', error)
    response.status(500).json({ error: 'Could not confirm the order right now. Please try again.' })
  }
})

app.post('/api/tryon/generate', async (request: Request, response: Response) => {
  const client = getAI()
  if (!client) {
    response.status(503).json({ error: 'VYRO Fit image generation needs GEMINI_API_KEY in .env. Add the key and restart the app.' })
    return
  }

  const isImage = (value: unknown): value is { mimeType: string; data: string } =>
    typeof value === 'object' && value !== null &&
    'mimeType' in value && 'data' in value &&
    typeof value.mimeType === 'string' && /^image\/(jpeg|png|webp)$/.test(value.mimeType) &&
    typeof value.data === 'string' && /^[A-Za-z0-9+/]+={0,2}$/.test(value.data)

  const photo = request.body?.photo
  const garments = request.body?.garments
  if (!isImage(photo) || !Array.isArray(garments) || garments.length < 1 || garments.length > 5 ||
      garments.some((garment: any) => !garment || typeof garment.name !== 'string' || !isImage(garment.image))) {
    response.status(400).json({ error: 'Upload a photo and select one to five products with valid product images.' })
    return
  }

  const prompt = [
    'Create a photorealistic virtual clothing try-on image using the first image as the person and the following images as the exact selected garment references.',
    'Edit the first image so this same person is wearing the selected items. Preserve their face, identity, body shape, pose, skin tone, and the original scene as closely as possible.',
    'Reproduce the garments from their reference images as faithfully as possible, including silhouette, color, material, visible logos, and details. Fit them naturally to the person. Do not add unselected clothing items or text. Keep the full person in frame.',
    ...garments.map((garment: any, index: number) => `Garment reference ${index + 1}: ${String(garment.name).slice(0, 120)}.`),
    'Return only the edited image.',
  ].join('\n')

  try {
    const parts: any[] = [
      { inlineData: { mimeType: photo.mimeType, data: photo.data } },
      ...garments.map((garment: any) => ({ inlineData: { mimeType: garment.image.mimeType, data: garment.image.data } })),
      { text: prompt },
    ]
    const result = await client.models.generateContent({
      model: tryOnModelName,
      contents: [{ role: 'user', parts }],
      config: { responseModalities: ['TEXT', 'IMAGE'] },
    })
    const outputParts = result.candidates?.[0]?.content?.parts ?? []
    const generatedImage = outputParts.find((part: any) => part.inlineData?.data)?.inlineData
    if (!generatedImage?.data) {
      throw new Error(outputParts.find((part: any) => part.text)?.text || 'The image model did not return a try-on image. Please try a different photo.')
    }
    lastTryOnError = null
    response.json({ mode: 'generated', image: `data:${generatedImage.mimeType || 'image/png'};base64,${generatedImage.data}`, generatedAt: new Date().toISOString() })
  } catch (error) {
    const status = statusFromError(error)
    const detail = error instanceof Error ? error.message : String(error)
    const safeDetail = detail
      .replace(/([?&]key=)[^&\s]+/gi, '$1[redacted]')
      .replace(/AIza[\w-]{20,}/g, '[redacted]')
      .slice(0, 400)
    lastTryOnError = { status, message: safeDetail }
    console.error('VYRO Fit image generation failed:', lastTryOnError)
    const normalizedDetail = detail.toLowerCase()
    const quotaExceeded = status === 429 || /resource_exhausted|quota|billing|free tier/.test(normalizedDetail)
    const accessDenied = status === 403 || /permission denied|not authorized/.test(normalizedDetail)
    const modelUnavailable = status === 404 || /model .*not found|not supported for generatecontent/.test(normalizedDetail)

    if (quotaExceeded) {
      response.status(429).json({ error: 'Gemini image generation quota is unavailable for this project. Enable billing for the Gemini API project or check its image model limits in Google AI Studio, then try again.' })
      return
    }
    if (accessDenied) {
      response.status(403).json({ error: 'This Gemini project cannot access the image generation model. Check the API key and model access in Google AI Studio.' })
      return
    }
    if (modelUnavailable) {
      response.status(502).json({ error: 'The configured Gemini image model is unavailable for this project. Check model access in Google AI Studio.' })
      return
    }
    response.status(status === 503 ? 503 : 502).json({
      error: status === 503
        ? 'Gemini image generation is temporarily unavailable. Wait a moment and try again.'
        : 'Could not create the try-on image. Try a clear, full-body photo and try again.',
    })
  }
})

app.post('/api/promotions/validate', async (request: Request, response: Response) => {
  const code = toText(request.body?.code).toUpperCase()
  const customerId = toText(request.body?.customerId)
  if (code !== 'HOUR') {
    response.status(400).json({ error: 'Invalid promo code.' })
    return
  }
  if (!/^[\w-]{16,80}$/.test(customerId)) {
    response.status(400).json({ error: 'Could not identify this browser for the promotion.' })
    return
  }

  const claim = promoClaimQueue.then(async () => {
    let customerIds: string[] = []
    try {
      const saved = JSON.parse(await readFile(hourPromoFile, 'utf8')) as { customerIds?: unknown }
      if (Array.isArray(saved.customerIds)) {
        customerIds = saved.customerIds.filter((value): value is string => typeof value === 'string')
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    }

    if (customerIds.includes(customerId)) {
      return { allowed: true, remaining: Math.max(0, hourPromoLimit - customerIds.length) }
    }
    if (customerIds.length >= hourPromoLimit) return { allowed: false, remaining: 0 }

    customerIds.push(customerId)
    await mkdir(path.dirname(hourPromoFile), { recursive: true })
    const tempFile = `${hourPromoFile}.tmp`
    await writeFile(tempFile, JSON.stringify({ customerIds }, null, 2), 'utf8')
    await rename(tempFile, hourPromoFile)
    return { allowed: true, remaining: hourPromoLimit - customerIds.length }
  })
  promoClaimQueue = claim.then(() => undefined, () => undefined)

  try {
    const result = await claim
    if (!result.allowed) {
      response.status(409).json({ error: 'This promotion has reached its 20-customer limit.', remaining: 0 })
      return
    }
    response.json({ valid: true, discountPercent: 10, remaining: result.remaining })
  } catch (error) {
    console.error('Could not reserve HOUR promotion:', error)
    response.status(500).json({ error: 'Promo validation is temporarily unavailable. Please try again.' })
  }
})

app.post('/api/chat', async (request: Request, response: Response) => {
  const message = toText(request.body?.message)
  if (!message) {
    response.status(400).json({ error: 'Please type a question so I can help.' })
    return
  }
  if (message.length > maxMessageLength) {
    response.status(400).json({ error: 'That message is too long. Shorten it and try again.' })
    return
  }

  const client = getAI()
  if (!client) {
    response.status(503).json({ error: 'The Gemini key is not configured. Add GEMINI_API_KEY to .env and restart the app.' })
    return
  }

  let catalogInstruction = 'The catalog is temporarily unavailable. Do not guess products or prices; ask the customer to try again later.'
  try {
    const catalog = await loadCatalogContext()
    catalogInstruction = `Current catalog from the store database (authoritative product, price, and availability data):\n${JSON.stringify(catalog)}`
  } catch (error) {
    console.warn('Could not load VYRO product catalog for chat:', error)
  }

  try {
    const history = normalizeHistory(request.body?.history)
    const systemInstruction = `${baseInstructions}\n\n${catalogInstruction}`
    const modelsToTry = [modelName, ...fallbackModelNames]
    let responseModel = modelName
    let result: Awaited<ReturnType<ReturnType<typeof client.chats.create>['sendMessage']>> | undefined
    let lastOverloadError: unknown

    for (const candidateModel of modelsToTry) {
      try {
        result = await createChat(client, candidateModel, history, systemInstruction).sendMessage({ message })
        responseModel = candidateModel
        break
      } catch (modelError) {
        if (![429, 503].includes(statusFromError(modelError) ?? 0)) throw modelError
        lastOverloadError = modelError
        console.warn(`${candidateModel} is busy.`)
      }
    }

    if (!result) throw lastOverloadError || new Error('All Gemini models are unavailable.')

    lastGeminiError = null
    response.json({ reply: result.text || 'Sorry, I could not prepare a reply. Please try asking another way.', model: responseModel })
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    const status = statusFromError(error)
    lastGeminiError = {
      status,
      message: detail
        .replace(/([?&]key=)[^&\s]+/gi, '$1[redacted]')
        .replace(/AIza[\w-]{20,}/g, '[redacted]')
        .slice(0, 500),
    }
    console.error('Gemini stylist request failed:', lastGeminiError)
    const isBusy = status === 429 || status === 503 || status === 504
    response.status(isBusy ? 503 : 502).json({
      error: isBusy
        ? 'Gemini is busy or taking too long right now. Please wait a moment and try again.'
        : 'There was a problem connecting to the VYRO Fashion Stylist. Please try again shortly.',
    })
  }
})

if (process.env.NODE_ENV === 'production') {
  const distDirectory = path.resolve(process.cwd(), 'dist')
  const require = createRequire(import.meta.url)
  const legacyApi = require('./backend/server.js')

  app.use(express.static(distDirectory))
  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/') || request.path.startsWith('/uploads/')) return next()
    response.sendFile(path.join(distDirectory, 'index.html'), error => error && next(error))
  })
  app.use(legacyApi)
}

app.listen(port, '0.0.0.0', () => {
  console.log(`VYRO ${process.env.NODE_ENV === 'production' ? 'site and API' : 'stylist API'} listening on port ${port}`)
})
