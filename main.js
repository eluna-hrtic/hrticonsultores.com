/* HRTIC · sitio web v1 · comportamiento mínimo, sin dependencias */
(function () {
  "use strict";

  // Menú móvil
  var boton = document.querySelector(".menu-boton");
  var menu = document.getElementById("menu");
  if (boton && menu) {
    boton.addEventListener("click", function () {
      var abierto = menu.classList.toggle("abierto");
      boton.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
  }

  // Video de capacitaciones: sin reproducción automática si la persona pidió reducir el movimiento
  document.querySelectorAll("video[autoplay]").forEach(function (v) {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.removeAttribute("autoplay"); v.pause(); v.controls = true;
    }
  });

  // Fecha visible en la hoja de reclamación
  var hoy = new Date();
  var fechaTxt = hoy.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  var lrFecha = document.getElementById("lr-fecha");
  if (lrFecha) lrFecha.textContent = fechaTxt;

  // Prellenado desde la URL (?tema=03, ?tipo=profesional)
  var params = new URLSearchParams(location.search);
  var tema = document.getElementById("c-tema");
  if (tema && params.get("tema")) tema.value = params.get("tema");
  if (params.get("tipo") === "profesional") {
    var r = document.querySelector('#form-contacto input[name="tipo"][value="profesional"]');
    if (r) r.checked = true;
    if (tema && !tema.value) tema.value = "P";
  }

  function datos(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { o[k] = String(v).trim(); });
    o.pagina = location.pathname;
    o.enviado = new Date().toISOString();
    return o;
  }

  function aviso(form, tipo, texto) {
    var a = form.querySelector(".aviso");
    if (!a) return;
    a.className = "aviso aviso-" + tipo;
    a.textContent = texto;
  }

  function validar(form) {
    var primero = null;
    form.querySelectorAll("[required]").forEach(function (c) {
      var ok = c.type === "checkbox" ? c.checked :
        c.type === "radio" ? !!form.querySelector('input[name="' + c.name + '"]:checked') :
        c.value.trim() !== "" && (c.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.value.trim())) &&
        (!(c.minLength > 0) || c.value.trim().length >= c.minLength);
      c.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok && !primero) primero = c;
    });
    if (primero) { primero.focus(); return false; }
    return true;
  }

  function enviar(form, alTerminar) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validar(form)) { aviso(form, "error", "Revisa los campos obligatorios."); return; }
      var endpoint = form.getAttribute("data-endpoint");
      var btn = form.querySelector('button[type="submit"]');
      if (!endpoint) { alTerminar(null, datos(form)); return; }
      btn.disabled = true;
      aviso(form, "info", "Enviando…");
      fetch(endpoint, { method: "POST", body: JSON.stringify(datos(form)) })
        .then(function (r) { return r.json(); })
        .then(function (res) { alTerminar(res, null); })
        .catch(function () { aviso(form, "error", "No se pudo enviar. Escríbenos a eluna@hrticonsultores.com."); })
        .finally(function () { btn.disabled = false; });
    });
  }

  // Formulario de contacto
  var fc = document.getElementById("form-contacto");
  if (fc) enviar(fc, function (res, local) {
    if (local) {
      // Sin servicio de formularios conectado: se abre el correo con el mensaje armado.
      var cuerpo = "Nombre: " + local.nombre + "\nCorreo: " + local.correo + "\nTeléfono: " + (local.telefono || "-") +
        "\nEmpresa: " + (local.empresa || "-") + "\nEscribe como: " + local.tipo + "\nTema: " + (local.tema || "-") + "\n\n" + local.mensaje;
      location.href = "mailto:eluna@hrticonsultores.com?subject=" + encodeURIComponent("Consulta web · " + local.nombre) + "&body=" + encodeURIComponent(cuerpo);
      aviso(fc, "info", "Se abrió tu programa de correo con el mensaje listo para enviar.");
      return;
    }
    if (res && res.ok) { fc.reset(); aviso(fc, "ok", "Recibimos tu mensaje. Te respondemos al correo que indicaste."); }
    else aviso(fc, "error", "No se pudo enviar. Escríbenos a eluna@hrticonsultores.com.");
  });

  // Consultas: precio total según el servicio (Ley N.° 29571, art. 4.1); el comprobante define el documento
  var fq = document.getElementById("form-consulta");
  if (fq) {
    var SERVICIOS = {
      escrita: { total: "S/ 59.00", detalle: "Consulta laboral por escrito · incluye IGV" },
      personalizada: { total: "S/ 177.00", detalle: "Consulta personalizada por videollamada (45 min) · incluye IGV" }
    };
    var DOCS = {
      persona: { doc: "DNI o carné de extranjería", ayuda: "(para la boleta)", max: 12 },
      empresa: { doc: "RUC", ayuda: "(para la factura)", max: 11 }
    };
    var razon = fq.querySelector(".solo-empresa");
    var inRazon = document.getElementById("q-razon");
    var inDoc = document.getElementById("q-documento");
    var etiqueta = document.getElementById("q-documento-etiqueta");
    var elegido = function (nombre, defecto) { return (fq.querySelector('input[name="' + nombre + '"]:checked') || {}).value || defecto; };
    var modo = function () {
      var s = SERVICIOS[elegido("servicio", "escrita")];
      var t = elegido("tipo", "persona"), d = DOCS[t];
      document.getElementById("q-total").textContent = s.total;
      document.getElementById("q-detalle").textContent = s.detalle;
      etiqueta.innerHTML = d.doc + ' <span class="ayuda">' + d.ayuda + "</span>";
      inDoc.maxLength = d.max;
      razon.hidden = t !== "empresa";
      if (t === "empresa") inRazon.setAttribute("required", ""); else { inRazon.removeAttribute("required"); inRazon.removeAttribute("aria-invalid"); }
    };
    fq.querySelectorAll('input[name="servicio"], input[name="tipo"]').forEach(function (r) { r.addEventListener("change", modo); });
    var marcar = function (nombre, valor) { var r = fq.querySelector('input[name="' + nombre + '"][value="' + valor + '"]'); if (r) r.checked = true; };
    if (params.get("servicio")) marcar("servicio", params.get("servicio"));
    if (params.get("tipo") === "empresa") marcar("tipo", "empresa");
    modo();
    enviar(fq, function (res, local) {
      if (local) { aviso(fq, "error", "El registro de consultas aún no está conectado. Escríbenos a eluna@hrticonsultores.com."); return; }
      if (res && res.ok) {
        fq.reset(); modo();
        aviso(fq, "ok", "Registramos tu consulta N.° " + res.numero + ". Te enviamos a tu correo el precio total (S/ " + res.total +
          ") y los datos de pago. Si no lo ves en unos minutos, revisa la carpeta de spam o correo no deseado y márcalo como «No es spam»: así te llegan también los siguientes correos de tu consulta.");
      } else if (res && res.error === "documento") aviso(fq, "error", "Revisa el documento: DNI de 8 dígitos, carné de extranjería o RUC de 11 dígitos, y la razón social si pides factura.");
      else aviso(fq, "error", "No se pudo registrar. Escríbenos a eluna@hrticonsultores.com.");
    });
  }

  // Libro de Reclamaciones
  var fl = document.getElementById("form-libro");
  if (fl) enviar(fl, function (res, local) {
    if (local) { aviso(fl, "error", "El Libro de Reclamaciones virtual aún no está conectado. Escríbenos a eluna@hrticonsultores.com."); return; }
    if (res && res.ok) {
      document.getElementById("lr-numero").textContent = res.numero;
      fl.reset();
      aviso(fl, "ok", "Hoja N.° " + res.numero + " registrada el " + fechaTxt + ". Te enviamos una copia a tu correo. Puedes imprimir esta página como constancia.");
    } else aviso(fl, "error", "No se pudo registrar. Escríbenos a eluna@hrticonsultores.com.");
  });
})();
