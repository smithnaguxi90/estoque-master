const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" })); // Limite aumentado para imagens

// Configuração da conexão MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root", // Seu usuário do MySQL (padrão do XAMPP é root)
  password: "Smith1990@", // Sua senha do MySQL (padrão do XAMPP é vazio)
  database: "estoquemaster",
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
    return;
  }
  console.log("Conectado ao MySQL!");
});

// --- ROTAS (API) ---

// 1. Buscar Materiais
app.get("/api/materials", (req, res) => {
  const sql = `
        SELECT m.*, c.name as category_name 
        FROM materials m
        LEFT JOIN categories c ON m.category_id = c.id
        WHERE m.is_archived = 0`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    // Formatar para bater com o formato do frontend
    const formatted = results.map((item) => ({
      ...item,
      category: item.category_name, // Mapeando para o nome usado no front
      isArchived: item.is_archived === 1,
    }));
    res.json(formatted);
  });
});

// 2. Criar Material
app.post("/api/materials", (req, res) => {
  const {
    name,
    sku,
    category,
    quantity,
    minQuantity,
    resupplyQuantity,
    alertPercentage,
    description,
    image,
  } = req.body;

  // Primeiro precisamos pegar o ID da categoria pelo nome
  const catSql = "SELECT id FROM categories WHERE name = ?";
  db.query(catSql, [category], (err, catResults) => {
    if (err) return res.status(500).send(err);

    const categoryId = catResults.length > 0 ? catResults[0].id : null;

    const insertSql = `
            INSERT INTO materials (name, sku, category_id, quantity, min_quantity, resupply_quantity, alert_percentage, description, image)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      insertSql,
      [
        name,
        sku,
        categoryId,
        quantity,
        minQuantity,
        resupplyQuantity,
        alertPercentage,
        description,
        image,
      ],
      (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Material criado!", id: result.insertId });
      }
    );
  });
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
