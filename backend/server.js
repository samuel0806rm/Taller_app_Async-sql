const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// Conexión con MySQL
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Mysql1234!",
    database: "mi_app"
});

// Probar conexión
db.connect((err) => {
    if (err) {
        console.error("Error conectando a MySQL:", err);
        return;
    }

    console.log("Conectado a MySQL");
});

// GET - obtener productos
app.get("/productos", (req, res) => {
    db.query("SELECT * FROM productos", (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json(results);
    });
});

// POST - crear producto
app.post("/productos", (req, res) => {
    const { nombre, cantidad } = req.body;

    if (!nombre || cantidad === undefined) {
        return res.status(400).json({
            error: "Nombre y cantidad son obligatorios"
        });
    }

    const sql = "INSERT INTO productos (nombre, cantidad) VALUES (?, ?)";

    db.query(sql, [nombre, cantidad], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.status(201).json({
            id: result.insertId,
            nombre,
            cantidad
        });
    });
});

// PUT - actualizar producto
app.put("/productos/:id", (req, res) => {
    const { id } = req.params;
    const { nombre, cantidad } = req.body;

    const sql = `
        UPDATE productos
        SET nombre = ?, cantidad = ?
        WHERE id = ?
    `;

    db.query(sql, [nombre, cantidad, id], (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        res.json({
            mensaje: "Producto actualizado"
        });
    });
});

// DELETE - eliminar producto
app.delete("/productos/:id", (req, res) => {
    const { id } = req.params;

    db.query(
        "DELETE FROM productos WHERE id = ?",
        [id],
        (err, result) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.json({
                mensaje: "Producto eliminado"
            });
        }
    );
});

// Iniciar servidor
app.listen(3000, () => {
    console.log("Servidor funcionando en http://localhost:3000");
});