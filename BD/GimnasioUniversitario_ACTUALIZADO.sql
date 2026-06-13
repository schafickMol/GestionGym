USE [master]
GO
IF EXISTS (SELECT name FROM sys.databases WHERE name = N'GimnasioUniversitario')
    DROP DATABASE [GimnasioUniversitario]
GO
CREATE DATABASE [GimnasioUniversitario]
GO
USE [GimnasioUniversitario]
GO

CREATE TABLE [dbo].[datos_fisicos](
    [id]             [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [usuario_id]     [int] NOT NULL,
    [peso]           [decimal](5,2) NOT NULL,
    [estatura]       [decimal](5,2) NOT NULL,
    [imc]            [decimal](5,2) NOT NULL,
    [fecha_registro] [datetime] NULL
)
GO

CREATE TABLE [dbo].[ejercicios](
    [id]             [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [nombre]         [varchar](100) NOT NULL,
    [video_url]      [varchar](max) NOT NULL,
    [grupo_muscular] [varchar](50)  NOT NULL
)
GO

CREATE TABLE [dbo].[mis_rutinas](
    [id]           [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [usuario_id]   [int] NOT NULL,
    [ejercicio_id] [int] NOT NULL,
    [completado]   [bit] NULL
)
GO

CREATE TABLE [dbo].[reservas_maquinas](
    [id]              [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [usuario_id]      [int] NOT NULL,
    [maquina_nombre]  [varchar](100) NOT NULL,
    [dia_hora]        [varchar](100) NOT NULL,
    [hora_entrada]    [varchar](10)  NULL,
    [hora_salida]     [varchar](10)  NULL,
    -- Datos del alumno (rellenados por admin al crear la reserva, o tomados del usuario al confirmar)
    [nombre_alumno]   [varchar](100) NULL,
    [codigo_alumno]   [varchar](20)  NULL,
    [facultad_alumno] [varchar](150) NULL,
    [carrera_alumno]  [varchar](150) NULL,
    [edad_alumno]     [int]          NULL,
    [sexo_alumno]     [varchar](20)  NULL,
    -- Estado
    [completado]      [bit] NOT NULL DEFAULT 0,
    [eliminado]       [bit] NOT NULL DEFAULT 0
)
GO

CREATE TABLE [dbo].[usuario_rutinas](
    [id]               [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [usuario_id]       [int] NOT NULL,
    [ejercicio_nombre] [varchar](255) NOT NULL,
    [completado]       [bit] NULL
)
GO

-- Tabla usuarios — ahora con codigo_estudiantil
CREATE TABLE [dbo].[usuarios](
    [id]                  [int] IDENTITY(1,1) NOT NULL PRIMARY KEY,
    [carnet]              [varchar](50)  NOT NULL,
    [contrasena]          [varchar](255) NOT NULL,
    [nombre_completo]     [varchar](100) NOT NULL,
    [codigo_estudiantil]  [varchar](20)  NULL,
    [foto_perfil]         [varchar](max) NULL,
    [rol]                 [varchar](20)  NULL,
    [edad]                [int]          NULL,
    [sexo]                [varchar](20)  NULL,
    [facultad]            [varchar](150) NULL,
    [carrera]             [varchar](150) NULL,
    [imc_guardado]        [varchar](10)  NULL
)
GO

-- ── Datos iniciales ──────────────────────────────────────────────────────────
SET IDENTITY_INSERT [dbo].[ejercicios] ON
INSERT [dbo].[ejercicios] ([id],[nombre],[video_url],[grupo_muscular]) VALUES
(1,  N'Press de Banca Inclinado', N'https://www.youtube.com/watch?v=xyz1',  N'pecho'),
(2,  N'Aperturas con Mancuernas', N'https://www.youtube.com/watch?v=xyz2',  N'pecho'),
(3,  N'Dominadas',                N'https://www.youtube.com/watch?v=xyz3',  N'espalda'),
(4,  N'Remo con Barra',           N'https://www.youtube.com/watch?v=xyz4',  N'espalda'),
(5,  N'Sentadillas Libres',       N'https://www.youtube.com/watch?v=xyz5',  N'pierna'),
(6,  N'Prensa de Piernas',        N'https://www.youtube.com/watch?v=xyz6',  N'pierna'),
(7,  N'Press Militar',            N'https://www.youtube.com/watch?v=xyz7',  N'hombros'),
(8,  N'Elevaciones Laterales',    N'https://www.youtube.com/watch?v=xyz8',  N'hombros'),
(9,  N'Curl de Biceps con Barra', N'https://www.youtube.com/watch?v=xyz9',  N'brazos'),
(10, N'Extensiones de Triceps',   N'https://www.youtube.com/watch?v=xyz10', N'brazos'),
(11, N'Burpees',                  N'https://www.youtube.com/watch?v=xyz11', N'full body'),
(12, N'Kettlebell Swings',        N'https://www.youtube.com/watch?v=xyz12', N'full body')
SET IDENTITY_INSERT [dbo].[ejercicios] OFF
GO

SET IDENTITY_INSERT [dbo].[usuarios] ON
INSERT [dbo].[usuarios] ([id],[carnet],[contrasena],[nombre_completo],[rol])
VALUES (1, N'admin', N'admin123', N'Administrador Principal', N'admin')
SET IDENTITY_INSERT [dbo].[usuarios] OFF
GO
