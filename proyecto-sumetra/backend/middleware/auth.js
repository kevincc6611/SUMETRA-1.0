const jwt = require("jsonwebtoken");
const { config } = require("../config");
const { AppError, asyncHandler } = require("../lib/errors");

function publicUser(row) {
  return {
    id: Number(row.id),
    nombre: row.nombre,
    email: row.email,
    rol: row.rol,
    activo: Boolean(row.activo)
  };
}

function signToken(user) {
  return jwt.sign(
    { rol: user.rol, nombre: user.nombre },
    config.jwt.secret,
    { subject: String(user.id), expiresIn: config.jwt.expiresIn, issuer: "sumetra" }
  );
}

function createAuthMiddleware(pool) {
  const authenticate = asyncHandler(async (req, _res, next) => {
    const authorization = req.get("authorization") || "";
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    if (!match) throw new AppError(401, "Debes iniciar sesión.", "SESION_REQUERIDA");

    let payload;
    try {
      payload = jwt.verify(match[1], config.jwt.secret, { issuer: "sumetra" });
    } catch {
      throw new AppError(401, "La sesión no es válida o ya venció.", "SESION_INVALIDA");
    }

    const [rows] = await pool.execute(
      "SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ? LIMIT 1",
      [payload.sub]
    );
    if (rows.length === 0 || !rows[0].activo) {
      throw new AppError(401, "La cuenta no está disponible.", "CUENTA_INACTIVA");
    }
    req.user = publicUser(rows[0]);
    next();
  });

  function authorize(...roles) {
    return function authorizationMiddleware(req, _res, next) {
      if (!req.user || !roles.includes(req.user.rol)) {
        return next(new AppError(403, "No tienes permiso para realizar esta acción.", "SIN_PERMISO"));
      }
      next();
    };
  }

  return { authenticate, authorize };
}

module.exports = { createAuthMiddleware, signToken, publicUser };
