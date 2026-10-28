/* HRTIC · tarifario público de hrticonsultores.com. GENERADO, no editar a mano: fuente/generar_tarifario_publico.cjs desde public/tarifario.js de PRAOLIR · VERSION 2026-10-28.1 · sha256 b11df922410fee3a60994857e6a5ddcb3caf3ed1c390007647035ce5562bfa0b */
(function (g) {
  "use strict";
  var TRAMOS = [
    [1, 20], [21, 50], [51, 100], [101, 200], [201, 500], [501, Infinity]
  ];
  var ETIQUETAS_TRAMO = ["1 a 20", "21 a 50", "51 a 100", "101 a 200", "201 a 500", "501 a más"];
  var MODULOS = [
    { k: "asistencia", n: "Control de asistencia", grupo: "Base", base: true, minimo: 290,
      d: "Marcación por celular, equipo fijo, QR y rostro; horas extra, turnos, permisos, tableros y reportes",
      p: [9.70, 5.50, 4.70, 4.20, 3.90, 3.60] },
    { k: "personas", n: "Administración de personas", grupo: "Personas", minimo: 0,
      d: "Legajo digital, contratos y adendas con firma electrónica, disciplina, solicitudes, políticas con acuse y documentos ISO",
      p: [6.30, 4.90, 5.70, 5.80, 5.40, 5.20] },
    { k: "planilla", n: "Planilla y boletas", grupo: "Planilla", minimo: 0,
      d: "Planilla, gratificación, CTS, liquidación, quinta, boletas firmadas y archivos de la PLAME",
      p: [10.00, 4.60, 4.60, 3.60, 3.30, 3.00] },
    { k: "seleccion", n: "Selección", grupo: "Talento", minimo: 76,
      d: "Vacantes con postulación desde el celular, filtros, prueba de conocimientos, evaluaciones psicolaborales automatizadas con informe al instante (no es un diagnóstico), entrevista por competencias y ranking",
      p: [5.70, 3.40, 2.00, 1.80, 1.70, 1.60] },
    { k: "induccion", n: "Inducción", grupo: "Talento", minimo: 28,
      d: "Plan de 12 actividades con base legal y verificación automática",
      p: [2.10, 1.40, 0.90, 0.60, 0.60, 0.60] },
    { k: "desempeno", n: "Desempeño (Nine Box)", grupo: "Talento", minimo: 76,
      d: "Objetivos, evaluación 90° a 360°, apuntes de incidentes, actas 1:1, Nine Box y calibración",
      p: [5.70, 3.40, 2.00, 1.80, 1.70, 1.60] },
    { k: "cumplimiento", n: "Cumplimiento laboral", grupo: "Integral", minimo: 133,
      d: "Autodiagnóstico de 37 obligaciones (relaciones laborales, SST, hostigamiento sexual, igualdad salarial, selección de personal y datos de postulantes) con la información de todos los módulos contratados, evidencia, semáforo, plan de acción y multa potencial SUNAFIL; modelo de aviso y autorización de datos para postulantes; políticas con acuse, investigaciones de hostigamiento con sus plazos, registros de SST y sondeo anual de hostigamiento sexual",
      p: [3.00, 1.70, 1.10, 1.00, 0.90, 0.90] },
    { k: "clima", n: "Clima y convivencia", grupo: "Integral", minimo: 132,
      d: "Encuesta de clima anónima con matriz de prioridades y plan de acción, encuesta de salida, buzón y canal de denuncias",
      p: [2.80, 1.70, 1.00, 0.90, 0.90, 0.70] },
    { k: "corporativo", n: "Corporativo", grupo: "Corporativo", minimo: 735,
      d: "Varias razones sociales con cupo único, API y webhooks, la plataforma dentro de su intranet (sus dominios) y auditoría anual de cumplimiento (desde 51 trabajadores)",
      p: [null, null, 2.20, 2.00, 1.80, 1.70] }
  ];
  var PAQUETES = [
    { k: "Asistencia", m: ["asistencia"], p: [9.70, 5.50, 4.70, 4.20, 3.90, 3.60], minimo: 290 },
    { k: "Personas", m: ["asistencia", "personas"], p: [16.00, 10.40, 10.40, 10.00, 9.30, 8.80], minimo: 290 },
    { k: "Planilla", m: ["asistencia", "personas", "planilla"], p: [26.00, 15.00, 15.00, 13.60, 12.60, 11.80], minimo: 290 },
    { k: "Talento", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno"], p: [39.50, 23.20, 19.90, 17.80, 16.60, 15.60], minimo: 470 },
    { k: "Integral", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima"], p: [45.30, 26.60, 22.00, 19.70, 18.40, 17.20], minimo: 735 },
    { k: "Corporativo", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima", "corporativo"], p: [null, null, 24.20, 21.70, 20.20, 18.90], minimo: 1470 }
  ];
  var MICRO = { minimo: 149, hasta: 10 };
  var IGV = 0.18;
  var IMPLEMENTACION = { monto: 490, anual: 0, dias_habiles: 15 };
  var PLAN_ARCHIVO = { general: [[50, 360], [200, 720], [Infinity, 1200]], sst: 180 };
  var MODALIDADES = [
    { k: "mensual", n: "Mensual, sin permanencia", descuento: 0, meses: 1, permanencia: 0, implementacion: true },
    { k: "perm6", n: "Mensual con contrato anual (12 meses)", descuento: 0.03, meses: 1, permanencia: 12, implementacion: false },
    { k: "semestral", n: "Semestral adelantado (6 meses) con contrato anual", descuento: 0.06, meses: 6, permanencia: 12, implementacion: false },
    { k: "anual", n: "Anual adelantado (12 meses) con contrato anual", descuento: 0.10, meses: 12, permanencia: 12, implementacion: false }
  ];
  var CUOTA_MIN = { anual: 178.17, anual_impl: 137.34, mes: 186.78, mes_impl: 138.77 };
  var PROMO_LANZAMIENTO = { vence: "2026-11-30", cupos: 20, permanencia: 12, sin_plataforma: 0.10, migracion: 0.15, piso: 0.85 };
  var INCLUIDO = [
    "Implementación en hasta 15 días hábiles desde que entregas la información completa: configuración, carga del personal e inducción de los usuarios",
    "Agente de cumplimiento: 30 consultas al mes (paquete adicional de 50 consultas por S/ 15 + IGV)",
    "Importador de datos de otros sistemas (Excel, CSV, T-Registro y PLAME)",
    "Boletas de otro sistema con firma y constancia (con Personas o Planilla)",
    "Documentos ISO e indicadores de capital humano (con Personas)"
  ];
  function r2(x) { return Math.round(x * 100 + 1e-9) / 100; }
  function tramoDe(n) { for (var i = 0; i < TRAMOS.length; i++) if (n >= TRAMOS[i][0] && n <= TRAMOS[i][1]) return i; return -1; }
  function modulo(k) { for (var i = 0; i < MODULOS.length; i++) if (MODULOS[i].k === k) return MODULOS[i]; return null; }
  function normalizar(lista) {
    var out = ["asistencia"];
    (lista || []).forEach(function (k) { if (modulo(k) && out.indexOf(k) < 0) out.push(k); });
    return MODULOS.map(function (m) { return m.k; }).filter(function (k) { return out.indexOf(k) >= 0; });
  }
  function tarifa(mods, t) {
    var s = 0; mods.forEach(function (k) { var v = modulo(k).p[t]; if (v != null) s += v; }); return r2(s);
  }
  function nombrePlan(mods) {
    for (var i = PAQUETES.length - 1; i >= 0; i--) {
      var p = PAQUETES[i]; if (p.m.length === mods.length && p.m.every(function (k) { return mods.indexOf(k) >= 0; })) return "Paquete " + p.k;
    }
    return "Plan a la medida";
  }
  function cotizar(modulos, n) {
    n = Math.floor(Number(n));
    if (!(n >= 1)) return { ok: false, error: "Indica el número de trabajadores (1 o más)." };
    var mods = normalizar(modulos), t = tramoDe(n), avisos = [];
    if (mods.indexOf("corporativo") >= 0 && n <= 50) { mods = mods.filter(function (k) { return k !== "corporativo"; }); avisos.push("Corporativo se contrata desde 51 trabajadores: no se incluyó."); }
    var porTrab = tarifa(mods, t), bruto = r2(porTrab * n), piso = 0, pisoDe = null;
    for (var i = 0; i < t; i++) {
      var v = r2(TRAMOS[i][1] * tarifa(mods, i)); if (v > piso) { piso = v; pisoDe = TRAMOS[i][1]; }
    }
    var micro = mods.length === 1 && n <= MICRO.hasta;
    var minimo = micro ? MICRO.minimo : mods.reduce(function (s, k) { return s + modulo(k).minimo; }, 0);
    var sub = Math.max(bruto, piso, minimo), regla = sub === bruto ? "tarifa" : (sub === piso && piso >= minimo ? "piso" : "minimo");
    var igv = r2(sub * IGV);
    return {
      ok: true, n: n, tramo: ETIQUETAS_TRAMO[t], modulos: mods, plan: nombrePlan(mods), por_trabajador: porTrab,
      detalle: mods.map(function (k) { var m = modulo(k); return { k: k, n: m.n, por_trabajador: m.p[t], subtotal: r2((m.p[t] || 0) * n) }; }),
      bruto: bruto, piso: piso, piso_de: pisoDe, minimo: minimo, micro: micro, regla: regla,
      subtotal: r2(sub), igv: igv, total: r2(sub + igv), efectivo_por_trabajador: r2(sub / n), avisos: avisos
    };
  }
  function modalidad(k) { for (var i = 0; i < MODALIDADES.length; i++) if (MODALIDADES[i].k === k) return MODALIDADES[i]; return null; }
  function propuesta(modulos, n, k, precio, promo) {
    var q = cotizar(modulos, n), m = modalidad(k || "mensual");
    if (!q.ok) return q;
    if (!m) return { ok: false, error: "Elige la forma de pago." };
    var especial0 = precio !== undefined && precio !== null && precio !== "";
    if (especial0) return { ok: false, error: "El precio especial se define en la propuesta de HRTIC." };
    var pr = promo && promo.tipo ? promocion(q.subtotal, m, promo, especial0) : null;
    if (pr && pr.error) return { ok: false, error: pr.error };
    if (pr) m = pr.modalidad;
    var d = descuentoAplicable(q.subtotal, m), lista = q.subtotal, calculada = r2(lista * (1 - d)), especial = especial0 ? r2(+precio) : null, avisos = q.avisos.slice();
    if (especial !== null && !(especial > 0)) return { ok: false, error: "El precio propuesto debe ser un monto mayor que cero." };
    var aplicada = false;
    if (pr) {
      if (pr.cuota < calculada) {
        aplicada = true; d = pr.descuento; calculada = pr.cuota;
        avisos.push("Promoción de lanzamiento: " + (pr.tipo === "sin_plataforma" ? "10 % de descuento" : pr.cuota > pr.objetivo
          ? "lo que paga hoy menos 15 % (" + soles(pr.objetivo) + ") queda debajo del piso del plan: se aplica el piso (" + soles(pr.piso) + ", 85 % de la cuota de lista)"
          : "15 % menos de lo que paga hoy (" + soles(pr.objetivo) + ")") + " en los primeros 12 meses; no se suma al descuento de la forma de pago.");
      } else if (d > 0) avisos.push("El descuento de la forma de pago (" + pct(d) + ") es igual o mayor que el de la promoción: se aplica ese (no se suman).");
      else avisos.push("Lo que el cliente paga hoy menos 15 % no baja de la cuota de lista: se cobra la de lista.");
    }
    var cuota = especial !== null ? especial : calculada;
    var imp = m.implementacion ? IMPLEMENTACION.monto : IMPLEMENTACION.anual, periodo = r2(cuota * m.meses);
    return { ok: true, cotizacion: q, modalidad: m.k, modalidad_nombre: m.n, descuento: d, descuento_tabla: m.descuento, permanencia: m.permanencia, meses_factura: m.meses,
      lista: lista, calculada: calculada, especial: especial, cuota: cuota, igv: r2(cuota * IGV), cuota_con_igv: r2(cuota * (1 + IGV)),
      factura_periodo: periodo, factura_periodo_con_igv: r2(periodo * (1 + IGV)), implementacion: imp, implementacion_con_igv: r2(imp * (1 + IGV)),
      primer_anio: r2(cuota * 12 + imp), ahorro_anual: r2((lista - cuota) * 12 + (IMPLEMENTACION.monto - imp)),
      avisos: avisos,
      promo: pr ? { tipo: pr.tipo, aplicada: aplicada, descuento: aplicada ? pr.descuento : 0, pago_actual: pr.pago_actual,
        cuota_objetivo: pr.objetivo, piso: pr.piso, permanencia: PROMO_LANZAMIENTO.permanencia, implementacion_sin_costo: pr.implementacion_sin_costo, vence: PROMO_LANZAMIENTO.vence,
        factura: pr.factura } : null };
  }
  function pct(x) { return (Math.round(x * 1000) / 10).toString().replace(".", ",") + " %"; }
  function fechaPe(f) { return String(f || "").split("-").reverse().join("/"); }
  function promocion(lista, m, promo, conEspecial) {
    var P = PROMO_LANZAMIENTO;
    if (promo.tipo !== "sin_plataforma" && promo.tipo !== "migracion") return { error: "Tipo de promoción no válido." };
    if (!(m.permanencia >= P.permanencia)) return { error: "La promoción de lanzamiento exige contrato anual: elige el pago mensual con contrato anual, el semestral o el anual adelantado (el mensual sin permanencia va sin descuento ni promoción)." };
    if (!promo.hoy || promo.hoy > P.vence) return { error: "La promoción de lanzamiento venció el " + fechaPe(P.vence) + ": la propuesta va sin promoción." };
    if (conEspecial) return { error: "La promoción de lanzamiento no se combina con un precio especial: usa una de las dos." };
    var pago = null, factura = "";
    if (promo.tipo === "migracion") {
      pago = r2(+String(promo.pago_actual || "").replace(",", "."));
      factura = String(promo.factura || "").trim().slice(0, 80);
      if (!(pago > 0)) return { error: "Indica lo que el cliente paga hoy al mes a su proveedor, sin IGV, según su última factura." };
      if (factura.length < 4) return { error: "Indica la serie y el número de la última factura del proveedor actual (sustento del 15 %)." };
    }
    var objetivo = promo.tipo === "sin_plataforma" ? r2(lista * (1 - P.sin_plataforma)) : Math.min(lista, r2(pago * (1 - P.migracion)));
    var piso = r2(lista * P.piso), cuota = Math.max(objetivo, piso), gratis = promo.cupo !== false;
    return { tipo: promo.tipo, pago_actual: pago, factura: factura, objetivo: objetivo, piso: piso, cuota: cuota, descuento: lista > 0 ? Math.round((1 - cuota / lista) * 10000) / 10000 : 0,
      implementacion_sin_costo: gratis || !m.implementacion,
      modalidad: { k: m.k, n: m.n, descuento: m.descuento, meses: m.meses,
        permanencia: Math.max(m.permanencia, P.permanencia), implementacion: m.implementacion && !gratis } };
  }
  function cuotaMinima(m) { return CUOTA_MIN[(m.k === "anual" || m.permanencia >= 12 ? "anual" : "mes") + (m.implementacion ? "_impl" : "")]; }
  function descuentoAplicable(lista, m) {
    var min = cuotaMinima(m);
    for (var d = m.descuento; d > 0.0001; d = Math.round((d - 0.005) * 1000) / 1000) if (r2(lista * (1 - d)) >= min) return d;
    return 0;
  }
  function planArchivo(n) {
    n = Math.max(1, Math.floor(Number(n)) || 1);
    for (var i = 0; i < PLAN_ARCHIVO.general.length; i++) if (n <= PLAN_ARCHIVO.general[i][0]) return PLAN_ARCHIVO.general[i][1];
    return PLAN_ARCHIVO.general[PLAN_ARCHIVO.general.length - 1][1];
  }
  function desde() { return { sin_igv: MICRO.minimo, con_igv: r2(MICRO.minimo * (1 + IGV)) }; }
  function soles(x) { return "S/ " + Number(x).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  g.HRTarifario = { VERSION: "2026-10-28.1", TRAMOS: TRAMOS, ETIQUETAS_TRAMO: ETIQUETAS_TRAMO, MODULOS: MODULOS, PAQUETES: PAQUETES,
    MICRO: MICRO, IGV: IGV, INCLUIDO: INCLUIDO, IMPLEMENTACION: IMPLEMENTACION, PLAN_ARCHIVO: PLAN_ARCHIVO, planArchivo: planArchivo, PROMO_LANZAMIENTO: PROMO_LANZAMIENTO,
    cotizar: cotizar, desde: desde, tramoDe: tramoDe, normalizar: normalizar, soles: soles,
    MODALIDADES: MODALIDADES, modalidad: modalidad, propuesta: propuesta, descuentoAplicable: descuentoAplicable };
})(typeof window !== "undefined" ? window : globalThis);
