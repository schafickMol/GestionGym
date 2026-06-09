import React, { useState } from 'react';
import univoLogo from './assets/Logo-Univo.png'; 

export default function Login({ onStart }) {
  // Ajustamos el valor por defecto al carnet que creamos en SQL Server
  const [email, setEmail] = useState('admin'); 
  const [password, setPassword] = useState('');

  const handleLogin = function(e) {
    e.preventDefault();
    
    // 1. Preparamos los datos tal como los espera nuestra tabla de SQL
    const credenciales = {
      carnet: email, 
      contrasena: password
    };

    // 2. Hacemos la petición POST a nuestro mesero (Node.js)
    fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credenciales)
    })
    .then(function(respuesta) {
      if (respuesta.ok) {
        // Si el login fue correcto, convertimos la respuesta a JSON
        return respuesta.json();
      } else {
        // Si el backend mandó un error (ej. 401), forzamos el error aquí
        throw new Error('Credenciales incorrectas');
      }
    })
    .then(function(datosUsuario) {
      // 3. ¡Login exitoso! Le enviamos los datos del usuario (con su rol) a App.jsx
      onStart(datosUsuario); 
    })
    .catch(function(error) {
      // Si falla, mostramos la alerta tradicional
      alert('Credenciales incorrectas. Verifica tu usuario y contraseña.');
      console.log('Error de login:', error);
    });
  };

  return (
    /* FONDO: Degradado diagonal más intenso y visible usando tus azules */
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-univo-blue-mid to-univo-blue-dark p-6 relative">
      
      {/* BRANDING FLOTANTE: Logo de UNIVO en la esquina superior izquierda */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <img 
          src={univoLogo} 
          alt="Universidad de Oriente - UNIVO" 
          className="h-14 w-auto drop-shadow-lg" 
        />
        <div className="flex flex-col text-white drop-shadow-md">
          <span className="font-bold text-lg tracking-tight">GYM UNIVO</span>
          <span className="text-xs opacity-90">Gestión y Reservas</span>
        </div>
      </div>

      {/* TARJETA BLANCA PRINCIPAL */}
      <div className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md backdrop-blur-sm bg-white/95">
        
        {/* ENCABEZADO DE TARJETA: Mantenemos el icono de puerta */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-3 rounded-2xl border border-gray-200">
            {/* Reemplaza este SVG por tu icono de puerta azul oscuro */}
            <svg className="w-8 h-8 text-univo-blue-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
          </div>
        </div>

        <h2 className="text-3xl font-extrabold text-center text-univo-blue-dark mb-3 tracking-tight">Iniciar sesión</h2>
        <p className="text-center text-gray-500 mb-10 text-sm px-6">
          Accede al sistema de gestión de gimnasio y reservas.
        </p>

        {/* FORMULARIO */}
        <form onSubmit={handleLogin} className="space-y-6">
          
          {/* Campo Email / Carnet */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              </div>
              <input 
                type="text" 
                placeholder="Usuario o Carnet" 
                value={email}
                onChange={function(e) { setEmail(e.target.value); }}
                /* CAMBIO: Borde de enfoque dorado (#F2A516) */
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-univo-gold focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          {/* Campo Contraseña */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              </div>
              <input 
                type="password" 
                placeholder="Contraseña" 
                value={password}
                onChange={function(e) { setPassword(e.target.value); }}
                /* CAMBIO: Borde de enfoque dorado */
                className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-univo-gold focus:border-transparent transition-all"
                required
              />
            </div>
            {/* CAMBIO: El enlace de "Forgot" ahora es dorado para mayor visibilidad */}
            <div className="flex justify-end mt-3">
              <a href="#" className="text-sm font-semibold text-univo-gold hover:text-univo-blue-mid transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </div>

          {/* BOTÓN PRINCIPAL */}
          <button 
            type="submit" 
            /* CAMBIO: Fondo azul oscuro, texto en ORO claro para contraste premium */
            className="w-full py-4 px-4 bg-univo-blue-dark hover:bg-univo-blue-mid text-univo-gold font-bold text-lg rounded-2xl shadow-lg focus:outline-none focus:ring-2 focus:ring-univo-gold focus:ring-offset-2 transition-all tracking-wider cursor-pointer"
          >
            COMENZAR
          </button>
        </form>
      </div>
    </div>
  );
}