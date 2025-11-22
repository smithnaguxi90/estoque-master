from flask import Flask, render_template, request, redirect
import mysql.connector

app = Flask(__name__)

# Configuração do Banco (Coloque sua senha)
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="sua_senha", 
        database="sistema_estoque"
    )

# ROTA 1: Página Inicial (Mostra os produtos)
@app.route('/')
def index():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Busca todos os produtos
    cursor.execute("SELECT * FROM produtos")
    meus_produtos = cursor.fetchall()
    conn.close()
    # Envia os dados para o HTML
    return render_template('index.html', lista_produtos=meus_produtos)

# ROTA 2: Cadastrar (Recebe o formulário)
@app.route('/adicionar', methods=['POST'])
def adicionar():
    # Pega o que o usuário digitou no site
    nome = request.form['nome']
    preco = request.form['preco']
    quantidade = request.form['quantidade']

    # Salva no MySQL
    conn = get_db_connection()
    cursor = conn.cursor()
    sql = "INSERT INTO produtos (nome, preco_venda, quantidade) VALUES (%s, %s, %s)"
    cursor.execute(sql, (nome, preco, quantidade))
    conn.commit()
    conn.close()

    # Recarrega a página inicial
    return redirect('/')

if __name__ == '__main__':
    app.run(debug=True)