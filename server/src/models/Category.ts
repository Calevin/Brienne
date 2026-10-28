import mongoose, { Schema } from 'mongoose';
import { Category, CATEGORY_COLORS } from '@brienne/shared';

// Documento persistido: agrega la clave de unicidad, que no forma parte del contrato compartido
interface CategoryRecord extends Category {
  nameKey: string;
}

// Modelo de categoria global.
// nameKey es la clave de unicidad global: nombre recortado en minusculas (spec 005, RF-05).
// El indice unique garantiza la unicidad tambien ante escrituras concurrentes (CL-08).
const CategorySchema = new Schema<CategoryRecord>({
  nombre: { type: String, required: true, trim: true },
  nameKey: { type: String, required: true, unique: true },
  descripcion: { type: String, default: null },
  color: { type: String, required: true, enum: [...CATEGORY_COLORS] },
}, {
  timestamps: true // Añade createdAt y updatedAt automáticamente
});

export const CategoryModel = mongoose.model<CategoryRecord>('Category', CategorySchema);
