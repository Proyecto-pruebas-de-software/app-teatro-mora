# Especificación de Requerimientos de Software
## 🎭 Teatro Mora - Eventos teatrales

Version 0.1  
Hecho por <author> Claudio Varela 
<organization>  
<date created>  

Tabla de contenidos
=================
* [Historial de revisión](#historial-de-revisión)
* 1 [Introducción](#1-introducción)
  * 1.1 [Propósito del documento](#11-propósito-del-documento)
  * 1.2 [Enfoque del producto y requerimiento del negocio](#12-enfoque-del-producto-y-requerimiento-de-negocio)
  * 1.3 [Reglas del negocio](#13-reglas-del-negocio)
    * RN1 [Acceso a compra solo para regristrados](#rn1-acceso-a-compra-solo-para-registrados)
    * RN2 [Activación de la cola](#rn2-activación-de-la-cola)
    * RN3 [Turno único e intransferible](#rn3-turno-único-e-intransferible)
    * RN4 [Tiempo límite de compra](#rn4-tiempo-límite-de-compra)
    * RN5 [Moderación exclusiva para administradores](#rn5-moderación-exclusiva-para-administradores)
    * RN6 [Gestión de actores hecha por administradores](#rn6-gestión-de-actores-hecha-por-administradores)
    * RN7 [Una cuenta por usuario](#rn7-una-cuenta-por-usuario)
    * RN8 [Foro activo por evento](#rn8-foro-activo-por-evento)
* 2 [Vistazo al producto](#2-vistazo-al-producto)
  * 2.1 [Perspectiva del producto](#21-perspectiva-del-producto)
  * 2.2 [Funciones del producto](#22-funciones-del-producto)
  * 2.3 [Restricciones del producto](#23-restricciones-del-producto)
  * 2.4 [Características de los usuarios](#24-características-de-los-usuarios)
  * 2.5 [Supuestos y dependencias](#25-supuestos-y-dependencias)
* 3 [Requisitos](#3-requisitos)
  * 3.1 [Requisitos funcionales](#31-requisitos-funcionales)
    * RF1 [Registro de usuarios](#rf1-registro-de-usuarios)
    * RF2 [Autenticación de usuarios](#rf2-autenticación-de-usuarios)
    * RF3 [Creación de eventos](#rf3-creación-de-eventos)
    * RF4 [Gestión de actores](#rf4-gestión-de-actores)
    * RF5 [Asignación de actores](#rf5-asignación-de-actores)
    * RF6 [Página de detalles del evento](#rf6-página-de-detalles-del-evento)
    * RF7 [Cola virtual](#rf7-cola-virtual)
    * RF8 [Turno de compra y selección de asiento](#rf8-turno-de-compra-y-selección-de-asiento)
    * RF9 [Participación en foros](#rf9-participación-en-foros)
    * RF10 [Respuestas en foros](#rf10-respuestas-en-foros)
    * RF11 [Moderación del foro](#rf11-moderación-del-foro)
    * RF12 [Diseño responsive](#rf12-diseño-responsive)
  * 3.2 [Requisitos no funcionales](#32-requisitos-no-funcionales)
    * [Rendimiento](#rendimiento) 
    * [Usabilidad](#usabilidad)
    * [Seguridad](#seguridad)
    * [Disponibilidad](#disponibilidad)
    * [Escalabilidad](#esacalabilidad)
* 4 [Casos de uso](#4-casos-de-uso)
  * CU01 [Registrar un usuario](#cu01-registrar-un-usuario)
  * CU02 [Inicio de sesión](#cu02-inicio-de-sesión)
  * CU03 [Crear evento teatral](#cu03-crear-evento-teatral)
  * CU04 [Asignar actores a evento](#cu04-asignar-actores-a-evento)
  * CU05 [Unirse a la cola virtual](#cu05-unirse-a-la-cola-virtual)
  * CU06 [Comprar boleto con selección de asientos](#cu06-comprar-boleto-con-selección-de-asientos)
  * CU07 [Participar en foro del evento](#cu07-participar-en-foro-del-evento)
  * CU08 [Responder en foro](#cu08-responder-en-foro)
  * CU09 [Gestionar perfiles de actores](#cu09-gestionar-perfiles-de-actores)
  * CU10 [Moderar foro](#cu10-moderar-foro-eliminar-mensajes)
* 5 [Diagramas de la solución](#5-diagramas-de-la-solución)
* 6 [Verificación](#6-verificación)
  * 6.1 [Tipos de pruebas](#61-tipos-de-pruebas)
  * 6.2 [Casos de prueba iniciales](#62-casos-de-prueba-iniciales)
  

## Historial de revisión
| Name | Date    | Reason For Changes  | Version   |
| ---- | ------- | ------------------- | --------- |
|  CV  | 21/4/25 |                     |    1.0    |
|      |         |                     |           |
|      |         |                     |           |

## 1. Introducción
### 1.1 Propósito del documento
El propósito de este documento es documentar el proyecto del Teatro Mora de forma técnica, clara y precisa, se utilizará como base para el desarrollo del proyecto en etapa posteriores.

### 1.2 Enfoque del producto y requerimiento de negocio
El producto a desarrollar es una plataforma para gestión de eventos teatrales, con especial atención en la venta de entradas. Actualmente la página web del teatro colapsa durante los lanzamientos por la alta demanda, con esto se ven afectadas sus ventas y reputación, la solución a desarrollar debe ser moderna, robusta y confiable.

La aplicación web deberá permitir a los usuarios comprar entradas mediante una cola virtual, esta cola debe gestionar la demanda simultánea, además debe tener un foro interactivo por evento para fomentar la conexión entre actores y público. La administración del teatro debe poder gestionar eventos, asignar actores y moderar las discusiones en foro.

### 1.3 Reglas de negocio

| ID   | Nombre de la Regla de Negocio               | Descripción                                                                                      |
|------|---------------------------------------------|--------------------------------------------------------------------------------------------------|
| RN1  | Acceso a compra solo para registrados       | Solo los usuarios con cuenta y sesión iniciada pueden unirse a la cola y comprar boletos.        |
| RN2  | Activación de la cola                       | La opción de unirse a la cola solo estará habilitada exactamente una hora antes de la venta.     |
| RN3  | Turno único e intransferible                | Cada usuario puede unirse una sola vez a la cola por evento y su turno es único e intransferible.|
| RN4  | Tiempo límite de compra                     | El usuario tiene un tiempo máximo (a acordar) para comprar tras recibir su turno; si no, lo pierde.|
| RN5  | Moderación exclusiva para administradores   | Solo la administración podrá eliminar mensajes del foro.                                         |
| RN6  | Gestión de actores hecha por administradores| Solo la administración puede gestionar (crear, editar, eliminar) perfiles de actores y asignarlos.|
| RN7  | Una cuenta por usuario                      | No se permite la creación de múltiples cuentas con el mismo correo electrónico.                  |
| RN8  | Foro activo por evento                      | El foro solo estará disponible en los eventos ya publicados y solo para usuarios registrados.    |



## 2. Vistazo al producto
### 2.1 Perspectiva del producto
El proyecto del Teatro Mora es un sistema web diseñado para permitir la gestión de eventos teatrales, la compra de boletos mediante una cola virtual, y la interacción entre público y actores a través de foros. El sistema responde a una necesidad identificada por el Teatro Mora de modernizar sus procesos de venta y participación ciudadana.

---

### 2.2 Funciones del Producto

- Registro e inicio de sesión de usuarios.
- Creación y gestión de eventos teatrales (por el administrador).
- Gestión de perfiles de actores.
- Asignación de actores a eventos.
- Sistema de cola virtual para controlar el acceso a la compra de boletos.
- Selección de asientos y compra con límite de tiempo.
- Participación del público en foros por evento.
- Moderación y respuestas en foros por parte del administrador y actores.
- Visualización de eventos activos con detalles, actores y foros.

---

### 2.3 Restricciones del Producto

- El sistema debe ejecutarse en navegadores modernos (Chrome, Firefox, Edge, Safari).
- Se debe respetar un tiempo máximo de respuesta de 2 segundos en operaciones clave.
- Cumplimiento con las reglas de negocio definidas (ver sección RN).
- El diseño debe ser accesible.
- La integración con plataformas de pago debe usar APIs estándar y seguras.
- Solo los administradores puede gestionar actores y moderar foros.

---

### 2.4 Características de los Usuarios

| Clase de Usuario       | Características                                                                           |
|------------------------|--------------------------------------------------------------------------------------------|
| Usuario visitante   | Puede explorar eventos sin comprar ni interactuar. No requiere cuenta.                    |
| Usuario  | Puede comprar boletos, participar en foros y unirse a colas. Requiere autenticación.      |
| Actor               | Asociado a eventos, puede responder en foros. Sin permisos de gestión o moderación.       |
| Administrador | Control total sobre la plataforma: crear eventos, gestionar actores, moderar foros.       |

---

### 2.5 Supuestos y Dependencias

- Se asume que los usuarios tienen conexión a Internet estable.
- El sistema se alojará en un entorno en la nube (AWS).
- El sistema depende de servicios de terceros para pagos.
- Las reglas de negocio no sufrirán modificaciones significativas durante el desarrollo.
---

## 3. Requisitos

### 3.1 Requisitos Funcionales

### RF1 Registro de usuarios

**Descripción:**  
El sistema debe permitir a cualquier visitante registrarse creando un perfil con correo electrónico, nombre de usuario y contraseña.

**Atributos:**  
- Único correo por usuario  
- Validación de campos obligatoria  
- Contraseña segura (mínimo 8 caracteres, mínimo un caracter especial, por lo menos una mayuscula)

**Operaciones disponibles:**  
- Registrar nuevo usuario  
- Validar que el correo no esté en uso

**Criterios de aceptación:**  
- El sistema debe impedir el registro si falta algún dato obligatorio.  
- El correo debe ser único y válido.  
- El usuario debe ser redirigido a su perfil tras registrarse exitosamente.

**Prioridad:** Must, Sin registro no se puede comprar ni participar en foros.

---

### RF2 Autenticación de usuarios
**Descripción:**  
El sistema debe permitir a los usuarios registrados iniciar sesión con su correo y contraseña.

**Atributos:**  
- Sesión con duración limitada  

**Operaciones disponibles:**  
- Iniciar sesión  
- Cerrar sesión  
- Recuperar contraseña

**Criterios de aceptación:**  
- Si las credenciales son correctas, se accede al sistema.  
- Si son incorrectas, se muestra mensaje de error claro.  
- El sistema permite cerrar sesión desde cualquier pantalla.

**Prioridad:** Must, Esencial para el acceso seguro y personalizado.

---

### RF3 Creación de eventos
**Descripción:**  
El sistema debe permitir al administrador crear eventos ingresando nombre, fecha, hora y descripción.

**Atributos:**  
- Solo accesible por el administrador  
- Fecha y hora deben ser válidas y futuras

**Operaciones disponibles:**  
- Crear evento  
- Validar datos ingresados

**Criterios de aceptación:**  
- Un evento no puede ser creado con datos faltantes.  
- Solo se permiten eventos futuros.  
- El evento aparece publicado tras su creación.

**Prioridad:** Must, permite que el administrador cargue contenido fundamental.

---

### RF4 Gestión de actores
**Descripción:**  
El sistema debe permitir al administrador crear, editar y eliminar perfiles de actores con nombre, biografía y foto.

**Atributos:**  
- Cada actor debe tener al menos un nombre y una biografía  
- Foto es opcional

**Operaciones disponibles:**  
- Crear actor  
- Editar actor  
- Eliminar actor

**Criterios de aceptación:**  
- No se pueden guardar perfiles sin nombre o biografía.  
- Los cambios se reflejan inmediatamente en los eventos vinculados.

**Prioridad:** Should, necesario para mantener información actualizada, pero podría agregarse en fases.

---

### RF5 Asignación de actores
**Descripción:**  
El sistema debe permitir al administrador asignar uno o más actores a un evento desde la lista de actores registrados.

**Atributos:**  
- Solo actores existentes pueden ser asignados  
- Un evento debe tener al menos un actor para ser publicado

**Operaciones disponibles:**  
- Asignar actor  
- Eliminar actor asignado

**Criterios de aceptación:**  
- El evento no puede publicarse sin actores asignados.  
- La lista de actores asignados debe poder visualizarse desde la vista del evento.

**Prioridad:** Should, aporta valor visual e informativo a los eventos.

---

### RF6 Página de detalles del evento
**Descripción:**  
El sistema debe mostrar una página por evento con información del evento, actores asignados, botón para unirse a la cola (cuando esté habilitado), y foro interactivo.

**Atributos:**  
- Accesible para todos los usuarios registrados  
- El botón de cola se activa solo una hora antes

**Operaciones disponibles:**  
- Ver detalles  
- Entrar a foro  
- Unirse a la cola (cuando aplique)

**Criterios de aceptación:**  
- La página debe mostrar todos los datos del evento.  
- El botón de cola solo aparece en el momento habilitado.  
- El foro muestra mensajes cronológicamente.

**Prioridad:** Must, punto de entrada para usuarios.

---

### RF7 Cola virtual
**Descripción:**  
El sistema debe permitir a usuarios unirse a una cola virtual una hora antes de la venta de boletos y asignarles un número de turno único.

**Atributos:**  
- Un usuario solo puede unirse una vez por evento  
- El turno es personal e intransferible

**Operaciones disponibles:**  
- Unirse a cola  
- Visualizar número de turno  
- Ver tiempo estimado de espera

**Criterios de aceptación:**  
- Solo usuarios autenticados pueden unirse.  
- El sistema asigna un número único al usuario.  
- No se permite unirse fuera del horario habilitado.

**Prioridad:** Must, soluciona el principal problema técnico del sistema actual.

---

### RF8 Turno de compra y selección de asiento
**Descripción:**  
Cuando llegue su turno, el usuario debe poder seleccionar asientos disponibles y realizar la compra en un tiempo limitado.

**Atributos:**  
- Límite de 5 minutos por usuario  
- Asientos disponibles se actualizan en tiempo real

**Operaciones disponibles:**  
- Seleccionar asiento  
- Confirmar compra  
- Cancelar proceso

**Criterios de aceptación:**  
- Al llegar el turno, se debe habilitar el formulario de compra.  
- Si no completa la compra en el tiempo establecido, se pierde el turno.  
- Solo asientos disponibles pueden seleccionarse.

**Prioridad:** Must, núcleo del sistema de venta de boletos.

---

### RF9 Participación en foros
**Descripción:**  
El sistema debe permitir a los usuarios autenticados escribir mensajes públicos en el foro del evento.

**Atributos:**  
- Solo disponible para eventos publicados  
- Los mensajes son visibles por todos

**Operaciones disponibles:**  
- Escribir mensaje  
- Ver mensajes existentes

**Criterios de aceptación:**  
- Solo usuarios registrados pueden participar.  
- El mensaje se publica inmediatamente tras enviarlo.  
- Se muestra fecha y nombre de usuario junto al mensaje.

**Prioridad:** Could, mejora la experiencia del usuario, pero no es crítico.

---

### RF10 Respuestas en foros
**Descripción:**  
El sistema debe permitir al administrador, actores, y a los usuarios responder mensajes en el foro del evento.

**Atributos:**  
- Las respuestas son visibles públicamente  
- No se permiten respuestas anónimas

**Operaciones disponibles:**  
- Responder mensaje

**Criterios de aceptación:**    
- Las respuestas se agrupan debajo del mensaje original.  
- Se muestra autor y hora de la respuesta.

**Prioridad:** Could, agrega valor, pero no afecta la funcionalidad base.

---

### RF11 Moderación del foro
**Descripción:**  
El sistema debe permitir al administrador eliminar mensajes del foro.

**Atributos:**  
- Acción irreversible  
- Solo disponible para el administrador

**Operaciones disponibles:**  
- Eliminar mensaje

**Criterios de aceptación:**  
- El mensaje desaparece inmediatamente tras ser eliminado.  
- Se muestra confirmación antes de borrar.

**Prioridad:** Should, necesario para mantener un entorno respetuoso.

---

### RF12 Diseño responsive
**Descripción:**  
El sistema debe adaptarse automáticamente a distintos tamaños de pantalla y dispositivos (móviles y escritorio).

**Atributos:**  
- Layout adaptable  
- Funcionalidades completas en todos los tamaños

**Criterios de aceptación:**  
- Todas las vistas y acciones deben funcionar correctamente desde un smartphone, tablet o PC.  
- No se pierde contenido al cambiar tamaño de pantalla.  
- Menús y botones se adaptan al dispositivo.

**Prioridad:** Must, es clave para accesibilidad desde cualquier dispositivo.


### 3.2 Requisitos no funcionales

| **Requisito no funcional** | **Descripción** |
|-------------------------|-----------------|
| Rendimiento         | El sistema debe tener un tiempo de respuesta rápido (2 segundos) para las operaciones clave como registro, inicio de sesión, unirse a la cola y comprar boletos. |
| Usabilidad          | La interfaz debe ser intuitiva, fácil de entender y responsive para poder acceder desde distintos dispositivos. Los movimientos y acciones se deben percibir con fluidez (To Be Determined). |
| Seguridad           | Toda la información del usuario (perfil, contraseñas, transacciones) debe ser almacenada de forma segura utilizando cifrado estándar, por ejemplo, contraseñas en hash. |
| Disponibilidad      | El sistema debe estar disponible al menos el 99% del tiempo, especialmente durante horarios de eventos. |
| Escalabilidad       | El sistema debe poder soportar al menos (To Be Determined) usuarios concurrentes durante los lanzamientos de boletos sin degradar el rendimiento. |
| Mantenimiento       | El sistema debe permitir actualizaciones sin afectar las funcionalidades principales ni provocar tiempos prolongados fuera de línea. |


## 4. Casos de uso

### CU01 Registrar un usuario

**Creado por:** Equipo de desarrollo

**Fecha de creación:** 19/04/2025  

**Actor principal:** Visitante  
**Actores secundarios:** Sistema de autenticación  

**Descripción**  
El visitante ingresa su correo electrónico, nombre de usuario y contraseña para crear una cuenta en la plataforma. El sistema valida los datos, crea un perfil y permite el acceso a funcionalidades como unirse a la cola virtual, participar en foros y comprar boletos.

**Trigger:**  
El visitante hace clic en “Registrarse” desde la página principal.

**Precondiciones:**  
- PRE-1. El visitante no debe estar autenticado.  
- PRE-2. El visitante debe tener una dirección de correo válida.  

**Postcondiciones:**  
- POST-1. Se crea un perfil de usuario nuevo.  
- POST-2. El usuario es redirigido a su área personal autenticada.  

**Flujo normal:**  
1. El visitante accede al formulario de registro.  
2. Ingresa nombre de usuario, correo y contraseña.  
3. El sistema valida los datos ingresados.  
4. El sistema registra al usuario y crea el perfil.  
5. El sistema redirige al usuario a su área personal.

**Flujos alternativos:**  
**Datos Inválidos**  
1. El sistema detecta datos incompletos o inválidos.  
2. El sistema muestra mensaje de error.  
3. El usuario puede corregir los datos e intentar nuevamente.

**Excepciones:**  
**Correo Ya Registrado**  
1. El sistema detecta que el correo ya está en uso.  
2. El sistema notifica al usuario.  
3. El usuario puede iniciar sesión o usar otro correo.

**Prioridad:** Alta  

**Frecuencia de uso:** Alta, especialmente por nuevos usuarios antes de los eventos.  

**Reglas de negocio:**  
- RN7  

**Información extra:**  
Se puede usar un servicio de verificación de correo electrónico para mayor seguridad.

**Supuestos:**  
El usuario tiene acceso a internet y sabe completar formularios básicos.

---

### CU02 Inicio de Sesión

**Creado por:** Equipo de desarrollo 

**Fecha de creación:** 20/4/2025

**Actor principal:** Usuario registrado  
**Actores secundarios:** Sistema de autenticación

**Descripción:**  
Permite a un usuario autenticarse en el sistema con sus credenciales (correo y contraseña). Esto le da acceso a funcionalidades restringidas como unirse a la cola, participar en foros y comprar boletos.

**Trigger:**  
El usuario accede al formulario de inicio de sesión e ingresa sus credenciales.

**Precondiciones:**  
PRE-1. El usuario debe haberse registrado previamente.  
PRE-2. El sistema de autenticación debe estar disponible.  

**Postcondiciones:**  
POST-1. El usuario inicia sesión y es redirigido a la página principal con su sesión activa.  
POST-2. El sistema registra la sesión iniciada.

**Flujo normal:**  
**Iniciar sesión**
1. El usuario accede al formulario de inicio de sesión.  
2. El usuario introduce su correo electrónico y contraseña.  
3. El sistema valida las credenciales.  
4. Si son correctas, el sistema inicia sesión y redirige al usuario a la página principal.

**Flujos alternativos:**  
**Credenciales incorrectas**
1. El usuario introduce datos inválidos.  
2. El sistema muestra un mensaje de error indicando que las credenciales no son válidas.  
3. El usuario puede volver a intentarlo.

**Excepciones:**  
**El sistema de autenticación no está disponible**
1. El sistema muestra un mensaje: “Servicio no disponible, intente más tarde”.  
2. El caso de uso finaliza sin autenticación.

**Prioridad:** Alta  

**Frecuencia de uso:** Frecuente, cada vez que un usuario desea acceder al sistema.

**Reglas de negocio:** RN1, RN7  

**Otra información:** El sistema debe implementar protección contra intentos de acceso masivo (fuerza bruta).  

**Supuestos:**  
Se asume que el usuario recuerda sus credenciales y tiene acceso a internet.

---

### CU03 Crear Evento Teatral
**Creado por:** Equipo de desarrollo  

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Administrador  
**Actores Secundarios:** Ninguno  

**Descripción:**  
El administrador ingresa los detalles del evento como nombre, fecha, hora y descripción para crear un nuevo evento en la plataforma.  

**Trigger:**  
El administrador selecciona la opción "Crear evento" desde la interfaz administrativa.  

**Precondiciones:**  
PRE-1. El administrador ha iniciado sesión en el sistema.  
PRE-2. La interfaz administrativa está disponible.  

**Postcondiciones:**  
POST-1. El evento queda registrado en la base de datos.  
POST-2. El evento es visible para los usuarios en la página de eventos (sin foro ni cola aún activa).  

**Flujo Normal:**  
**Crear Evento Teatral**  
1. El administrador accede a la sección de administración de eventos.  
2. El sistema muestra un formulario para ingresar detalles del evento.  
3. El administrador introduce el nombre del evento, fecha, hora y descripción.  
4. El administrador envía el formulario.  
5. El sistema valida los datos y guarda el evento en la base de datos.  
6. El sistema notifica al administrador que el evento ha sido creado exitosamente.  

**Flujos Alternativos:**  
**Datos incompletos o inválidos**  
1. El sistema detecta que falta información obligatoria o hay un error en los campos (fecha inválida, texto vacío, etc.).  
2. El sistema informa al administrador sobre el problema.  
3. El administrador corrige los datos y vuelve al paso 4 del flujo principal.  

**Excepciones:**  
**Error de conexión**  
1. El sistema no puede acceder a la base de datos.  
2. Se muestra un mensaje de error y se sugiere intentar más tarde.  

**Prioridad:** Alta  

**Frecuencia de uso:** Depende del número de eventos.  

**Reglas de Negocio relacionadas:** RN5  

**Otra Información:**  
El evento no estará disponible para la venta ni para el foro hasta que al menos un actor haya sido asignado.  

**Supuestos:**  
Se asume que la administración tiene los datos necesarios del evento al momento de crear uno.

---

### CU04 Asignar Actores a Evento
**Creado por:** Equipo de desarrollo  

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Administrador  
**Actores Secundarios:** Ninguno  

**Descripción:**  
Permite a la administración seleccionar actores desde una lista de perfiles existentes y asignarlos a un evento específico.  

**Trigger:**  
La administración accede a la sección de edición de un evento y selecciona la opción "Asignar actores".  

**Precondiciones:**  
PRE-1. El administrador ha iniciado sesión correctamente.  
PRE-2. Existen actores registrados en el sistema.  
PRE-3. El evento ya ha sido creado y está disponible en el sistema.  

**Postcondiciones:**  
POST-1. Los actores seleccionados quedan vinculados al evento.  
POST-2. La información de los actores será visible en la página de detalles del evento.  

**Flujo Normal:**  
**Asignar Actores a Evento**  
1. El administrador accede a la lista de eventos y selecciona el evento deseado.  
2. El sistema muestra la opción para gestionar actores.  
3. El administrador elige “Asignar actores”.  
4. El sistema muestra una lista de actores registrados.  
5. El administrador selecciona uno o más actores.  
6. El administrador confirma la asignación.  
7. El sistema guarda la asignación en la base de datos y notifica a al administrador del éxito.  

**Flujos Alternativos:**  
**No hay actores registrados**  
1. El sistema informa al administrador que no hay actores disponibles para asignar.  
2. El administrador debe registrar actores antes de asignarlos al evento.  

**Excepciones:**  
**Error de base de datos**  
1. El sistema no puede guardar la asignación.  
2. Se muestra un mensaje de error y se sugiere intentar más tarde.  

**Prioridad:** Alta  

**Frecuencia de uso:** Por lo general, una vez por evento creado.  

**Reglas de Negocio relacionadas:** RN5, RN6  

**Otra Información:**  
Cada evento debe tener al menos un actor asignado para ser publicado y habilitar el foro y la cola virtual.  

**Supuestos:**  
Se asume que el administrador conoce qué actores debe asignar a cada evento.

---

### CU05 Unirse a la Cola Virtual
**Creado por:** Equipo de desarrollo  

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Usuario  
**Actores Secundarios:** Sistema  

**Descripción:**  
Permite al usuario unirse a la cola virtual de un evento una hora antes del inicio de la venta de boletos y recibir un número de turno único.  

**Trigger:**  
El usuario accede a la página del evento y pulsa el botón "Unirse a la cola virtual", cuando este está habilitado.  

**Precondiciones:**  
PRE-1. El usuario debe estar autenticado en el sistema.  
PRE-2. La hora actual está dentro del rango de una hora antes del inicio de la venta del evento.  
PRE-3. El evento debe estar publicado y tener al menos un actor asignado.  

**Postcondiciones:**  
POST-1. El usuario recibe un número de turno único e intransferible.  
POST-2. El sistema registra su posición en la cola virtual.  

**Flujo Normal:**  
**Unirse a la Cola Virtual**  
1. El usuario accede a la página de detalles de un evento.  
2. El sistema detecta que falta una hora o menos para el inicio de la venta.  
3. Se habilita el botón “Unirse a la cola virtual”.  
4. El usuario hace clic en el botón.  
5. El sistema registra al usuario y le asigna un número de turno único.  
6. El sistema muestra su número de turno y posición en tiempo real.  

**Flujos Alternativos:**  
**Usuario ya en cola**  
1. Si el usuario intenta unirse nuevamente al mismo evento, el sistema le informa que ya está en cola.  

**Excepciones:**  
**Problema de conexión o carga del sistema**  
1. El sistema no puede registrar al usuario.  
2. Se muestra un mensaje de error y se sugiere intentar nuevamente.  

**Prioridad:** Crítica  

**Frecuencia de uso:** Alta durante cada inicio de venta de boletos por evento.  

**Reglas de Negocio relacionadas:** RN1, RN2, RN3 

**Otra Información:**  
El sistema debe estar optimizado para soportar múltiples usuarios intentando unirse simultáneamente.  

**Supuestos:**  
Se espera que los usuarios estén atentos a la hora de activación de la cola para asegurar su lugar.

---

### CU06 Comprar Boleto con Selección de Asientos
**Creado por:** Equipo de desarrollo  

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Usuario  
**Actores Secundarios:** Sistema  

**Descripción:**  
Cuando llega su turno en la cola virtual, el usuario puede seleccionar asientos disponibles y realizar la compra del boleto dentro de un límite de tiempo.  

**Trigger:**  
El sistema detecta que el turno del usuario ha llegado y lo redirige automáticamente a la interfaz de compra.  

**Precondiciones:**  
PRE-1. El usuario debe estar autenticado.  
PRE-2. El usuario debe estar inscrito en la cola virtual del evento.  
PRE-3. El evento debe tener asientos disponibles.  

**Postcondiciones:**  
POST-1. La compra es registrada y el sistema actualiza el estado de los asientos seleccionados a “ocupados”.  
POST-2. El usuario recibe confirmación de la compra y detalles del asiento.  

**Flujo Normal:**  
**Comprar Boleto con Selección de Asientos**  
1. El sistema detecta que es el turno del usuario.  
2. El sistema muestra la interfaz de selección de asientos.  
3. El usuario selecciona uno o más asientos disponibles.  
4. El sistema calcula el monto total.  
5. El usuario procede al pago.  
6. El sistema valida el pago y registra la compra.  
7. Se muestran los detalles de la compra y asientos asignados.  

**Flujos Alternativos:**  
**Usuario abandona el flujo antes de pagar**  
1. Si el usuario no completa la compra en el tiempo establecido (5 minutos), el sistema libera los asientos y pierde su turno.  

**Excepciones:**  
**Fallo en el pago**  
1. El sistema notifica el error.  
2. El usuario puede intentar pagar nuevamente si está dentro del tiempo límite.  

**Prioridad:** Crítica  

**Frecuencia de uso:** Alta durante cada venta de boletos.  

**Reglas de Negocio relacionadas:** RN1, RN3, RN4

**Otra Información:**  
El sistema debe mostrar un temporizador visible al usuario indicando el tiempo restante para finalizar la compra.  

**Supuestos:**  
Se espera que los métodos de pago estén disponibles y funcionales para completar la transacción.

---

### CU07 Participar en Foro del Evento
**Creado por:** Equipo de desarrollo  

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Usuario  
**Actores Secundarios:** Sistema  

**Descripción:**  
Permite a los usuarios autenticados escribir mensajes públicos en el foro de un evento específico para interactuar con otros asistentes, actores o la administración.  

**Trigger:**  
El usuario accede a la página del evento y desea dejar un comentario o pregunta en el foro.  

**Precondiciones:**  
PRE-1. El usuario debe tener una cuenta y estar autenticado.  
PRE-2. El evento debe estar publicado y tener el foro habilitado.  

**Postcondiciones:**  
POST-1. El mensaje del usuario es publicado y visible públicamente dentro del foro del evento.  

**Flujo Normal:**  
**Participar en Foro del Evento**  
1. El usuario accede a la página de detalles del evento.  
2. El usuario visualiza el foro activo.  
3. El usuario escribe un mensaje en el área de participación.  
4. El usuario envía el mensaje.  
5. El sistema publica el mensaje con la información del usuario (nombre, fecha, hora).  

**Flujos Alternativos:**  
**Usuario envía mensaje vacío**  
1. El sistema valida el contenido y muestra un mensaje de error si está vacío.  

**Excepciones:**  
**Fallo de conexión o error del sistema**  
1. El sistema muestra una notificación de error al intentar publicar el mensaje.  

**Prioridad:** Media  

**Frecuencia de uso:** Moderada, principalmente antes y durante el evento.  

**Reglas de Negocio relacionadas:** RN1, RN8  

**Otra Información:**  
Los mensajes se muestran en orden cronológico. El sistema podría implementar filtros o moderación en el futuro.  

**Supuestos:**  
Se espera que los usuarios actúen con respeto; en caso contrario, el administrador podrá intervenir mediante moderación.

---

### CU08 Responder en Foro
**Creado por:** Equipo de desarrollo 

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Usuarios  
**Actores Secundarios:** Sistema  

**Descripción:**  
Permite a los usuarios responder mensajes públicos publicados por usuarios en el foro del evento correspondiente.  

**Trigger:**  
Un usuario visualiza un mensaje en el foro y desea responderlo.  

**Precondiciones:**  
PRE-1. El usuario debe haber iniciado sesión.  
PRE-2. El foro del evento debe estar activo.

**Postcondiciones:**  
POST-1. La respuesta es publicada y visible públicamente dentro del hilo del foro.  

**Flujo Normal:**  
**Responder en Foro**  
1. El usuario accede a la página del evento.  
2. Visualiza el foro con los mensajes públicos.  
3. Selecciona un mensaje al que desea responder.  
4. Escribe y envía una respuesta.  
5. El sistema publica la respuesta asociada al mensaje original.

**Flujos Alternativos:**  
**Respuesta vacía**  
1. El sistema detecta que no hay contenido y muestra un mensaje de error solicitando completar el campo.  

**Excepciones:**  
**Fallo en la publicación**  
1. El sistema muestra una notificación de error si no se puede enviar la respuesta por problemas técnicos.  

**Prioridad:** Media  

**Frecuencia de uso:** Moderada, especialmente en los días previos al evento.  

**Reglas de Negocio relacionadas:** RN8  

**Otra Información:**  
El sistema puede diferenciar visualmente las respuestas de distintos usuarios

**Supuestos:**  
Se espera que las respuestas sean relevantes, respetuosas y fomenten el diálogo.

---

### CU09 Gestionar Perfiles de Actores
**Creado por:** Equipo de desarrollo  

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Administración  
**Actores Secundarios:** Sistema  

**Descripción:**  
Permite al administrador crear, editar o eliminar perfiles de actores, incluyendo su nombre, biografía y foto, para que luego puedan ser asignados a eventos teatrales.  

**Trigger:**  
El administrador desea agregar un nuevo actor, actualizar su información o eliminar un perfil existente.  

**Precondiciones:**  
PRE-1. El administrador debe haber iniciado sesión.  

**Postcondiciones:**  
POST-1. La lista de actores disponibles se actualiza según la operación realizada (creación, edición o eliminación).  

**Flujo Normal:**  
**Crear perfil de actor**  
1. El administrador accede a la sección de gestión de actores.  
2. Selecciona la opción “Agregar nuevo actor”.  
3. Ingresa el nombre, biografía y sube una foto.  
4. Confirma la creación del perfil.  
5. El sistema guarda la información y añade el actor a la lista.  

**Editar perfil de actor**  
1. El administrador selecciona un actor existente.  
2. Modifica el nombre, biografía o reemplaza la foto.  
3. Confirma los cambios.  
4. El sistema actualiza la información del actor.  

**Eliminar perfil de actor**  
1. El administrador selecciona un actor.  
2. Hace clic en “Eliminar”.  
3. El sistema solicita confirmación.  
4. El administrador confirma y el perfil es eliminado.  

**Flujos Alternativos:**  
**Foto no válida**  
1. El sistema detecta que el archivo subido no es una imagen y solicita un nuevo archivo.  

**Excepciones:**  
**Fallo en guardar cambios**  
1. El sistema muestra un error si hay un problema técnico al guardar los datos.  

**Prioridad:** Alta  

**Frecuencia de uso:** Moderada, al actualizar o renovar el elenco para eventos nuevos.  

**Reglas de Negocio relacionadas:** RN6  

**Otra Información:**  
Los actores eliminados ya no podrán ser asignados a nuevos eventos, pero permanecerán visibles en eventos pasados si ya estaban asignados.  

**Supuestos:**  
Se espera que el administrador suba imágenes en formatos comunes (JPG, PNG).

---

### CU10 Moderar Foro
**Creado por:** Equipo de desarrollo  

**Fecha de creación:** 20/04/2025  

**Actor Principal:** Administración  
**Actores Secundarios:** Sistema  

**Descripción:**  
Permite al administrador eliminar mensajes ofensivos o inapropiados publicados por usuarios en los foros de los eventos.  

**Trigger:**  
El administrador detecta un mensaje que incumple las normas del foro o recibe una denuncia de un usuario.  

**Precondiciones:**  
PRE-1. El administrador debe haber iniciado sesión como administradora.  
PRE-2. Debe existir al menos un mensaje en el foro del evento.  

**Postcondiciones:**  
POST-1. El mensaje eliminado deja de estar visible para todos los usuarios.  

**Flujo Normal:**  
1. El administrador accede al foro del evento.  
2. Revisa los mensajes publicados por los usuarios.  
3. Selecciona el mensaje a eliminar.  
4. Hace clic en “Eliminar mensaje”.  
5. El sistema solicita confirmación.  
6. El administrador confirma la eliminación.  
7. El sistema elimina el mensaje del foro.  

**Flujos Alternativos:**  
**Cancelación de eliminación**  
1. Si el administrador decide no eliminar el mensaje, puede cancelar la acción.  
2. El sistema no realiza ningún cambio y regresa al foro.  

**Excepciones:**  
**Error en eliminación del mensaje**  
1. Si ocurre un error del sistema al intentar eliminar el mensaje, se muestra un mensaje de error y el contenido permanece visible.  

**Prioridad:** Media  

**Frecuencia de uso:** Variable, según la actividad y comportamiento de los usuarios en los foros.  

**Reglas de Negocio relacionadas:** RN5  

**Otra Información:**  
Solo el administrador tiene privilegios para eliminar mensajes. Los actores pueden responder pero no moderar el foro.  

**Supuestos:**  
Se espera que los usuarios respeten las normas del foro y que las eliminaciones sean acciones excepcionales.

## 5. Diagramas de la solución

### CU05 + CU06

**Descripción:**
En este diagrama se muestra el flujo por donde pasa un usuario al comprar sus tickets para la obra de teatro, es una combinación de el CU05 y CU06.

![](CU05+CU06.drawio.png "")

### Arquitectura para la solución basada en cloud

**Descripción:**
La arquitectura cloud propuesta incluye un balanceador de carga que distribuye el tráfico de usuarios entre múltiples instancias del sistema, evitando la sobrecarga de un solo servidor y asegurando alta disponibilidad y rendimiento constante. Junto con el uso de CDN, que entrega contenido estático al usuario, garantizando una experiencia rápida y fluida. Esta arquitectura escalable permite manejar eficazmente la demanda durante eventos concurridos (como la venta de boletos).

![](cloudarch.png "")


## 6. Verificación

Queremos validar que el sistema satisface los requisitos funcionales y no funcionales que han sido detallados en el documento, queremos detectar todos los defectos posibles antes de entregar nuestro sistema al cliente. Aseguraremos la usabilidad, rendimiento, disponibilidad y escalabilidad del sistema. Tanto frontend como backend deben ser testeados, se destacan los siguientes tipos de prueba:

### 6.1 Tipos de Pruebas

- **Pruebas Funcionales**  
  Validan que el sistema realiza correctamente las funciones definidas en los casos de uso.

- **Pruebas de Integración**  
  Verifican la correcta comunicación entre módulos (ej. autenticación + cola virtual + módulo de compra).

- **Pruebas de Rendimiento**  
  Evalúan el tiempo de respuesta y comportamiento bajo carga (especialmente en la cola y la compra).


---

### 6.2 Casos de Prueba Iniciales

| ID  | Nombre del Caso de Prueba                   | Objetivo                                                   | Requisitos Relacionados    |
|-----|---------------------------------------------|------------------------------------------------------------|-----------------------------|
| P01 | Registro de Usuario                        | Verificar que un visitante puede registrarse correctamente | RF1                   |
| P02 | Inicio de Sesión                           | Validar acceso con credenciales correctas e incorrectas    | RF2                         |
| P03 | Creación de Evento                         | Confirmar que María puede registrar un evento              | RF3                         |
| P04 | Asignación de Actores                      | Verificar asignación de actores por parte de María         | RF4              |
| P05 | Activación de Cola Virtual                 | Probar que se activa 1 hora antes del evento               | RF7                    |
| P06 | Compra de Boleto                           | Verificar compra completa con selección de asiento         | RF8            |
| P07 | Tiempo Límite de Compra                    | Confirmar que se pierde el turno tras 5 minutos            | RF8                         |
| P08 | Publicar en Foro                           | Validar que usuarios registrados puedan comentar           | RF9                    |
| P09 | Responder en Foro                          | Verificar respuestas de actores y María                    | RF10                   |
| P10 | Moderación del Foro                        | Asegurar que solo María puede eliminar mensajes            | RF11                   |

---

**FIN DEL DOCUMENTO**


