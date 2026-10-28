/* HRTIC · sitio web v1.33 (carruseles con teclado) · v1.32 (cupos de la promoción) · v1.20 · comportamiento mínimo, sin dependencias (movimiento con prefers-reduced-motion desde el 30/09/2026) */
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

  // Video de capacitaciones: se descarga recién cuando entra en pantalla (ahorra ~2 MB a quien no llega hasta ahí)
  // y no arranca solo si la persona pidió reducir el movimiento.
  var quieto = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function cargarVideo(v) {
    v.querySelectorAll("source[data-src]").forEach(function (s) { s.src = s.getAttribute("data-src"); s.removeAttribute("data-src"); });
    v.load();
    if (quieto) { v.controls = true; } else { var p = v.play(); if (p && p.catch) p.catch(function () { v.controls = true; }); }
  }
  document.querySelectorAll("video[data-autoplay]").forEach(function (v) {
    if (!("IntersectionObserver" in window)) { cargarVideo(v); return; }
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cargarVideo(v); } });
    }, { rootMargin: "200px" });
    io.observe(v);
  });


  // v1.18 (30/09/2026): movimiento. Aparición al bajar solo para lo que está fuera de la primera pantalla (sin parpadeo ni
  // saltos de diseño) y manifiesto que se ilumina palabra por palabra. Con «reducir movimiento» todo queda quieto y visible.
  if (!quieto && "IntersectionObserver" in window) {
    var sel = ".seccion .intro, .seccion .tarjeta, .pasos li, .puerta, .galeria li, .criterio-ultima, .franja, .manifiesto-cuerpo p, .fundador, .convocatoria, .calendario-lista li, .entrega";
    var alto = window.innerHeight;
    var obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("visible"); obs.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll(sel).forEach(function (el) {
      if (el.closest(".portada") || el.closest(".calc") || el.classList.contains("aparece")) return;
      if (el.getBoundingClientRect().top < alto * 0.92) return;
      var i = Array.prototype.indexOf.call(el.parentElement.children, el);
      el.style.transitionDelay = Math.min(i, 5) * 70 + "ms";
      el.classList.add("aparece");
      el.addEventListener("transitionend", function fin(ev) {
        if (ev.propertyName !== "opacity") return;
        el.classList.remove("aparece", "visible"); el.style.transitionDelay = ""; el.removeEventListener("transitionend", fin);
      });
      obs.observe(el);
    });
  }
  var frase = document.querySelector("[data-manifiesto]");
  if (frase) {
    (function envolver(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (t) {
            if (!t) return;
            if (/^\s+$/.test(t)) { frag.appendChild(document.createTextNode(t)); return; }
            var w = document.createElement("span"); w.className = "mw"; w.textContent = t; frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) envolver(n);
      });
    })(frase);
    var palabras = frase.querySelectorAll(".mw");
    if (quieto) palabras.forEach(function (w) { w.classList.add("on"); });
    else {
      var pintar = function () {
        var r = frase.getBoundingClientRect(), vh = window.innerHeight;
        var avance = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.45)));
        var n = Math.round(avance * palabras.length);
        palabras.forEach(function (w, i) { w.classList.toggle("on", i < n); });
      };
      window.addEventListener("scroll", pintar, { passive: true });
      window.addEventListener("resize", pintar);
      pintar();
    }
  }


  // v1.20 (30/09/2026): experiencia en el celular. Carruseles que se asoman, detalle de las líneas y de las condiciones
  // plegado. Solo en pantallas angostas: en computadora no cambia nada. Sin JavaScript todo se ve completo.
  var angosta = window.matchMedia && window.matchMedia("(max-width: 640px)").matches;
  var mediana = window.matchMedia && window.matchMedia("(max-width: 720px)").matches;
  if (angosta) {
    document.querySelectorAll(".rejilla-siete, .rejilla:not(.guias-rejilla), .pasos, .testimonios, .galeria, .valores").forEach(function (c) {
      if (c.children.length < 2 || c.closest(".calc")) return;
      // v1.33 (13/10/2026): el carrusel se alcanza y se desplaza con el teclado (WCAG 2.1.1; axe «scrollable-region-focusable»). Las listas
      // conservan su rol; un div recibe el rol «region» para poder llevar nombre.
      if (!c.hasAttribute("tabindex")) {
        var sec = c.closest("section"), h2 = sec && sec.querySelector("h2");
        c.setAttribute("tabindex", "0");
        if (!/^(UL|OL)$/.test(c.tagName)) c.setAttribute("role", "region");
        if (!c.hasAttribute("aria-label")) c.setAttribute("aria-label", (h2 ? h2.textContent.trim() + " · " : "") + "desliza para ver más");
      }
      var aviso = document.createElement("p");
      aviso.className = "desliza"; aviso.setAttribute("aria-hidden", "true"); aviso.textContent = "Desliza para ver más";
      c.parentNode.insertBefore(aviso, c.nextSibling);
      c.addEventListener("scroll", function () { aviso.classList.add("visto"); }, { passive: true, once: true });
      if (!quieto && "IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            io.disconnect();
            // El imán del carrusel devolvería el empujón a 0: se suspende mientras dura.
            setTimeout(function () {
              c.style.scrollSnapType = "none";
              c.scrollBy({ left: 72, behavior: "smooth" });
              setTimeout(function () { c.scrollBy({ left: -72, behavior: "smooth" }); }, 700);
              setTimeout(function () { c.style.scrollSnapType = ""; }, 1500);
            }, 400);
          });
        }, { threshold: 0.6 });
        io.observe(c);
      }
    });
  }
  if (angosta) {
    // Criterio: cada novedad normativa muestra su título y estado; el resumen y la fuente se abren al tocar.
    document.querySelectorAll(".novedad").forEach(function (li, i) {
      if (location.hash === "#" + li.id) return;
      var cuerpo = li.querySelector(".novedad-cuerpo"), h = cuerpo && cuerpo.querySelector("h3");
      if (!h || !h.nextElementSibling) return;
      var det = document.createElement("div");
      det.className = "plegable"; det.id = "novedad-detalle-" + (i + 1);
      var n = h.nextElementSibling;
      while (n) { var sig = n.nextElementSibling; det.appendChild(n); n = sig; }
      cuerpo.appendChild(det);
      var b = document.createElement("button");
      b.type = "button"; b.className = "plegar-titulo"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", det.id);
      while (h.firstChild) b.appendChild(h.firstChild);
      h.appendChild(b);
      plegable(b, det, null);
    });
  }
  function plegable(boton, cuerpo, textos) {
    boton.addEventListener("click", function () {
      var abrir = boton.getAttribute("aria-expanded") !== "true";
      boton.setAttribute("aria-expanded", abrir ? "true" : "false");
      if (textos) boton.firstChild.textContent = abrir ? textos[1] : textos[0];
      if (abrir) {
        cuerpo.style.maxHeight = cuerpo.scrollHeight + "px";
        var fin = function (ev) { if (ev.propertyName === "max-height" && boton.getAttribute("aria-expanded") === "true") cuerpo.style.maxHeight = "none"; cuerpo.removeEventListener("transitionend", fin); };
        cuerpo.addEventListener("transitionend", fin);
        if (quieto) cuerpo.style.maxHeight = "none";
      } else {
        cuerpo.style.maxHeight = cuerpo.scrollHeight + "px";
        void cuerpo.offsetHeight;
        cuerpo.style.maxHeight = "0px";
      }
    });
  }
  if (mediana) {
    document.querySelectorAll(".linea").forEach(function (l, i) {
      var cab = l.querySelector(".cabeza"), det = cab && cab.nextElementSibling;
      if (!det || location.hash === "#" + l.id) return;
      det.id = det.id || "linea-detalle-" + (i + 1);
      det.classList.add("plegable");
      var b = document.createElement("button");
      b.type = "button"; b.className = "plegar"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", det.id);
      b.appendChild(document.createTextNode("Ver qué hacemos y entregables"));
      cab.appendChild(b);
      plegable(b, det, ["Ver qué hacemos y entregables", "Ocultar el detalle"]);
    });
    document.querySelectorAll(".legal").forEach(function (sec, k) {
      var titulos = Array.prototype.filter.call(sec.children, function (x) { return x.tagName === "H3"; });
      if (titulos.length < 3) return;
      titulos.forEach(function (h, j) {
        var cuerpo = document.createElement("div");
        cuerpo.className = "plegable"; cuerpo.id = "legal-" + k + "-" + j;
        var n = h.nextElementSibling;
        while (n && n.tagName !== "H3") { var sig = n.nextElementSibling; cuerpo.appendChild(n); n = sig; }
        h.parentNode.insertBefore(cuerpo, h.nextSibling);
        var b = document.createElement("button");
        b.type = "button"; b.className = "plegar-titulo"; b.setAttribute("aria-expanded", "false"); b.setAttribute("aria-controls", cuerpo.id);
        while (h.firstChild) b.appendChild(h.firstChild);
        h.appendChild(b);
        plegable(b, cuerpo, null);
      });
    });
  }

  var params = new URLSearchParams(location.search);
  var pagina = location.pathname.replace(/^.*\//, "").replace(/\.html$/, "");
  if (!pagina || pagina === "index") pagina = "inicio";

  // Origen de la visita: fuente (campaña utm o sitio de procedencia) y página de entrada de esta sesión.
  // No usa cookies; vive solo en esta pestaña y viaja con los formularios para saber qué canal trae consultas.
  var origen = (function () {
    var o = null;
    try { o = JSON.parse(sessionStorage.getItem("hrtic_origen") || "null"); } catch (e) { o = null; }
    if (o && o.fuente) return o;
    var ref = "";
    try {
      var u = document.referrer ? new URL(document.referrer) : null;
      if (u && u.hostname !== location.hostname) ref = u.hostname.replace(/^www\./, "");
    } catch (e) { ref = ""; }
    var conocidos = [[/(^|\.)(linkedin\.com|lnkd\.in)$/, "linkedin"], [/(^|\.)google\./, "google"],
      [/(^|\.)(facebook\.com|fb\.me)$/, "facebook"], [/(^|\.)instagram\.com$/, "instagram"],
      [/(^|\.)(whatsapp\.com|wa\.me)$/, "whatsapp"], [/(^|\.)bing\.com$/, "bing"], [/^t\.co$/, "x"]];
    var deRef = ref;
    conocidos.forEach(function (c) { if (c[0].test(ref)) deRef = c[1]; });
    var fuente = (params.get("utm_source") || deRef || "directo").toLowerCase().slice(0, 40);
    var campana = (params.get("utm_campaign") || "").slice(0, 60);
    // v1.48: también el medio (utm_medium) y el sitio de procedencia tal cual, para el campo oculto «origen» del formulario de contacto.
    o = { fuente: fuente + (campana ? " · " + campana : ""), entrada: pagina, medio: (params.get("utm_medium") || "").toLowerCase().slice(0, 30), ref: ref.slice(0, 60) };
    try { sessionStorage.setItem("hrtic_origen", JSON.stringify(o)); } catch (e) { /* sin almacenamiento: igual funciona */ }
    return o;
  })();

  // Medición sin cookies (GoatCounter): clics que acercan a una consulta.
  function evento(nombre, titulo) {
    try {
      if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: nombre, title: titulo, event: true });
    } catch (e) { /* si el bloqueador de anuncios lo impide, la web sigue igual */ }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a[href]") : null;
    if (!a) return;
    var h = a.getAttribute("href") || "";
    if (/^https:\/\/wa\.me\//.test(h)) evento("clic-whatsapp-" + pagina, "WhatsApp desde " + pagina);
    else if (/^mailto:/.test(h)) evento("clic-correo-" + pagina, "Correo desde " + pagina);
    else if (/consultas\.html/.test(h) && pagina !== "consultas") evento("clic-consulta-" + pagina, "Hacia consultas desde " + pagina);
    else if (/[?&]servicio=/.test(h)) evento("elige-" + (/personalizada/.test(h) ? "videollamada" : "escrita"), "Elige servicio en consultas");
  });

  // WhatsApp: el mensaje prellenado dice desde qué página (y qué fuente) escribe la persona.
  document.querySelectorAll('a[href^="https://wa.me/"]').forEach(function (a) {
    if (origen.fuente === "directo") return;
    try {
      var u = new URL(a.href);
      var t = u.searchParams.get("text") || "";
      u.searchParams.set("text", t.replace(/\)/, " · " + origen.fuente + ")"));
      a.href = u.toString();
    } catch (e) { /* se queda con el mensaje original */ }
  });

  // Fecha visible en la hoja de reclamación
  var hoy = new Date();
  var fechaTxt = hoy.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
  var lrFecha = document.getElementById("lr-fecha");
  if (lrFecha) lrFecha.textContent = fechaTxt;

  // Prellenado desde la URL (?tema=03, ?tipo=profesional)
  var tema = document.getElementById("c-tema");
  if (tema && params.get("tema")) tema.value = params.get("tema");
  if (params.get("tipo") === "profesional") {
    var r = document.querySelector('#form-contacto input[name="tipo"][value="profesional"]');
    if (r) r.checked = true;
    if (tema && !tema.value) tema.value = "P";
  }

  function datos(form) {
    var o = {};
    new FormData(form).forEach(function (v, k) { if (typeof v === "string") o[k] = v.trim(); }); // los archivos van aparte
    o.pagina = location.pathname;
    o.enviado = new Date().toISOString();
    o.fuente = origen.fuente;
    o.entrada = origen.entrada;
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

  // «preparar» (opcional) completa los datos antes de enviarlos, por ejemplo con el CV; si falla, muestra su propio aviso.
  function enviar(form, alTerminar, preparar) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validar(form)) { aviso(form, "error", "Revisa los campos obligatorios."); return; }
      var endpoint = form.getAttribute("data-endpoint");
      var btn = form.querySelector('button[type="submit"]');
      if (!endpoint) { alTerminar(null, datos(form)); return; }
      btn.disabled = true;
      aviso(form, "info", "Enviando…");
      Promise.resolve(preparar ? preparar(datos(form)) : datos(form))
        .then(function (d) {
          if (!d) return null;
          return fetch(endpoint, { method: "POST", body: JSON.stringify(d) })
            .then(function (r) { return r.json(); })
            .then(function (res) { alTerminar(res, null); });
        })
        .catch(function () { aviso(form, "error", "No se pudo enviar. Escríbenos a eluna@hrticonsultores.com."); })
        .finally(function () { btn.disabled = false; });
    });
  }

  // Formulario de contacto. v1.18: para empresas pide el número de trabajadores (ubica la banda de precio) y el sector;
  // viajan al inicio del mensaje, sin cambiar el servicio de formularios.
  var fc = document.getElementById("form-contacto");
  function perfilContacto() {
    if (!fc) return;
    var emp = !!fc.querySelector('input[name="tipo"][value="empresa"]:checked');
    fc.querySelectorAll(".solo-empresa").forEach(function (x) { x.hidden = !emp; });
    var t = fc.querySelector('select[name="trabajadores"]');
    if (t) { t.required = emp; if (!emp) t.removeAttribute("aria-invalid"); }
  }
  // Días desde hoy (en Lima) hasta una fecha «AAAA-MM-DD»; null si no es una fecha que exista.
  function diasHasta(iso) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return null;
    var f = Date.UTC(+m[1], +m[2] - 1, +m[3]), x = new Date(f);
    if (x.getUTCFullYear() !== +m[1] || x.getUTCMonth() !== +m[2] - 1 || x.getUTCDate() !== +m[3]) return null;
    return (f - Date.parse(new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10) + "T00:00:00Z")) / 86400000;
  }
  var revisarUrgencia = function () {};
  // v1.48: también la urgencia (inspección en curso y fecha límite). Viajan al inicio del mensaje, así llegan con el servicio de
  // formularios actual (v1.13), y además como campos propios para el servicio v1.14, que los guarda en columnas (el v1.13 los ignora).
  function prepararContacto(d) {
    var emp = d.tipo === "empresa", partes = [];
    if (emp && (d.trabajadores || d.sector)) partes.push("Trabajadores: " + (d.trabajadores || "-") + " · Sector: " + (d.sector || "-"));
    if (emp && d.inspeccion) partes.push("Inspección de SUNAFIL en curso: " + d.inspeccion);
    if (d.fecha_limite) partes.push("Fecha límite: " + d.fecha_limite.split("-").reverse().join("/"));
    if (partes.length) d.mensaje = partes.join(" · ") + "\n\n" + d.mensaje;
    if (!emp) { delete d.trabajadores; delete d.sector; delete d.inspeccion; }
    return d;
  }
  if (fc) { fc.addEventListener("change", perfilContacto); perfilContacto(); }
  if (fc) enviar(fc, function (res, local) {
    if (local) {
      // Sin servicio de formularios conectado: se abre el correo con el mensaje armado.
      var cuerpo = "Nombre: " + local.nombre + "\nCorreo: " + local.correo + "\nTeléfono: " + (local.telefono || "-") +
        "\nEmpresa: " + (local.empresa || "-") + "\nEscribe como: " + local.tipo + "\nTema: " + (local.tema || "-") + "\n\n" + prepararContacto(local).mensaje;
      location.href = "mailto:eluna@hrticonsultores.com?subject=" + encodeURIComponent("Consulta web · " + local.nombre) + "&body=" + encodeURIComponent(cuerpo);
      aviso(fc, "info", "Se abrió tu programa de correo con el mensaje listo para enviar.");
      return;
    }
    if (res && res.ok) { evento("envio-contacto", "Mensaje de contacto enviado"); fc.reset(); revisarUrgencia(); aviso(fc, "ok", "Recibimos tu mensaje. Te respondemos al correo que indicaste."); }
    else aviso(fc, "error", "No se pudo enviar. Escríbenos a eluna@hrticonsultores.com.");
  }, function (d) {
    // Ronda de corrección (M-7): la fecha límite debe existir y estar a no más de 2 años (el servicio v1.14 aplica la misma regla).
    var df = diasHasta(d.fecha_limite);
    if (d.fecha_limite && (df === null || Math.abs(df) > 731)) {
      var inF = document.getElementById("c-fecha");
      if (inF) { inF.setAttribute("aria-invalid", "true"); inF.focus(); }
      aviso(fc, "error", "Revisa la fecha límite: debe ser una fecha real, a no más de 2 años de hoy.");
      return null;
    }
    return prepararContacto(d);
  });

  // Consultas: precio total según el servicio (Ley N.º 29571, art. 4.1); el comprobante define el documento
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
        evento("envio-consulta-" + elegido("servicio", "escrita"), "Consulta registrada");
        fq.reset(); modo();
        aviso(fq, "ok", "Registramos tu consulta N.º " + res.numero + ". Te enviamos a tu correo el precio total (S/ " + res.total +
          ") y los datos de pago. Si no lo ves en unos minutos, revisa la carpeta de spam o correo no deseado y márcalo como «No es spam»: así te llegan también los siguientes correos de tu consulta.");
      } else if (res && res.error === "documento") aviso(fq, "error", "Revisa el documento: DNI de 8 dígitos, carné de extranjería o RUC de 11 dígitos, y la razón social si pides factura.");
      else aviso(fq, "error", "No se pudo registrar. Escríbenos a eluna@hrticonsultores.com.");
    });
  }

  // Empleos: postulación con CV en PDF (hasta 5 MB). El CV viaja en base64 y se guarda en una carpeta privada de Drive.
  var fp = document.getElementById("form-postulacion");
  if (fp) {
    var selConv = document.getElementById("p-convocatoria");
    var chkCompartir = document.getElementById("p-compartir");
    var txtCompartir = document.getElementById("p-compartir-texto");
    var casillaCompartir = document.getElementById("p-compartir-casilla");
    var chkBanco = document.getElementById("p-banco"), casillaBanco = document.getElementById("p-banco-casilla");
    var selArea = document.getElementById("p-area"), areaOpcional = document.getElementById("p-area-opcional");
    var selDoc = document.getElementById("p-tipo-doc"), inDoc = document.getElementById("p-doc"), ayudaDoc = document.getElementById("p-doc-ayuda");
    var inCv = document.getElementById("p-cv");
    var TEXTO_BANCO = txtCompartir.innerHTML;
    var TEXTO_CLIENTE = "Autorizo que HRTIC comparta mi CV con la empresa que contrata el proceso al que postulo. Es necesario para postular a esta convocatoria.";
    var tipoConv = function () { var o = selConv.options[selConv.selectedIndex]; return (o && o.getAttribute("data-tipo")) || "banco"; };
    // Ronda de corrección (decisiones 11, 13 y 14 de Ernesto; auditoría I-3 e I-4). El banco de talento tiene su propia casilla,
    // opcional, que se oculta si la persona eligió el banco (es lo que pide). El área de interés es obligatoria solo en el banco.
    // «Proponerme a empresas clientes» supone el banco: en una convocatoria propia de HRTIC aparece solo si marcó el banco.
    var ajustarCompartir = function () {
      var tipo = tipoConv(), banco = tipo === "banco";
      if (casillaBanco && chkBanco) { casillaBanco.hidden = banco; if (banco) chkBanco.checked = false; }
      if (selArea) {
        if (banco) selArea.setAttribute("required", ""); else { selArea.removeAttribute("required"); selArea.removeAttribute("aria-invalid"); }
        if (areaOpcional) areaOpcional.hidden = banco;
      }
      if (tipo === "cliente") { chkCompartir.setAttribute("required", ""); txtCompartir.textContent = TEXTO_CLIENTE; if (casillaCompartir) casillaCompartir.hidden = false; }
      else {
        chkCompartir.removeAttribute("required"); chkCompartir.removeAttribute("aria-invalid"); txtCompartir.innerHTML = TEXTO_BANCO;
        var ver = banco || !!(chkBanco && chkBanco.checked);
        if (casillaCompartir) casillaCompartir.hidden = !ver;
        if (!ver) chkCompartir.checked = false;
      }
    };
    if (chkBanco) chkBanco.addEventListener("change", ajustarCompartir);
    // Documento de identidad (decisión 14): las mismas reglas que el servicio de formularios v1.14. Se envía en mayúsculas, sin
    // espacios, puntos ni guiones. El formato del CPP y del PTP no se pudo confirmar en una fuente oficial: regla prudente.
    var DOCS = {
      dni: { re: /^\d{8}$/, min: 8, num: true, ayuda: "8 dígitos.", error: "El DNI tiene 8 dígitos, solo números." },
      ce: { re: /^[A-Z0-9]{9,12}$/, min: 9, num: false, ayuda: "De 9 a 12 letras o números, sin espacios ni guiones.", error: "Revisa el carné de extranjería: tiene de 9 a 12 letras o números." },
      pasaporte: { re: /^[A-Z0-9]{6,15}$/, min: 6, num: false, ayuda: "De 6 a 15 letras o números, como figura en el pasaporte.", error: "Copia el número del pasaporte tal como figura: de 6 a 15 letras o números." },
      cpp: { re: /^[A-Z0-9]{6,15}$/, min: 6, num: false, ayuda: "De 6 a 15 letras o números, como figura en el carné.", error: "Escribe el número del CPP tal como figura en el carné: de 6 a 15 letras o números." },
      ptp: { re: /^[A-Z0-9]{6,15}$/, min: 6, num: false, ayuda: "De 6 a 15 letras o números, como figura en el permiso.", error: "Usa el número del PTP tal como figura en el permiso: de 6 a 15 letras o números." }
    };
    var docElegido = function () { return DOCS[selDoc && selDoc.value] || DOCS.dni; };
    var normalizarDoc = function (v) { return String(v || "").toUpperCase().replace(/[\s.\-]/g, ""); };
    var ajustarDoc = function () {
      if (!selDoc || !inDoc) return;
      var t = docElegido();
      inDoc.setAttribute("minlength", String(t.min)); inDoc.setAttribute("maxlength", "20");
      inDoc.setAttribute("inputmode", t.num ? "numeric" : "text"); inDoc.removeAttribute("pattern"); inDoc.removeAttribute("aria-invalid");
      if (ayudaDoc) ayudaDoc.textContent = t.ayuda;
    };
    if (selDoc) selDoc.addEventListener("change", ajustarDoc);
    ajustarDoc();
    var elegirConv = function (id) {
      for (var i = 0; i < selConv.options.length; i++) if (selConv.options[i].value === id) { selConv.selectedIndex = i; break; }
      ajustarCompartir();
    };
    selConv.addEventListener("change", ajustarCompartir);
    document.querySelectorAll("a[data-convocatoria]").forEach(function (a) {
      a.addEventListener("click", function () { elegirConv(a.getAttribute("data-convocatoria")); evento("elige-convocatoria", "Elige convocatoria"); });
    });
    if (params.get("convocatoria")) elegirConv(params.get("convocatoria"));
    ajustarCompartir();

    var MAX_CV = 5 * 1024 * 1024;
    var leerCv = function (archivo) {
      return new Promise(function (ok, mal) {
        var lector = new FileReader();
        lector.onload = function () { ok(new Uint8Array(lector.result)); };
        lector.onerror = function () { mal(lector.error); };
        lector.readAsArrayBuffer(archivo);
      });
    };
    var aBase64 = function (bytes) {
      var partes = [], paso = 0x8000;
      for (var i = 0; i < bytes.length; i += paso) partes.push(String.fromCharCode.apply(null, bytes.subarray(i, i + paso)));
      return btoa(partes.join(""));
    };
    var errorCv = function (texto) { inCv.setAttribute("aria-invalid", "true"); inCv.focus(); aviso(fp, "error", texto); return null; };
    inCv.addEventListener("change", function () {
      var f = inCv.files && inCv.files[0];
      inCv.removeAttribute("aria-invalid");
      if (f && f.size > MAX_CV) errorCv("Tu CV pesa " + (f.size / 1048576).toFixed(1) + " MB. El máximo es 5 MB: guárdalo de nuevo en PDF con menos imágenes.");
    });

    enviar(fp, function (res, local) {
      if (local) { aviso(fp, "error", "La postulación en línea aún no está conectada. Envía tu CV a eluna@hrticonsultores.com."); return; }
      if (res && res.ok) {
        evento("envio-postulacion-" + tipoConv(), "Postulación enviada");
        fp.reset(); ajustarCompartir(); ajustarDoc();
        aviso(fp, "ok", "Recibimos tu postulación N.º " + res.numero + ". Te enviamos la confirmación a tu correo; si no la ves en unos minutos, revisa la carpeta de spam o correo no deseado.");
      } else if (res && res.error === "cv") errorCv("Revisa tu CV: debe ser un archivo PDF de hasta 5 MB.");
      else if (res && res.error === "compartir") { chkCompartir.focus(); aviso(fp, "error", "Para postular a esta convocatoria necesitamos tu autorización para compartir tu CV con la empresa."); }
      else if (res && (res.error === "documento" || res.error === "dni")) { if (inDoc) { inDoc.setAttribute("aria-invalid", "true"); inDoc.focus(); } aviso(fp, "error", docElegido().error); }
      else if (res && res.error === "limite") aviso(fp, "error", "Recibimos varias postulaciones desde este correo en la última hora. Inténtalo más tarde o escríbenos a eluna@hrticonsultores.com.");
      else aviso(fp, "error", "No se pudo enviar. Envía tu CV a eluna@hrticonsultores.com.");
    }, function (d) {
      // Ronda de corrección (decisión 14): tipo y número de documento, validado según el tipo.
      if (selDoc && inDoc) {
        var t = docElegido();
        d.tipo_documento = selDoc.value; d.documento = normalizarDoc(d.documento);
        if (!t.re.test(d.documento)) { inDoc.setAttribute("aria-invalid", "true"); inDoc.focus(); aviso(fp, "error", t.error); return null; }
      }
      var f = inCv.files && inCv.files[0];
      if (!f) return errorCv("Adjunta tu CV en PDF.");
      if (!/\.pdf$/i.test(f.name) && f.type !== "application/pdf") return errorCv("Tu CV debe estar en PDF. Guárdalo como PDF desde Word o Google Docs y vuelve a adjuntarlo.");
      if (f.size > MAX_CV) return errorCv("Tu CV pesa " + (f.size / 1048576).toFixed(1) + " MB. El máximo es 5 MB.");
      return leerCv(f).then(function (bytes) {
        // Firma de un PDF: «%PDF-» al inicio (un .pdf renombrado desde otro formato no la tiene).
        if (String.fromCharCode.apply(null, bytes.subarray(0, 5)) !== "%PDF-") return errorCv("El archivo no es un PDF válido. Vuelve a guardarlo como PDF.");
        var o = selConv.options[selConv.selectedIndex];
        d.tipo_convocatoria = tipoConv();
        d.convocatoria_titulo = o ? o.textContent.trim() : "";
        d.cvNombre = f.name.slice(0, 120);
        d.cvBase64 = aBase64(bytes);
        return d;
      });
    });
  }

  // Criterio HRTIC: filtro por tema, «Ver más» y copiar enlace. Sin JavaScript se ven todas las entregas.
  var rejilla = document.querySelector(".criterio-rejilla[data-por-pagina]");
  if (rejilla) {
    var porPagina = +rejilla.getAttribute("data-por-pagina") || 12;
    if (window.matchMedia && window.matchMedia("(max-width: 640px)").matches) porPagina = Math.min(porPagina, 6);   // v1.20: menos texto en el celular
    var mostrar = porPagina, filtro = "";
    var botonMas = document.getElementById("criterio-mas");
    var tarjetas = Array.prototype.slice.call(rejilla.querySelectorAll(".entrega"));
    // v1.11: buscador en el navegador, sin tildes ni mayúsculas, combinado con el filtro por tema.
    var plano = function (x) { return (x || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""); };
    var textos = tarjetas.map(function (t) { return plano(t.textContent); });
    var caja = document.getElementById("criterio-buscar"), q = document.getElementById("criterio-q");
    var conteo = document.getElementById("criterio-conteo"), vacio = document.getElementById("criterio-vacio"), busca = "";
    var pintar = function () {
      var palabras = busca.split(/\s+/).filter(Boolean);
      var visibles = tarjetas.filter(function (t, i) {
        return (!filtro || t.getAttribute("data-categoria") === filtro) && palabras.every(function (p) { return textos[i].indexOf(p) !== -1; });
      });
      tarjetas.forEach(function (t) { t.hidden = true; });
      visibles.forEach(function (t, i) { t.hidden = i >= mostrar; });
      if (botonMas) botonMas.hidden = visibles.length <= mostrar;
      if (conteo) conteo.textContent = palabras.length ? visibles.length + (visibles.length === 1 ? " entrega" : " entregas") : "";
      if (vacio) vacio.hidden = visibles.length > 0;
    };
    if (caja && q) {
      caja.hidden = false;
      var espera, contado = false;
      q.addEventListener("input", function () {
        clearTimeout(espera);
        espera = setTimeout(function () { busca = plano(q.value.trim()); mostrar = porPagina; pintar(); if (busca && !contado) { contado = true; evento("criterio-busqueda", "Búsqueda en Criterio"); } }, 180);
      });
    }
    document.querySelectorAll(".filtro").forEach(function (b) {
      b.addEventListener("click", function () {
        filtro = b.getAttribute("data-filtro"); mostrar = porPagina;
        document.querySelectorAll(".filtro").forEach(function (x) { x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        pintar(); evento("criterio-filtro", "Filtro de Criterio HRTIC");
      });
    });
    if (botonMas) botonMas.addEventListener("click", function () { mostrar += porPagina; pintar(); });
    pintar();
  }
  document.querySelectorAll(".copiar-enlace").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = b.getAttribute("data-url");
      var listo = function () { b.textContent = "Enlace copiado"; setTimeout(function () { b.textContent = "Copiar enlace"; }, 2500); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(listo, function () { prompt("Copia el enlace:", url); });
      else prompt("Copia el enlace:", url);
    });
  });
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest(".compartir a") : null;
    if (a) evento("criterio-compartir-" + (/linkedin/.test(a.href) ? "linkedin" : "whatsapp"), "Compartir entrega");
  });

  // Boletín de Criterio HRTIC (24/09/2026): suscripción con doble confirmación por correo.
  // FRAGMENTO para main.js: pegar DENTRO de la función principal, justo antes de «// Libro de Reclamaciones».
  // Usa enviar(), aviso() y evento() de main.js, igual que los demás formularios. Suelto (fuera de main.js) no hace nada.
  // Mide en GoatCounter «envio-suscripcion-criterio» y «envio-suscripcion-pie», con el mismo patrón que «envio-contacto».
  (function () {
    if (typeof enviar !== "function" || typeof aviso !== "function" || typeof evento !== "function") return;
    document.querySelectorAll("form.form-suscripcion").forEach(function (fs) {
      var ubicacion = fs.getAttribute("data-ubicacion") === "criterio" ? "criterio" : "pie";
      enviar(fs, function (res, local) {
        if (local) { aviso(fs, "error", "La suscripción aún no está conectada. Escríbenos a eluna@hrticonsultores.com."); return; }
        if (res && res.ok) {
          evento("envio-suscripcion-" + ubicacion, "Suscripción al boletín (por confirmar)");
          fs.reset();
          aviso(fs, "ok", "Falta un paso: revisa tu correo y abre el enlace para confirmar tu suscripción. Hasta que lo abras no te enviaremos el boletín. " +
            "Si no lo ves en unos minutos, revisa la carpeta de spam o correo no deseado. Si tu correo ya estaba suscrito, no necesitas hacer nada.");
        } else if (res && res.error === "limite") aviso(fs, "error", "Recibimos varias solicitudes con este correo. Inténtalo más tarde o escríbenos a eluna@hrticonsultores.com.");
        else if (res && res.error === "datos") aviso(fs, "error", "Revisa tu correo, elige tu perfil y marca la casilla de autorización.");
        else aviso(fs, "error", "No se pudo enviar. Escríbenos a eluna@hrticonsultores.com.");
      }, function (d) {
        d.ubicacion = ubicacion; // bloque de Criterio o pie de página: se guarda en «Formulario en»
        return d;
      });
    });
  })();

  // Confirmación y baja del boletín (v1.8.1): el enlace del correo abre suscripcion.html en el sitio,
  // que llama al servicio de formularios. Así funciona aunque el navegador tenga varias cuentas de Google abiertas.
  var sa = document.getElementById("sus-accion");
  if (sa) (function () {
    var q = new URLSearchParams(location.search), accion = q.get("accion") === "baja" ? "baja" : "confirmar";
    var token = (q.get("token") || "").trim(), titulo = document.getElementById("sus-titulo"), texto = document.getElementById("sus-texto");
    function mostrar(t, h) { titulo.textContent = t; texto.innerHTML = h; }
    if (!token) { mostrar("Enlace incompleto", "<p>Abre el enlace completo desde el correo que te enviamos. Si el problema sigue, escríbenos a <a href=\"mailto:eluna@hrticonsultores.com\">eluna@hrticonsultores.com</a>.</p>"); return; }
    fetch(sa.getAttribute("data-endpoint"), { method: "POST", body: JSON.stringify({ formulario: "suscripcion_accion", accion: accion, token: token }) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error("respuesta");
        mostrar(res.titulo, (res.prueba ? "<p class=\"aviso\">Página de prueba: no se registró ningún cambio.</p>" : "") + res.html);
        if (typeof evento === "function") evento("boletin-" + res.tipo, "Boletín: " + res.tipo);
      })
      .catch(function () {
        mostrar("No pudimos procesar el enlace", "<p>Vuelve a abrirlo en unos minutos. Si el problema sigue, escríbenos a <a href=\"mailto:eluna@hrticonsultores.com\">eluna@hrticonsultores.com</a> y lo resolvemos a mano.</p>");
      });
  })();

  // v1.32: promoción con cupos (parciales/cupos.html). Cuenta los días que faltan en hora de Lima (UTC-5, sin horario de
  // verano) y oculta el bloque al vencer, aunque el sitio no se vuelva a construir.
  document.querySelectorAll("[data-vence]").forEach(function (b) {
    var vence = Date.parse(b.getAttribute("data-vence") + "T00:00:00Z");
    var hoy = Date.parse(new Date(Date.now() - 5 * 3600000).toISOString().slice(0, 10) + "T00:00:00Z");
    if (isNaN(vence)) return;
    var dias = Math.round((vence - hoy) / 86400000);
    if (dias < 0) { b.hidden = true; return; }
    var caja = b.querySelector("[data-dias-caja]"), dd = b.querySelector("[data-dias]");
    if (!caja || !dd) return;
    dd.textContent = dias === 0 ? "Hoy es el último día" : dias === 1 ? "1 día" : dias + " días";
    caja.hidden = false;
  });

  // ---------- Web v1.48 (28/10/2026): portada con demostración, situaciones, recorrido y contacto que califica ----------

  // «Lo que preguntan las empresas en el Perú»: la caja escribe sola cada consulta y resalta en la lista dónde se responde.
  // Con «reducir movimiento» no escribe ni cambia sola (queda la primera consulta). Se pausa con el cursor o el foco encima, fuera de
  // pantalla y con la pestaña oculta. La caja es decorativa (aria-hidden): los lectores de pantalla y el teclado usan la lista.
  // Ronda de corrección (M-1, WCAG 2.2.2): botón «Pausar»/«Reanudar» y una sola vuelta por las consultas; al terminarla, la caja
  // queda quieta en la primera. El cursor deja de parpadear a los 5 segundos (CSS).
  var escribe = document.querySelector("[data-escribe]");
  if (escribe) (function () {
    var caja = escribe.querySelector("[data-escribe-caja]"), txt = escribe.querySelector("[data-escribe-texto]");
    var lista = escribe.querySelector(".buscador-lista"), boton = escribe.querySelector("[data-escribe-pausa]");
    var enlaces = Array.prototype.slice.call(escribe.querySelectorAll(".buscador-lista a"));
    if (!caja || !txt || !enlaces.length) return;
    escribe.addEventListener("click", function (e) {
      var a = e.target.closest ? e.target.closest("a") : null;
      if (a) evento("clic-preguntan-" + (enlaces.indexOf(a) + 1 || "caja"), "Consulta de la portada");
    });
    var i = 0, pos = 0, fase = "escribe", pausa = false, visible = true, reloj = null, detenido = false, escritas = 0;
    var frase = function () { return enlaces[i].querySelector(".q").textContent; };
    var marcar = function () {
      enlaces.forEach(function (a, k) { a.classList.toggle("activa", k === i); });
      caja.setAttribute("href", enlaces[i].getAttribute("href"));
      if (enlaces[i].target) { caja.target = enlaces[i].target; caja.rel = "noopener"; } else { caja.removeAttribute("target"); caja.removeAttribute("rel"); }
    };
    if (quieto) { marcar(); enlaces[0].classList.remove("activa"); return; }
    var parar = function () { if (reloj) { clearTimeout(reloj); reloj = null; } };
    var rotular = function () {
      if (!boton) return;
      var t = detenido ? "Reanudar" : "Pausar";
      boton.textContent = t; boton.setAttribute("aria-label", t + " la animación de las consultas");
    };
    var completa = function () { pos = frase().length; txt.textContent = frase(); fase = "lee"; };
    var paso = function () {
      reloj = null;
      if (pausa || detenido || !visible || document.hidden) return;
      var f = frase(), espera = 55;
      if (fase === "escribe") { pos += 1; txt.textContent = f.slice(0, pos); if (pos >= f.length) { fase = "lee"; espera = 2600; escritas += 1; } }
      else if (fase === "lee") {
        if (escritas >= enlaces.length) { i = 0; marcar(); completa(); detenido = true; rotular(); return; }   // una sola vuelta
        fase = "borra"; espera = 30;
      }
      else {
        pos -= 1; txt.textContent = f.slice(0, Math.max(pos, 0)); espera = 22;
        if (pos <= 0) { i = (i + 1) % enlaces.length; marcar(); fase = "escribe"; espera = 380; }
      }
      reloj = setTimeout(paso, espera);
    };
    var seguir = function () { if (!reloj && !pausa && !detenido && visible && !document.hidden) reloj = setTimeout(paso, 400); };
    // Al pasar el cursor o el foco por una consulta de la lista, la caja la muestra completa.
    enlaces.forEach(function (a, k) {
      var mostrar = function () { parar(); i = k; marcar(); completa(); };
      a.addEventListener("mouseenter", mostrar); a.addEventListener("focus", mostrar);
    });
    [caja, lista].forEach(function (el) {
      if (!el) return;
      el.addEventListener("mouseenter", function () { pausa = true; parar(); });
      el.addEventListener("mouseleave", function () { pausa = false; seguir(); });
    });
    if (lista) {
      lista.addEventListener("focusin", function () { pausa = true; parar(); });
      lista.addEventListener("focusout", function () { pausa = false; seguir(); });
    }
    if (boton) {
      boton.hidden = false;
      boton.addEventListener("click", function () {
        detenido = !detenido;
        if (detenido) parar(); else { if (escritas >= enlaces.length) escritas = 0; seguir(); }
        rotular();
      });
    }
    document.addEventListener("visibilitychange", function () { if (document.hidden) parar(); else seguir(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) seguir(); else parar(); }).observe(escribe);
    }
    txt.textContent = ""; marcar(); seguir();
  })();

  // «Elija su situación»: cada título pasa a ser un botón y se ve un caso a la vez (sin JavaScript se ven los cinco).
  // Los casos del recuadro «Nos buscan cuando…» abren su detalle y llevan hasta él.
  var sits = document.querySelector("[data-situaciones]");
  if (sits) (function () {
    var botones = [];
    Array.prototype.forEach.call(sits.querySelectorAll(".sit-titulo"), function (h) {
      var panel = h.nextElementSibling;
      if (!panel || !panel.id) return;
      var b = document.createElement("button");
      b.type = "button"; b.className = "sit-boton"; b.id = panel.id + "-boton"; b.setAttribute("aria-controls", panel.id);
      while (h.firstChild) b.appendChild(h.firstChild);
      h.appendChild(b);
      panel.setAttribute("role", "region"); panel.setAttribute("aria-labelledby", b.id);
      b.addEventListener("click", function () { abrir(panel.id); evento("situacion-" + panel.id.replace(/^sit-/, ""), "Situación de la portada"); });
      botones.push(b);
    });
    if (!botones.length) return;
    function abrir(id) {
      botones.forEach(function (b) {
        var si = b.getAttribute("aria-controls") === id;
        b.setAttribute("aria-expanded", si ? "true" : "false");
        document.getElementById(b.getAttribute("aria-controls")).hidden = !si;
      });
    }
    sits.setAttribute("data-listo", "");
    var desdeHash = function () { var x = location.hash && document.getElementById(location.hash.slice(1)); return x && x.classList.contains("sit-panel") ? x.id : ""; };
    abrir(desdeHash() || botones[0].getAttribute("aria-controls"));
    window.addEventListener("hashchange", function () { var id = desdeHash(); if (id) abrir(id); });
    document.querySelectorAll("a[data-situacion]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = (a.getAttribute("href") || "").replace(/^#/, ""), panel = document.getElementById(id);
        if (!panel) return;
        e.preventDefault();
        abrir(id);
        var b = document.getElementById(id + "-boton");
        var dosColumnas = window.matchMedia && window.matchMedia("(min-width: 900px)").matches;
        var destino = dosColumnas ? document.getElementById("situaciones") : b;
        if (destino) destino.scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "start" });
        if (b) b.focus({ preventScroll: true });
        if (history.replaceState) history.replaceState(null, "", "#" + id);
        evento("situacion-portada-" + id.replace(/^sit-/, ""), "Situación desde el recuadro de la portada");
      });
    });
  })();

  // «Un mes en su empresa»: el momento que cruza la línea de lectura se ilumina y la maqueta muestra su pantalla. Lo mueve el
  // desplazamiento de la persona, nunca un temporizador; con «reducir movimiento» el cambio es inmediato (sin fundido, por CSS).
  var rec = document.querySelector("[data-recorrido]");
  if (rec) (function () {
    var sec = rec.closest(".recorrido") || rec, maqueta = rec.querySelector(".recorrido-maqueta");
    var pasos = Array.prototype.slice.call(rec.querySelectorAll(".recorrido-paso"));
    var pantallas = Array.prototype.slice.call(rec.querySelectorAll(".pantalla"));
    if (!pasos.length || pantallas.length !== pasos.length) return;
    sec.setAttribute("data-listo", "");
    var actual = -1, pendiente = false, angostoMq = window.matchMedia ? window.matchMedia("(max-width: 900px)") : null;
    var activar = function (k) {
      if (k === actual) return;
      actual = k;
      pasos.forEach(function (p, j) { p.classList.toggle("activo", j === k); });
      pantallas.forEach(function (p, j) { p.classList.toggle("activa", j === k); });
    };
    // Ronda de corrección (I-2 y M-8): en el celular la maqueta queda fija arriba solo si debajo quedan al menos 250 px para leer
    // (360×740 y más altos). Con el celular en horizontal o en pantallas bajas (740×360, 844×390, 375×667, 320×568) va antes de los
    // momentos, sin quedar fija, y los momentos se leen completos, sin atenuar. 76 px = alto de la cabecera fija (styles.css).
    var estatico = false;
    var ajustarFija = function () {
      var e = false;
      if (angostoMq && angostoMq.matches && maqueta) {
        var vh = window.innerHeight, libre = vh - 76 - maqueta.offsetHeight;
        e = libre < 250;
      }
      if (e !== estatico) { estatico = e; sec.classList.toggle("recorrido-estatico", e); }
    };
    var medir = function () {
      pendiente = false;
      var vh = window.innerHeight, linea = vh * 0.5, k = 0;
      // En el celular, con la maqueta fija arriba, el momento se activa al entrar en el primer tercio del espacio libre debajo de ella.
      if (angostoMq && angostoMq.matches && maqueta && !estatico) { var piso = maqueta.getBoundingClientRect().bottom; linea = piso + Math.max(vh - piso, 0) * 0.35; }
      pasos.forEach(function (p, j) { if (p.getBoundingClientRect().top <= linea) k = j; });
      activar(k);
    };
    var pedir = function () { if (!pendiente) { pendiente = true; requestAnimationFrame(medir); } };
    window.addEventListener("scroll", pedir, { passive: true });
    window.addEventListener("resize", function () { ajustarFija(); pedir(); });
    ajustarFija();
    medir();
  })();

  // Contacto que califica: urgencia (inspección en curso, fecha límite) y origen oculto (campaña o red de llegada).
  // El origen sale de lo que ya guarda esta pestaña (utm o sitio de procedencia, y la primera página): no usa cookies.
  document.querySelectorAll('form input[type="hidden"][name="origen"]').forEach(function (h) {
    h.value = [origen.fuente, origen.medio ? "medio " + origen.medio : "", origen.ref && origen.fuente.indexOf(origen.ref) !== 0 ? "desde " + origen.ref : "",
      "entrada " + origen.entrada].filter(Boolean).join(" · ").slice(0, 200);
  });
  // Ronda de corrección: sin opción marcada de antemano en «¿Hay una inspección…?» (M-2) y con un aviso propio si la fecha ya pasó (M-3).
  var urgente = document.getElementById("c-urgente"), vencido = document.getElementById("c-vencido");
  if (fc && urgente) (function () {
    var fecha = document.getElementById("c-fecha");
    revisarUrgencia = function () {
      var emp = !!fc.querySelector('input[name="tipo"][value="empresa"]:checked');
      var insp = emp && !!fc.querySelector('input[name="inspeccion"][value="Sí"]:checked');
      var dias = fecha ? diasHasta(fecha.value) : null, ok = dias !== null && Math.abs(dias) <= 731;
      if (fecha) fecha.removeAttribute("aria-invalid");
      urgente.hidden = !(insp || (ok && dias >= 0 && dias <= 5));
      if (vencido) vencido.hidden = !(ok && dias < 0);
    };
    fc.addEventListener("change", revisarUrgencia); if (fecha) fecha.addEventListener("input", revisarUrgencia); revisarUrgencia();
  })();

  // Libro de Reclamaciones
  var fl = document.getElementById("form-libro");
  if (fl) enviar(fl, function (res, local) {
    if (local) { aviso(fl, "error", "El Libro de Reclamaciones virtual aún no está conectado. Escríbenos a eluna@hrticonsultores.com."); return; }
    if (res && res.ok) {
      document.getElementById("lr-numero").textContent = res.numero;
      fl.reset();
      aviso(fl, "ok", "Hoja N.º " + res.numero + " registrada el " + fechaTxt + ". Te enviamos una copia a tu correo. Puedes imprimir esta página como constancia.");
    } else aviso(fl, "error", "No se pudo registrar. Escríbenos a eluna@hrticonsultores.com.");
  });
})();
