interface TaskCardProps {
  category: string;
  categoryTheme: "critical" | "personal" | "regular" | "yellow";
  title: string;
  assignee: string;
  imgUrl?: string;
  hasRightBorder?: boolean;
}

export default function TaskCard({ category, categoryTheme, title, assignee, imgUrl, hasRightBorder = false }: TaskCardProps) {
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

  return (
    <div
      className={`p-8 border-b-8 border-black flex flex-col justify-between bg-white hover:bg-surface-container transition-colors ${
        hasRightBorder ? "border-r-8" : ""
      }`}
    >
      <div>
        <span className={`font-label text-xs font-bold px-2 py-0.5 mb-4 inline-block ${themeStyles}`}>
          {category}
        </span>
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
