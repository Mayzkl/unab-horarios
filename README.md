# UNAB Horarios

Este proyecto permite a los estudiantes de la Universidad Andrés Bello consultar y gestionar los horarios de los ramos de su semestre. El sistema muestra los cursos disponibles, sus secciones y los horarios correspondientes, permitiendo seleccionar las secciones sin generar conflictos.

## Uso

1. **Selecciona el semestre**: Usa el selector para elegir el semestre actual.
2. **Buscar ramos**: Ingresa el nombre o código de un ramo en el campo de búsqueda.
3. **Selecciona secciones**: Elige una o más secciones para añadirlas a tu horario. Puedes seleccionar tanto los teóricos como los prácticos de un mismo ramo.
4. **Ver horarios**: Visualiza tus secciones seleccionadas en la vista semanal de horarios.

## Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/usuario/unab-horarios.git

2. Accede al directorio del proyecto:
    cd unab-horarios

3. configura entorno virtual en python 3.11.x
    python -m venv venv

4. Activa el entorno virtual
    En windows:
        .\venv\Scripts\activate
    En macOS/Linux:
        source venv/bin/activate

5. Instala dependencias:
    npm install

6. Ejecuta el proyecto: 
    npm run dev

7. Abre la app en el navegador con http://localhost:3000