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
