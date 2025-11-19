const mysql = require("mysql2/promise");

async function main() {
  // 1. Criar a conexão
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Smith1990@", // <--- COLOQUE SUA SENHA AQUI
    database: "sistema_estoque",
  });

  console.log("Conectado ao MySQL!\n");

  // 2. Executar a consulta (Query)
  // O resultado vem em dois arrays: [linhas, campos]. Pegamos só as linhas.
  const [rows] = await connection.execute("SELECT * FROM produtos");

  // 3. Mostrar os dados
  rows.forEach((produto) => {
    console.log(
      `ID: ${produto.id} | Produto: ${produto.nome} | Preço: R$ ${produto.preco_venda}`
    );
  });

  await connection.end();
}

main();
