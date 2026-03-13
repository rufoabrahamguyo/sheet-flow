export function errorHandler(err, _req, res, _next) {
    const status = err.status ?? 500;
    const message = err.message ?? 'Internal Server Error';
    console.error('[error]', status, message, err.stack);
    res.status(status).json({ message });
}
