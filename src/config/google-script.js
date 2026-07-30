/**
 * CÓDIGO DE GOOGLE APPS SCRIPT
 * 
 * INSTRUCCIONES:
 * 1. Crea una hoja de cálculo en Google Sheets.
 * 2. En la primera fila (Fila 1), coloca exactamente estos encabezados en cada columna:
 *    A: Fecha
 *    B: Empresa
 *    C: Nombre Cliente
 *    D: Correo Cliente
 *    E: WhatsApp Cliente
 *    F: Ciudad
 *    G: Nombre Empresa Cliente
 *    H: Actividad Comercial
 *    I: Sitio Web Actual
 *    J: Tipo de Página
 *    K: Objetivos
 *    L: Secciones
 *    M: Tiene Logo
 *    N: Tiene Fotos
 *    O: Tiene Textos
 *    P: Estilo Visual
 *    Q: Colores Preferidos
 *    R: Páginas Referencia
 *    S: Medios Contacto
 *    T: Presupuesto
 *    U: Cuándo Iniciar
 *    V: Email Negocio (para formularios web)
 *    W: WhatsApp Negocio
 *    X: Teléfono Negocio
 *    Y: Dirección Negocio
 *    Z: Redes Sociales
 * 
 * 3. Ve a "Extensiones" -> "Apps Script".
 * 4. Borra el código existente y pega este archivo completo.
 * 5. Haz clic en "Implementar" (Deploy) -> "Administrar implementaciones" -> actualiza la existente.
 * 6. Configura:
 *    - Ejecutar como: "Tú" (Tu correo de Google).
 *    - Quién tiene acceso: "Cualquiera" (Anyone).
 */

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  try {
    var data = {};
    
    // Obtener los datos independientemente de cómo se envíen (JSON o Formulario/URL-encoded)
    if (e.postData && e.postData.contents && e.postData.type && e.postData.type.indexOf('application/json') > -1) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    } else if (e.postData && e.postData.contents) {
      // Fallback: intentar parsear como JSON o query string manual
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        var pairs = e.postData.contents.split('&');
        for (var i = 0; i < pairs.length; i++) {
          var pair = pairs[i].split('=');
          data[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '').replace(/\+/g, ' ');
        }
      }
    }
    
    // Insertar fila con los datos recibidos
    sheet.appendRow([
      new Date(), // Fecha
      data.empresa || '',
      data.nombre || '',
      data.correo || '',
      data.whatsapp || '',
      data.ciudad || '',
      data.nombreEmpresaCliente || '',
      data.actividad || '',
      data.sitioWebActual || '',
      data.tipoPagina || '',
      data.objetivos || '',
      data.secciones || '',
      data.tieneLogo || '',
      data.tieneFotos || '',
      data.tieneTextos || '',
      data.estiloVisual || '',
      data.colores || '',
      data.referencias || '',
      data.mediosContacto || '',
      data.presupuesto || '',
      data.inicio || '',
      data.emailNegocio || '',
      data.whatsappNegocio || '',
      data.telefonoNegocio || '',
      data.direccionNegocio || '',
      data.redesSociales || ''
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'Datos guardados correctamente'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Configurar cabeceras CORS para peticiones OPTIONS (navegador preflight)
function doOptions(e) {
  var output = ContentService.createTextOutput();
  return output.setMimeType(ContentService.MimeType.TEXT);
}
