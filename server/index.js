const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Verificación básica del API
app.get('/api/health', (req, res) => {
  res.json({ status: 'API operativa', timestamp: new Date() });
});

// Helper para extraer el ID del usuario desde el Bearer token mock si no viene en el body
function extraerUsuarioIdDesdeHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const match = token.match(/^jwt_access_mock_(\d+)_/);
  return match ? parseInt(match[1], 10) : null;
}

// ============================================================================
// ENDPOINTS DE AUTENTICACIÓN (LOGIN Y REGISTRO DIRIGENTE)
// ============================================================================

// 1. Registro exclusivo de Dirigente
app.post('/api/auth/registro-dirigente', async (req, res) => {
  const { dni, nombres, apellidos, email, password } = req.body;

  try {
    const [existentes] = await db.query(
      'SELECT id FROM usuarios WHERE dni = ? OR email = ?',
      [dni, email]
    );

    if (existentes.length > 0) {
      return res.status(400).json({
        mensaje: 'El DNI o correo electrónico ya se encuentra registrado.',
      });
    }

    const [roles] = await db.query(
      "SELECT id FROM roles WHERE nombre = 'SOLICITANTE_DIRIGENTE'"
    );

    let rolId;
    if (roles.length === 0) {
      const [nuevoRol] = await db.query(
        "INSERT INTO roles (nombre, descripcion) VALUES ('SOLICITANTE_DIRIGENTE', 'Dirigente representante de la olla común')"
      );
      rolId = nuevoRol.insertId;
    } else {
      rolId = roles[0].id;
    }

    const [result] = await db.query(
      `INSERT INTO usuarios (dni, nombres, apellidos, email, password_hash, rol_id, estado)
       VALUES (?, ?, ?, ?, ?, ?, 'ACTIVO')`,
      [dni, nombres, apellidos, email, password, rolId]
    );

    const usuarioId = result.insertId;

    const accessToken = `jwt_access_mock_${usuarioId}_${Date.now()}`;
    const refreshToken = `jwt_refresh_mock_${usuarioId}_${Date.now()}`;

    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaExpiracion.getDate() + 7);

    await db.query(
      `INSERT INTO tokens_sesion (usuario_id, refresh_token_hash, expira_en)
       VALUES (?, ?, ?)`,
      [usuarioId, refreshToken, fechaExpiracion]
    );

    return res.status(201).json({
      access_token: accessToken,
      refresh_token: refreshToken,
      usuario: {
        id: usuarioId,
        dni,
        nombres,
        apellidos,
        email,
        rol_id: rolId,
        rol: 'SOLICITANTE_DIRIGENTE',
        olla_id: null,
        estado: 'ACTIVO',
      },
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ mensaje: 'El DNI o correo ya se encuentra registrado.' });
    }
    console.error('Error al registrar dirigente:', error);
    return res.status(500).json({ mensaje: error.message });
  }
});

app.post('/api/auth/register', (req, res, next) => {
  req.url = '/api/auth/registro-dirigente';
  app.handle(req, res, next);
});

// 2. Login de Dirigente
app.post('/api/auth/login', async (req, res) => {
  const { identificador, password } = req.body;

  try {
    const [usuarios] = await db.query(
      `SELECT u.id, u.dni, u.nombres, u.apellidos, u.email, u.password_hash, u.estado, u.olla_id, r.nombre AS rol
       FROM usuarios u
       INNER JOIN roles r ON u.rol_id = r.id
       WHERE (u.dni = ? OR u.email = ?) AND r.nombre = 'SOLICITANTE_DIRIGENTE'`,
      [identificador, identificador]
    );

    if (usuarios.length === 0) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas o no es dirigente.' });
    }

    const usuario = usuarios[0];

    if (usuario.password_hash !== password) {
      return res.status(401).json({ mensaje: 'Contraseña incorrecta.' });
    }

    const accessToken = `jwt_access_mock_${usuario.id}_${Date.now()}`;
    const refreshToken = `jwt_refresh_mock_${usuario.id}_${Date.now()}`;

    return res.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      usuario: {
        id: usuario.id,
        dni: usuario.dni,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol,
        olla_id: usuario.olla_id,
        estado: usuario.estado,
      },
    });
  } catch (error) {
    console.error('Error en /auth/login:', error);
    return res.status(500).json({ mensaje: error.message });
  }
});

// ============================================================================
// ENDPOINTS DE OLLAS COMUNES
// ============================================================================

// Obtener datos de una olla por ID
const obtenerOllaPorId = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ollas_comunes WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ mensaje: 'Olla común no encontrada.' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ mensaje: error.message });
  }
};

app.get('/api/ollas/:id', obtenerOllaPorId);
app.get('/api/ollas-comunes/:id', obtenerOllaPorId);

