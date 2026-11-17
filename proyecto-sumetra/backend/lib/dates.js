const validation = require("./validation");

function parseDateRange(query) {
  const desde = validation.optionalIsoDate(query.desde, "desde");
  const hasta = validation.optionalIsoDate(query.hasta, "hasta");
  if (desde && hasta && desde > hasta) {
    validation.validationError("desde no puede ser posterior a hasta.");
  }
  return { desde, hasta };
}

function dateWhere(alias, range, params) {
  const conditions = [];
  if (range.desde) {
    conditions.push(`${alias}.fecha >= ?`);
    params.push(range.desde);
  }
  if (range.hasta) {
    conditions.push(`${alias}.fecha <= ?`);
    params.push(range.hasta);
  }
  return conditions;
}

module.exports = { parseDateRange, dateWhere };
