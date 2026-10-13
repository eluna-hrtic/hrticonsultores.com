/* HRTIC · gestión de solicitudes de demostración (web v1.32, 13/10/2026). Regla de Ernesto: nadie obtiene una demo sin su aprobación.
   Abre con el enlace del correo (?t=token&a=aprobar|rechazar), muestra la solicitud y pide confirmar con un clic: así un antivirus
   que abra el enlace no decide por Ernesto. Envía 'demo_accion' al servicio de formularios v1.11. Página fuera de Google (noindex). */
(function () {
  "use strict";
  var caja = document.getElementById("g-caja");
  if (!caja) return;
  var endpoint = caja.getAttribute("data-endpoint") || "";
  var estado = document.getElementById("g-estado"), datos = document.getElementById("g-datos"), botones = document.getElementById("g-botones");
  var params = new URLSearchParams(location.search);
  var token = params.get("t") || "", sugerida = params.get("a") || "";
  var ESTADOS = { Agendada: "aprobada: el prospecto ya tiene la invitación", Rechazada: "rechazada", Vencida: "vencida sin respuesta",
                  Realizada: "realizada", "No asistió": "marcada como «No asistió»", Reprogramada: "reprogramada", Cancelada: "cancelada" };

  function pedir(accion) {
    return fetch(endpoint, { method: "POST", body: JSON.stringify({ formulario: "demo_accion", accion: accion, token: token }) })
      .then(function (r) { return r.json(); });
  }
  function fila(dt, dd) {
    if (!dd) return;
    var a = document.createElement("dt"), b = document.createElement("dd");
    a.textContent = dt; b.textContent = dd;
    datos.appendChild(a); datos.appendChild(b);
  }
  function mostrar(res) {
    datos.innerHTML = "";
    fila("N.º", res.numero); fila("Fecha y hora", res.cuando); fila("Empresa", res.empresa); fila("Contacto", res.nombre);
    fila("Rubro", res.rubro); fila("Trabajadores", res.trabajadores); fila("Qué quiere ver", res.interes);
    if (res.estado === "Solicitada") fila("Decidir hasta", res.limite);
    datos.hidden = false;
  }
  function error(res) {
    var e = res && res.error;
    if (e === "token") return "El enlace no es válido. Ábrelo desde el correo de la solicitud.";
    if (e === "vencida") return "Esta solicitud ya venció: el horario se libera y el prospecto recibe el correo para elegir otro.";
    return "No se pudo completar. Vuelve a intentarlo en un minuto o revisa la pestaña «Demos» de la hoja.";
  }

  if (!endpoint || !/^[0-9a-f]{64}$/.test(token)) { estado.textContent = "El enlace está incompleto. Ábrelo desde el correo de la solicitud."; return; }
  pedir("ver").then(function (res) {
    if (!res || !res.ok) { estado.textContent = error(res); return; }
    mostrar(res);
    if (res.estado !== "Solicitada") { estado.textContent = "Esta solicitud ya está " + (ESTADOS[res.estado] || res.estado.toLowerCase()) + "."; return; }
    estado.textContent = sugerida === "rechazar" ? "Confirma el rechazo con el botón." : "Confirma la aprobación con el botón.";
    botones.hidden = false;
    var b = botones.querySelector('[data-accion="' + (sugerida === "rechazar" ? "rechazar" : "aprobar") + '"]');
    if (b) b.focus();
    botones.addEventListener("click", function (ev) {
      var btn = ev.target.closest ? ev.target.closest("button[data-accion]") : null;
      if (!btn) return;
      var accion = btn.getAttribute("data-accion");
      botones.querySelectorAll("button").forEach(function (x) { x.disabled = true; });
      estado.textContent = accion === "aprobar" ? "Aprobando y creando el Google Meet…" : "Rechazando…";
      pedir(accion).then(function (r) {
        if (!r || !r.ok) { estado.textContent = error(r); return; }
        botones.hidden = true;
        mostrar(r);
        estado.textContent = r.estado === "Agendada"
          ? "Aprobada. Se creó el Google Meet y " + r.nombre + " recibió la invitación y la confirmación por correo."
          : "Rechazada. Se liberó el horario y el prospecto recibió un correo para elegir otro.";
      }).catch(function () {
        estado.textContent = "No se pudo completar. Vuelve a intentarlo en un minuto.";
        botones.querySelectorAll("button").forEach(function (x) { x.disabled = false; });
      });
    });
  }).catch(function () { estado.textContent = "No se pudo cargar la solicitud. Revisa tu conexión y vuelve a abrir el enlace."; });
})();
