const express = require("express");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const { Pool } = require("pg");
const path = require('path');
const fs = require('fs');
const app = express();
const bodyParser = require('body-parser');
app.use(express.json());
const port = 3000;


require("dotenv").config();



const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "database Cv",
      version: "1.0.0",
    },
  },
  apis: ["dataBaseCv.js"],
};

const specs = swaggerJsdoc(options);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

app.get("/", (req, res) => {
  res.send("!welcome to my page a pleasure kikeriveros where you will find everything about my api!");
});
/**
 * @swagger
 * /:
 *   get:
 *     summary: Thank you for visiting my api we will be uploading new data
 *     responses:
 *       200:
 *         description: we thank you for your attention
 */

// Define your API key
const apiKey = process.env.API_KEY || "bUMx6Ir4dWch"; // Puedes definir la API key en el archivo .env

// Crea una función de middleware para verificar la API key
function verifyApiKey(req, res, next) {
  const providedApiKey = req.headers["api-key"];

  if (providedApiKey && providedApiKey === apiKey) {
    // La API key es válida
    next();
  } else {
    // La API key no es válida
    res.status(403).json({ error: "Acceso no autorizado. API key inválida." });
  }
}// Use the middleware for all routes

const pool = new Pool({
  user: "default",
  host: "ep-polished-glitter-00374982-pooler.us-east-1.postgres.vercel-storage.com",
  database: "verceldb",
  password: "bUMx6Ir4dWch",
  port: 5432,
  ssl: { rejectUnauthorized: false },
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/users/upload', (req, res) => {
  // Obtener los campos y valores del cuerpo de la solicitud
  const data = req.body;

  // Crear el contenido del archivo de texto
  const content = Object.entries(data)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');

  // Definir la ruta del directorio de uploads
  const uploadDir = path.join(__dirname, 'uploads');

  // Verificar si el directorio existe, si no, crearlo
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
  }

  // Guardar el contenido en un archivo llamado 'upload.txt' dentro del directorio de uploads
  const filePath = path.join(uploadDir, 'Cv.txt');
  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error al generar el archivo.');
    } else {
      console.log(`Archivo ${filePath} generado con éxito.`);
      res.status(200).send('Archivo generado con éxito.');
    }
  });
});

// Obtener un usuario por document_number
app.get("/users/:document_number", async (req, res) => {
  // Construir la consulta para obtener un usuario por document_number
  const getUserQuery = `SELECT * FROM users WHERE document_number = ${req.params.document_number}`;

  try {
    // Ejecutar la consulta para obtener el usuario
    const data = await pool.query(getUserQuery);

    // Mostrar información en la consola
    console.log("User details: ", data.rows);

    // Enviar la respuesta con los detalles del usuario
    res.status(200).send(data.rows);
  } catch (err) {
    console.error(err);
    // Enviar respuesta de error en caso de problemas
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Agregar un nuevo usuario
app.post("/users", function (req, res) {
  const document_number = req.body.document_number;
  const full_name = req.body.full_name;
  const profession = req.body.profession;
  const studies = req.body.studies;
  const experience = req.body.experience; // Agregado el campo 'experience'
  const insertar = `INSERT INTO users(document_number, full_name, profession, studies, experience) 
  VALUES(${document_number}, '${full_name}', '${profession}', '${studies}', '${experience}')`;

  pool.query(insertar)
    .then(() => {
      res.status(201).send("User saved");
    })
    .catch((err) => {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    });
  console.log(req.body);
});

// Actualizar un usuario por id
app.put("/users/:id", async (req, res) => {
  // Campos permitidos para actualizar
  const allowedFields = ['profession', 'studies', 'experience', 'cv'];

  // Filtrar los campos enviados en la solicitud para asegurarse de que solo se actualicen los permitidos
  const updateFields = Object.keys(req.body).filter(field => allowedFields.includes(field));

  // Verificar si hay campos para actualizar
  if (updateFields.length === 0) {
    return res.status(400).json({ error: "Bad Request: No valid fields to update." });
  }

  // Construir la consulta de actualización dinámicamente
  const updateQuery = `UPDATE users SET ${updateFields.map(field => `${field}='${req.body[field]}'`).join(', ')} WHERE id=${req.params.id}`;

  try {
    // Ejecutar la consulta de actualización
    await pool.query(updateQuery);

    // Enviar respuesta exitosa
    res.status(201).send("User modified successfully.");
  } catch (err) {
    console.error(err);
    // Enviar respuesta de error en caso de problemas
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Eliminar un usuario por document_number
app.delete("/users/:document_number", async (req, res) => {
    // Construir la consulta de eliminación basada en el document_number proporcionado
    const deleteQuery = `DELETE FROM users WHERE document_number=${req.params.document_number}`;
  
    try {
      // Ejecutar la consulta de eliminación
      await pool.query(deleteQuery);
  
      // Enviar respuesta exitosa
      res.status(204).send("User Deleted");
    } catch (err) {
      console.error(err);
      // Enviar respuesta de error en caso de problemas
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

app.get("/users", async (req, res) => {
    // Construir la consulta para obtener todos los usuarios
    const getAllUsersQuery = "SELECT * FROM users";
  
    try {
      // Ejecutar la consulta para obtener todos los usuarios
      const data = await pool.query(getAllUsersQuery);
  
      // Mostrar información en la consola
      console.log("All users: ", data.rows);
  
      // Enviar la respuesta con todos los usuarios
      res.status(200).send(data.rows);
    } catch (err) {
      console.error(err);
      // Enviar respuesta de error en caso de problemas
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  module.exports = app;

app.listen(port, function () {
  console.log(`the student server is working`);
});