import { z } from 'zod';

// Catalogo cerrado de colores de la paleta neoplastica, en hexadecimal minusculas (spec 005, Seccion 4)
export const CATEGORY_COLORS = ['#bc0002', '#2c4bdb', '#fac901', '#000000', '#ffffff'] as const;

// Color por defecto asignado cuando la creacion no lo envia
export const DEFAULT_CATEGORY_COLOR = '#ffffff';

// Opciones visuales de la paleta: valor canonico y etiqueta mostrada en la interfaz
export const CATEGORY_COLOR_OPTIONS: ReadonlyArray<{ value: (typeof CATEGORY_COLORS)[number]; label: string }> = [
  { value: '#bc0002', label: 'Rojo' },
  { value: '#2c4bdb', label: 'Azul' },
  { value: '#fac901', label: 'Amarillo' },
  { value: '#000000', label: 'Negro' },
  { value: '#ffffff', label: 'Blanco' },
];

// Mensajes exactos exigidos por la spec: deben coincidir en cliente y servidor
export const CATEGORY_ERRORS = {
  duplicateName: 'Nombre de categoría duplicado',
  nameLength: 'El nombre debe tener entre 3 y 25 caracteres',
  descriptionLength: 'La descripción no puede superar los 100 caracteres',
  invalidColor: 'Color no permitido',
  taskCategoryNotFound: 'Categoría inexistente',
} as const;

// Contrato canonico de la entidad Categoria.
// trim() se ejecuta antes de min/max, por eso los limites aplican sobre el valor ya recortado.
export const CategorySchema = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(3, CATEGORY_ERRORS.nameLength).max(25, CATEGORY_ERRORS.nameLength),
  descripcion: z.string().trim().max(100, CATEGORY_ERRORS.descriptionLength).nullable(),
  color: z.enum(CATEGORY_COLORS, { errorMap: () => ({ message: CATEGORY_ERRORS.invalidColor }) }),
});

// DTO de creacion: descripcion opcional y color con valor por defecto blanco
export const CreateCategorySchema = CategorySchema.omit({ id: true }).extend({
  descripcion: z
    .string()
    .trim()
    .max(100, CATEGORY_ERRORS.descriptionLength)
    .nullable()
    .default(null),
  color: z
    .enum(CATEGORY_COLORS, { errorMap: () => ({ message: CATEGORY_ERRORS.invalidColor }) })
    .default(DEFAULT_CATEGORY_COLOR),
});

// DTO de edicion: todos los campos opcionales (actualizacion parcial)
export const UpdateCategorySchema = CreateCategorySchema.partial();

export type Category = z.infer<typeof CategorySchema>;
export type CreateCategoryDTO = z.input<typeof CreateCategorySchema>;
export type UpdateCategoryDTO = z.input<typeof UpdateCategorySchema>;
