# Sistema de gestion comercial Distribuciones Daval

Prototipo frontend para gestionar el flujo comercial de Distribuciones DAVAL en el sector ferretero. La aplicacion permite administrar rutas comerciales, empresas, sucursales, usuarios, catalogo, listas de precios, promociones y cotizaciones desde tres experiencias principales: superadmin, asesor comercial y cliente final.

Este proyecto actualmente funciona con datos dummy en memoria. No tiene persistencia real ni backend conectado.

## Stack

- React 18
- Vite
- React Router
- Tailwind CSS
- Lucide React
- Recharts

## Ejecucion local

```bash
npm install
npm run dev
```

URL local habitual:

```text
http://127.0.0.1:5173/login
```

Build de validacion:

```bash
npm run build
```

## Credenciales del prototipo

| Rol | Email | Password | Ruta inicial |
| --- | --- | --- | --- |
| Superadmin | `admin@oblicua.com` | `admin123` | `/admin` |
| Asesor comercial | `asesor@oblicua.com` | `asesor123` | `/asesor` |
| Cliente empresa | `compras@oblicua.com` | `cliente123` | `/cliente` |
| Cliente comprador | `cliente@oblicua.com` | `cliente123` | `/cliente` |

## Flujo Superadmin

Ruta base: `/admin`

El superadmin administra la configuracion comercial completa del prototipo. El menu esta organizado segun el flujo de negocio:

1. Home
2. Rutas
3. Empresas
4. Usuarios
5. Categorias Producto
6. Catalogo
7. Listas de precios
8. Promociones
9. Trabajar cotizaciones
10. Asesores

### Home

Dashboard general con indicadores comerciales del sistema. Sirve como punto inicial de administracion.

### Rutas

Permite crear y editar rutas comerciales. Cada ruta contiene:

- Nombre de la ruta.
- Dia de la semana en que se realiza.
- Hora maxima para recibir cotizaciones.
- Cobertura por cuadrante tipo Google Maps.
- Campos automaticos de calles y carreras asociados al cuadrante.

Regla de negocio importante:

- La hora maxima de la ruta define hasta cuando un cliente puede montar cotizaciones antes de su siguiente ruta.
- El cliente solo puede cotizar hasta el dia anterior a la ruta a la hora maxima configurada.
- Luego de cerrarse la ventana, vuelve a poder cotizar desde el dia siguiente a la ruta y el ciclo se repite semanalmente.

Nota tecnica:

- La integracion real de Google Maps aun no esta conectada.
- Para produccion, la API key de Google Maps debe estar restringida por dominio, API y cuota.

### Empresas

Modulo enfocado en empresas ferreteras. Permite administrar empresas cliente y sus sucursales.

Cada empresa tiene:

- Nombre.
- NIT.
- Email.
- Telefono.
- Direccion.
- Sucursales.

Cada sucursal tiene:

- Nombre.
- Direccion.
- Ciudad.
- Ruta relacionada.
- Asesor asignado.
- Estado activo/inactivo.

La ruta relacionada permitira ubicar sucursales pertenecientes a una ruta comercial. El asesor asignado permitira asociar las cotizaciones de una sucursal con el asesor comercial correcto.

### Usuarios

Gestiona usuarios cliente creados desde administracion. Estos usuarios quedan asociados a una empresa y pueden usar la experiencia cliente.

### Categorias Producto

Administra las categorias del catalogo. El contenido dummy actual esta orientado al sector ferretero:

- Herramientas Manuales.
- Tornilleria y Fijacion.
- Construccion y Obra.
- Seguridad Industrial.
- Pinturas y Adhesivos.

### Catalogo

Administra productos del catalogo comercial. Cada producto incluye:

- Imagen.
- SKU.
- Nombre.
- Categoria.
- Calidad de producto.
- Descripcion.
- Precio base.
- Stock.
- Unidad.
- Estado.
- Productos complementarios para cross-selling.

Calidades disponibles:

- Calidad estandar.
- Alta calidad.
- Calidad premium.

El superadmin puede crear, editar, activar o desactivar productos. Tambien existe un modal demo de importacion Excel.

### Listas de precios

Permite configurar listas de precios por cliente. La creacion/edicion solicita:

- Nombre de la lista.
- Alcance: todos los clientes, uno o varios clientes.
- Archivo Excel con plantilla.

Formato esperado de plantilla:

```text
SKU - Nombre producto - Precio sin puntos ni comas
```

Desde la vista se puede descargar un ejemplo de plantilla para diligenciar.

### Promociones

