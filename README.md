# Práctica: Validación de la Información (FrontEnd + BackEnd)

Este proyecto es una demostración técnica de validación de datos implementando un sistema de registro seguro con doble capa de validación: en el cliente (FrontEnd) y en el servidor (BackEnd). 

El objetivo es demostrar por qué es necesario que ambas partes cooperen, asegurando tanto la experiencia del usuario como la integridad absoluta de la base de datos contra peticiones alteradas o malintencionadas.

## 🚀 Requisitos Funcionales Implementados
- **FrontEnd (HTML5, Vanilla JS, CSS puro):**
  - **Obligatoriedad:** Verificación de campos vacíos.
  - **Formato y Patrón:** Validación nativa `type="email"` y Regex para teléfonos de exactamente 10 dígitos.
  - **Coherencia y Contraseñas robustas:** UI dinámica para verificar visualmente que se cumplan 5 políticas estrictas de seguridad (longitud, mayúscula, minúscula, símbolo y número), y confirmación cruzada de que ambos campos de contraseña coincidan idénticamente antes del envío.
  - **Prueba Humanoide (CAPTCHA matemático):** Validación matemática para evitar automatización simple.
- **BackEnd (Node.js, Express, SQLite3):**
  - **Persistencia y Datos Únicos:** Base de datos SQLite embebida que asegura que no haya duplicidad ni de teléfonos ni de emails mediante `UNIQUE` constraints e interrogación asíncrona de la base de datos previa a la inserción.
  - **Honeypot:** Campo trampa totalmente invisible desde el frente para capturar `bots`, si se envía lleno, la petición se bloquea con el error B4.
  - **Rejección de Manipulación:** Una vez que el POST llega al servidor, vuelve a procesar todas las regex y datos requeridos; el servidor denegará rotundamente llamadas API modificadas en herramientas como cURL, Insomnia, DevTools, entre otros.
  - **Consola / Logs:** Demostración gráfica desde la consola donde intercepta comportamientos errantes o ataques a la red, categorizados con etiquetas de log claras (`[LOG B1]`, `[LOG B5]`, etc.) según los requerimientos.

## 💻 Instalación y Uso Local

Para correr este proyecto asegúrate de contar con [Node.js](https://nodejs.org/) instalado.

1. **Clona el repositorio** o abre la carpeta en tu editor de código.
2. Abre tu terminal integrada, instala las dependencias de Node.js (`express` y `sqlite3`) e inicia la aplicación en modo desarrollo:
```bash
npm install
npm run dev
```
3. Tu servidor web debe levantar. En la terminal verás el mensaje `Servidor listo...`
4. Dirige tu navegador de preferencia hacia `http://localhost:3000`. **(No utilizes la extensión Live Server; debes abrir explícitamente el localhost para enlazar Front y Back).**
5. Prueba el formulario usando el "Panel de Pruebas Flotante".

## 🧪 Panel de Pruebas Dinámico
En la interfaz gráfica hay un botón inferior derecho `🧪 Panel de Pruebas`. 
Este contiene 11 scripts de ejecución rápida para someter a estrés tanto los manejadores de eventos del UI como las validaciones por parte del procesador de peticiones en Express.

Al presionar cualquiera de los recuadros de la izquierda (**Casos A**), se autocompletan datos sucios para que puedas observar en tiempo real la UX impidiendo el submit de la información con advertencias legibles.
Al presionar cualquiera de los recuadros de la derecha (**Casos B**), se realizan inserciones directas o envíos simulados para ilustrar los logs de denegación por la terminal.
