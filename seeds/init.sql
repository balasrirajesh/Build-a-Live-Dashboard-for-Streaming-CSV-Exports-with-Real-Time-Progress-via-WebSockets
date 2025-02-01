-- Create exports tracking table
CREATE TABLE IF NOT EXISTS exports (
    id VARCHAR(36) PRIMARY KEY,
    status VARCHAR(20) NOT NULL DEFAULT 'queued',
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    file_path TEXT,
    file_size BIGINT,
    duration_seconds NUMERIC(10,2),
    error_message TEXT
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed 100,000 users using generate_series
INSERT INTO users (name, email, created_at)
SELECT
    'User_' || i AS name,
    'user_' || i || '@example.com' AS email,
    NOW() - (random() * interval '365 days') AS created_at
FROM generate_series(1, 100000) AS s(i)
ON CONFLICT DO NOTHING;
