
-- ===== backend/database/schema.sql =====
-- ============================================================================
-- VYRO — MySQL schema
-- Charset utf8mb4 throughout (full Unicode, incl. emoji-safe) with InnoDB
-- for foreign key + transaction support.
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- users
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(150)    NOT NULL,
    email         VARCHAR(190)    NOT NULL,
    password_hash VARCHAR(255)    NOT NULL,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    slug       VARCHAR(100) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_categories_name (name),
    UNIQUE KEY uq_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- products
-- id is a slug-style string ("axis-blazer") rather than an integer so it
-- matches the ids already used throughout the existing frontend — no
-- id-remapping layer needed when this is wired up later.
-- sizes/colors are stored as JSON arrays: no separate variant tables were
-- requested, and a garment's size/color list is small, fixed-shape, and
-- always read as a whole — a good fit for JSON rather than a join.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
    id            VARCHAR(60)     NOT NULL PRIMARY KEY,
    category_id   INT UNSIGNED    NOT NULL,
    name          VARCHAR(150)    NOT NULL,
    description   TEXT            NULL,
    materials     VARCHAR(255)    NULL,
    price_value   INT UNSIGNED    NOT NULL COMMENT 'Price in MAD, whole dirhams',
    image_url     VARCHAR(255)    NULL,
    sizes         JSON            NULL COMMENT 'e.g. ["S","M","L","XL"]',
    colors        JSON            NULL COMMENT 'e.g. [{"name":"Black","hex":"#141416"}]',
    stock         INT UNSIGNED    NOT NULL DEFAULT 0,
    rating        DECIMAL(2,1)    NOT NULL DEFAULT 0.0,
    review_count  INT UNSIGNED    NOT NULL DEFAULT 0,
    is_new        TINYINT(1)      NOT NULL DEFAULT 0,
    created_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_products_category (category_id),
    CONSTRAINT fk_products_category
        FOREIGN KEY (category_id) REFERENCES categories(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- orders
-- Customer/address fields are a snapshot at time of purchase (not a join
-- to users) so a later profile edit never rewrites order history.
-- subtotal/shipping/total are always computed server-side from the DB's
-- current product prices — never trusted from the client.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_number   VARCHAR(40)     NOT NULL,
    user_id        INT UNSIGNED    NULL,
    full_name      VARCHAR(150)    NOT NULL,
    email          VARCHAR(190)    NULL,
    phone          VARCHAR(30)     NOT NULL,
    address        VARCHAR(255)    NOT NULL,
    city           VARCHAR(100)    NOT NULL,
    postal_code    VARCHAR(20)     NULL,
    payment_method ENUM('cod','card') NOT NULL,
    subtotal       INT UNSIGNED    NOT NULL,
    shipping       INT UNSIGNED    NOT NULL,
    total          INT UNSIGNED    NOT NULL,
    status         ENUM('placed','processing','shipped','delivered','cancelled')
                   NOT NULL DEFAULT 'placed',
    created_at     TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_orders_order_number (order_number),
    KEY idx_orders_user (user_id),
    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- order_items
-- product_name/unit_price are snapshotted at purchase time so historical
-- orders stay accurate even if a product is later renamed, repriced, or
-- removed.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    order_id     INT UNSIGNED    NOT NULL,
    product_id   VARCHAR(60)     NOT NULL,
    product_name VARCHAR(150)    NOT NULL,
    size         VARCHAR(20)     NULL,
    color        VARCHAR(40)     NULL,
    quantity     INT UNSIGNED    NOT NULL,
    unit_price   INT UNSIGNED    NOT NULL,
    line_total   INT UNSIGNED    NOT NULL,
    KEY idx_order_items_order (order_id),
    KEY idx_order_items_product (product_id),
    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_order_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- wishlist
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS wishlist (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    product_id VARCHAR(60)  NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_wishlist_user_product (user_id, product_id),
    KEY idx_wishlist_product (product_id),
    CONSTRAINT fk_wishlist_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_wishlist_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- saved_looks
-- photo_url is nullable: a look saved from the Look Builder has no photo,
-- one saved from VYRO Fit does.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS saved_looks (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    photo_url  VARCHAR(255) NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_saved_looks_user (user_id),
    CONSTRAINT fk_saved_looks_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- look_items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS look_items (
    id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    saved_look_id  INT UNSIGNED NOT NULL,
    product_id     VARCHAR(60)  NOT NULL,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_look_items_look (saved_look_id),
    KEY idx_look_items_product (product_id),
    CONSTRAINT fk_look_items_look
        FOREIGN KEY (saved_look_id) REFERENCES saved_looks(id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_look_items_product
        FOREIGN KEY (product_id) REFERENCES products(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ===== backend/database/seed.sql =====
-- VYRO storefront catalog. Keep IDs, names, prices, categories, variants, and
-- image paths aligned with src/data/catalog.ts. Initial stock is zero because
-- saleable quantities must be supplied by the store owner before launch.
SET NAMES utf8mb4;

INSERT INTO categories (name, slug) VALUES
    ('Hoodies', 'hoodies'),
    ('Outerwear', 'outerwear'),
    ('Bottoms', 'bottoms'),
    ('Footwear', 'footwear'),
    ('Accessories', 'accessories'),
    ('Tees', 'tees')
ON DUPLICATE KEY UPDATE slug = VALUES(slug);

INSERT INTO products
    (id, category_id, name, description, materials, price_value, image_url, sizes, colors, stock, rating, review_count, is_new)
VALUES
('vyro-cyber-hoodie', (SELECT id FROM categories WHERE slug='hoodies'), 'VYRO 480gsm Boxy Oversized Hoodie', 'Heavyweight 480gsm washed-black French terry hoodie with dropped shoulders, boxy cropped drape, and metallic VYRO chest crest.', '100% Heavyweight Combed Cotton (480gsm)', 690, '/assets/products/vyro_oversized_hoodie.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Washed Obsidian','hex','#181A20'),JSON_OBJECT('name','Crimson Ash','hex','#E11D48')), 0, 0, 0, 1),
('vyro-cargo-pant', (SELECT id FROM categories WHERE slug='bottoms'), 'Parachute Tactical Wide Cargo Pants', 'Relaxed wide-leg parachute cargo trousers in charcoal ripstop nylon with articulated knees, crimson utility straps, and toggle cuffs.', '94% Ripstop Technical Nylon, 6% Elastane', 640, '/assets/products/vyro_tech_cargo.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Charcoal Ripstop','hex','#1C1E24'),JSON_OBJECT('name','Stealth Black','hex','#0F1117')), 0, 0, 0, 0),
('vyro-aero-bomber', (SELECT id FROM categories WHERE slug='outerwear'), 'Cropped Boxy Flight Bomber Jacket', 'Architectural cropped-waist oversized flight bomber in matte-black twill with quilted crimson thermal lining and MA-1 sleeve pocket.', '100% Water-Repellent Matte Flight Twill', 1190, '/assets/products/vyro_bomber_jacket.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Matte Black / Crimson','hex','#14161D'),JSON_OBJECT('name','Deep Slate','hex','#27272A')), 0, 0, 0, 1),
('vyro-velocity-high', (SELECT id FROM categories WHERE slug='footwear'), 'Apex Chunky Runner Sneakers', 'Sculpted oversized runner silhouette with multi-layered mesh and leather upper, chunky EVA lugged sole, and crimson heel cage.', 'Full-Grain Nubuck, Ballistic Mesh & Dual-Density EVA', 980, '/assets/products/vyro_chunky_sneakers.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Obsidian / Chalk / Crimson','hex','#E11D48'),JSON_OBJECT('name','Triple Black','hex','#18181B')), 0, 0, 0, 1),
('vyro-oversized-tee', (SELECT id FROM categories WHERE slug='tees'), 'Acid-Wash Drop-Shoulder Heavy Tee', 'Boxy oversized 300gsm vintage acid-wash charcoal tee with wide rib collar and futuristic crimson chest typography.', '100% Organic Carded Cotton (300gsm)', 390, '/assets/products/vyro_oversized_tee.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Acid Charcoal','hex','#27272A'),JSON_OBJECT('name','Jet Black','hex','#111318')), 0, 0, 0, 0),
('vyro-full-kit', (SELECT id FROM categories WHERE slug='hoodies'), 'VYRO Complete Oversized 4-Piece Fit', 'Full contemporary street uniform: 480gsm Boxy Hoodie, Parachute Wide Cargo Pants, Apex Chunky Sneakers, and Crossbody Tech Bag.', '480gsm French Terry & Ripstop Technical Nylon', 2190, '/assets/products/vyro_full_oversized_fit.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Signature Obsidian / Crimson','hex','#E11D48')), 0, 0, 0, 1),
('vyro-hero-campaign-fit', (SELECT id FROM categories WHERE slug='hoodies'), 'VYRO Hero Campaign Full Outfit', 'The signature VYRO FASHION hero look: Reflective VYRO Hoodie, Tactical Cargo Pants, Crimson/Chalk High-Tops, and Stealth V-Cap.', 'Heavyweight Tech-Fleece, Ripstop Twill & Full-Grain Leather', 1890, '/assets/products/vyro_campaign_full_outfit.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Campaign Black / Crimson','hex','#E11D48'),JSON_OBJECT('name','Obsidian Edition','hex','#141720')), 0, 0, 0, 1),
('vyro-campaign-hoodie-solo', (SELECT id FROM categories WHERE slug='hoodies'), 'VYRO Signature Reflective Hoodie', 'The exact oversized black hoodie from the VYRO campaign featuring bold white VYRO chest typography, contrast red stitching, and sleeve utility pocket.', '100% Heavyweight Tech-Fleece Cotton (460gsm)', 740, '/assets/products/vyro_campaign_hoodie_solo.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Obsidian / White','hex','#141720'),JSON_OBJECT('name','Crimson Stitch','hex','#E11D48')), 0, 0, 0, 1),
('vyro-campaign-pants-solo', (SELECT id FROM categories WHERE slug='bottoms'), 'VYRO Tactical Campaign Cargo Pants', 'The signature black tactical cargo trousers from the VYRO campaign with gusseted thigh pockets, white VYRO branding, and tapered ankle cuffs.', '96% Combed Ripstop Cotton, 4% Elastane', 690, '/assets/products/vyro_campaign_pants_solo.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Obsidian Black','hex','#12141A'),JSON_OBJECT('name','Graphite','hex','#27272A')), 0, 0, 0, 1),
('vyro-campaign-sneakers-solo', (SELECT id FROM categories WHERE slug='footwear'), 'VYRO V-Crest High-Top Sneakers', 'The signature black, chalk-white, and crimson high-top sneakers from the VYRO campaign with bold V-emblem tongue and cushioned court sole.', 'Full-Grain Leather & Breathable Technical Mesh', 990, '/assets/products/vyro_campaign_sneakers_solo.jpg', JSON_ARRAY('S','M','L','XL','XXL'), JSON_ARRAY(JSON_OBJECT('name','Obsidian / Chalk / Crimson','hex','#E11D48'),JSON_OBJECT('name','Stealth Black','hex','#18181B')), 0, 0, 0, 1),
('vyro-campaign-cap-solo', (SELECT id FROM categories WHERE slug='accessories'), 'VYRO Stealth V-Emblem Cap', 'Structured 6-panel black cap from the VYRO campaign featuring a 3D metallic-white V-insignia and micro-adjustable rear strap.', '100% Brushed Technical Twill', 290, '/assets/products/vyro_campaign_cap_solo.jpg', JSON_ARRAY('One Size'), JSON_ARRAY(JSON_OBJECT('name','Obsidian Black','hex','#111318'),JSON_OBJECT('name','Crimson Edition','hex','#E11D48')), 0, 0, 0, 1)
ON DUPLICATE KEY UPDATE
    category_id=VALUES(category_id), name=VALUES(name), description=VALUES(description), materials=VALUES(materials),
    price_value=VALUES(price_value), image_url=VALUES(image_url), sizes=VALUES(sizes), colors=VALUES(colors),
    rating=VALUES(rating), review_count=VALUES(review_count), is_new=VALUES(is_new);

