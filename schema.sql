CREATE DATABASE IF NOT EXISTS estoquemaster
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE estoquemaster;

-- Tabela de Categorias
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Tabela de Materiais
CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    category_id INT,
    quantity INT DEFAULT 0,
    min_quantity INT DEFAULT 0,
    resupply_quantity INT DEFAULT 0,
    alert_percentage INT DEFAULT 40,
    description TEXT,
    image LONGTEXT,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Tabela de Movimentações
CREATE TABLE IF NOT EXISTS movements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    material_id INT NOT NULL,
    type ENUM('entrada', 'saida') NOT NULL,
    quantity INT NOT NULL,
    date DATE NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE
);

-- Inserir Categorias Padrão
INSERT IGNORE INTO categories (name) VALUES 
('Carpetes'), ('Chaves'), ('Construção'), ('Equipamentos'), 
('Estrutural'), ('Ferramentas'), ('Gesso'), ('Impermeabilização'), 
('Marcenaria'), ('Marmoraria'), ('Materiais'), ('Pavimentação'), 
('Persianas'), ('Pintura'), ('Piso Vinílicos'), ('Proteção'), 
('Serralheria'), ('Tapeçaria'), ('Vidraçaria');