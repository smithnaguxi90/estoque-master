import mysql.connector

# 1. Configuração da conexão
conexao = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Smith1990@",  # <--- COLOQUE SUA SENHA AQUI
    database="sistema_estoque"
)

cursor = conexao.cursor()

# 2. Executar um comando SQL (Ler dados)
comando = "SELECT * FROM produtos"
cursor.execute(comando)

# 3. Pegar e mostrar os resultados
resultados = cursor.fetchall() # Pega todas as linhas

print(f"{'ID':<5} {'Produto':<30} {'Preço':<10}")
print("-" * 50)

for produto in resultados:
    # produto é uma tupla: (id, nome, descricao, qtd, custo, venda, data)
    id_prod = produto[0]
    nome = produto[1]
    preco = produto[5]
    print(f"{id_prod:<5} {nome:<30} R$ {preco:<10}")

# 4. Fechar conexão
cursor.close()
conexao.close()