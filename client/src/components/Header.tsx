export default function Header() {
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex bg-white border-b-8 border-black h-14">
      {/* Sidebar Alignment (Left Section) */}
      <div className="w-16 flex-shrink-0 text-3xl font-black text-black border-r-neo-thick flex items-center justify-center bg-[#fac901]">
        B
      </div>

      {/* Main Layout Container for the rest of the header */}
      <div className="flex-1 grid grid-cols-12">
        {/* TAREAS Alignment (Middle Section) */}
        <nav className="col-span-8 flex font-bold text-black uppercase tracking-tighter border-r-neo-thick">
          <a
            className="text-white bg-primary px-8 h-full flex items-center hover:bg-primary-container transition-colors"
            href="#"
          >
            Tareas
          </a>
        </nav>

        {/* CALENDARIO Alignment (Right Section) */}
        <div className="col-span-4 font-label font-bold text-black uppercase tracking-tighter h-full flex items-center justify-center">
          Calendario
        </div>
      </div>
    </header>
  );
}
