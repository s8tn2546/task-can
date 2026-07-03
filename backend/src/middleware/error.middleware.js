function errorMiddleware(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Server error';
  return res.status(status).json({ error: message });
}

module.exports = errorMiddleware;