Modulo similar a listas de precios, pero con vigencia. Cada promocion contiene:

- Nombre.
- Alcance por clientes o todos los clientes.
- Fecha y hora desde.
- Fecha y hora hasta.
- Archivo de precios por SKU.

Las promociones vigentes se reflejan en el catalogo del cliente:

- Se muestran en el apartado destacado Promociones.
- Los productos promocionados muestran precio anterior y precio final.
- El color de promocion en cliente es verde.

### Trabajar cotizaciones

Las cotizaciones reemplazan el concepto anterior de pedidos. La tabla del superadmin permite abrir una cotizacion y entrar a una vista dedicada de detalle.

Cada cotizacion debe permitir identificar:

- Usuario solicitante.
- Empresa.
- Sucursal.
- Asesor asignado.
- Productos.
- Cantidades.
- Totales.
- Comentarios internos.
- Adjuntos.
- Link para ver cotizacion en Siigo.

Actualmente las cotizaciones no manejan estados.

### Asesores

Administra asesores comerciales. El campo sede asignada fue eliminado porque DAVAL solo opera con una sede en la logica actual del proyecto.

## Flujo Asesor Comercial

Ruta base: `/asesor`

El asesor comercial trabaja las cotizaciones asignadas a el.

### Mis Cotizaciones

Vista principal con:

- Tabla de cotizaciones asignadas.
- Rango de fechas.
- Indicadores de volumen, valor total, unidades y cotizaciones con link de Siigo.
- Acceso a vista interna de cada cotizacion.

### Detalle de cotizacion

Ruta:

```text
/asesor/cotizacion/:orderId
```

En esta vista el asesor puede:

- Revisar informacion completa de la cotizacion.
- Ver empresa, usuario solicitante y sucursal.
- Revisar productos, cantidades, unidades y total.
- Agregar comentarios internos.
- Adjuntar archivos.
- Editar o guardar el link de Siigo cuando aplique.
- Usar el boton superior "Ver cotizacion en Siigo".

El boton "Ver cotizacion en Siigo" tiene estilo transparente azul. Si la cotizacion tiene `siigoUrl`, abre el enlace en una nueva pestana; si no lo tiene, aparece deshabilitado.

## Flujo Cliente

Ruta base: `/cliente`

La experiencia cliente esta disenada para que el comprador pueda autogestionar solicitudes de cotizacion antes de que inicie la ruta de DAVAL.

### Inicio

El cliente no inicia directamente en el catalogo. Primero elige entre:

1. Iniciar una cotizacion nueva desde cero.
2. Iniciar una cotizacion basada en una cotizacion anterior.

La primera opcion lleva al catalogo y muestra un modal inicial explicando que puede navegar productos, agregarlos al carrito y confirmar la solicitud.

La segunda opcion permite seleccionar una cotizacion existente, previsualizarla y cargar sus productos al carrito para acelerar solicitudes recurrentes.

### Catalogo

Ruta:

```text
/cliente/catalogo
```

Funcionalidades principales:

- Busqueda global por nombre o SKU.
- Filtro por categorias.
- Apartado destacado Promociones.
- Filtro por calidad de producto.
- Vista en cards y vista tipo lista.
- Precio anterior y precio promocional cuando hay promocion vigente.
- Cantidad seleccionable desde cada card.
- Agregar al carrito directamente desde card o lista.
- Ver detalle del producto sin perder la opcion de agregar al carrito.

El apartado Promociones solo muestra productos que tengan una promocion vigente aplicable al cliente.

### Carrito y confirmacion

El carrito esta disponible desde la barra superior. Permite:

- Ver productos agregados.
- Cambiar cantidades.
- Eliminar productos con confirmacion.
- Ver total estimado.
- Ir a revisar y confirmar cotizacion.

Al confirmar, la cotizacion queda creada en el estado actual del prototipo usando datos en memoria.

### Mis Cotizaciones

Ruta:

```text
/cliente/cotizaciones
```

Permite al cliente revisar su historial de cotizaciones y abrir una vista interna de detalle.

### Administrar

Ruta:

```text
/cliente/administrar
```

Permite administrar usuarios y sucursales de la empresa cliente con restricciones frontend:

- Si solo hay una sucursal, no se puede eliminar.
- Si solo hay un usuario, no se puede eliminar.
- El usuario actual no puede eliminarse a si mismo.
- El cliente puede ver la ruta asignada a una sucursal, pero no puede modificarla.

### Registro de cliente desde login

En el login existe el boton "Quiero registrarme como cliente". Abre un wizard para crear:

