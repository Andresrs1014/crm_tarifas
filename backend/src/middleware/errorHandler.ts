import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error('[ErrorHandler]', err);

  if (err instanceof Error) {
    const anyErr = err as NodeJS.ErrnoException & { statusCode?: number; status?: number };
    const status = anyErr.statusCode ?? anyErr.status ?? 500;
    res.status(status).json({
      error: err.message || 'Error interno del servidor',
    });
    return;
  }

  res.status(500).json({ error: 'Error interno del servidor' });
}
