-- ============================================================================
-- VYRO — seed data
-- Mirrors the product catalog already used by the frontend's mock data
-- (src/lib/products.js) so the two stay in sync during integration.
-- ============================================================================

SET NAMES utf8mb4;

INSERT INTO categories (name, slug) VALUES
    ('T-Shirts',    't-shirts'),
    ('Hoodies',     'hoodies'),
    ('Jackets',     'jackets'),
    ('Pants',       'pants'),
    ('Shoes',       'shoes'),
    ('Accessories', 'accessories')
ON DUPLICATE KEY UPDATE name = VALUES(name);

INSERT INTO products
    (id, category_id, name, description, materials, price_value, image_url, sizes, colors, stock, rating, review_count, is_new)
VALUES
(
    'nova-overcoat',
    (SELECT id FROM categories WHERE slug = 'jackets'),
    'Nova Overcoat',
    'A full-length wool-blend overcoat cut for a clean, structured silhouette. Built for cold commutes and layering over tailoring.',
    '72% wool, 25% polyester, 3% elastane. Fully lined.',
    6200, '/images/products/nova-overcoat.jpg',
    JSON_ARRAY('S','M','L','XL'),
    JSON_ARRAY(JSON_OBJECT('name','Black','hex','#141416'), JSON_OBJECT('name','Charcoal','hex','#2e2e31')),
    8, 4.8, 96, 1
),
(
    'axis-blazer',
    (SELECT id FROM categories WHERE slug = 'jackets'),
    'Axis Blazer',
    'Single-breasted blazer in a soft-structured wool blend. Slim through the body with a natural shoulder line.',
    '68% wool, 30% polyester, 2% elastane. Half-canvassed construction.',
    4850, '/images/products/axis-blazer.jpg',
    JSON_ARRAY('S','M','L','XL'),
    JSON_ARRAY(JSON_OBJECT('name','Navy','hex','#1f2b42'), JSON_OBJECT('name','Black','hex','#141416')),
    5, 4.6, 142, 1
),
(
    'field-jacket',
    (SELECT id FROM categories WHERE slug = 'jackets'),
    'Field Jacket',
    'Cotton-canvas field jacket with a four-pocket front and a matte corozo button placket. Built to weather.',
    '100% cotton canvas, brushed cotton lining.',
    3600, '/images/products/field-jacket.jpg',
    JSON_ARRAY('S','M','L','XL','XXL'),
    JSON_ARRAY(JSON_OBJECT('name','Olive','hex','#4a5230'), JSON_OBJECT('name','Black','hex','#141416')),
    0, 4.3, 58, 0
),
(
    'strata-shirt',
    (SELECT id FROM categories WHERE slug = 't-shirts'),
    'Strata Shirt',
    'A structured cotton-poplin shirt with a clean point collar. Cut close through the waist without pulling at the shoulders.',
    '100% cotton poplin.',
    950, '/images/products/strata-shirt.jpg',
    JSON_ARRAY('S','M','L','XL'),
    JSON_ARRAY(JSON_OBJECT('name','White','hex','#ededec'), JSON_OBJECT('name','Black','hex','#141416')),
    14, 4.4, 87, 0
),
(
    'core-tee',
    (SELECT id FROM categories WHERE slug = 't-shirts'),
    'Core Tee',
    'Heavyweight cotton tee with a boxier fit and reinforced collar seam. The everyday layer under everything else.',
    '100% combed cotton, 220gsm jersey.',
    480, '/images/products/core-tee.jpg',
    JSON_ARRAY('S','M','L','XL'),
    JSON_ARRAY(JSON_OBJECT('name','White','hex','#ededec'), JSON_OBJECT('name','Black','hex','#141416'), JSON_OBJECT('name','Grey','hex','#7d7d80')),
    20, 4.5, 211, 1
),
(
    'form-trouser',
    (SELECT id FROM categories WHERE slug = 'pants'),
    'Form Trouser',
    'Tapered wool-blend trouser with a mid-rise waist and a clean front. Tailored enough for the office, relaxed enough without it.',
    '70% wool, 28% polyester, 2% elastane.',
    1650, '/images/products/form-trouser.jpg',
    JSON_ARRAY('28','30','32','34','36'),
    JSON_ARRAY(JSON_OBJECT('name','Black','hex','#141416'), JSON_OBJECT('name','Sand','hex','#c9b895')),
    10, 4.4, 73, 1
),
(
    'utility-cargo',
    (SELECT id FROM categories WHERE slug = 'pants'),
    'Utility Cargo',
    'Straight-leg cargo pant in brushed cotton twill, with articulated knees and a hidden interior pocket.',
    '100% cotton twill.',
    1450, '/images/products/utility-cargo.jpg',
    JSON_ARRAY('28','30','32','34'),
    JSON_ARRAY(JSON_OBJECT('name','Olive','hex','#4a5230'), JSON_OBJECT('name','Black','hex','#141416')),
    6, 4.1, 39, 0
),
(
    'mono-knit',
    (SELECT id FROM categories WHERE slug = 'hoodies'),
    'Mono Knit',
    'Fine-gauge merino knit with a ribbed hem and cuff. Layers cleanly under the Axis Blazer or worn alone.',
    '100% merino wool.',
    1380, '/images/products/mono-knit.jpg',
    JSON_ARRAY('S','M','L','XL'),
    JSON_ARRAY(JSON_OBJECT('name','Grey','hex','#7d7d80'), JSON_OBJECT('name','Navy','hex','#1f2b42')),
    0, 4.0, 24, 0
),
(
    'drift-hoodie',
    (SELECT id FROM categories WHERE slug = 'hoodies'),
    'Drift Hoodie',
    'Heavyweight brushed-fleece hoodie with a dropped shoulder and a fixed drawcord hood. Off-duty, not sloppy.',
    '80% cotton, 20% polyester brushed fleece, 420gsm.',
    1150, '/images/products/drift-hoodie.jpg',
    JSON_ARRAY('S','M','L','XL','XXL'),
    JSON_ARRAY(JSON_OBJECT('name','Black','hex','#141416'), JSON_OBJECT('name','Grey','hex','#7d7d80'), JSON_OBJECT('name','Sand','hex','#c9b895')),
    15, 4.7, 168, 1
),
(
    'vector-runner',
    (SELECT id FROM categories WHERE slug = 'shoes'),
    'Vector Runner',
    'Minimal low-top trainer in a smooth leather upper with a lightweight rubber sole. Built to go with everything above it.',
    'Leather upper, rubber outsole, cushioned foam midsole.',
    2450, '/images/products/vector-runner.jpg',
    JSON_ARRAY('40','41','42','43','44','45'),
    JSON_ARRAY(JSON_OBJECT('name','White','hex','#ededec'), JSON_OBJECT('name','Black','hex','#141416')),
    9, 4.6, 104, 0
),
(
    'trail-sneaker',
    (SELECT id FROM categories WHERE slug = 'shoes'),
    'Trail Sneaker',
    'Rugged low-top with a lugged outsole and abrasion-resistant panels, without tipping into full hiking-boot territory.',
    'Textile and synthetic upper, rubber lugged outsole.',
    2150, '/images/products/trail-sneaker.jpg',
    JSON_ARRAY('40','41','42','43','44'),
    JSON_ARRAY(JSON_OBJECT('name','Black','hex','#141416'), JSON_OBJECT('name','Grey','hex','#7d7d80')),
    4, 4.2, 31, 1
),
(
    'transit-bag',
    (SELECT id FROM categories WHERE slug = 'accessories'),
    'Transit Bag',
    'Structured leather tote with a padded laptop sleeve and a magnetic top closure. Fits a full day without bulking up.',
    'Full-grain leather, cotton-twill lining.',
    2900, '/images/products/transit-bag.jpg',
    JSON_ARRAY('One Size'),
    JSON_ARRAY(JSON_OBJECT('name','Black','hex','#141416'), JSON_OBJECT('name','Sand','hex','#c9b895')),
    12, 4.9, 65, 0
),
(
    'signal-cap',
    (SELECT id FROM categories WHERE slug = 'accessories'),
    'Signal Cap',
    'Six-panel cap in washed cotton twill with a curved brim and an adjustable strap. The finishing piece on a low-key look.',
    '100% cotton twill, adjustable strap.',
    380, '/images/products/signal-cap.jpg',
    JSON_ARRAY('One Size'),
    JSON_ARRAY(JSON_OBJECT('name','Black','hex','#141416'), JSON_OBJECT('name','Navy','hex','#1f2b42'), JSON_OBJECT('name','Olive','hex','#4a5230')),
    25, 4.3, 47, 1
)
ON DUPLICATE KEY UPDATE name = VALUES(name);
