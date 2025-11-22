const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));

// --- CONFIGURAÇÃO DO BANCO DE DADOS ---
// ATENÇÃO: Verifique se a senha ('') e usuário ('root') estão corretos para o seu MySQL
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Smith1990@",
  database: "estoquemaster",
  multipleStatements: true,
});

db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
    console.log(
      "DICA: Verifique se o XAMPP/MySQL está rodando e se criou o banco com o schema.sql"
    );
  } else {
    console.log("Conectado ao MySQL com sucesso!");
  }
});

// --- ROTAS DE CATEGORIAS ---
app.get("/api/categories", (req, res) => {
  db.query("SELECT * FROM categories ORDER BY name", (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.post("/api/categories", (req, res) => {
  const { name } = req.body;
  db.query(
    "INSERT INTO categories (name) VALUES (?)",
    [name],
    (err, result) => {
      if (err) return res.status(500).send(err);
      res.json({ id: result.insertId, name });
    }
  );
});

app.delete("/api/categories/:id", (req, res) => {
  db.query("DELETE FROM categories WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).send(err);
    res.json({ message: "Deletado" });
  });
});

// --- ROTAS DE MATERIAIS ---
app.get("/api/materials", (req, res) => {
  const sql = `
        SELECT m.*, c.name as category_name 
        FROM materials m
        LEFT JOIN categories c ON m.category_id = c.id
        ORDER BY m.created_at DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    const formatted = results.map((item) => ({
      ...item,
      category: item.category_name || "Sem Categoria",
      isArchived: item.is_archived === 1,
    }));
    res.json(formatted);
  });
});

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

  const getCatSql = "SELECT id FROM categories WHERE name = ?";
  db.query(getCatSql, [category], (err, results) => {
    if (err) return res.status(500).send(err);

    let categoryId = results.length ? results[0].id : null;

    const saveMaterial = (catId) => {
      const sql = `INSERT INTO materials (name, sku, category_id, quantity, min_quantity, resupply_quantity, alert_percentage, description, image) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      db.query(
        sql,
        [
          name,
          sku,
          catId,
          quantity,
          minQuantity,
          resupplyQuantity,
          alertPercentage,
          description,
          image,
        ],
        (err, result) => {
          if (err) return res.status(500).send(err);
          res.json({ success: true, id: result.insertId });
        }
      );
    };

    if (!categoryId && category) {
      db.query(
        "INSERT INTO categories (name) VALUES (?)",
        [category],
        (err, resCat) => {
          if (err) return res.status(500).send(err);
          saveMaterial(resCat.insertId);
        }
      );
    } else {
      saveMaterial(categoryId);
    }
  });
});

app.put("/api/materials/:id", (req, res) => {
  const {
    name,
    sku,
    category,
    minQuantity,
    resupplyQuantity,
    alertPercentage,
    description,
    image,
    isArchived,
  } = req.body;
  const id = req.params.id;

  const sql = `
        UPDATE materials SET 
        name=?, sku=?, min_quantity=?, resupply_quantity=?, alert_percentage=?, description=?, is_archived=?
        ${image ? ", image=?" : ""}
        WHERE id=?
    `;

  const params = [
    name,
    sku,
    minQuantity,
    resupplyQuantity,
    alertPercentage,
    description,
    isArchived ? 1 : 0,
  ];
  if (image) params.push(image);
  params.push(id);

  db.query(sql, params, (err) => {
    if (err) return res.status(500).send(err);
    res.json({ success: true });
  });
});

// --- ROTAS DE MOVIMENTAÇÕES ---
app.get("/api/movements", (req, res) => {
  const sql = `
        SELECT mov.*, mat.name as material_name 
        FROM movements mov
        JOIN materials mat ON mov.material_id = mat.id
        ORDER BY mov.date DESC, mov.id DESC`;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    const formatted = results.map((m) => ({
      id: m.id,
      materialId: m.material_id,
      materialName: m.material_name,
      type: m.type,
      quantity: m.quantity,
      date: m.date,
      reason: m.reason,
    }));
    res.json(formatted);
  });
});

app.post("/api/movements", (req, res) => {
  const { materialId, type, quantity, date, reason } = req.body;

  const movSql =
    "INSERT INTO movements (material_id, type, quantity, date, reason) VALUES (?, ?, ?, ?, ?)";

  const updateSql =
    type === "entrada"
      ? "UPDATE materials SET quantity = quantity + ? WHERE id = ?"
      : "UPDATE materials SET quantity = quantity - ? WHERE id = ?";

  db.beginTransaction((err) => {
    if (err) return res.status(500).send(err);

    db.query(movSql, [materialId, type, quantity, date, reason], (err) => {
      if (err) return db.rollback(() => res.status(500).send(err));

      db.query(updateSql, [quantity, materialId], (err) => {
        if (err) return db.rollback(() => res.status(500).send(err));

        db.commit((err) => {
          if (err) return db.rollback(() => res.status(500).send(err));
          res.json({ success: true });
        });
      });
    });
  });
});

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));
