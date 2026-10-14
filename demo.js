/* HRTIC · agenda de demostraciones de la Plataforma HRTIC (v1.32 de la web, 10/10/2026; v1.34, 13/10/2026: número exacto de
   trabajadores, régimen y lo que necesita resolver, para crear la demostración a la medida al aprobar la solicitud).
   Pide los horarios libres al servicio de formularios v1.11 (GET ?accion=demo_horarios) y envía la SOLICITUD (formulario 'demo').
   El servicio vuelve a revisar el calendario y aparta el horario; la invitación sale solo cuando Ernesto aprueba (13/10/2026).
   Si el horario se ocupó, responde «ocupado» y aquí se recargan los horarios. Sin servicio o con error, la página ofrece WhatsApp. No usa cookies. */
(function () {
  "use strict";
  var form = document.getElementById("form-demo");
  if (!form) return;
  var endpoint = form.getAttribute("data-endpoint") || "";
  var $ = function (id) { return document.getElementById(id); };
  var cajaDias = $("d-dias"), cajaHoras = $("d-horas"), estado = $("d-estado"), elegido = $("d-elegido");
  var campoInicio = $("d-inicio"), campoPlan = $("d-plan");
  var WSP = "https://wa.me/51942927868?text=" + encodeURIComponent("Hola, vengo de la web de HRTIC. Quiero agendar una demostración de la plataforma.");
  var horarios = [], diaActual = "", horaElegida = null;

  var params = new URLSearchParams(location.search);
  var plan = (params.get("plan") || "").slice(0, 200);
  if (plan) campoPlan.value = plan;

  function origen() {
    try { return JSON.parse(sessionStorage.getItem("hrtic_origen") || "{}"); } catch (e) { return {}; }
  }
  function evento(nombre, titulo) {
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: nombre, title: titulo, event: true }); } catch (e) { /* sin medición */ }
  }
  function aviso(tipo, texto) {
    var a = form.querySelector(".aviso");
    a.className = "aviso aviso-" + tipo;
    a.textContent = texto;
  }
  function sinAgenda(texto) {
    cajaDias.innerHTML = ""; cajaHoras.innerHTML = "";
    estado.innerHTML = "";
    estado.appendChild(document.createTextNode(texto + " "));
    var a = document.createElement("a");
    a.href = WSP; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Escríbanos por WhatsApp y coordinamos el horario.";
    estado.appendChild(a);
  }
  function boton(clase, html, etiqueta) {
    var b = document.createElement("button");
    b.type = "button"; b.className = clase; b.innerHTML = html; b.setAttribute("aria-pressed", "false");
    if (etiqueta) b.setAttribute("aria-label", etiqueta);
    return b;
  }
  function partesDia(texto) { // «martes 13/10/2026»
    var p = texto.split(" "), f = (p[1] || "").split("/");
    return { semana: p[0].slice(0, 3), num: f[0] + "/" + f[1], largo: texto };
  }
  function elegirHora(h, b) {
    horaElegida = h;
    campoInicio.value = h.inicio;
    cajaHoras.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
    elegido.textContent = "Solicitud para el " + h.dia + " a las " + h.hora + " (hora de Lima), 20 minutos por Google Meet.";
    elegido.classList.add("listo");
  }
  function mostrarDia(fecha) {
    diaActual = fecha;
    cajaDias.querySelectorAll("button").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-fecha") === fecha ? "true" : "false"); });
    cajaHoras.innerHTML = "";
    horarios.filter(function (h) { return h.fecha === fecha; }).forEach(function (h) {
      var b = boton("agenda-hora", h.hora, h.dia + " a las " + h.hora);
      if (horaElegida && horaElegida.inicio === h.inicio) b.setAttribute("aria-pressed", "true");
      b.addEventListener("click", function () { elegirHora(h, b); });
      cajaHoras.appendChild(b);
    });
  }
  function pintar() {
    cajaDias.innerHTML = "";
    var dias = [];
    horarios.forEach(function (h) { if (dias.indexOf(h.fecha) === -1) dias.push(h.fecha); });
    if (!dias.length) { sinAgenda("No quedan horarios libres en los próximos días."); return; }
    dias.forEach(function (fecha) {
      var h = horarios.filter(function (x) { return x.fecha === fecha; });
      var p = partesDia(h[0].dia);
      var b = boton("agenda-dia", "<small>" + p.semana + "</small><strong>" + p.num + "</strong>",
                    p.semana + " " + p.num + ": " + p.largo + ", " + h.length + (h.length === 1 ? " horario libre" : " horarios libres"));   // v1.35: el nombre accesible empieza con el texto visible (WCAG 2.5.3)
      b.setAttribute("data-fecha", fecha);
      b.addEventListener("click", function () { mostrarDia(fecha); });
      cajaDias.appendChild(b);
    });
    estado.textContent = horarios.length + " horarios libres en los próximos " + dias.length + " días hábiles.";
    mostrarDia(dias.indexOf(diaActual) !== -1 ? diaActual : dias[0]);
  }
  function cargar() {
    if (!endpoint) { sinAgenda("La agenda en línea todavía no está conectada."); return Promise.resolve(); }
    estado.textContent = "Cargando los horarios libres…";
    return fetch(endpoint + (endpoint.indexOf("?") === -1 ? "?" : "&") + "accion=demo_horarios")
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok || !Array.isArray(res.horarios)) throw new Error("sin horarios");
        horarios = res.horarios;
        if (horaElegida && !horarios.some(function (h) { return h.inicio === horaElegida.inicio; })) {
          horaElegida = null; campoInicio.value = "";
          elegido.textContent = "Primero elija un día y una hora."; elegido.classList.remove("listo");
        }
        pintar();
      })
      .catch(function () { sinAgenda("No pudimos cargar la agenda en este momento."); });
  }

  function validar() {
    var primero = null;
    form.querySelectorAll("[required]").forEach(function (c) {
      var v = c.type === "checkbox" ? c.checked : c.value.trim();
      var bien = c.type === "checkbox" ? v : v !== "" &&
        (c.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) &&
        (c.name !== "telefono" || v.replace(/\D/g, "").length >= 9);
      c.setAttribute("aria-invalid", bien ? "false" : "true");
      if (!bien && !primero) primero = c;
    });
    var dol = form.querySelectorAll('input[name="dolores"]'), marcados = form.querySelectorAll('input[name="dolores"]:checked').length;
    var caja = document.getElementById("d-dolores");
    if (dol.length) { caja.classList.toggle("invalido", !marcados); if (!marcados && !primero) primero = dol[0]; }
    var n = form.querySelector('[name="trabajadores"]');
    if (n && n.value && !(+n.value >= 1 && +n.value <= 5000 && Math.floor(+n.value) === +n.value)) { n.setAttribute("aria-invalid", "true"); if (!primero) primero = n; }
    if (primero) { primero.focus(); return false; }
    return true;
  }
  var MENSAJES = {
    ocupado: "Ese horario se acaba de ocupar. Elija otro: ya actualizamos la agenda.",
    limite: "Ya tiene solicitudes o demostraciones pendientes con este correo. Para cambiar la fecha, escríbanos por WhatsApp al 942 927 868.",
    telefono: "Revise el celular: debe tener al menos 9 dígitos.",
    consentimiento: "Marque la autorización para tratar sus datos.",
    horario: "Elija un día y una hora."
  };

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!campoInicio.value) { aviso("error", "Primero elija un día y una hora."); cajaDias.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (!validar()) { aviso("error", form.querySelector('input[name="dolores"]:checked') ? "Revise los campos obligatorios." : "Revise los campos obligatorios y marque al menos un tema por resolver."); return; }
    if (!endpoint) { aviso("error", "La agenda en línea todavía no está conectada. Escríbanos por WhatsApp al 942 927 868."); return; }
    var d = {};
    new FormData(form).forEach(function (v, k) { if (typeof v === "string" && k !== "dolores") d[k] = v.trim(); });
    d.dolores = [].map.call(form.querySelectorAll('input[name="dolores"]:checked'), function (c) { return c.value; }).join(",");
    var o = origen();
    d.formulario = "demo"; d.pagina = location.pathname; d.enviado = new Date().toISOString();
    d.fuente = o.fuente || ""; d.entrada = o.entrada || "";
    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    aviso("info", "Enviando su solicitud…");
    fetch(endpoint, { method: "POST", body: JSON.stringify(d) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (res && res.ok && res.numero) {
          evento("envio-demo", "Demostración solicitada");
          var caja = document.createElement("div");
          caja.className = "tarjeta agenda-confirmada";
          caja.setAttribute("tabindex", "-1");
          var t = document.createElement("h3"); t.textContent = "Solicitud enviada";
          var p1 = document.createElement("p"); p1.textContent = "Reservamos el " + res.cuando + " para usted. Su número de solicitud es " + res.numero + ".";
          var p2 = document.createElement("p"); p2.textContent = "Le confirmamos por correo a " + d.correo + ", con el enlace de Google Meet, a más tardar el " + res.limite +
            ". Si no ve nuestro correo, revise la carpeta de correo no deseado.";
          caja.appendChild(t); caja.appendChild(p1); caja.appendChild(p2);
          form.replaceWith(caja);
          caja.focus();
          return;
        }
        var err = res && res.error;
        aviso("error", MENSAJES[err] || "No se pudo enviar la solicitud. Escríbanos por WhatsApp al 942 927 868.");
        if (err === "ocupado") cargar();
      })
      .catch(function () { aviso("error", "No se pudo enviar la solicitud. Escríbanos por WhatsApp al 942 927 868."); })
      .finally(function () { btn.disabled = false; });
  });

  cargar();
})();
