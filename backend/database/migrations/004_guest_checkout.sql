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
