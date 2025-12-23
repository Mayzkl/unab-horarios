# UNAB Horarios
 
 Este proyecto permite a los estudiantes de la Universidad Andrés Bello consultar y gestionar los horarios de los ramos de su semestre. El sistema muestra los cursos disponibles, sus secciones y los horarios correspondientes, permitiendo seleccionar las secciones sin generar conflictos.
 
## Requisitos
 - Node.js 18 o superior (se probó con Node 18+/20+).
 - npm 9 o superior.
 
-## Instalación
+> **Opcional (solo si usarás el parser de PDF):** Python 3.11+ y un entorno virtual (`venv`) para ejecutar `scripts/parse_unab_pdf.py`.
 
## Instalación y ejecución

1. **Clona el repositorio**
    ```bash
    git clone https://github.com/usuario/unab-horarios.git
   cd unab-horarios
   ```
 
2. **Instala dependencias de Node**
   ```bash
   npm install
   ```
 
3. ** Prepara el entorno Python para el parser de PDFs**
   ```bash
   python -m venv venv
   # En Windows
   .\venv\Scripts\activate
   # En macOS/Linux
   source venv/bin/activate
   # Instala dependencias si tu script lo requiere
   # pip install -r requirements.txt
   ```

4. **Inicia el servidor de desarrollo**
   ```bash
   npm run dev
   ```
   La app quedará disponible en `http://localhost:3000`.
 
 
## Uso de la app
 1. **Selecciona el semestre** desde el combo superior.
 2. **Busca ramos** por código o nombre.
 3. **Elige secciones**: puedes escoger un teórico y un taller/práctico por ramo (se marca en verde lo seleccionado).
 4. **Revisa el horario semanal**: cada ramo se muestra con un color único y el tipo de actividad (TEO/TAL, etc.).
 5. **Guarda tu horario (local)**: pulsa “Guardar horario (local)” para almacenar tu selección en el navegador y recuperarla luego (mismo semestre).
