# Cómo Arreglar el Error "zsh: command not found: npm"

El error que estás viendo significa que **Node.js** no está instalado en tu computadora. Node.js es el "motor" necesario para ejecutar esta aplicación.

### Paso 1: Descargar Node.js
1.  Ve al sitio oficial: **[https://nodejs.org/](https://nodejs.org/)**
2.  Descarga la versión que dice **"LTS"** (Recomendada para la mayoría).
3.  Abre el archivo `.pkg` descargado e instálalo como cualquier otro programa en tu Mac.

### Paso 2: Verificar la Instalación
Una vez que termine la instalación:
1.  **Cierra completamente tu terminal** (CMD + Q).
2.  Abre una nueva terminal.
3.  Escribe el siguiente comando y presiona Enter:
    ```bash
    node -v
    ```
    (Debería mostrarte algo como `v18.17.0` o superior).
4.  Escribe el siguiente comando:
    ```bash
    npm -v
    ```
    (Debería mostrarte un número de versión).

### Paso 3: Iniciar el Proyecto
Ahora que Node.js está instalado, regresa a la carpeta del proyecto y ejecuta:

```bash
# Instalar las librerías del proyecto
npm install

# Iniciar la aplicación
npm run dev
```

### Paso 4: Configurar Credenciales de Firebase
1.  Busca el archivo `.env.local` en la carpeta del proyecto (lo acabo de crear por ti).
2.  Ábrelo con un editor de texto (como Bloc de Notas o VS Code).
3.  Reemplaza los valores de ejemplo con tus propios keys de Firebase.
    - Ve a la consola de Firebase > Configuración del Proyecto > General.
    - Copia los valores y pégalos en el archivo.

¡Listo! La aplicación debería abrirse en `http://localhost:3000`.
