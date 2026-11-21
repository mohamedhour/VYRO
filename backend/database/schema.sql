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
    stock_by_size JSON            NULL COMMENT 'e.g. {"S":0,"M":5,"L":0}; totals must match stock',
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
