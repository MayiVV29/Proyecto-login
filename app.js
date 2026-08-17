import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; // 1. Importamos la librería JWT

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const __dirname = path.resolve();
app.use(express.static(__dirname));

// 2. Clave secreta para firmar los tokens (en un proyecto real iría en una variable de entorno)
const JWT_SECRET = 'mi_clave_secreta_super_segura_2026';

// Conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'biblioteca'
});

db.connect((err) => {
    if (err) {
        console.error('Error conectando a la base de datos:', err.message);
        return;
    }
    console.log('Conectado a la base de datos MySQL.');
});

// Ruta de login con validación y protección contra inyección SQL
app.post('/api/login', (req, res) => {
    const { usuario, password } = req.body;

    // Consulta parametrizada (segura contra inyección SQL)
    db.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Usuario no encontrado' });
        }

        const user = results[0];

        // Verificar contraseña con bcrypt
        bcrypt.compare(password, user.password, (err, result) => {
            if (result) {
                // 3. Si la contraseña es correcta, generamos un token JWT
                const token = jwt.sign(
                    { id: user.id, usuario: user.usuario }, // datos que guarda el token
                    JWT_SECRET,                              // clave secreta para firmarlo
                    { expiresIn: '1h' }                      // el token expira en 1 hora
                );

                res.json({
                    message: 'Login exitoso',
                    token: token // enviamos el token al cliente
                });
            } else {
                res.status(401).json({ message: 'Contraseña incorrecta' });
            }
        });
    });
});

app.listen(port, () => {
    console.log(`Servidor escuchando en el puerto ${port}`);
});