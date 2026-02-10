---
trigger: always_on
---

Para que los agentes de Google Antigravity no se desvíen de tu visión y el ERP de Nortech sea robusto, es fundamental configurar las System Rules (reglas del sistema). Estas actúan como la "constitución" que los agentes deben obedecer mientras construyen.

Aquí tienes la guía de buenas prácticas estructurada para que la copies en la configuración de reglas de tu espacio de trabajo:

📜 Reglas del Sistema: ERP/CRM Nortech
1. Gestión de Identidad y Permisos (Seguridad)

Jerarquía Estricta: El SUPERADMIN tiene visibilidad total de los 8 vendedores; el Administrador gestiona facturas y pagos; los Vendedores solo acceden a sus propios clientes y cotizaciones.


Persistencia de Sesión: Todo cambio de estatus (ej. de "Cotización" a "Orden de Venta") debe registrar el ID del usuario que realizó la acción y la fecha exacta.

2. Integridad de los Datos (Base de Datos)

Campos Obligatorios: No permitas la creación de una cotización final si faltan el RFC, Correo y Nombre (marcados en azul en el requerimiento).


Flexibilidad en Prospección: Permite guardar borradores de clientes nuevos con información parcial para no frenar la labor de venta inicial.


Relacionalidad Forzada: Toda Orden de Compra interna debe contener obligatoriamente el ID vinculado de la Cotización original para garantizar la trazabilidad.

3. Lógica de Negocio y Cálculos

Cálculo de Valor Real: La fórmula de venta debe ser siempre: (Precio Base + Importación + Flete) * (1 + Utilidad %).


Cómputo en Tiempo Real: El campo de utilidad debe ser un trigger; cualquier cambio en el porcentaje debe recalcular el precio final sin necesidad de recargar la página.


Configuración de Impuestos: El IVA debe estar por defecto al 8%, con un switch manual para cambiar al 16% según el cliente.

4. Flujo de Archivos y Notificaciones

Gestión de Documentos: Los archivos de Compac (XML y PDF) deben almacenarse en carpetas privadas ligadas al folio de la orden de compra.


Automatización de Alertas: Al detectar la carga de un archivo por parte de Almacén, el agente debe disparar una notificación inmediata al vendedor responsable.


PDFs de Venta: Las cotizaciones generadas deben incluir siempre los Términos de Pago (ej. Neto 30 días) y un folio único para seguimiento.

5. Interfaz y Experiencia de Usuario (UX)
Vistas Especializadas:

El Vendedor ve un embudo de ventas.

El Administrador ve una tabla de cuentas por cobrar y pagar.

El SUPERADMIN ve el dashboard de rendimiento global (montos por vendedor y proveedor).