// Registrar Olla Común
const registrarOlla = async (req, res) => {
  const nombre = req.body.nombre || req.body.nombre_olla;
  const distrito = req.body.distrito;
  let direccion = req.body.direccion || '';
  const referencia = req.body.referencia || req.body.punto_referencia;
  
  const usuario_id = req.body.usuario_id || req.body.dirigente_id || extraerUsuarioIdDesdeHeader(req);

  if (!nombre || !distrito) {
    return res.status(400).json({ mensaje: 'El nombre y el distrito son obligatorios.' });
  }

  if (referencia) {
    direccion = direccion ? `${direccion} (Ref: ${referencia})` : `Ref: ${referencia}`;
  }

  try {
    const [result] = await db.query(
      `INSERT INTO ollas_comunes (nombre, direccion, distrito, estado_aprobacion)
       VALUES (?, ?, ?, 'PENDIENTE')`,
      [nombre, direccion, distrito]
    );

    const ollaId = result.insertId;

    if (usuario_id) {
      await db.query('UPDATE usuarios SET olla_id = ? WHERE id = ?', [ollaId, usuario_id]);
    }

    return res.status(201).json({
      id: ollaId,
      olla_id: ollaId,
      nombre,
      direccion,
      distrito,
      estado_aprobacion: 'PENDIENTE',
      mensaje: 'Olla común registrada con éxito'
    });
  } catch (error) {
    console.error('Error al registrar olla:', error);
    return res.status(500).json({ mensaje: error.message });
  }
};

app.post('/api/ollas', registrarOlla);
app.post('/api/ollas-comunes', registrarOlla);
app.post('/api/solicitudes/olla', registrarOlla);

// ============================================================================
// ENDPOINTS DE BENEFICIARIOS (PADRÓN)
// ============================================================================

// Mock de verificación RENIEC (usado por onDniBlur en PadronPage)
app.get('/api/reniec/verificar/:dni', (req, res) => {
  const { dni } = req.params;
  if (!/^\d{8}$/.test(dni)) {
    return res.status(400).json({ valido: false, motivo: 'Formato de DNI inválido' });
  }

  res.json({
    dni,
    valido: true,
    nombres: 'CIUDADANO',
    apellidos: 'VERIFICADO RENIEC',
    estado_documento: 'VIGENTE'
  });
});

// Listar beneficiarios de una olla
const listarBeneficiariosHandler = async (req, res) => {
  const { ollaId } = req.params;

  if (!ollaId || ollaId === 'undefined' || ollaId === 'null') {
    return res.json([]);
  }

  try {
    const [rows] = await db.query(
      `SELECT id, olla_id, dni, nombres, apellidos, fecha_nacimiento, 
              integrantes_hogar, condicion_nutricional, estado_padron 
       FROM beneficiarios 
       WHERE olla_id = ? 
       ORDER BY id DESC`,
      [ollaId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error al obtener padrón:', error);
    res.status(500).json({ mensaje: error.message });
  }
};

app.get('/api/ollas/:ollaId/beneficiarios', listarBeneficiariosHandler);
app.get('/api/ollas-comunes/:ollaId/beneficiarios', listarBeneficiariosHandler);

// Registrar beneficiario individual (devuelve 409 si el DNI ya existe en la olla)
const registrarBeneficiarioHandler = async (req, res) => {
  const { ollaId } = req.params;
  const {
    dni,
    nombres,
    apellidos,
    fecha_nacimiento,
    integrantes_hogar,
    condicion_nutricional
  } = req.body;

  if (!ollaId || ollaId === 'undefined' || ollaId === 'null') {
    return res.status(400).json({ mensaje: 'ID de olla común no válido.' });
  }

  try {
    const [existentes] = await db.query(
      'SELECT id FROM beneficiarios WHERE olla_id = ? AND dni = ?',
      [ollaId, dni]
    );

    if (existentes.length > 0) {
      return res.status(409).json({
        mensaje: 'Este DNI ya está registrado en tu olla común (posible duplicado).'
      });
    }

    const [result] = await db.query(
      `INSERT INTO beneficiarios 
       (olla_id, dni, nombres, apellidos, fecha_nacimiento, integrantes_hogar, condicion_nutricional, estado_padron, dni_valido_modulo11)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVO', 1)`,
      [
        ollaId,
        dni,
        nombres,
        apellidos,
        fecha_nacimiento || '2000-01-01',
        integrantes_hogar || 1,
        condicion_nutricional || null
      ]
    );

    res.status(201).json({
      id: result.insertId,
      olla_id: Number(ollaId),
      dni,
      nombres,
      apellidos,
      fecha_nacimiento,
      integrantes_hogar: Number(integrantes_hogar) || 1,
      condicion_nutricional,
      estado_padron: 'ACTIVO',
      mensaje: 'Beneficiario registrado con éxito.'
    });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'Este DNI ya se encuentra registrado en esta olla.' });
    }
    console.error('Error al registrar beneficiario:', error);
    return res.status(500).json({ mensaje: error.message });
  }
};

app.post('/api/ollas/:ollaId/beneficiarios', registrarBeneficiarioHandler);
app.post('/api/ollas-comunes/:ollaId/beneficiarios', registrarBeneficiarioHandler);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend escuchando en http://localhost:${PORT}`);
});