-- ===== backend/database/migrations/002_admin_dashboard.sql =====
-- ============================================================================
-- Migration 002 — Admin dashboard support
-- Run after schema.sql + seed.sql. Purely additive: no existing column is
-- removed, no existing data is touched beyond widening one ENUM.
-- ============================================================================

SET NAMES utf8mb4;

-- ----------------------------------------------------------------------------
-- users.is_admin — who can access /admin. Nobody is an admin by default;
-- see database/create-admin.php to promote the first account.
-- ----------------------------------------------------------------------------
ALTER TABLE users
    ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash;

-- ----------------------------------------------------------------------------
-- orders.status — widened from the original 5 values to the 6 the admin
-- dashboard needs to display and set. 'placed' orders become 'pending';
-- everything else keeps its existing value.
-- ----------------------------------------------------------------------------
ALTER TABLE orders
    MODIFY COLUMN status ENUM('pending','confirmed','processing','shipped','delivered','cancelled')
        NOT NULL DEFAULT 'pending';

UPDATE orders SET status = 'pending' WHERE status = 'placed';

-- ----------------------------------------------------------------------------
-- tryon_events — one row per VYRO Fit preview actually generated (see
-- ResultStep.jsx). Lets "VYRO Fit Statistics" reflect real usage instead
-- of invented numbers. Anonymous by design (user_id is nullable) since
-- VYRO Fit works without an account; product_ids captures the exact
-- outfit combination so "most popular outfits" can be computed from it.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS tryon_events (
    id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id      INT UNSIGNED NULL,
    product_ids  JSON         NOT NULL COMMENT 'e.g. ["drift-hoodie","form-trouser"]',
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_tryon_events_user (user_id),
    CONSTRAINT fk_tryon_events_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== backend/database/migrations/003_cloud_state.sql =====
-- Durable state used by the VYRO storefront APIs when hosted on Workers.
-- JSON is stored as LONGTEXT so it works with both MySQL and TiDB Starter.
CREATE TABLE IF NOT EXISTS app_state (
    state_key   VARCHAR(80) NOT NULL PRIMARY KEY,
    state_value LONGTEXT    NOT NULL,
    updated_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Product uploads and private fit photos must survive Worker instance restarts.
-- Images are validated and capped at 8 MiB by the API before they are stored.
CREATE TABLE IF NOT EXISTS app_uploads (
    object_key   VARCHAR(180) NOT NULL PRIMARY KEY,
    content_type VARCHAR(40)  NOT NULL,
    content      MEDIUMBLOB   NOT NULL,
    created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== backend/database/migrations/004_guest_checkout.sql =====
-- Allow customers to submit cash-on-delivery orders without creating an account.
-- Preserve historical order rows if their associated account is removed.
ALTER TABLE orders DROP FOREIGN KEY fk_orders_user;
ALTER TABLE orders
    MODIFY COLUMN user_id INT UNSIGNED NULL,
    MODIFY COLUMN email VARCHAR(190) NULL,
    MODIFY COLUMN postal_code VARCHAR(20) NULL;
ALTER TABLE orders
    ADD CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL ON UPDATE CASCADE;
