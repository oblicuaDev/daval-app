ALTER TABLE product_price_lists
ADD CONSTRAINT uq_product_price_list
UNIQUE (product_id, price_list_id);