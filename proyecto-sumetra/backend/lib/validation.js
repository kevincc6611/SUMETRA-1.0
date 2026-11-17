const { AppError } = require("./errors");

function validationError(message, details) {
  throw new AppError(422, message, "DATOS_INVALIDOS", details);
}

function requiredString(value, field, { min = 1, max = 255 } = {}) {
  if (typeof value !== "string") validationError(`${field} es obligatorio.`);
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    validationError(`${field} debe contener entre ${min} y ${max} caracteres.`);
  }
  return normalized;
}

function optionalString(value, field, { max = 1000 } = {}) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") validationError(`${field} no es válido.`);
  const normalized = value.trim();
  if (normalized.length > max) validationError(`${field} no puede superar ${max} caracteres.`);
  return normalized || null;
}

function email(value) {
  const normalized = requiredString(value, "email", { min: 5, max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    validationError("El correo electrónico no es válido.");
  }
  return normalized;
}

function password(value) {
  if (typeof value !== "string" || value.length < 8 || value.length > 72) {
    validationError("La contraseña debe contener entre 8 y 72 caracteres.");
  }
  if (!/[A-Za-zÁÉÍÓÚáéíóúÑñ]/.test(value) || !/\d/.test(value)) {
    validationError("La contraseña debe incluir al menos una letra y un número.");
  }
  return value;
}

function positiveMoney(value, field = "monto") {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 9999999999.99) {
    validationError(`${field} debe ser un número mayor que cero.`);
  }
  const rounded = Math.round(number * 100) / 100;
  if (Math.abs(number - rounded) > Number.EPSILON) {
    validationError(`${field} admite máximo dos decimales.`);
  }
  return rounded;
}

function nonNegativeMoney(value, field = "precio") {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 9999999999.99) {
    validationError(`${field} debe ser un número igual o mayor que cero.`);
  }
  const rounded = Math.round(number * 100) / 100;
  if (Math.abs(number - rounded) > Number.EPSILON) {
    validationError(`${field} admite máximo dos decimales.`);
  }
  return rounded;
}

function integer(value, field, { min = 0, max = 2147483647 } = {}) {
  const number = Number(value);
  if (!Number.isInteger(number) || number < min || number > max) {
    validationError(`${field} debe ser un entero entre ${min} y ${max}.`);
  }
  return number;
}

function id(value, field = "id") {
  return integer(value, field, { min: 1, max: Number.MAX_SAFE_INTEGER });
}

function isoDate(value, field = "fecha", { defaultToday = false } = {}) {
  if ((value === undefined || value === null || value === "") && defaultToday) {
    return new Date().toISOString().slice(0, 10);
  }
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    validationError(`${field} debe usar el formato AAAA-MM-DD.`);
  }
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    validationError(`${field} no es una fecha válida.`);
  }
  return value;
}

function optionalIsoDate(value, field) {
  if (value === undefined || value === null || value === "") return null;
  return isoDate(value, field);
}

function enumValue(value, field, values) {
  if (!values.includes(value)) validationError(`${field} debe ser uno de: ${values.join(", ")}.`);
  return value;
}

module.exports = {
  validationError,
  requiredString,
  optionalString,
  email,
  password,
  positiveMoney,
  nonNegativeMoney,
  integer,
  id,
  isoDate,
  optionalIsoDate,
  enumValue
};
