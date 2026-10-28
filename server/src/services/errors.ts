// Codigo de error expresado en terminos de dominio, sin ninguna referencia a HTTP (constitution C)
export type DomainErrorCode = 'VALIDATION' | 'DUPLICATE_NAME' | 'NOT_FOUND';

// Error de negocio lanzado por la capa de servicios y traducido a HTTP solo en los controladores
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(message: string, code: DomainErrorCode) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}

// Detecta la colision de clave unica de MongoDB (E11000) para mapearla a nombre duplicado
export function isDuplicateKeyError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: number | string }).code;
  return code === 11000 || code === 'E11000';
}
