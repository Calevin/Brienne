interface CategoryBadgeInfo {
  name: string;
  color: string;
}

interface TaskCardProps {
  category?: string;
  points?: number | null;
  categoryTag?: CategoryBadgeInfo | null;
  categoryTheme: "critical" | "personal" | "regular" | "yellow";
  title: string;
  assignee: string;
  imgUrl?: string;
  hasRightBorder?: boolean;
  onClick?: () => void;
}

export default function TaskCard({
  category,
  points,
  categoryTag,
  categoryTheme,
  title,
  assignee,
  imgUrl,
  hasRightBorder = false,
  onClick,
}: TaskCardProps) {
  let themeStyles = "";
  switch (categoryTheme) {
    case "critical":
      themeStyles = "bg-primary text-white";
      break;
    case "personal":
      themeStyles = "bg-secondary text-white";
      break;
    case "yellow":
      themeStyles = "bg-[#fac901] text-black";
      break;
    default:
    case "regular":
      themeStyles = "border-[3px] border-black text-black"; // Cambiado a 3px para resaltar al verse muy fino
      break;
  }

  // Si se proveen puntos explicitamente se formatean, manteniendo retrocompatibilidad con la prop category
  const pointsLabel = points !== undefined ? (points !== null ? `Pts: ${points}` : "") : category;

  return (
    <div
      onClick={onClick}
      className={`p-8 border-b-8 border-black flex flex-col justify-between bg-white hover:bg-surface-container transition-colors ${onClick ? 'cursor-pointer' : ''} ${
        hasRightBorder ? "border-r-8" : ""
      }`}
    >
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {pointsLabel && (
            <span className={`font-label text-xs font-bold px-2 py-0.5 inline-block ${themeStyles}`}>
              {pointsLabel}
            </span>
          )}
          {categoryTag && (
            <span
              title={categoryTag.name}
              style={{ backgroundColor: categoryTag.color }}
              className={`font-label text-xs font-bold px-2 py-0.5 inline-block border-2 border-black uppercase tracking-wider ${
                categoryTag.color === '#ffffff' ? 'text-black' : 'text-white'
              }`}
            >
              {categoryTag.name.slice(0, 6)}
            </span>
          )}
        </div>
        <h3 className="text-2xl font-bold leading-tight mb-6">{title}</h3>
      </div>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black border-2 border-black overflow-hidden">
          {imgUrl && (
            <img 
              className="w-full h-full object-cover" 
              src={imgUrl} 
              alt={assignee} 
            />
          )}
        </div>
        <span className="font-label text-sm font-bold uppercase">{assignee}</span>
      </div>
    </div>
  );
}
