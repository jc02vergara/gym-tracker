CREATE DATABASE IF NOT EXISTS gym_tracker;
USE gym_tracker;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routines (
    id VARCHAR(36) PRIMARY KEY, -- Using UUIDs from frontend initially, or moving to INT
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercises (
    id VARCHAR(36) PRIMARY KEY,
    routine_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (routine_id) REFERENCES routines(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    exercise_id VARCHAR(36) NOT NULL,
    weight DECIMAL(5,2),
    reps INT,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS measurements (
    id VARCHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    weight DECIMAL(5,2),
    chest DECIMAL(5,2),
    waist DECIMAL(5,2),
    arms DECIMAL(5,2),
    legs DECIMAL(5,2),
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insertar usuario de prueba por defecto (password: 'password')
-- Hash generado con password_hash('password', PASSWORD_DEFAULT)
INSERT INTO users (username, password_hash) 
SELECT 'TestUser', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'
WHERE NOT EXISTS (SELECT * FROM users WHERE username = 'TestUser');
