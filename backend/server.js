'use strict';

// VYRO API for Node.js + Express + MySQL. Route names intentionally retain
// the existing .php suffix so deployed frontends can switch servers without
// changing every API URL.
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');
let connectTidb;
let bcrypt;
try { bcrypt = require('bcryptjs'); } catch { bcrypt = null; }

const app = express();
if (process.env.CLOUDFLARE_WORKER === 'true') app.set('trust proxy', 1);
const port = Number(process.env.PORT || 8000);
const secret = process.env.VYRO_SESSION_SECRET;
const allowedOrigins = (process.env.VYRO_ALLOWED_ORIGINS || 'http://localhost:5173').split(',').map(x => x.trim()).filter(Boolean);
const secureCookie = /^(1|true|yes)$/i.test(process.env.VYRO_IS_HTTPS || 'false');
const debug = /^(1|true|yes)$/i.test(process.env.VYRO_DEBUG || 'false');
let activePool;
function edgeDatabaseClient() {
  const config = globalThis.__VYRO_TIDB_CONFIG;
  if (!config?.host || !config?.username || !config?.password || !config?.database) {
    throw new Error('TiDB Cloud database settings are missing.');
  }
  if (!connectTidb) ({ connect: connectTidb } = require('@tidbcloud/serverless'));
  const connection = connectTidb({ ...config, fullResult: true });
  let transaction;
  async function run(sql, values) {
    const result = await (transaction || connection).execute(sql, values, { fullResult: true });
    return [result.rows || [], {
      affectedRows: Number(result.rowsAffected || 0),
      insertId: Number(result.lastInsertId || 0),
    }];
  }
  return {
    execute: run,
    query: run,
    async beginTransaction() { transaction = await connection.begin(); },
    async commit() {
      if (!transaction) return;
      const current = transaction;
      try { await current.commit(); } finally { transaction = undefined; }
    },
    async rollback() {
      if (!transaction) return;
      const current = transaction;
      try { await current.rollback(); } finally { transaction = undefined; }
    },
    release() {},
  };
}
function getPool() {
  if (activePool) return activePool;
  if (process.env.CLOUDFLARE_WORKER === 'true') {
    if (!globalThis.__VYRO_TIDB_CONFIG) throw new Error('TiDB Cloud database settings are missing.');
    // TiDB's HTTP serverless driver works in Workers and avoids the MySQL
    // AuthSwitchRequest handshake that Hyperdrive currently rejects for TiDB.
    activePool = {
      execute: (...args) => edgeDatabaseClient().execute(...args),
      query: (...args) => edgeDatabaseClient().query(...args),
      getConnection: async () => edgeDatabaseClient(),
    };
  } else {
    activePool = mysql.createPool({
      host: process.env.VYRO_DB_HOST || '127.0.0.1',
      port: Number(process.env.VYRO_DB_PORT || 3307),
      database: process.env.VYRO_DB_NAME || 'vyro_db',
      user: process.env.VYRO_DB_USER || 'vyro_app',
      password: process.env.VYRO_DB_PASS || '',
      ssl: /^(1|true|yes)$/i.test(process.env.VYRO_DB_SSL || 'false') ? { minVersion: 'TLSv1.2' } : undefined,
      charset: 'utf8mb4', waitForConnections: true, connectionLimit: 10,
      queueLimit: 0, decimalNumbers: true,
    });
  }
  return activePool;
}
const pool = new Proxy({}, {
  get(_target, property) {
    const value = getPool()[property];
    return typeof value === 'function' ? value.bind(getPool()) : value;
  },
});
globalThis.__VYRO_DB_POOL = pool;
const localDataRoot = process.env.CLOUDFLARE_WORKER === 'true' ? '/tmp/vyro' : __dirname;
const privatePhotos = path.join(localDataRoot, 'private', 'tryon-photos');
const productPhotos = path.join(localDataRoot, 'public', 'uploads', 'products');
const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
class RequestValidationError extends Error {}

if (!secret || secret.length < 32) {
  console.error('Set VYRO_SESSION_SECRET to a random value of at least 32 characters.');
  process.exit(1);
}

app.disable('x-powered-by');
app.use((req, res, next) => {
  const origin = req.get('Origin');
  const sameOrigin = origin && origin === `${req.get('x-forwarded-proto')?.split(',')[0] || req.protocol}://${req.get('host')}`;
  if (origin && (allowedOrigins.includes(origin) || sameOrigin)) {
    res.set('Access-Control-Allow-Origin', origin);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.vary('Origin');
  }
  res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  if (req.method === 'OPTIONS') return res.status(204).end();
  next();
});
app.use(express.json({ limit: '12mb', type: ['application/json', 'application/*+json'] }));

