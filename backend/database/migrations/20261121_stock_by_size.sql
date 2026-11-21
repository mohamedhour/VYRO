-- Add stock per size to the live VYRO catalog.
-- Run this once in the TiDB SQL Editor. Values below are example/demo stock;
-- replace them with real counts before accepting customer orders.
ALTER TABLE products ADD COLUMN stock_by_size JSON NULL;

UPDATE products
SET stock_by_size = CASE id
    WHEN 'vyro-cyber-hoodie' THEN JSON_OBJECT('S',10,'M',10,'L',10,'XL',10,'XXL',10)
    WHEN 'vyro-cargo-pant' THEN JSON_OBJECT('S',0,'M',5,'L',0,'XL',0,'XXL',0)
    WHEN 'vyro-aero-bomber' THEN JSON_OBJECT('S',10,'M',10,'L',10,'XL',10,'XXL',10)
    WHEN 'vyro-velocity-high' THEN JSON_OBJECT('S',10,'M',0,'L',10,'XL',0,'XXL',10)
    WHEN 'vyro-oversized-tee' THEN JSON_OBJECT('S',10,'M',10,'L',10,'XL',10,'XXL',10)
    WHEN 'vyro-full-kit' THEN JSON_OBJECT('S',0,'M',0,'L',0,'XL',0,'XXL',0)
    WHEN 'vyro-hero-campaign-fit' THEN JSON_OBJECT('S',0,'M',0,'L',0,'XL',0,'XXL',0)
    WHEN 'vyro-campaign-hoodie-solo' THEN JSON_OBJECT('S',0,'M',10,'L',0,'XL',10,'XXL',0)
    WHEN 'vyro-campaign-pants-solo' THEN JSON_OBJECT('S',0,'M',5,'L',0,'XL',0,'XXL',0)
    WHEN 'vyro-campaign-sneakers-solo' THEN JSON_OBJECT('S',10,'M',10,'L',10,'XL',10,'XXL',10)
    WHEN 'vyro-campaign-cap-solo' THEN JSON_OBJECT('One Size',5)
    ELSE stock_by_size
END,
stock = CASE id
    WHEN 'vyro-cyber-hoodie' THEN 50
    WHEN 'vyro-cargo-pant' THEN 5
    WHEN 'vyro-aero-bomber' THEN 50
    WHEN 'vyro-velocity-high' THEN 30
    WHEN 'vyro-oversized-tee' THEN 50
    WHEN 'vyro-full-kit' THEN 0
    WHEN 'vyro-hero-campaign-fit' THEN 0
    WHEN 'vyro-campaign-hoodie-solo' THEN 20
    WHEN 'vyro-campaign-pants-solo' THEN 5
    WHEN 'vyro-campaign-sneakers-solo' THEN 50
    WHEN 'vyro-campaign-cap-solo' THEN 5
    ELSE stock
END
WHERE id IN (
    'vyro-cyber-hoodie','vyro-cargo-pant','vyro-aero-bomber','vyro-velocity-high',
    'vyro-oversized-tee','vyro-full-kit','vyro-hero-campaign-fit',
    'vyro-campaign-hoodie-solo','vyro-campaign-pants-solo',
    'vyro-campaign-sneakers-solo','vyro-campaign-cap-solo'
);
