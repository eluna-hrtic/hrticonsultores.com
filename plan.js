/* HRTIC · «Arma tu plan» (web v1.19, 06/10/2026). Usa tarifario.js, la misma fuente de precios de la plataforma (/admin).
   Todo se calcula en el navegador: no se envía ni se guarda nada. El botón de WhatsApp lleva el plan elegido. */
(function () {
  "use strict";
  var T = window.HRTarifario, f = document.getElementById("f-plan");
  if (!T || !f) return;
  var WSP = "51942927868", n = document.getElementById("f-plan-n"), caja = document.getElementById("f-plan-modulos");
  var $ = function (id) { return document.getElementById(id); };
  function soles(x) { return "S/\u00a0" + Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function conIgv(x) { return Math.round(x * (1 + T.IGV) * 100) / 100; }
  function origen() { try { var o = JSON.parse(sessionStorage.getItem("hrtic_origen") || "null"); return o && o.fuente && o.fuente !== "directo" ? " · " + o.fuente : ""; } catch (e) { return ""; } }

  // Opciones: una por módulo, con su precio por trabajador del tramo actual
  T.MODULOS.forEach(function (m) {
    var l = document.createElement("label"); l.className = "plan-modulo" + (m.base ? " fijo" : ""); l.setAttribute("data-k", m.k);
    var c = document.createElement("input"); c.type = "checkbox"; c.name = "m"; c.value = m.k; c.checked = !!m.base; c.disabled = !!m.base;
    var t = document.createElement("span"), nm = document.createElement("span"), d = document.createElement("span"), p = document.createElement("span");
    nm.className = "pm-nombre"; nm.textContent = m.n + (m.base ? " · siempre incluido" : "");
    d.className = "pm-desc"; d.textContent = m.d;
    p.className = "pm-precio"; t.appendChild(nm); t.appendChild(d);
    l.appendChild(c); l.appendChild(t); l.appendChild(p); caja.appendChild(l);
  });
  // Atajo: elegir un paquete de referencia desde la URL (?paquete=Planilla) o desde enlaces internos
  try {
    var q = new URLSearchParams(location.search), pk = (q.get("paquete") || "").toLowerCase(), nn = parseInt(q.get("trabajadores"), 10);
    T.PAQUETES.forEach(function (p) { if (p.k.toLowerCase() === pk) caja.querySelectorAll("input").forEach(function (c) { c.checked = p.m.indexOf(c.value) >= 0; }); });
    if (nn > 0) n.value = String(nn);
  } catch (e) { /* sin parámetros */ }

  function elegidos() { return Array.prototype.map.call(caja.querySelectorAll("input:checked"), function (c) { return c.value; }); }
  function calcular() {
    var num = Math.floor(Number(n.value)), t = T.tramoDe(num >= 1 ? num : 1);
    caja.querySelectorAll(".plan-modulo").forEach(function (l) {
      var m = T.MODULOS.filter(function (x) { return x.k === l.getAttribute("data-k"); })[0], v = m.p[t];
      l.querySelector(".pm-precio").textContent = v == null ? "desde 51" : soles(v);
      l.classList.toggle("no-disponible", v == null);
    });
    var r = T.cotizar(elegidos(), n.value), tb = $("s-plan-tabla").tBodies[0];
    tb.innerHTML = "";
    if (!r.ok) {
      $("s-plan-nombre").textContent = "Su plan"; $("s-plan-total").textContent = "—"; $("s-plan-desglose").textContent = r.error; $("s-plan-regla").textContent = "";
      return;
    }
    $("s-plan-nombre").textContent = r.plan + " · " + r.n + (r.n === 1 ? " trabajador" : " trabajadores");
    $("s-plan-total").textContent = soles(r.total);
    $("s-plan-desglose").textContent = "Al mes, precio total con IGV: " + soles(r.subtotal) + " + IGV " + soles(r.igv) + ". Equivale a " + soles(conIgv(r.efectivo_por_trabajador)) + " por trabajador con IGV.";
    r.detalle.forEach(function (x) {
      var tr = document.createElement("tr");
      [x.n, soles(x.por_trabajador), soles(x.subtotal)].forEach(function (v, i) { var td = document.createElement("td"); td.textContent = v; if (i) td.className = "num"; tr.appendChild(td); });
      tb.appendChild(tr);
    });
    var regla = r.regla === "minimo" ? (r.micro ? "Se aplica el monto mínimo de microempresa: " + soles(conIgv(r.minimo)) + " con IGV." : "Se aplica el monto mínimo de su plan: " + soles(conIgv(r.minimo)) + " con IGV.")
      : r.regla === "piso" ? "La factura no baja al crecer: paga lo mismo que con " + r.piso_de + " trabajadores." : "Montos de la tabla sin IGV; el total incluye IGV.";
    $("s-plan-regla").textContent = regla + (r.avisos.length ? " " + r.avisos.join(" ") : "");
    var texto = "Hola, vengo de la web de HRTIC (Arma tu plan" + origen() + "). Quiero una demostración de la plataforma. Mi plan: " +
      r.detalle.map(function (x) { return x.n; }).join(", ") + ", para " + r.n + (r.n === 1 ? " trabajador" : " trabajadores") + ". Precio de la web: " + soles(r.total) + " al mes con IGV.";
    $("s-plan-wsp").href = "https://wa.me/" + WSP + "?text=" + encodeURIComponent(texto);
  }
  f.addEventListener("input", calcular);
  f.addEventListener("change", calcular);
  f.addEventListener("submit", function (e) { e.preventDefault(); calcular(); });
  calcular();
})();