const cookieName = 'vyro_session';
function b64(value) { return Buffer.from(value).toString('base64url'); }
function sign(value) { return crypto.createHmac('sha256', secret).update(value).digest('base64url'); }
function newSession(userId = null) {
  const session = { userId, csrf: crypto.randomBytes(32).toString('hex'), exp: Date.now() + 7 * 86400000 };
  const payload = b64(JSON.stringify(session));
  return { token: `${payload}.${sign(payload)}`, session };
}
function getSession(req) {
  const token = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  try { const session = JSON.parse(Buffer.from(payload, 'base64url').toString()); return session.exp > Date.now() ? session : null; } catch { return null; }
}
function setSession(res, userId = null) {
  const created = newSession(userId);
  res.cookie(cookieName, created.token, { httpOnly: true, sameSite: 'lax', secure: secureCookie, path: '/', maxAge: 7 * 86400000 });
  return created.session;
}
function ok(res, data, status = 200) { return res.status(status).json({ success: true, data }); }
function fail(res, message, status = 400, details) { const body = { success: false, error: message }; if (details) body.details = details; return res.status(status).json(body); }
function requireCsrf(req, res, next) {
  const session = getSession(req); const origin = req.get('Origin'); const csrf = req.get('X-CSRF-Token');
  const sameOrigin = origin && origin === `${req.get('x-forwarded-proto')?.split(',')[0] || req.protocol}://${req.get('host')}`;
  if ((origin && !allowedOrigins.includes(origin) && !sameOrigin) || !session || !csrf || !safeEqual(session.csrf, csrf)) return fail(res, 'Invalid security token. Refresh the page and try again.', 403);
  req.vyroSession = session; next();
}
function safeEqual(a, b) { const aa = Buffer.from(String(a)); const bb = Buffer.from(String(b)); return aa.length === bb.length && crypto.timingSafeEqual(aa, bb); }
async function hashPassword(password) {
  if (bcrypt) return bcrypt.hash(password, 12);
  const salt = crypto.randomBytes(16);
  const hash = await new Promise((resolve, reject) => crypto.scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 }, (error, value) => error ? reject(error) : resolve(value)));
  return `scrypt$16384$8$1$${salt.toString('hex')}$${hash.toString('hex')}`;
}
async function verifyPassword(password, stored) {
  if (stored.startsWith('$2') && bcrypt) return bcrypt.compare(password, stored);
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, salt, expected] = parts;
  try { const actual = await new Promise((resolve, reject) => crypto.scrypt(password, Buffer.from(salt, 'hex'), Buffer.from(expected, 'hex').length, { N: Number(n), r: Number(r), p: Number(p) }, (error, value) => error ? reject(error) : resolve(value))); return safeEqual(actual, Buffer.from(expected, 'hex')); } catch { return false; }
}
function requireUser(req, res, next) { const s = req.vyroSession || getSession(req); if (!s?.userId) return fail(res, 'Please sign in to continue.', 401); req.userId = Number(s.userId); req.vyroSession = s; next(); }
async function requireAdmin(req, res, next) {
  try { const [rows] = await pool.execute('SELECT id, full_name, email, is_admin FROM users WHERE id=? LIMIT 1', [req.userId]); if (!rows[0]?.is_admin) return fail(res, 'Administrator access required.', 403); req.admin = rows[0]; next(); }
  catch (e) { next(e); }
}
app.use((req, res, next) => {
  const s = getSession(req); req.vyroSession = s || setSession(res);
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return requireCsrf(req, res, next);
  next();
});
function method(methodName) { return (req, res, next) => req.method === methodName ? next() : fail(res, 'Method not allowed.', 405); }
function body(req) { return req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {}; }
function requiredFields(data, fields) { const errors = {}; for (const [key, label] of fields) if (data[key] == null || String(data[key]).trim() === '') errors[key] = `${label} is required.`; return errors; }
function emailValid(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '')); }
function publicUser(row) { return { id: Number(row.id), fullName: row.full_name, email: row.email, isAdmin: !!row.is_admin }; }
function slugify(s) { return String(s || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
function parseJson(value, fallback = []) { if (Array.isArray(value) || (value && typeof value === 'object')) return value; try { return JSON.parse(value || 'null') ?? fallback; } catch { return fallback; } }
function publicProduct(row) {
  const priceValue = Number(row.price_value);
  return { id: row.id, name: row.name, description: row.description, materials: row.materials, category: row.category_name, categorySlug: row.category_slug,
    categoryId: Number(row.category_id), price: `MAD ${priceValue.toLocaleString('en-US')}`, priceValue, image: row.image_url,
    sizes: parseJson(row.sizes), colors: parseJson(row.colors), stock: Number(row.stock), rating: Number(row.rating), reviewCount: Number(row.review_count), isNew: !!row.is_new };
}
async function productById(id) { const [rows] = await pool.execute('SELECT p.*,c.name category_name,c.slug category_slug FROM products p JOIN categories c ON c.id=p.category_id WHERE p.id=? LIMIT 1', [id]); return rows[0] ? publicProduct(rows[0]) : null; }
app.get('/api/auth/csrf.php', (req, res) => ok(res, { csrfToken: req.vyroSession.csrf }));
app.post('/api/auth/register.php', method('POST'), async (req, res) => {
  const data = body(req); const errors = requiredFields(data, [['fullName','Full name'],['email','Email'],['password','Password']]);
  if (!errors.email && !emailValid(data.email)) errors.email = 'Enter a valid email address.';
  if (!errors.fullName && String(data.fullName).trim().length < 2) errors.fullName = 'Enter your full name.';
  if (!errors.password && (String(data.password).length < 8 || !/[a-z]/i.test(data.password) || !/[0-9]/.test(data.password))) errors.password = String(data.password).length < 8 ? 'Use at least 8 characters.' : 'Include at least one letter and one number.';
  if (Object.keys(errors).length) return fail(res, 'Please correct the highlighted fields.', 422, errors);
  const email = String(data.email).trim().toLowerCase(); const [existing] = await pool.execute('SELECT id FROM users WHERE email=? LIMIT 1', [email]);
  if (existing.length) return fail(res, 'An account with this email already exists.', 409);
  const hash = await hashPassword(data.password); const [result] = await pool.execute('INSERT INTO users (full_name,email,password_hash) VALUES (?,?,?)', [String(data.fullName).trim(), email, hash]);
  const [rows] = await pool.execute('SELECT * FROM users WHERE id=?', [result.insertId]); setSession(res, result.insertId); return ok(res, { user: publicUser(rows[0]) }, 201);
});
app.post('/api/auth/login.php', method('POST'), async (req, res) => {
  const data = body(req); const errors = requiredFields(data, [['email','Email'],['password','Password']]); if (!errors.email && !emailValid(data.email)) errors.email = 'Enter a valid email address.';
  if (Object.keys(errors).length) return fail(res, 'Please correct the highlighted fields.', 422, errors);
  const [rows] = await pool.execute('SELECT * FROM users WHERE email=? LIMIT 1', [String(data.email).trim().toLowerCase()]);
  if (!rows[0] || !(await verifyPassword(data.password, rows[0].password_hash))) return fail(res, 'Incorrect email or password.', 401);
  setSession(res, rows[0].id); return ok(res, { user: publicUser(rows[0]) });
});
app.post('/api/auth/logout.php', method('POST'), (req,res) => { res.clearCookie(cookieName, { httpOnly: true, sameSite: 'lax', secure: secureCookie, path: '/' }); return ok(res, { message: 'Logged out.' }); });
app.get('/api/auth/me.php', async (req,res) => { const id = req.vyroSession?.userId; if (!id) return ok(res, { user: null }); const [rows] = await pool.execute('SELECT * FROM users WHERE id=? LIMIT 1',[id]); return ok(res,{user:rows[0]?publicUser(rows[0]):null}); });

app.get('/api/categories/list.php', async (_req,res) => { const [rows] = await pool.query('SELECT id,name,slug FROM categories ORDER BY name'); return ok(res,{categories:rows}); });
app.get('/api/products/list.php', async (req,res) => {
  const q=req.query; const where=[]; const args=[]; if(q.category){where.push('c.slug=?');args.push(q.category);} if(q.search){where.push('(p.name LIKE ? OR p.description LIKE ?)');args.push(`%${q.search}%`,`%${q.search}%`);} if(q.maxPrice!==undefined&&Number.isFinite(Number(q.maxPrice))){where.push('p.price_value<=?');args.push(Number(q.maxPrice));} if(q.inStockOnly==='true')where.push('p.stock>0');
  const sorts={'featured':'p.is_new DESC,p.rating DESC','price-asc':'p.price_value ASC','price-desc':'p.price_value DESC','newest':'p.is_new DESC,p.created_at DESC','rating':'p.rating DESC'}; const order=sorts[q.sort]||sorts.featured;
  const [rows]=await pool.execute(`SELECT p.*,c.name category_name,c.slug category_slug FROM products p JOIN categories c ON c.id=p.category_id ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY ${order}`,args); return ok(res,{products:rows.map(publicProduct)});
});
app.get('/api/products/detail.php', async (req,res) => { if(!req.query.id)return fail(res,'A product id is required.',400); const p=await productById(req.query.id); return p?ok(res,{product:p}):fail(res,'Product not found.',404); });

app.get('/api/wishlist/list.php',requireUser,async(req,res)=>{const [rows]=await pool.execute('SELECT p.*,c.name category_name,c.slug category_slug FROM wishlist w JOIN products p ON p.id=w.product_id JOIN categories c ON c.id=p.category_id WHERE w.user_id=? ORDER BY w.created_at DESC',[req.userId]);return ok(res,{products:rows.map(r=>({id:r.id,name:r.name,category:r.category_name,price:`MAD ${Number(r.price_value).toLocaleString('en-US')}`,priceValue:Number(r.price_value),image:r.image_url,sizes:parseJson(r.sizes),colors:parseJson(r.colors),stock:Number(r.stock),rating:Number(r.rating)}))});});
app.post('/api/wishlist/toggle.php',method('POST'),requireUser,async(req,res)=>{const id=body(req).productId;if(!id)return fail(res,'Product is required.',422,{productId:'Product is required.'});const [p]=await pool.execute('SELECT id FROM products WHERE id=?',[id]);if(!p.length)return fail(res,'Product not found.',404);const [w]=await pool.execute('SELECT id FROM wishlist WHERE user_id=? AND product_id=?',[req.userId,id]);if(w.length){await pool.execute('DELETE FROM wishlist WHERE id=?',[w[0].id]);return ok(res,{wishlisted:false});}await pool.execute('INSERT INTO wishlist(user_id,product_id) VALUES(?,?)',[req.userId,id]);return ok(res,{wishlisted:true});});

app.post('/api/orders/create.php',method('POST'),requireUser,async(req,res)=>{
 const d=body(req);const errors=requiredFields(d,[['fullName','Full name'],['email','Email'],['phone','Phone'],['address','Address'],['city','City'],['postalCode','Postal code'],['paymentMethod','Payment method']]);if(!errors.email&&!emailValid(d.email))errors.email='Enter a valid email address.';if(!errors.postalCode&&!/^\d{5}$/.test(String(d.postalCode)))errors.postalCode='Enter a valid 5-digit postal code.';if(!errors.paymentMethod&&!['cod','card'].includes(d.paymentMethod))errors.paymentMethod='Choose a valid payment method.';if(Object.keys(errors).length)return fail(res,'Please correct the highlighted fields.',422,errors);if(!Array.isArray(d.items)||!d.items.length)return fail(res,'Your cart is empty.',422);
 const conn=await pool.getConnection();try{await conn.beginTransaction();let subtotal=0;const lines=[];const required=new Map();for(const item of d.items){const qty=Number(item.quantity??1);if(!item.productId||!Number.isInteger(qty)||qty<1)throw new RequestValidationError('Each item needs a valid product and quantity.');required.set(String(item.productId),(required.get(String(item.productId))||0)+qty);}const products=new Map();for(const[id,qty]of required){const[ps]=await conn.execute('SELECT id,name,price_value,stock FROM products WHERE id=? FOR UPDATE',[id]);if(!ps[0])throw new RequestValidationError(`Product "${id}" no longer exists.`);if(Number(ps[0].stock)<qty)throw new RequestValidationError(`"${ps[0].name}" doesn't have enough stock left.`);products.set(id,ps[0]);}for(const item of d.items){const qty=Number(item.quantity??1);const p=products.get(String(item.productId));const price=Number(p.price_value);subtotal+=price*qty;lines.push({p,item,qty,price});}
 const shipping=subtotal>=1500?0:50;const orderNumber='VYRO-'+crypto.randomBytes(5).toString('hex').toUpperCase();const [insert]=await conn.execute('INSERT INTO orders(order_number,user_id,full_name,email,phone,address,city,postal_code,payment_method,subtotal,shipping,total) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)',[orderNumber,req.userId,d.fullName,d.email,d.phone,d.address,d.city,d.postalCode,d.paymentMethod,subtotal,shipping,subtotal+shipping]);
 for(const l of lines){await conn.execute('INSERT INTO order_items(order_id,product_id,product_name,size,color,quantity,unit_price,line_total) VALUES(?,?,?,?,?,?,?,?)',[insert.insertId,l.p.id,l.p.name,l.item.size||null,l.item.color||null,l.qty,l.price,l.qty*l.price]);await conn.execute('UPDATE products SET stock=stock-? WHERE id=?',[l.qty,l.p.id]);}await conn.commit();return ok(res,{order:await getOrder(req.userId,insert.insertId)},201);
 }catch(e){await conn.rollback();if(e instanceof RequestValidationError)return fail(res,e.message,422);throw e;}finally{conn.release();}
});
async function getOrder(userId,id){const [o]=await pool.execute('SELECT * FROM orders WHERE id=? AND user_id=?',[id,userId]);if(!o[0])return null;const [items]=await pool.execute('SELECT * FROM order_items WHERE order_id=?',[id]);const r=o[0];return{id:Number(r.id),orderNumber:r.order_number,status:r.status,customer:{fullName:r.full_name,email:r.email,phone:r.phone},address:{address:r.address,city:r.city,postalCode:r.postal_code},paymentMethod:r.payment_method,subtotal:Number(r.subtotal),shipping:Number(r.shipping),total:Number(r.total),placedAt:r.created_at,items:items.map(i=>({productId:i.product_id,name:i.product_name,size:i.size,color:i.color,quantity:Number(i.quantity),unitPrice:Number(i.unit_price),lineTotal:Number(i.line_total)}))};}
app.get('/api/orders/list.php',requireUser,async(req,res)=>{const[ids]=await pool.execute('SELECT id FROM orders WHERE user_id=? ORDER BY created_at DESC',[req.userId]);return ok(res,{orders:await Promise.all(ids.map(x=>getOrder(req.userId,x.id)))});});
app.get('/api/orders/detail.php',requireUser,async(req,res)=>{const id=Number(req.query.id);if(!Number.isInteger(id)||id<1)return fail(res,'A valid order id is required.',400);const order=await getOrder(req.userId,id);return order?ok(res,{order}):fail(res,'Order not found.',404);});

// Remaining API routes are registered below; admin and saved-look handlers
// share the same response and authentication helpers as the customer API.
app.post('/api/saved-looks/create.php',method('POST'),requireUser,async(req,res)=>{const d=body(req);if(!['try-on','look-builder'].includes(d.source))return fail(res,'Please correct the highlighted fields.',422,{source:'Invalid source.'});if(!Array.isArray(d.productIds)||!d.productIds.length)return fail(res,'A saved look needs at least one item.',422);let photoName=null;try{if(d.photoDataUrl)photoName=await saveImage(d.photoDataUrl,privatePhotos,8*1024*1024,'tryon');const conn=await pool.getConnection();try{await conn.beginTransaction();const [look]=await conn.execute('INSERT INTO saved_looks(user_id,photo_url) VALUES(?,?)',[req.userId,photoName]);for(const id of d.productIds){const[p]=await conn.execute('SELECT id FROM products WHERE id=?',[String(id)]);if(!p.length)throw new Error(`Product "${id}" no longer exists.`);await conn.execute('INSERT INTO look_items(saved_look_id,product_id) VALUES(?,?)',[look.insertId,String(id)]);}await conn.commit();return ok(res,{look:await getLook(req.userId,look.insertId)},201);}catch(e){await conn.rollback();throw e;}finally{conn.release();}}catch(e){if(photoName)await removeImage(privatePhotos,photoName,'tryon').catch(()=>{});return fail(res,e.message,422);}});
async function getLook(userId,id){const[l]=await pool.execute('SELECT * FROM saved_looks WHERE id=? AND user_id=?',[id,userId]);if(!l[0])return null;const[items]=await pool.execute('SELECT p.id,p.name,p.image_url,p.price_value FROM look_items li JOIN products p ON p.id=li.product_id WHERE li.saved_look_id=?',[id]);return{id:Number(l[0].id),createdAt:l[0].created_at,photoUrl:l[0].photo_url?`/api/saved-looks/photo.php?id=${id}`:null,items:items.map(i=>({id:i.id,name:i.name,image:i.image_url,priceValue:Number(i.price_value)}))};}
app.get('/api/saved-looks/list.php',requireUser,async(req,res)=>{const[ids]=await pool.execute('SELECT id FROM saved_looks WHERE user_id=? ORDER BY created_at DESC',[req.userId]);return ok(res,{looks:await Promise.all(ids.map(l=>getLook(req.userId,l.id)))});});
app.post('/api/saved-looks/delete.php',method('POST'),requireUser,async(req,res)=>{const id=Number(body(req).id);if(!Number.isInteger(id)||id<1)return fail(res,'A valid look id is required.',400);const[l]=await pool.execute('SELECT photo_url FROM saved_looks WHERE id=? AND user_id=?',[id,req.userId]);if(!l[0])return fail(res,'Saved look not found.',404);await pool.execute('DELETE FROM saved_looks WHERE id=? AND user_id=?',[id,req.userId]);if(l[0].photo_url)await removeImage(privatePhotos,path.basename(l[0].photo_url),'tryon').catch(()=>{});return ok(res,{message:'Look deleted.'});});
app.get('/api/saved-looks/photo.php',requireUser,async(req,res)=>{const id=Number(req.query.id);if(!Number.isInteger(id)||id<1)return fail(res,'Photo not found.',404);const[l]=await pool.execute('SELECT photo_url FROM saved_looks WHERE id=? AND user_id=?',[id,req.userId]);const filename=l[0]?.photo_url;if(!filename||! /^[a-f0-9]{32}\.(jpg|png|webp)$/.test(filename))return fail(res,'Photo not found.',404);try{let bytes,type;if(process.env.CLOUDFLARE_WORKER==='true'){const[images]=await pool.execute('SELECT content_type,content FROM app_uploads WHERE object_key=?',[`tryon/${filename}`]);if(!images[0])return fail(res,'Photo not found.',404);bytes=Buffer.from(images[0].content);type=images[0].content_type;}else{bytes=await fs.readFile(path.join(privatePhotos,filename));type=sniffImage(bytes);}if(!type||!sniffImage(bytes))return fail(res,'Photo not found.',404);res.set({'Content-Type':type,'Content-Length':String(bytes.length),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache','Content-Disposition':'inline; filename="vyro-fit-photo"'});return res.send(bytes);}catch{return fail(res,'Photo not found.',404);}});
app.post('/api/tryon-events/log.php',method('POST'),async(req,res)=>{const ids=body(req).productIds;if(!Array.isArray(ids)||!ids.length)return fail(res,'At least one product id is required.',400);const userId=req.vyroSession?.userId||null;await pool.execute('INSERT INTO tryon_events(user_id,product_ids) VALUES(?,?)',[userId,JSON.stringify(ids)]);return ok(res,{message:'Logged.'},201);});

app.get('/api/admin/dashboard.php',requireUser,requireAdmin,async(_req,res)=>{const results=await Promise.all([pool.query("SELECT COALESCE(SUM(total),0) total FROM orders WHERE status!='cancelled'"),pool.query('SELECT COUNT(*) total FROM orders'),pool.query('SELECT COUNT(*) total FROM users WHERE is_admin=0'),pool.query('SELECT COUNT(*) total FROM products'),pool.query('SELECT COUNT(*) total FROM products WHERE stock<=5')]);const revenue=results[0][0][0],orders=results[1][0][0],customers=results[2][0][0],products=results[3][0][0],low=results[4][0][0];return ok(res,{totalRevenue:Number(revenue.total),totalOrders:Number(orders.total),totalCustomers:Number(customers.total),totalProducts:Number(products.total),lowStockCount:Number(low.total)});});
app.get('/api/admin/products-list.php',requireUser,requireAdmin,async(_req,res)=>{const[rows]=await pool.query('SELECT p.*,c.name category_name,c.slug category_slug FROM products p JOIN categories c ON c.id=p.category_id ORDER BY p.created_at DESC');return ok(res,{products:rows.map(publicProduct)});});
app.post('/api/admin/products-create.php',method('POST'),requireUser,requireAdmin,productWrite);
app.post('/api/admin/products-update.php',method('POST'),requireUser,requireAdmin,productWrite);
async function productWrite(req,res){const d=body(req);const errs=requiredFields(d,[['name','Name'],['categoryId','Category'],['priceValue','Price'],['stock','Stock']]);for(const f of ['categoryId','priceValue','stock'])if(d[f]!==undefined&&(!Number.isInteger(Number(d[f]))||Number(d[f])<(f==='stock'?0:1)))errs[f]=`${f==='stock'?'Stock':f==='categoryId'?'Category':'Price'} must be a ${f==='stock'?'zero or positive':'positive'} whole number.`;if(Object.keys(errs).length)return fail(res,'Please correct the highlighted fields.',422,errs);const id=req.path.endsWith('products-update.php')?String(d.id||''):slugify(d.name);if(!id)return fail(res,'A product id is required.',400);try{const vals=[Number(d.categoryId),String(d.name).trim(),d.description||null,d.materials||null,Number(d.priceValue),d.image||null,JSON.stringify(d.sizes||[]),JSON.stringify(d.colors||[]),Number(d.stock),d.isNew?1:0];if(req.path.endsWith('products-update.php')){const[r]=await pool.execute('UPDATE products SET category_id=?,name=?,description=?,materials=?,price_value=?,image_url=?,sizes=?,colors=?,stock=?,is_new=? WHERE id=?',[...vals,id]);if(!r.affectedRows){const[p]=await pool.execute('SELECT id FROM products WHERE id=?',[id]);if(!p.length)return fail(res,'Product not found.',422);}}else await pool.execute('INSERT INTO products(id,category_id,name,description,materials,price_value,image_url,sizes,colors,stock,is_new) VALUES(?,?,?,?,?,?,?,?,?,?,?)',[id,...vals]);return ok(res,{product:await productById(id)},req.path.endsWith('products-create.php')?201:200);}catch(e){if(e.code==='ER_DUP_ENTRY')return fail(res,'A product with a matching name/id already exists.',409);throw e;}}
app.post('/api/admin/products-delete.php',method('POST'),requireUser,requireAdmin,async(req,res)=>{const id=body(req).id;if(!id)return fail(res,'A product id is required.',400);const[r]=await pool.execute('DELETE FROM products WHERE id=?',[id]);if(!r.affectedRows)return fail(res,'Product not found.',404);return ok(res,{message:'Product deleted.'});});
app.post('/api/admin/products-upload-image.php',method('POST'),requireUser,requireAdmin,async(req,res)=>{if(!body(req).imageDataUrl)return fail(res,'An image is required.',400);const filename=await saveImage(body(req).imageDataUrl,productPhotos,8*1024*1024,'products');return ok(res,{url:`/uploads/products/${filename}`},201);});
app.get('/api/admin/orders-list.php',requireUser,requireAdmin,async(_req,res)=>{const[rows]=await pool.query('SELECT id,order_number,full_name,email,total,status,created_at FROM orders ORDER BY created_at DESC');return ok(res,{orders:rows.map(r=>({id:Number(r.id),orderNumber:r.order_number,customerName:r.full_name,customerEmail:r.email,total:Number(r.total),status:r.status,placedAt:r.created_at})),statuses});});
app.post('/api/admin/orders-update-status.php',method('POST'),requireUser,requireAdmin,async(req,res)=>{const{id,status}=body(req);if(!id||!status)return fail(res,'An order id and status are required.',400);if(!statuses.includes(status))return fail(res,'Invalid order status.',422);const[r]=await pool.execute('UPDATE orders SET status=? WHERE id=?',[status,id]);if(!r.affectedRows){const[o]=await pool.execute('SELECT id FROM orders WHERE id=?',[id]);if(!o.length)return fail(res,'Order not found.',422);}return ok(res,{message:'Order status updated.'});});
app.get('/api/admin/customers-list.php',requireUser,requireAdmin,async(_req,res)=>{const[rows]=await pool.query("SELECT u.id,u.full_name,u.email,COUNT(o.id) order_count,COALESCE(SUM(CASE WHEN o.status!='cancelled' THEN o.total ELSE 0 END),0) total_spent FROM users u LEFT JOIN orders o ON o.user_id=u.id WHERE u.is_admin=0 GROUP BY u.id,u.full_name,u.email ORDER BY total_spent DESC");return ok(res,{customers:rows.map(r=>({id:Number(r.id),fullName:r.full_name,email:r.email,orderCount:Number(r.order_count),totalSpent:Number(r.total_spent)}))});});
app.get('/api/admin/inventory-list.php',requireUser,requireAdmin,async(_req,res)=>{const[rows]=await pool.query('SELECT p.id,p.name,p.stock,c.name category FROM products p JOIN categories c ON c.id=p.category_id WHERE p.stock<=5 ORDER BY p.stock ASC');return ok(res,{products:rows.map(r=>({...r,stock:Number(r.stock)}))});});
app.post('/api/admin/categories-create.php',method('POST'),requireUser,requireAdmin,async(req,res)=>{const name=String(body(req).name||'').trim();if(!name)return fail(res,'Please correct the highlighted fields.',422,{name:'Name is required.'});const slug=slugify(name);try{const[r]=await pool.execute('INSERT INTO categories(name,slug) VALUES(?,?)',[name,slug]);return ok(res,{category:{id:r.insertId,name,slug}},201);}catch(e){if(e.code==='ER_DUP_ENTRY')return fail(res,'A category with a matching name already exists.',409);throw e;}});
app.post('/api/admin/categories-delete.php',method('POST'),requireUser,requireAdmin,async(req,res)=>{const id=Number(body(req).id);if(!Number.isInteger(id)||id<=0)return fail(res,'A valid category id is required.',400);try{await pool.execute('DELETE FROM categories WHERE id=?',[id]);return ok(res,{message:'Category deleted.'});}catch(e){if(e.code==='ER_ROW_IS_REFERENCED_2')return fail(res,'This category still has products assigned to it — move or delete those first.',409);throw e;}});
app.get('/api/admin/tryon-stats.php',requireUser,requireAdmin,async(_req,res)=>{const[events]=await pool.query('SELECT product_ids FROM tryon_events');const counts=new Map(), outfits=new Map();for(const row of events){const ids=parseJson(row.product_ids);for(const id of ids)counts.set(id,(counts.get(id)||0)+1);if(ids.length>1){const sorted=[...ids].sort();const key=sorted.join('|');outfits.set(key,(outfits.get(key)||0)+1);}}const mostTriedProducts=[];for(const[id,count]of [...counts].sort((a,b)=>b[1]-a[1]).slice(0,5)){const[p]=await pool.execute('SELECT name FROM products WHERE id=?',[id]);mostTriedProducts.push({productId:id,name:p[0]?.name||id,tryOnCount:count});}const mostPopularOutfits=[];for(const[key,count]of [...outfits].sort((a,b)=>b[1]-a[1]).slice(0,5)){const ids=key.split('|');const names=[];for(const id of ids){const[p]=await pool.execute('SELECT name FROM products WHERE id=?',[id]);names.push(p[0]?.name||id);}mostPopularOutfits.push({productIds:ids,names,timesWorn:count});}return ok(res,{totalTryOns:events.length,mostTriedProducts,mostPopularOutfits});});

async function saveImage(dataUrl, directory, maxBytes, scope='products'){const match=/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/.exec(String(dataUrl));if(!match)throw new Error('That image could not be read. Please try another file.');const bytes=Buffer.from(match[2],'base64');if(bytes.length>maxBytes)throw new Error('That image is too large — please use a file under 8MB.');const type=sniffImage(bytes);if(!type||type!==match[1])throw new Error('The image content is invalid.');const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[type];const filename=crypto.randomBytes(16).toString('hex')+'.'+ext;if(process.env.CLOUDFLARE_WORKER==='true'){await pool.execute('INSERT INTO app_uploads(object_key,content_type,content) VALUES(?,?,?)',[`${scope}/${filename}`,type,bytes]);return filename;}await fs.mkdir(directory,{recursive:true});await fs.writeFile(path.join(directory,filename),bytes,{flag:'wx'});return filename;}
async function removeImage(directory,filename,scope='products'){if(process.env.CLOUDFLARE_WORKER==='true')return pool.execute('DELETE FROM app_uploads WHERE object_key=?',[`${scope}/${filename}`]);return fs.unlink(path.join(directory,filename));}
function sniffImage(b){if(b.length<12)return null;if(b[0]===0xff&&b[1]===0xd8&&b[2]===0xff)return'image/jpeg';if(b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return'image/png';if(b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP')return'image/webp';return null;}
app.get('/uploads/products/:filename',async(req,res,next)=>{if(process.env.CLOUDFLARE_WORKER!=='true')return next();const filename=path.basename(req.params.filename);if(!/^[a-f0-9]{32}\.(jpg|png|webp)$/.test(filename))return fail(res,'Image not found.',404);const[images]=await pool.execute('SELECT content_type,content FROM app_uploads WHERE object_key=?',[`products/${filename}`]);if(!images[0])return fail(res,'Image not found.',404);res.set({'Content-Type':images[0].content_type,'X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=31536000, immutable'});return res.send(Buffer.from(images[0].content));});
if(process.env.CLOUDFLARE_WORKER!=='true')app.use('/uploads/products',express.static(productPhotos,{fallthrough:false, dotfiles:'deny', setHeaders(res){res.setHeader('X-Content-Type-Options','nosniff');}}));
app.use((req,res)=>fail(res,'Not found.',404));
app.use((err,req,res,_next)=>{console.error('[VYRO API]',err);if(res.headersSent)return;const status=err instanceof SyntaxError&&'body'in err?400:(Number(err.statusCode||err.status)>=400?Number(err.statusCode||err.status):500);return fail(res,status===400?'Request body must be valid JSON.':(debug?err.message:'Something went wrong. Please try again.'),status);});
if (require.main === module) app.listen(port, '0.0.0.0',()=>console.log(`VYRO Node API listening on port ${port}`));
module.exports = app;
