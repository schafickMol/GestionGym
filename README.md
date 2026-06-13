# 🏋️ GestionGym — Sistema de Gestión del Gimnasio UNIVO

Aplicación web para la gestión del gimnasio del campus de la **Universidad de Oriente UNIVO**. Desarrollada con React + Vite en el frontend y Node.js + SQL Server en el backend.

---

##  Cómo ejecutar el proyecto por primera vez

El proyecto tiene dos partes: el **frontend** (React) y el **backend** (Node.js + API). Ambos deben estar corriendo al mismo tiempo.

### Requisitos previos

Antes de comenzar, asegurate de tener instalado en tu PC:

- [Node.js](https://nodejs.org/) — versión 18 o superior (recomendado: la más reciente LTS)
- [SQL Server](https://www.microsoft.com/es-es/sql-server/sql-server-downloads) — con la instancia `MSSQLSERVER` activa
- [SQL Server Management Studio (SSMS)](https://learn.microsoft.com/es-es/sql/ssms/download-sql-server-management-studio-ssms) — para crear la base de datos
- [Git](https://git-scm.com/) — para clonar el repositorio

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/schafickMol/GestionGym.git
cd GestionGym
```

---

### Paso 2 — Crear la base de datos

1. Abrí **SQL Server Management Studio (SSMS)**.
2. Conectate a tu instancia local de SQL Server.
3. Abrí el archivo `database/GimnasioUniversitario.sql` que está en el repositorio (o el script SQL que se entregó junto al proyecto).
4. Ejecutá el script completo con **F5**. Esto creará la base de datos `GimnasioUniversitario` con todas sus tablas.

---

### Paso 3 — Configurar y ejecutar el Backend

```bash
# Entrar a la carpeta del backend
cd BackEnd-gim

# Instalar las dependencias (solo la primera vez)
npm install

# Iniciar el servidor
node server.js
```

> El servidor quedará corriendo en `http://localhost:3000`. Dejá esta terminal abierta.


se debe cambiar en el archivo server.js a estos parametros segun sea conveniente para hacer la conexion:
const cfg = {
    server: 'localhost', port: 1433,
    user: 'sa', password: 'TuPasswordSeguro123!',
    database: 'GimnasioUniversitario',
    options: { encrypt: false, trustServerCertificate: true }
};


---

### Paso 4 — Configurar y ejecutar el Frontend

Abrí una **nueva terminal** (sin cerrar la del backend) y ejecutá:

```bash
# Desde la raíz del proyecto, entrar a la carpeta del frontend
cd proyecto-gim

# Instalar las dependencias (solo la primera vez)
npm install

# Iniciar la aplicación
npm run dev
```

> La aplicación estará disponible en `http://localhost:5173`. Abrila en tu navegador.

---

### Credenciales por defecto

| Rol | Usuario / Carnet | Contraseña |
|---|---|---|
| Administrador | (el que esté registrado en la BD) | `admin` | contraseña: |`admin123` |


---

## 📋 Guía de funciones del sistema

### 🔐 Autenticación

- **Login:** El acceso al sistema se realiza con carnet universitario y contraseña.
- **Roles:** Existen dos roles: **Administrador** y **Estudiante**. Cada uno ve funciones distintas según sus permisos.
- **Cambio de contraseña:** Desde el panel de perfil, cualquier usuario puede actualizar su contraseña actual.
- **Foto de perfil:** Se puede subir o cambiar una foto de perfil (máximo 5 MB).

---

### 📊 Dashboard — Agenda de Entrenamiento

Vista principal del sistema con el calendario semanal de reservas.

**Funciones disponibles para todos los usuarios:**
- Ver el calendario semanal con las reservas activas por día y hora (lunes a sábado).
- Crear una nueva reserva de máquina con el botón **+ Nueva Reserva**.
- Ver su IMC registrado en el panel lateral de perfil.
- Revisar y marcar como completados los ejercicios de su rutina desde el panel lateral.
- Finalizar la rutina actual para limpiarla y empezar de nuevo.

**Funciones exclusivas del Administrador:**
- **Gestionar Reservas:** ver todas las reservas activas, marcarlas como completadas o eliminarlas.
- **Registrar Alumno:** crear cuentas nuevas para estudiantes directamente desde el dashboard.
- **Exportar a Excel:** genera un reporte en `.xlsx` con las reservas confirmadas y los ejercicios más usados.
- **Generar PDF:** imprime un reporte formal con encabezado UNIVO, tabla de reservas y ranking de ejercicios.

---

### 📅 Nueva Reserva

Al presionar **+ Nueva Reserva** se abre un formulario con los siguientes campos:

- **Máquina / Ejercicio:** Máquina Pecho, Smith, Polea Espalda, Mancuernas, Full body, Caminadora, Elíptica, Bicicleta.
- **Día:** cualquier día de la semana actual (lunes a sábado).
- **Hora de entrada:** de 07:00 a 16:00.
- **Hora de salida:** posterior a la entrada, máximo hasta las 17:00.
- **Datos del alumno:** nombre completo, código estudiantil, facultad y carrera (campos obligatorios).

**Restricciones del sistema:**
- Máximo **10 personas por hora** en total (límite del gimnasio).
- Los estudiantes pueden tener máximo **3 reservas en el mismo horario**.
- Los **sábados** el gimnasio cierra a las 11:00 AM.
- La hora de salida siempre debe ser posterior a la de entrada.

---

### 🏃 Rutinas

Módulo para explorar ejercicios organizados por grupo muscular y armar la rutina personal.

**Grupos musculares disponibles:**
- Pecho · Espalda · Pierna · Hombros · Brazos · Full Body & HIIT

**Funciones para todos los usuarios:**
- Ver los ejercicios disponibles en cada categoría.
- Seleccionar ejercicios marcándolos con checkbox (se recomienda máximo 5).
- Ver el tutorial de cada ejercicio en YouTube con el botón **Tutorial**.
- Guardar la selección como rutina personal con el botón **Agregar a Mi Rutina**.

**Funciones exclusivas del Administrador:**
- **Añadir ejercicio:** agregar nuevos ejercicios a cualquier categoría, indicando nombre y enlace de YouTube.
- **Eliminar ejercicio:** quitar un ejercicio de la base de datos permanentemente.

---

### 📏 Datos Físicos / IMC

- Los usuarios pueden registrar su **peso** y **estatura**.
- El sistema calcula automáticamente el **IMC** (Índice de Masa Corporal).
- El IMC calculado se muestra en el panel lateral del dashboard.

---

### 👤 Perfil de Usuario

Accesible desde el panel lateral (escritorio) o desde la parte inferior de la página principal (móvil):

- Ver nombre completo y rol asignado.
- Cambiar foto de perfil.
- Cambiar contraseña.
- Ver IMC actual registrado.
- Gestionar la rutina de ejercicios activa.

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + Vite 8 |
| Estilos | Tailwind CSS 4 |
| Backend | Node.js + Express |
| Base de datos | SQL Server 2022 |
| Reportes | SheetJS (Excel) + Window.print() (PDF) |
| Control de versiones | Git + GitHub |

---

## 📁 Estructura del proyecto

```
GestionGym/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard.jsx      # Agenda, reservas y perfil
│   │   │   ├── Rutinas.jsx        # Ejercicios por grupo muscular
│   │   │   └── ...
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── server.js                   # Servidor Express + rutas API
│   └── package.json
└── database/
    └── GimnasioUniversitario.sql  # Script de creación de la BD
```

---
Proyecto de cátedra — **Diseño de Componentes Web · Ciclo I-2026**
Ingeniería en Desarrollo de Software · Universidad de Oriente (UNIVO)
Docente: Ing. Jose Adolfo Herrera Funes
