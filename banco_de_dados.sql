-- Execute estes comandos no seu cliente MySQL (Workbench, PHPMyAdmin, DBeaver)

-- 1. Cria o banco de dados
CREATE DATABASE sistema_cadastro;

-- 2. Seleciona o banco
USE sistema_cadastro;

-- 3. Cria a tabela de usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    data_cadastro DATETIME DEFAULT CURRENT_TIMESTAMP
);