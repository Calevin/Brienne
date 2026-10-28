import mongoose from 'mongoose';
import {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CreateCategorySchema,
  UpdateCategorySchema,
  CATEGORY_ERRORS,
  DEFAULT_CATEGORY_COLOR,
} from '@brienne/shared';
import { CategoryModel } from '../models/Category';
import { TaskModel } from '../models/Task';
import { DomainError, isDuplicateKeyError } from './errors';

// Contrato estructural minimo de safeParse de Zod, para no importar zod como dependencia del servidor
interface ParsingSchema<T> {
  safeParse(input: unknown): {
    success: boolean;
    data?: T;
    error?: { issues: ReadonlyArray<{ message?: string }> };
  };
}

// Documento minimo que necesita el mapeo canonico de respuesta
interface CategoryLike {
  _id?: unknown;
  id?: string;
  nombre: string;
  descripcion?: string | null;
  color: string;
}

// Clave de unicidad global: recortada y en minusculas, preservando los acentos
function buildNameKey(nombre: string): string {
  return nombre.trim().toLowerCase();
}

// Descripcion ausente o compuesta solo por espacios se persiste como null
function normalizeDescription(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed === '' ? null : trimmed;
}

// Normalizacion previa a la validacion en creacion (todos los campos son obligatorios o por defecto)
function normalizeForCreate(data: CreateCategoryDTO): Record<string, unknown> {
  return {
    nombre: typeof data.nombre === 'string' ? data.nombre.trim() : '',
    descripcion: normalizeDescription(data.descripcion),
    color: data.color ?? DEFAULT_CATEGORY_COLOR,
  };
}

// Normalizacion en edicion: solo se toman los campos presentes en el payload (actualizacion parcial)
function normalizeForUpdate(data: UpdateCategoryDTO): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  if ('nombre' in data) normalized.nombre = typeof data.nombre === 'string' ? data.nombre.trim() : '';
  if ('descripcion' in data) normalized.descripcion = normalizeDescription(data.descripcion);
  if ('color' in data) normalized.color = data.color ?? DEFAULT_CATEGORY_COLOR;
  return normalized;
}

// Traduce el fallo de validacion de Zod a un error de dominio con el mensaje exacto de la primera regla
function parseOrThrow<T>(schema: ParsingSchema<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error?.issues[0];
    throw new DomainError(issue?.message ?? 'Validación de datos inválida', 'VALIDATION');
  }
  return result.data as T;
}

// Mapeo canonico: excluye _id, __v y nameKey del contrato expuesto
function toCategoryResponse(doc: CategoryLike): Category {
  return {
    id: doc._id !== undefined && doc._id !== null ? String(doc._id) : (doc.id ?? ''),
    nombre: doc.nombre,
    descripcion: doc.descripcion ?? null,
    color: doc.color as Category['color'],
  };
}

// Orden alfabetico ascendente: insensible a mayusculas pero sensible a acentos (spec 005, Seccion 4)
function compareByName(a: Category, b: Category): number {
  return a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'accent' });
}

export const CategoryService = {
  async findAll(): Promise<Category[]> {
    const docs = await CategoryModel.find().lean();
    return docs.map(toCategoryResponse).sort(compareByName);
  },

  async create(data: CreateCategoryDTO): Promise<Category> {
    const validated = parseOrThrow<Omit<Category, 'id'>>(CreateCategorySchema, normalizeForCreate(data));
    const nameKey = buildNameKey(validated.nombre);

    const existing = await CategoryModel.findOne({ nameKey });
    if (existing) {
      throw new DomainError(CATEGORY_ERRORS.duplicateName, 'DUPLICATE_NAME');
    }

    try {
      const doc = await CategoryModel.create({ ...validated, nameKey });
      return toCategoryResponse(doc.toObject());
    } catch (error) {
      // Carrera concurrente: la base de datos rechaza la clave duplicada (CL-08)
      if (isDuplicateKeyError(error)) {
        throw new DomainError(CATEGORY_ERRORS.duplicateName, 'DUPLICATE_NAME');
      }
      throw error;
    }
  },

  async update(id: string, data: UpdateCategoryDTO): Promise<Category | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;

    const validated = parseOrThrow<Partial<Omit<Category, 'id'>>>(
      UpdateCategorySchema,
      normalizeForUpdate(data)
    );

    // normalizeForUpdate garantiza valores definidos: solo los campos presentes llegan aqui
    const update: Record<string, unknown> = { ...validated };

    if (validated.nombre !== undefined) {
      const nameKey = buildNameKey(validated.nombre);
      // Autoexclusion: el propio registro no compite contra su nombre actual (CL-05)
      const conflict = await CategoryModel.findOne({ nameKey, _id: { $ne: id } });
      if (conflict) {
        throw new DomainError(CATEGORY_ERRORS.duplicateName, 'DUPLICATE_NAME');
      }
      update.nameKey = nameKey;
    }

    if (Object.keys(update).length === 0) {
      const current = await CategoryModel.findById(id).lean();
      return current ? toCategoryResponse(current) : null;
    }

    const doc = await CategoryModel.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!doc) return null;
    return toCategoryResponse(doc);
  },

  async remove(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;

    const doc = await CategoryModel.findByIdAndDelete(id).lean();
    if (!doc) return false;

    // RF-03: solo se desvincula la categoria de las tareas, nunca se eliminan tareas
    await TaskModel.updateMany({ categoryId: id }, { $set: { categoryId: null } });
    return true;
  },
};
