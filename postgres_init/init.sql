-- Create the listings table
CREATE TABLE IF NOT EXISTS listings (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255),
    district VARCHAR(100),
    type VARCHAR(50),
    price DECIMAL(10, 2),
    area DECIMAL(10, 2),
    frontage DECIMAL(10, 2),
    floors INT,
    potential_score INT,
    risk_level VARCHAR(50),
    views INT
);

-- Import data from CSV
-- Note: /data/jfinder_listings.csv is mounted inside the container
COPY listings(id, name, district, type, price, area, frontage, floors, potential_score, risk_level, views)
FROM '/data/jfinder_listings.csv'
DELIMITER ','
CSV HEADER;
