export function notFoundHandler(_req, res) {
  res.status(404).json({ ok: false, message: "Route haipo." });
}

export function errorHandler(err, _req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    ok: false,
    message: status === 500 ? "Kuna hitilafu ya server." : err.message
  });
}
