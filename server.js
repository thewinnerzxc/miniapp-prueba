require('dotenv').config();

// Importar los módulos necesarios
const express = require('express');
const path = require('path');
const { Pool } = require('pg');

// Crear una aplicación de Express
const app = express();
// El puerto se obtiene de las variables de entorno de Render, o se usa 3000 para local
const PORT = process.env.PORT || 3000;

// Configurar la conexión a la base de datos PostgreSQL
// La URL de la base de datos se toma de la variable de entorno DATABASE_URL
// Render la configurará automáticamente. Para local, usarías un archivo .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // En producción (en Render), se requiere SSL, pero sin rechazar conexiones no autorizadas
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

// Middlewares
// Para poder procesar JSON en el cuerpo de las peticiones POST
app.use(express.json());
// Para servir archivos estáticos (como nuestro index.html)
app.use(express.static(path.join(__dirname)));

// --- RUTAS DE LA API ---

// Ruta GET para la raíz ('/')
// Sirve el archivo index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta POST para /api/contact
// Recibe nombre y email y los guarda en la base de datos
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email } = req.body;

    // Validar que los datos no estén vacíos
    if (!name || !email) {
      return res.status(400).json({ message: 'Nombre y email son requeridos.' });
    }

    // Consulta SQL para insertar un nuevo contacto
    const query = 'INSERT INTO contacts(name, email) VALUES($1, $2) RETURNING *';
    const values = [name, email];
    
    // Ejecutar la consulta
    const result = await pool.query(query, values);
    
    console.log('Contacto guardado:', result.rows[0]);
    
    // Enviar una respuesta de éxito al cliente
    res.status(201).json({ message: '¡Contacto guardado con éxito!', contact: result.rows[0] });

  } catch (error) {
    // Si ocurre un error, registrarlo en la consola y enviar una respuesta de error
    console.error('Error al guardar el contacto:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});

