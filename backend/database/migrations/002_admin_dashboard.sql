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
