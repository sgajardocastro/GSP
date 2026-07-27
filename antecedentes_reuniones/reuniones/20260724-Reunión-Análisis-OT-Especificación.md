TMAC:
- Obs comnductual no es obligatoria la foto.


# PRINCIPIO SPEC-DRIVEN 
- Todo debe ser Spec-Driven

## Ajustes estapa Preventa.

### Sobre el Orden de los Tabs horizontales superiores***
- Datos Servicio & Visita va en la misma posición.
- Estructurador de Servicios en segundo lugar como está ahora. Pero atención que creo que estas tomando algun json inicial de las categorías y subcategorías se debe usar lo que está en la base de datos. Aparece redundante y mal. Se debe incorporar la categoria Traslado.
- Condiciones Comerciales en segundo lugar. Aquí debemos agregar 
	- Proyección de Costos de Pensiones 
		- Los items son Alojamiento, Alimentación (desayuno, almuerzo cena) y Tranlado (cliente/san Pablo/NA). Esto aun no lo vamos a gestionar a detalle, pero es relevante para generar el EDP ya que en ocasiones esto lo costea el cliente.
		- Cotos: Se piden cotizaciones a PENSIONES
			- Registrar cotización y valorización por los items indicados anteriormente.
			- Luego, en el Registro de costos por registro diario este punto es retroalimentado.
    - En condiciones comerciales hiciste desaparecer una lista de condiciones de texto que estaban en las primeras versiones del sistema. Si las puedes recordar sería bueno, si no las recuerdas deja un área de texto reservada para esto.
- 
### Envío Cotización
	- Cuando el cliente ya tiene la cotización para envío:
		- Va ser enviada a través del sistema por correo, dejando trazabilidad de cuando esta fue enviada al lado del hitorial de cotizaciones, algo que diga enviada a email1, email2, email3... en que fecha hora. 
		- Por defecto va ser enviada al contacto del cliente, pero se puede moficiar y agregar a otros destinatarios.
		- Va con copia a (ESTO AUN NO ESTA DEFINIDO) Omar, gerencia@arriendosanpablo.cl)jponce@arriendosanpablo.cl
		- Tenemos pendiente el resolver enviar desde casillas @arriendosanpablo.cl. Por ahora, para efectos de desarrollo usaremos el mismo correo que usamos para notificar enrolamiento. (PENDTE CUENTA GOOGLE WORKSPACE).

### GENERAR REQUERIMIENTO 
    - El requerimiento lo genera el responsable comercial cuando la cotización es aceptada por el cliente. 
   	- El boton no es Registrar y ganar (Asignar), el titulo es Generar Requerimiento.
    - Se verifican los datos que falta una alerta por los datos que faltan. Jponce validará cuales son los atributos obligatorios para generar este punto. Pero esto también es un PENDIENTE. 
    - El requerimiento es recibido por el COORDINADOR DE OPERACIONES quien recibe un correo con los datos del negocio y la cotización.
    - Cuando el coordinador recibe el requerimiento, va a poder tocar los antecedentes ingresado inicialmente en la etapa preventa, pero no va reemplazar el dato, debemos buscar la forma para mostrar los datos que se generaron en comercial, y cuales de ellos  APROBADO CON OBSERVACIONES. Esto es importante para ver el diff de los cambios. No se como mostrarlo, si con colores o con una version anterior, o con dos columnas dato inicial, dato modifcado... no lo se. esto afecta ubna posterior cualificación de la calidad técnica del comercial, ya que si siempre se le deben hacer ajustes a sus propuestas... debería ser un KPI comercial.
	- Cuando se el coordinador termina de revisar los datos comerciales el aprueba el requerimiento como APROBADO o APROBADO CON OBSERVACIONES. Ggenera se genera una notificación de correo a operaciones, gerencia y al vendedor. Por ahora solo jponce@....

### Asignación 
    - Luego se seleccionan los equiposofertados, en base a las categorías, subcategorías se despliegas los que cumplen con ello. También se agrega el personal asignado.
    Se registra fecha y hora de salida y fecha de termino para reservar los recursos. A nivel de base de datos, creo que esto corresponde a un modelo de recursos asignados al proyecto, con fecha pla desde/hasta y fecha real desde/hasta. Tendrías que crear la tabla tpry_recurso_asignado, hora de salida y observaciones de operaciones.
    - Se cuando las personas son asignadas se les envía una notificación por correo.
	. Se ingresar el detalle del servicio que son las eslingas, cadenas... todo el equipo y herramientas complementarios. Esto debe usar como referencia lo que se registró en la ultima versión de la visita a terreno y si tiene modificaciones se debe registrar el diff.
    Esta asignación es lo que se conoce como OT	
 
			

Aprobación Requerimiento
Creción OT / Retorno a Comercial
Asignación Recursos humanos y técnicos


Tarea investigar tema correo 