- Informacion de la empresa.
- Usuario principal.
- Contrasena.
- Primera sucursal.

Al finalizar, se muestra un modal de bienvenida:

```text
Tu cuenta ha sido creada, te damos la bienvenida
```

El mensaje explica que la plataforma permite solicitar cotizaciones de manera autonoma antes de que la ruta de DAVAL inicie.

### Ventana de cotizacion por ruta

En toda la experiencia cliente hay una alerta/topbar con informacion de la siguiente ruta:

```text
Queda [tiempo] para tu siguiente ruta.
```

La regla se calcula usando:

- Ruta asignada a la sucursal del cliente.
- Dia de la ruta.
- Hora maxima de recepcion.

Si el cliente no tiene ruta asignada, se muestra:

```text
Solicita a tu asesor de Distribuciones DAVAL que te asigne una ruta de pedidos para empezar a usar la plataforma.
```

Esto evita errores en el calculo de ventana de cotizacion para clientes nuevos.

### Ayuda por WhatsApp

La experiencia cliente tiene un boton flotante:

```text
¿Necesitas ayuda?
```

Este abre WhatsApp de la compania con un mensaje prellenado. El numero actual es provisional y esta centralizado en `src/pages/client/ClientLayout.jsx`.

### Logo de DAVAL

En la experiencia cliente, el logo de DAVAL dirige al inicio `/cliente`.

## Comportamientos globales

### Tema oscuro

El proyecto esta disenado en dark theme para todas las experiencias.

### Creditos Oblicua

El archivo `index.html` importa el script:

```text
https://lab.oblicua.co/credits/credits.js
```

Y llama:

```js
setCredits("#000000", "Daval")
```

La carga es defensiva:

- Si el script falla, no rompe la app.
- Si `setCredits` no existe o lanza error, se captura con `try/catch`.
- Se usa cache-buster con `Date.now()` para pedir la version mas reciente del script.

## Seguridad e integraciones futuras

Nota importante para implementar integraciones reales:

- Las API keys visibles en frontend nunca deben considerarse secretas.
- Google Maps puede usar una key frontend, pero debe estar restringida por dominio, API y cuota.
- Tokens de Siigo, credenciales OAuth, service accounts de GCP y secretos privados no deben estar en React.
- Las operaciones sensibles deben pasar por backend propio o funcion serverless.
- Los secretos deben guardarse en variables de entorno del servidor o en GCP Secret Manager.
- No subir `.env` con secretos reales al repositorio.

Flujo recomendado para integraciones sensibles:

```text
Frontend -> Backend propio -> API externa
```

Ejemplos:

- Crear cotizacion real en Siigo.
- Sincronizar clientes con Siigo.
- Guardar rutas reales.
- Procesar archivos Excel.
- Usar tokens OAuth.

## Datos dummy

Los datos principales viven en:

```text
src/data/mockData.js
```

Incluyen:

- Empresas ferreteras.
- Usuarios por rol.
- Rutas.
- Categorias producto.
- Productos ferreteros.
- Listas de precios.
- Promociones.
- Cotizaciones.

El estado de la aplicacion se administra en memoria desde:

```text
src/context/AppContext.jsx
src/context/AuthContext.jsx
```

Al recargar la pagina, los datos vuelven al estado inicial del mock.

## Rutas principales

```text
/login
/admin
/admin/rutas
/admin/empresas
/admin/clientes
/admin/centros-de-costos
/admin/catalogo
/admin/listas-precios
/admin/promociones
/admin/cotizaciones
/admin/cotizaciones/:orderId
/admin/asesores
/asesor
/asesor/cotizacion/:orderId
/cliente
/cliente/catalogo
/cliente/cotizaciones
/cliente/cotizaciones/:orderId
/cliente/confirmar-cotizacion
/cliente/administrar
```

Algunas rutas antiguas con `pedidos` redirigen a sus equivalentes de `cotizaciones` para mantener compatibilidad.

## Notas de producto

- El concepto de "pedido" fue reemplazado por "cotizacion" en las experiencias.
- Ya no existe el rol supervisor.
- Las cotizaciones ya no tienen estados.
- El modulo Sedes fue retirado del superadmin por decision de negocio: DAVAL opera con una sola sede.
- La ruta y asesor asignado viven en la sucursal, porque de ahi se deriva la gestion comercial de cotizaciones.
- Las promociones se visualizan en verde y aplican por SKU cuando estan vigentes.
- La calidad de producto debe mantenerse como atributo del producto en futuras persistencias.
