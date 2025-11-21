-- Inserindo produtos
INSERT INTO produtos (nome, descricao, quantidade, preco_custo, preco_venda)
VALUES 
('Teclado Mecânico', 'RGB com switches azuis', 50, 120.00, 250.00),
('Mouse Gamer', '12000 DPI sem fio', 30, 80.50, 159.90),
('Monitor 24"', 'Full HD 75Hz', 10, 600.00, 899.00);
SELECT * FROM produtos;