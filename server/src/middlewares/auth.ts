import { Request, Response, NextFunction } from 'express';

// Extendemos Request de Express para que acepte el usuario
declare global {
  namespace Express {
    interface Request {
      user?: { id: string };
    }
  }
}

// Middleware temporal dado que la identidad se maneja con Hodor
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Placeholder: Asumiremos un usuario mock por ahora.
  // En producción, aquí validaríamos el JWT o Session entregado por tu proveedor Hodor.
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    // Si quisieramos estricto, enviaríamos 401. 
    // Para facilitar el desarrollo antes de enchufar Hodor, inyectamos un id falso
    req.user = { id: 'user-hodor-123' };
    return next();
  }

  // Parse hipotético de Token
  req.user = { id: 'user-hodor-123' };
  next();
};
