import { useState } from 'react';
import {
  CATEGORY_COLOR_OPTIONS,
  CreateCategorySchema,
  UpdateCategorySchema,
  DEFAULT_CATEGORY_COLOR,
  type Category,
} from '@brienne/shared';
import {
  useCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from '../hooks/useCategories';

type Mode = 'list' | 'create' | 'edit' | 'delete_confirm';

interface CategoryModalContentProps {
  onClose: () => void;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// La descripcion vacia o de solo espacios se despacha como null para que el backend la persista igual
function normalizeDescriptionValue(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function CategoryModalContent({ onClose }: CategoryModalContentProps) {
  const { data: categories } = useCategoriesQuery();
  const list = categories ?? [];

  // El modal se desmonta al cerrar, por lo que los borradores locales se descartan solos (RF-09)
  const [mode, setMode] = useState<Mode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [color, setColor] = useState<string>(DEFAULT_CATEGORY_COLOR);
  const [validationError, setValidationError] = useState<string | null>(null);

  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();

  const selected = list.find((category) => category.id === selectedId) ?? null;

  const apiError =
    mode === 'create'
      ? createMutation.error?.message
      : mode === 'edit'
        ? updateMutation.error?.message
        : mode === 'delete_confirm'
          ? deleteMutation.error?.message
          : undefined;
  const errorMessage = validationError ?? apiError ?? null;

  const resetDraft = () => {
    setNombre('');
    setDescripcion('');
    setColor(DEFAULT_CATEGORY_COLOR);
    setValidationError(null);
  };

  const goToList = () => {
    resetDraft();
    createMutation.reset();
    updateMutation.reset();
    deleteMutation.reset();
    setMode('list');
  };

  const startCreate = () => {
    resetDraft();
    createMutation.reset();
    setMode('create');
  };

  const startEdit = (target: Category) => {
    setSelectedId(target.id ?? null);
    setNombre(target.nombre);
    setDescripcion(target.descripcion ?? '');
    setColor(target.color);
    setValidationError(null);
    updateMutation.reset();
    setMode('edit');
  };

  const startDeleteConfirm = (target: Category) => {
    setSelectedId(target.id ?? null);
    setValidationError(null);
    deleteMutation.reset();
    setMode('delete_confirm');
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setValidationError(null);

    if (mode === 'create') {
      const parsed = CreateCategorySchema.safeParse({ nombre, descripcion, color });
      if (!parsed.success) {
        // Validacion reactiva en cliente antes de despachar el payload (constitution E)
        setValidationError(parsed.error.issues[0]?.message ?? 'Error de validación');
        return;
      }
      const payload = {
        ...parsed.data,
        descripcion: normalizeDescriptionValue(parsed.data.descripcion),
      };
      createMutation.mutate(payload, { onSuccess: goToList });
      return;
    }

    const parsed = UpdateCategorySchema.safeParse({ nombre, descripcion, color });
    if (!parsed.success) {
      setValidationError(parsed.error.issues[0]?.message ?? 'Error de validación');
      return;
    }
    if (selected?.id) {
      const payload = {
        ...parsed.data,
        descripcion: normalizeDescriptionValue(parsed.data.descripcion),
      };
      updateMutation.mutate({ id: selected.id, payload }, { onSuccess: goToList });
    }
  };

  const handleConfirmDelete = () => {
    if (!selected?.id) return;
    deleteMutation.mutate(selected.id, { onSuccess: goToList });
  };

  const isPending = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const headerLabel =
    mode === 'create'
      ? 'NUEVA'
      : mode === 'edit'
        ? 'EDICIÓN'
        : mode === 'delete_confirm'
          ? 'PELIGRO'
          : 'GESTIÓN';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-6 md:p-12 bg-black/80 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Encabezado lateral asimetrico estilo Mondrian */}
        <div
          className={`w-full border-b-8 border-black flex items-center justify-center py-4 ${
            mode === 'delete_confirm' ? 'bg-[#ff1e01]' : mode === 'create' || mode === 'edit' ? 'bg-[#2250ce]' : 'bg-black'
          }`}
        >
          <span className="text-white font-black text-xl tracking-[0.6em] uppercase">
            {headerLabel} DE CATEGORÍAS
          </span>
        </div>

        {/* Celda de cabecera con identificador y cierre */}
        <div className="flex justify-between items-center border-b-8 border-black px-8 py-6 bg-white">
          <span className="font-label font-bold uppercase tracking-[0.2em] text-xs opacity-60">
            MOD_CATEGORIES_005
          </span>
          <button
            type="button"
            aria-label="Cerrar modal de categorías"
            onClick={onClose}
            className="bg-black text-white w-12 h-12 flex items-center justify-center hover:bg-[#ff1e01] transition-colors border-2 border-black"
          >
            <span className="material-symbols-outlined font-bold">close</span>
          </button>
        </div>

        {mode === 'delete_confirm' ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white text-center">
            <span className="material-symbols-outlined text-[120px] text-[#ff1e01] mb-6 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">
              warning
            </span>
            <h3 className="font-black text-4xl uppercase tracking-tighter mb-4 text-black">
              ¿Eliminar la categoría?
            </h3>
            <p className="font-label text-xl uppercase font-bold text-black/60 max-w-lg mb-12">
              Las tareas asociadas quedarán sin categoría. La eliminación es definitiva.
            </p>
            {errorMessage && (
              <p role="alert" className="text-[#ff1e01] font-black text-sm uppercase mb-6">
                {errorMessage}
              </p>
            )}
            <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
              <button
                type="button"
                onClick={goToList}
                className="flex-1 md:flex-none px-8 py-4 bg-white text-black border-4 border-black font-black text-xl uppercase tracking-widest hover:bg-[#fac901] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                CANCELAR
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isPending}
                className="flex-1 md:flex-none px-8 py-4 bg-[#ff1e01] text-white border-4 border-black font-black text-xl uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {isPending ? 'ELIMINANDO...' : 'CONFIRMAR BORRADO'}
              </button>
            </div>
          </div>
        ) : mode === 'list' ? (
          <div className="bg-white text-black">
            <div className="flex items-center justify-between border-b-8 border-black px-8 py-6">
              <span className="font-black text-lg uppercase tracking-widest">
                {list.length} {list.length === 1 ? 'categoría' : 'categorías'}
              </span>
              <button
                type="button"
                onClick={startCreate}
                className="px-6 py-3 bg-black text-[#fac901] border-4 border-black font-black text-sm uppercase tracking-widest hover:bg-[#2250ce] hover:text-white transition-colors"
              >
                Nueva categoría
              </button>
            </div>

            {list.length === 0 ? (
              <p className="px-8 py-12 text-center font-label uppercase tracking-widest text-black/50">
                No hay categorías todavía
              </p>
            ) : (
              <ul>
                {list.map((category) => (
                  <li
                    key={category.id}
                    className="flex items-center gap-4 border-b-8 border-black px-8 py-4 last:border-b-0"
                  >
                    <span
                      className="w-8 h-8 border-4 border-black shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="flex-1 font-black uppercase tracking-wide">{category.nombre}</span>
                    <span className="hidden md:block font-label text-xs uppercase text-black/50 max-w-[16rem] truncate">
                      {category.descripcion ?? ''}
                    </span>
                    <button
                      type="button"
                      aria-label={`Editar ${category.nombre}`}
                      onClick={() => startEdit(category)}
                      className="px-4 py-2 bg-white text-black border-4 border-black font-black text-xs uppercase tracking-widest hover:bg-[#2250ce] hover:text-white transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      aria-label={`Eliminar ${category.nombre}`}
                      onClick={() => startDeleteConfirm(category)}
                      className="px-4 py-2 bg-white text-[#ff1e01] border-4 border-black font-black text-xs uppercase tracking-widest hover:bg-[#ff1e01] hover:text-white transition-colors"
                    >
                      Eliminar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-8 p-8 bg-white text-black">
            {/* Celda de nombre */}
            <div className="border-4 border-black p-6">
              <label
                htmlFor="category-name"
                className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50"
              >
                Nombre de la categoría
              </label>
              <input
                id="category-name"
                aria-label="Nombre de categoría"
                className="w-full p-4 text-xl font-black uppercase border-4 border-black focus:outline-none focus:border-[#2250ce] placeholder:text-black/20"
                type="text"
                placeholder="EJ: LABORAL"
                value={nombre}
                onChange={(event) => setNombre(event.target.value)}
                autoComplete="off"
                required
              />
            </div>

            {/* Celda de descripcion */}
            <div className="border-4 border-black p-6">
              <label
                htmlFor="category-description"
                className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50"
              >
                Descripción (Opcional)
              </label>
              <textarea
                id="category-description"
                aria-label="Descripción de la categoría"
                className="w-full p-4 font-body text-base font-medium resize-none border-4 border-black focus:outline-none focus:border-[#2250ce] placeholder:text-black/20"
                placeholder="DESCRIPCIÓN BREVE..."
                rows={3}
                value={descripcion}
                onChange={(event) => setDescripcion(event.target.value)}
              />
            </div>

            {/* Paleta cerrada de cinco colores */}
            <div className="border-4 border-black p-6">
              <span className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50">
                Color
              </span>
              <div className="flex flex-wrap gap-3" data-testid="category-color-picker">
                {CATEGORY_COLOR_OPTIONS.map((option) => {
                  const isSelected = color === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-label={option.label}
                      aria-pressed={isSelected}
                      onClick={() => setColor(option.value)}
                      className={`px-4 py-3 border-4 border-black font-black text-xs uppercase tracking-widest transition-all ${
                        isSelected
                          ? 'ring-4 ring-[#fac901] ring-offset-2 ring-offset-black -translate-y-1 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                          : 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                      } ${option.value === '#ffffff' ? 'text-black' : 'text-white'}`}
                      style={{ backgroundColor: option.value }}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {errorMessage && (
              <p role="alert" className="text-[#ff1e01] font-black text-sm uppercase">
                {errorMessage}
              </p>
            )}

            <div className="flex flex-col md:flex-row gap-4 border-t-8 border-black pt-6">
              <button
                type="button"
                onClick={goToList}
                className="flex-1 md:flex-none px-8 py-4 bg-white text-black border-4 border-black font-black text-lg uppercase tracking-widest hover:bg-[#fac901] transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 md:flex-none px-8 py-4 bg-black text-[#fac901] border-4 border-black font-black text-lg uppercase tracking-widest hover:bg-[#2250ce] hover:text-white transition-colors disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function CategoryModal({ isOpen, onClose }: CategoryModalProps) {
  if (!isOpen) return null;
  return <CategoryModalContent onClose={onClose} />;
}
