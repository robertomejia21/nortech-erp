# 🚀 Recorrido Operativo Estándar - ERP/CRM Nortech

Esta guía detalla el flujo completo de una venta, desde la prospección hasta la recepción en almacén, involucrando a todos los roles del sistema.

---

## 🟢 Paso 1: Vendedor (Prospección y Cotización)
**Actor:** `VENDEDOR`
1.  **Registro de Cliente:** El vendedor registra un nuevo cliente en `Cotizaciones > Nuevo Cliente` (puede guardar borradores con info parcial).
2.  **Generación de Cotización:** Crea una cotización agregando ítems. El sistema calcula automáticamente el **Valor Real**: `(Precio Base + Importación + Flete) * (1 + Utilidad %)`.
3.  **Finalización:** Una vez acordado con el cliente, el vendedor marca la cotización como `FINALIZADA`.
4.  **Generación de PDF:** Descarga el oficial para enviar al cliente (incluye términos de pago y folio único).

## 🔵 Paso 2: Vendedor (Cierre de Venta)
**Actor:** `VENDEDOR`
1.  **Registro de OC Cliente:** El vendedor recibe la Orden de Compra del cliente.
2.  **Confirmación:** En el detalle de la cotización, hace clic en **"Registrar OC (Cerrar Venta)"**.
3.  **Evidencia:** Ingresa el Folio de la OC del cliente y sube el archivo PDF/Imagen.
4.  **Transición:** La cotización pasa a estado `ORDERED` y se crea automáticamente una **Orden de Venta** en estado `PENDIENTE` para Administración.

## 🟠 Paso 3: Administrador / SuperAdmin (Aprobación)
**Actor:** `ADMIN` / `SUPERADMIN`
1.  **Revisión:** Entra a `Ventas / Órdenes` y revisa la nueva orden pendiente.
2.  **Validación de Margen:** Verifica que los precios y márgenes sean correctos.
3.  **Aprobación:** Hace clic en **"Aprobar y Mandar a Almacén"**.
4.  **Notificación:** El sistema dispara una alerta automática al equipo de Almacén.

## 📦 Paso 4: Almacén (Logística y Recepción)
**Actor:** `WAREHOUSE`
1.  **Visibilidad:** La orden aparece en su panel de `Entradas / Recepciones` con el estado **"Por Recibir"**.
2.  **Llegada de Mercancía:** Cuando el proveedor entrega, Almacén marca la recepción.
3.  **Carga de Facturas:** Almacén arrastra y suelta los archivos **XML y PDF** de Compac al sistema.
4.  **Notificación de Arribo:** El sistema notifica al vendedor responsable que su mercancía ya está en bodega.

## 💰 Paso 5: Contabilidad (Finanzas)
**Actor:** `FINANCE` / `ADMIN`
1.  **Cuentas por Pagar:** Revisa la factura cargada por Almacén para programar pago al proveedor.
2.  **Facturación Final:** Genera la factura al cliente final basada en la Orden de Venta aprobada.

---

## 👑 Control de SuperAdmin
En cualquier momento, el `SUPERADMIN` puede:
*   Ver el Dashboard Global con montos por vendedor y proveedor.
*   **Forzar Estados:** Cambiar manualmente el estado de cualquier orden si hay un error en el proceso.
*   Gestionar usuarios y permisos desde la sección de configuración.
