import { useState, useEffect } from 'react';
import { useCreateTaskMutation, useTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation } from '../hooks/useTasks';
import { useUIStore } from '../store/uiStore';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ isOpen, onClose }: TaskModalProps) {
  const { selectedTaskId } = useUIStore();
  const { data: tasks } = useTasksQuery();
  
  const [mode, setMode] = useState<'create' | 'view' | 'edit' | 'delete_confirm'>('create');
  
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [points, setPoints] = useState<number>(1);
  const [assignee, setAssignee] = useState<string>('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');

  const createTaskMutation = useCreateTaskMutation();
  const updateTaskMutation = useUpdateTaskMutation();
  const deleteTaskMutation = useDeleteTaskMutation();

  const handleDelete = () => {
    if (!selectedTaskId) return;
    setMode('delete_confirm');
  };

  useEffect(() => {
    if (isOpen) {
      if (selectedTaskId && tasks) {
        const task = tasks.find(t => t.id === selectedTaskId);
        if (task) {
          setTitle(task.title);
          setDetail(task.detail ?? '');
          setPoints(task.points as number || 1);
          setAssignee(task.assignedTo?.[0] || '');
          if (task.dueDate) {
            const date = new Date(task.dueDate);
            setDateStr(`${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`);
            setTimeStr(`${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`);
          } else {
             setDateStr('');
             setTimeStr('');
          }
          if (mode === 'create') setMode('view');
        }
      } else {
        setTitle('');
        setDetail('');
        setPoints(1);
        setAssignee('');
        setDateStr('');
        setTimeStr('');
        setMode('create');
      }
    }
  }, [isOpen, selectedTaskId, tasks]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalDueDate: Date | null = null;
    if (dateStr) {
       const timeVal = timeStr || '00:00';
       finalDueDate = new Date(`${dateStr}T${timeVal}:00`);
    }

    if (mode === 'create') {
      createTaskMutation.mutate(
        {
          title,
          detail: detail.trim() || null,
          points: points as any,
          ownerId: 'fixed-user-id-123',
          assignedTo: assignee ? [assignee] : [],
          recurrence: null,
          dueDate: finalDueDate,
          completed: false
        },
        {
          onSuccess: () => {
            onClose();
          }
        }
      );
    } else if (mode === 'edit' && selectedTaskId) {
      updateTaskMutation.mutate(
        {
          id: selectedTaskId,
          updates: {
             title,
             detail: detail.trim() || null,
             points: points as any,
             assignedTo: assignee ? [assignee] : [],
             dueDate: finalDueDate,
          }
        },
        {
          onSuccess: () => {
            onClose();
          }
        }
      );
    }
  };

  if (!isOpen) return null;

  const isView = mode === 'view';
  const isCompleted = tasks?.find(t => t.id === selectedTaskId)?.completed;
  const isPending = createTaskMutation.isPending || updateTaskMutation.isPending || deleteTaskMutation.isPending;
  const isError = createTaskMutation.isError || updateTaskMutation.isError || deleteTaskMutation.isError;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-6 md:p-12 bg-black/80 backdrop-blur-sm">
      {/* MONDRIAN MODAL */}
      <div className="bg-white w-full max-w-5xl border-8 border-black shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative flex flex-col md:flex-row max-h-[90vh] overflow-y-auto overflow-x-hidden">
        
        {/* Left Header Section (Asymmetric Branding) */}
        <div className={`w-full md:w-20 border-b-8 md:border-b-0 md:border-r-8 border-black hidden md:flex items-center justify-center ${mode === 'create' ? 'bg-[#2250ce]' : (mode === 'edit' || mode === 'delete_confirm') ? 'bg-[#ff1e01]' : 'bg-black'}`}>
          <div className="-rotate-90 whitespace-nowrap text-white font-black text-2xl tracking-[0.6em] uppercase">
             {mode === 'create' ? 'NUEVA TAREA' : mode === 'edit' ? 'EDICIÓN' : mode === 'delete_confirm' ? 'PELIGRO' : 'VISTA'}
          </div>
        </div>

        {/* Main Form Section */}
        <div className="flex-1">
          {/* Close Button Cell */}
          <div className="flex justify-between items-center border-b-8 border-black px-8 py-6 bg-white">
            <span className="font-label font-bold uppercase tracking-[0.2em] text-xs opacity-60">
              {mode === 'create' ? 'MOD_ADD_TASK_001' : `MOD_TASK_${selectedTaskId?.slice(0, 5).toUpperCase()}`}
            </span>
            <button 
              onClick={onClose}
              type="button"
              className="bg-black text-white w-12 h-12 flex items-center justify-center hover:bg-[#ff1e01] transition-colors border-2 border-black hover:scale-105"
            >
              <span className="material-symbols-outlined font-bold">close</span>
            </button>
          </div>

          {mode === 'delete_confirm' ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-24 bg-white text-center">
              <span className="material-symbols-outlined text-[120px] text-[#ff1e01] mb-6 drop-shadow-[8px_8px_0px_rgba(0,0,0,1)]">warning</span>
              <h3 className="font-black text-4xl md:text-5xl uppercase tracking-tighter mb-4 text-black">¿Purga Irreversible?</h3>
              <p className="font-label text-xl uppercase font-bold text-black/60 max-w-lg mb-12">
                Esta acción destruirá el registro de manera definitiva y no podrá recuperarse bajo ninguna circunstancia.
              </p>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                 <button 
                  type="button"
                  onClick={() => setMode('view')}
                  className="flex-1 md:flex-none px-8 py-4 bg-white text-black border-4 border-black font-black text-xl uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
                 >
                   CANCELAR
                 </button>
                 <button 
                  type="button"
                  onClick={() => {
                      if (selectedTaskId) {
                          deleteTaskMutation.mutate(selectedTaskId, {
                              onSuccess: () => onClose()
                          });
                      }
                  }}
                  disabled={deleteTaskMutation.isPending}
                  className="flex-1 md:flex-none px-8 py-4 bg-[#ff1e01] text-white border-4 border-black font-black text-xl uppercase tracking-widest hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
                 >
                   {deleteTaskMutation.isPending ? 'PURGANDO...' : 'CONFIRMAR BORRADO'}
                 </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 text-black">
            {/* Title Input */}
            <div className="col-span-12 border-b-8 border-black p-8 bg-white">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50">Nombre de la Tarea</label>
              <input 
                className={`w-full p-4 md:p-6 text-2xl md:text-3xl font-black uppercase tracking-tight border-4 border-black focus:outline-none focus:ring-0 placeholder:text-black/20 ${isView ? 'bg-black/5' : 'bg-white focus:border-[#2250ce]'}`} 
                placeholder="EJ: VIGILANCIA DE LOS PUERTOS" 
                type="text"
                autoFocus={!isView}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoComplete="off"
                required
                disabled={isView}
              />
            </div>

            {/* Detail Cell */}
            <div className="col-span-12 md:col-span-7 border-b-8 md:border-r-8 md:border-b-8 border-black p-8 bg-white">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50">Detalle (Opcional)</label>
              <textarea 
                className={`w-full p-4 font-body text-base font-medium resize-none border-4 border-black focus:outline-none focus:ring-0 placeholder:text-black/20 ${isView ? 'bg-black/5' : 'bg-white focus:border-[#2250ce]'}`}
                placeholder="DETALLES ESPECÍFICOS DEL JURAMENTO..." 
                rows={6}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                disabled={isView}
              />
            </div>

            {/* Category & Points Cell */}
            <div className="col-span-12 md:col-span-5 border-b-8 border-black bg-white p-8 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNlN2U3ZTciLz48L3N2Zz4=')]">
              <div className="mb-8">
                <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black">Categoría</label>
                <div className="flex flex-wrap gap-2">
                  <button disabled={isView} className={`px-4 py-2 border-4 border-black bg-[#ff1e01] text-white font-black text-[11px] uppercase tracking-widest transition-all ${isView ? 'opacity-80 cursor-default' : 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`} type="button">Doméstica</button>
                  <button disabled={isView} className={`px-4 py-2 border-4 border-black bg-white text-black font-black text-[11px] uppercase tracking-widest transition-all ${isView ? 'opacity-80 cursor-default' : 'hover:bg-[#2250ce] hover:text-white hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`} type="button">Laboral</button>
                </div>
              </div>

              <div>
                <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black">Puntos de Esfuerzo</label>
                <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                  {[1, 2, 3, 5, 8, 13, 21].map((point) => (
                    <div 
                      key={point} 
                      onClick={() => !isView && setPoints(point)}
                      className={`aspect-square flex items-center justify-center border-4 border-black font-black text-sm transition-colors ${points === point ? 'bg-[#fac901] text-black border-dashed' : 'bg-white'} ${isView ? (points === point ? '' : 'opacity-50 cursor-default') : 'cursor-pointer hover:bg-[#fac901] hover:text-black'}`}
                    >
                      {point}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Date & Time Cell */}
            <div className="col-span-12 md:col-span-6 border-b-8 md:border-b-0 md:border-r-8 border-black p-8 bg-white">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black/50">Fecha y Hora</label>
              <div className="grid grid-cols-2 gap-4">
                <input 
                  className={`p-3 font-label text-sm font-bold border-4 border-black focus:outline-none ${isView ? 'bg-black/5' : 'bg-white focus:border-[#2250ce]'}`} 
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  disabled={isView}
                />
                <input 
                  className={`p-3 font-label text-sm font-bold border-4 border-black focus:outline-none ${isView ? 'bg-black/5' : 'bg-white focus:border-[#2250ce]'}`} 
                  type="time"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  disabled={isView}
                />
              </div>
            </div>

            {/* Assignee Cell */}
            <div className="col-span-12 md:col-span-6 p-8 bg-[#fac901]">
              <label className="block font-black text-[10px] uppercase mb-4 tracking-[0.25em] text-black">Asignada a</label>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center text-black">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <select 
                  className={`flex-1 p-3 font-black uppercase text-xs tracking-widest border-4 border-black focus:outline-none ${isView ? 'bg-black/5 appearance-none' : 'bg-white focus:border-[#2250ce] cursor-pointer'}`}
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  disabled={isView}
                >
                  <option value="">(SIN ASIGNAR)</option>
                  <option value="JAIME LANNISTER">JAIME LANNISTER</option>
                  <option value="BRIENNE DE TARTH">BRIENNE DE TARTH</option>
                  <option value="JON SNOW">JON SNOW</option>
                </select>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="col-span-12 border-t-8 border-black flex flex-col md:flex-row">
              <div className="flex-1 p-6 bg-white hidden md:block">
                <p className="font-label text-[10px] uppercase font-bold tracking-widest text-[#2250ce]">Sujeto al Código de Honor v.2.4</p>
                {isError && <p className="text-red-500 font-bold text-xs mt-2 uppercase">Error al procesar la tarea</p>}
              </div>

              {(mode === 'view' || mode === 'edit') && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="w-full md:w-auto px-8 py-6 bg-white text-[#ff1e01] font-black text-xl uppercase tracking-[0.2em] border-t-8 md:border-t-0 md:border-l-8 border-black hover:bg-[#ff1e01] hover:text-white transition-colors flex items-center justify-center gap-4 group disabled:opacity-50"
                >
                  <span>BORRAR</span>
                  <span className="material-symbols-outlined font-bold! group-hover:rotate-12 transition-transform">delete</span>
                </button>
              )}

              {mode === 'view' ? (
                <>
                  <button 
                    type="button"
                    onClick={() => {
                        updateTaskMutation.mutate(
                          { id: selectedTaskId!, updates: { completed: !isCompleted } },
                          { onSuccess: () => onClose() }
                        );
                    }}
                    disabled={isPending}
                    className={`w-full md:w-auto px-10 py-6 text-white font-black text-xl uppercase tracking-[0.2em] border-t-8 md:border-t-0 md:border-l-8 border-black hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-4 group disabled:opacity-50 ${isCompleted ? 'bg-[#ff1e01]' : 'bg-[#2250ce]'}`}
                  >
                    <span>{isCompleted ? 'PENDIENTE' : 'HECHO'}</span>
                    <span className="material-symbols-outlined font-bold! group-hover:rotate-12 transition-transform">{isCompleted ? 'settings_backup_restore' : 'task_alt'}</span>
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setMode('edit');
                    }}
                    className="w-full md:w-auto px-12 py-6 bg-black text-white font-black text-xl uppercase tracking-[0.2em] border-t-8 md:border-t-0 md:border-l-8 border-black hover:bg-[#ff1e01] transition-colors flex items-center justify-center gap-4 group"
                  >
                    <span>EDITAR</span>
                    <span className="material-symbols-outlined font-bold! group-hover:rotate-12 transition-transform">edit_square</span>
                  </button>
                </>
              ) : (
                <button 
                  type="submit"
                  disabled={isPending}
                  className="w-full md:w-auto px-12 py-6 bg-black text-[#fac901] font-black text-xl uppercase tracking-[0.2em] border-t-8 md:border-t-0 md:border-l-8 border-black hover:bg-[#2250ce] hover:text-white transition-colors flex items-center justify-center gap-4 group disabled:opacity-50"
                >
                  <span>{isPending ? 'ENVIANDO...' : (mode === 'edit' ? 'GUARDAR' : 'GUARDAR')}</span>
                  {!isPending && <span className="material-symbols-outlined font-bold! group-hover:rotate-12 transition-transform">check_box</span>}
                </button>
              )}
            </div>
          </form>
          )}
        </div>

        {/* Asymmetric Accent Blocks (Mondrian signature) */}
        <div className="absolute -top-8 -right-8 w-16 h-16 bg-[#ff1e01] border-4 border-black z-[-1] hidden lg:block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>
        <div className="absolute -bottom-8 -left-8 w-16 h-16 bg-[#2250ce] border-4 border-black z-[-1] hidden lg:block shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"></div>
      </div>
    </div>
  );
}
