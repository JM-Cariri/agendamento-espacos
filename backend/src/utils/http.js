export function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

export class HttpError extends Error {
  constructor(status, message, details = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function sendError(error, _req, res, _next) {
  const status = Number.isInteger(error.status) ? error.status : Number.isInteger(error.statusCode) ? error.statusCode : 500;
  if (status >= 500) console.error(error.message);
  return res.status(status).json({
    error: status >= 500 ? 'Erro interno ao processar a solicitação.' : error.message,
    details: error.details || [],
  });
}
