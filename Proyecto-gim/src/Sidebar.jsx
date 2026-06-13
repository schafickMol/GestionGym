import React, { useState } from 'react';
import univoLogo from './assets/Logo-Univo.png'; 
import inc from './assets/imc.png';
import calendario from './assets/calendario.png';
import entrenamiento from './assets/entrenamiento.png';

export default function Sidebar({ activeView, onViewChange, onLogout }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: calendario },
    { id: 'rutinas',   label: 'Rutinas',   icon: entrenamiento },
    { id: 'imc',       label: 'IMC',       icon: inc },
  ];

  const handleNav = (id) => { onViewChange(id); setMenuAbierto(false); };

  return (
    <>
      {/* ── BARRA SUPERIOR MÓVIL ── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-univo-blue-dark flex items-center justify-between px-4 py-3 shadow-lg">
        <div className="flex items-center gap-3">
          <img src={univoLogo} alt="UNIVO" className="w-10 h-10 object-contain" />
          <span className="text-univo-gold font-black tracking-wide text-sm">GYM UNIVO</span>
        </div>
        <button onClick={() => setMenuAbierto(!menuAbierto)}
          className="text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer">
          {menuAbierto
            ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            : <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/></svg>
          }
        </button>
      </div>

      {/* ── DROPDOWN MÓVIL ── */}
      {menuAbierto && (
        <div className="lg:hidden fixed top-[60px] left-0 right-0 z-40 bg-univo-blue-dark shadow-2xl border-t border-white/10">
          <nav className="flex flex-col py-2">
            {menuItems.map(item => (
              <button key={item.id} onClick={() => handleNav(item.id)}
                className={`flex items-center gap-4 px-6 py-4 transition-all cursor-pointer ${
                  activeView === item.id
                    ? 'text-univo-gold bg-white/10 border-l-4 border-univo-gold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}>
                <img src={item.icon} alt={item.label} className="w-5 h-5 object-contain" />
                <span className="font-bold tracking-wide text-sm">{item.label}</span>
              </button>
            ))}
            <button onClick={() => { setMenuAbierto(false); onLogout(); }}
              className="flex items-center gap-4 px-6 py-4 text-red-400 hover:text-red-300 hover:bg-white/5 transition-all cursor-pointer border-t border-white/10 mt-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
              <span className="font-bold tracking-wide text-sm">Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      )}

      {/* ── SIDEBAR ESCRITORIO ──
          Usamos justify-between para pegar el logo arriba, la nav en el medio y el botón salir abajo,
          pero la nav NO tiene flex-1, así los ítems quedan juntos y el botón salir solo ocupa
          su espacio natural al final. */}
      <aside className="hidden lg:flex w-32 bg-univo-blue-dark flex-col items-center py-8 shadow-2xl z-20 min-h-screen">
        {/* Logo */}
        <img src={univoLogo} alt="UNIVO" className="w-20 h-20 object-contain drop-shadow-md mb-10" />

        {/* Navegación — sin flex-1, los ítems quedan pegados entre sí */}
        <nav className="flex flex-col gap-10 w-full">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => onViewChange(item.id)}
              className={`flex flex-col items-center justify-center gap-3 transition-all cursor-pointer w-full py-2 ${
                activeView === item.id
                  ? 'text-univo-gold border-r-4 border-univo-gold'
                  : 'text-white/50 hover:text-white'
              }`}>
              <img src={item.icon} alt={item.label} className="w-6 h-6 object-contain" />
              <span className="text-xs font-bold tracking-widest">{item.label}</span>
            </button>
          ))}

          {/* Salir — justo debajo de los ítems de nav, con separador sutil */}
          <button onClick={onLogout} title="Cerrar sesión"
            className="flex flex-col items-center justify-center gap-2 text-white/40 hover:text-red-400 transition-colors cursor-pointer w-full py-2 border-t border-white/10 pt-6">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span className="text-[10px] font-bold tracking-widest">Salir</span>
          </button>
        </nav>
      </aside>
    </>
  );
}