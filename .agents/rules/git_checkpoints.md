# 📌 Regla Inviolable: Protocolo de Checkpoints Periódicos en Git

## 1. Principio Fundamental
> **"Un hito validado sin commit es un trabajo expuesto al riesgo. Toda refactorización o corrección aprobada debe quedar asegurada inmediatamente en la historia de Git."**

---

## 2. Reglas de Ejecución Obligatoria para el Agente

1. **Commit Preventivo Inicial:**  
   Antes de iniciar cualquier edición de código, el agente debe verificar el estado del repositorio (`git status`). Si existen cambios previos pendientes y compilados limpiamente, debe realizar un commit local de resguardo antes de modificar nuevos archivos.

2. **Commit Obligatorio por Hito Exitoso (`npm run build` 0 Errores):**  
   Tan pronto como un componente, vista o corrección pase la verificación de compilación local (`npm run build`) con **0 errores**, el agente DEBE ejecutar automáticamente un `git commit` descriptivo reconociendo el hito alcanzado.

3. **Prohibición Absoluta de Acumulación de Tareas:**  
   Queda estrictamente prohibido avanzar a una segunda tarea, ajuste o refactorización sin haber registrado el commit del hito anterior.

4. **Formato Estándar de Commit:**  
   Los commits deben seguir la convención semántica:
   - `feat(componente): descripción concisa del cambio`
   - `fix(componente): corrección del error verificado`
   - `refactor(componente): ajuste de estructura o maquetación`
