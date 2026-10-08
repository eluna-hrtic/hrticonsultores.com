/* HRTIC · Tarifario «Arma tu plan» (v1.28, 08/10/2026: formas de pago con descuento y propuesta). Fuente única de precios: la usa /admin y se copia tal cual a la web
 * (hrticonsultores.com/assets/js/tarifario.js). Montos en S/ por trabajador al mes, SIN IGV.
 * Estructura del 06/10/2026 (v1.19): el precio de cada módulo es la diferencia entre un paquete y el anterior, así que Asistencia + los
 * módulos de un paquete = el precio exacto de ese paquete; Asistencia siempre incluida; mínimo proporcional en planes mixtos; la factura
 * nunca baja al pasar de tramo.
 * Decisión de Ernesto del 08/10/2026 (opción B): precio por trabajador 20 % debajo de la mediana del mercado (antes 35 %: cada módulo
 * × 0,80/0,65, redondeado a 0,10; Personas de 51 a 100 queda en 5,70 para que el paquete no suba al pasar de 21-50 a 51-100); mínimo
 * mensual S/ 290 (antes 170) y microempresa S/ 149 (antes 99, solo Asistencia y hasta 10 trabajadores). Implementación S/ 490 + IGV
 * (pago único), sin costo con pago anual adelantado. Plan Archivo general por tramo al año y Plan Archivo SST S/ 180 al año. */
(function (g) {
  "use strict";
  var TRAMOS = [ // [desde, hasta]
    [1, 20], [21, 50], [51, 100], [101, 200], [201, 500], [501, Infinity]
  ];
  var ETIQUETAS_TRAMO = ["1 a 20", "21 a 50", "51 a 100", "101 a 200", "201 a 500", "501 a más"];
  // Precio por trabajador al mes en cada tramo (null = no disponible en ese tramo). Mínimo: lo que suma a la factura mínima.
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
      d: "Vacantes con postulación desde el celular, filtros, pruebas, entrevista por competencias y ranking",
      p: [5.70, 3.40, 2.00, 1.80, 1.70, 1.60] },
    { k: "induccion", n: "Inducción", grupo: "Talento", minimo: 28,
      d: "Plan de 12 actividades con base legal y verificación automática",
      p: [2.10, 1.40, 0.90, 0.60, 0.60, 0.60] },
    { k: "desempeno", n: "Desempeño (Nine Box)", grupo: "Talento", minimo: 76,
      d: "Objetivos, evaluación 90° a 360°, apuntes de incidentes, actas 1:1, Nine Box y calibración",
      p: [5.70, 3.40, 2.00, 1.80, 1.70, 1.60] },
    { k: "cumplimiento", n: "Cumplimiento laboral", grupo: "Integral", minimo: 133,
      d: "Autodiagnóstico de 17 obligaciones con evidencia, semáforo, plan de acción y multa potencial SUNAFIL",
      p: [3.00, 1.70, 1.10, 1.00, 0.90, 0.90] },
    { k: "clima", n: "Clima y convivencia", grupo: "Integral", minimo: 132,
      d: "Encuesta anónima con eNPS, evaluación anual de hostigamiento, buzón y canal de denuncias",
      p: [2.80, 1.70, 1.00, 0.90, 0.90, 0.70] },
    { k: "corporativo", n: "Corporativo", grupo: "Corporativo", minimo: 735,
      d: "Varias razones sociales con cupo único, API y webhooks, marca blanca y auditoría anual de cumplimiento (desde 51 trabajadores)",
      p: [null, null, 2.20, 2.00, 1.80, 1.70] }
  ];
  // Paquetes de referencia (estructura del 03/10/2026, precios del 08/10/2026): sirven para nombrar el plan y para las pruebas.
  var PAQUETES = [
    { k: "Asistencia", m: ["asistencia"], p: [9.70, 5.50, 4.70, 4.20, 3.90, 3.60], minimo: 290 },
    { k: "Personas", m: ["asistencia", "personas"], p: [16.00, 10.40, 10.40, 10.00, 9.30, 8.80], minimo: 290 },
    { k: "Planilla", m: ["asistencia", "personas", "planilla"], p: [26.00, 15.00, 15.00, 13.60, 12.60, 11.80], minimo: 290 },
    { k: "Talento", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno"], p: [39.50, 23.20, 19.90, 17.80, 16.60, 15.60], minimo: 470 },
    { k: "Integral", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima"], p: [45.30, 26.60, 22.00, 19.70, 18.40, 17.20], minimo: 735 },
    { k: "Corporativo", m: ["asistencia", "personas", "planilla", "seleccion", "induccion", "desempeno", "cumplimiento", "clima", "corporativo"], p: [null, null, 24.20, 21.70, 20.20, 18.90], minimo: 1470 }
  ];
  var MICRO = { minimo: 149, hasta: 10 }; // solo Asistencia y hasta 10 trabajadores
  var IGV = 0.18;
  // Implementación (pago único, S/ sin IGV): sin costo si el cliente paga el año adelantado.
  var IMPLEMENTACION = { monto: 490, anual: 0 };
  // Plan Archivo (S/ al año, sin IGV) al terminar el servicio: general = consulta de solo lectura hasta 5 años después del último registro
  // (D.S. 004-2006-TR, art. 6; D.S. 001-98-TR, art. 21), por tramo de trabajadores; SST = custodia de los registros de SST hasta su último
  // plazo (D.S. 005-2012-TR, art. 35: 10 o 20 años).
  var PLAN_ARCHIVO = { general: [[50, 360], [200, 720], [Infinity, 1200]], sst: 180 };
  // v1.28 · Formas de pago (08/10/2026): descuento sobre la cuota mensual de lista, cada cuánto se factura, permanencia mínima (meses) y si la
  // implementación se cobra. Son excluyentes: el cliente elige una. Punto de equilibrio frente al pago mensual (plan de S/ 290, costos de COSTOS):
  // permanencia de 6 meses ~8,9 %, semestral adelantado ~6,1 %, anual adelantado con implementación sin costo ~0 % (planes chicos) a ~13 %
  // (S/ 2 200 al mes). El descuento de la tabla se reduce solo si el margen del primer año bajaría de MARGEN_MIN (descuentoAplicable).
  var MODALIDADES = [
    { k: "mensual", n: "Mensual, sin permanencia", descuento: 0, meses: 1, permanencia: 0, implementacion: true },
    { k: "perm6", n: "Mensual con permanencia de 6 meses", descuento: 0.03, meses: 1, permanencia: 6, implementacion: true },
    { k: "semestral", n: "Semestral adelantado (6 meses)", descuento: 0.06, meses: 6, permanencia: 6, implementacion: true },
    { k: "anual", n: "Anual adelantado (12 meses)", descuento: 0.10, meses: 12, permanencia: 12, implementacion: false }
  ];
  // Costos variables por cliente para estimar el margen de contribución del primer año (Suposición de HRTIC, 08/10/2026; ajustables):
  // atención y soporte S/ 40 al mes, IA del agente S/ 4 al mes, cobranza 1 % de lo facturado, implementación S/ 200 (horas de HRTIC) y
  // baja mensual esperada de 3 % sin permanencia. Los costos fijos (Google Workspace, plan de IA, Cloudflare) no entran: no cambian por cliente.
  var COSTOS = { atencion_mes: 40, ia_mes: 4, cobranza: 0.01, implementacion: 200, baja_mes: 0.03 };
  var MARGEN_MIN = 0.65;   // margen de contribución mínimo del primer año para aceptar un precio especial por debajo del tarifario
  var INCLUIDO = [
    "Acompañamiento de HRTIC en la configuración y la carga del personal",
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
  function tarifa(mods, t) { // S/ por trabajador en el tramo t con esos módulos (los no disponibles en el tramo no suman)
    var s = 0; mods.forEach(function (k) { var v = modulo(k).p[t]; if (v != null) s += v; }); return r2(s);
  }
  function nombrePlan(mods) {
    for (var i = PAQUETES.length - 1; i >= 0; i--) {
      var p = PAQUETES[i]; if (p.m.length === mods.length && p.m.every(function (k) { return mods.indexOf(k) >= 0; })) return "Paquete " + p.k;
    }
    return "Plan a la medida";
  }

  /** Cotización mensual. modulos: claves (Asistencia se agrega siempre); n: trabajadores activos. */
  function cotizar(modulos, n) {
    n = Math.floor(Number(n));
    if (!(n >= 1)) return { ok: false, error: "Indica el número de trabajadores (1 o más)." };
    var mods = normalizar(modulos), t = tramoDe(n), avisos = [];
    if (mods.indexOf("corporativo") >= 0 && n <= 50) { mods = mods.filter(function (k) { return k !== "corporativo"; }); avisos.push("Corporativo se contrata desde 51 trabajadores: no se incluyó."); }
    var porTrab = tarifa(mods, t), bruto = r2(porTrab * n), piso = 0, pisoDe = null;
    for (var i = 0; i < t; i++) { // la factura nunca baja al pasar de tramo: piso = tramo anterior completo
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
  /** Meses que se espera cobrar en el primer año con esa forma de pago (sin permanencia, el cliente puede irse cualquier mes). */
  function mesesEsperados(m) {
    var q = 1 - COSTOS.baja_mes, s = 0, k;
    if (m.k === "anual") return 12;
    if (m.k === "semestral") return 6 + 6 * Math.pow(q, 6);
    if (m.k === "perm6") { s = 6; for (k = 1; k <= 6; k++) s += Math.pow(q, k); return s; }
    for (k = 0; k < 12; k++) s += Math.pow(q, k); return s;
  }
  /** Margen de contribución esperado del primer año para una cuota mensual (sin IGV) y una forma de pago. */
  function margen(cuota, m) {
    var e = mesesEsperados(m), imp = m.implementacion ? IMPLEMENTACION.monto : IMPLEMENTACION.anual;
    var ingreso = cuota * e + imp, costo = (COSTOS.atencion_mes + COSTOS.ia_mes) * e + COSTOS.cobranza * ingreso + COSTOS.implementacion;
    return { meses: Math.round(e * 100) / 100, ingreso: r2(ingreso), costo: r2(costo), contribucion: r2(ingreso - costo), pct: ingreso > 0 ? Math.round((ingreso - costo) / ingreso * 1000) / 10 : 0 };
  }
  /**
   * Propuesta (v1.28): cotización de lista + forma de pago (descuento, factura por período, permanencia e implementación) y, si HRTIC
   * propone otro precio, la cuota especial. Un precio mayor que el de lista siempre se admite; uno menor solo si el margen del primer año
   * no baja de MARGEN_MIN.
   */
  function propuesta(modulos, n, k, precio) {
    var q = cotizar(modulos, n), m = modalidad(k || "mensual");
    if (!q.ok) return q;
    if (!m) return { ok: false, error: "Elige la forma de pago." };
    var d = descuentoAplicable(q.subtotal, m), lista = q.subtotal, calculada = r2(lista * (1 - d)), especial = precio !== undefined && precio !== null && precio !== "" ? r2(+precio) : null, avisos = q.avisos.slice();
    if (especial !== null && !(especial > 0)) return { ok: false, error: "El precio propuesto debe ser un monto mayor que cero." };
    var cuota = especial !== null ? especial : calculada, mg = margen(cuota, m), base = margen(lista, modalidad("mensual"));
    if (especial !== null && especial < calculada && mg.pct / 100 < MARGEN_MIN) {
      return { ok: false, error: "Ese precio deja un margen del primer año de " + mg.pct + " % (mínimo " + Math.round(MARGEN_MIN * 100) + " %). Propón " + soles(minimoConMargen(m)) + " o más, o usa otra forma de pago." };
    }
    if (especial !== null && especial < calculada) avisos.push("Precio especial por debajo del tarifario (" + soles(calculada) + "): queda en la propuesta y en el contrato.");
    if (d < m.descuento) avisos.push(d ? "Descuento reducido a " + pct(d) + " (de " + pct(m.descuento) + ") para mantener el margen mínimo del primer año (" + Math.round(MARGEN_MIN * 100) + " %)."
      : "Sin descuento por pago " + (m.k === "anual" ? "anual" : "adelantado") + " en este plan: el margen del primer año quedaría bajo el mínimo (" + Math.round(MARGEN_MIN * 100) + " %)" + (m.implementacion ? "." : "; la implementación sin costo ya es el beneficio."));
    var imp = m.implementacion ? IMPLEMENTACION.monto : IMPLEMENTACION.anual, periodo = r2(cuota * m.meses);
    return { ok: true, cotizacion: q, modalidad: m.k, modalidad_nombre: m.n, descuento: d, descuento_tabla: m.descuento, permanencia: m.permanencia, meses_factura: m.meses,
      lista: lista, calculada: calculada, especial: especial, cuota: cuota, igv: r2(cuota * IGV), cuota_con_igv: r2(cuota * (1 + IGV)),
      factura_periodo: periodo, factura_periodo_con_igv: r2(periodo * (1 + IGV)), implementacion: imp, implementacion_con_igv: r2(imp * (1 + IGV)),
      primer_anio: r2(cuota * 12 + imp), ahorro_anual: r2((lista - cuota) * 12 + (IMPLEMENTACION.monto - imp)), margen: mg,
      margen_vs_mensual: r2(mg.contribucion - base.contribucion), avisos: avisos };
  }
  function pct(x) { return (Math.round(x * 1000) / 10).toString().replace(".", ",") + " %"; }
  /** Descuento de la forma de pago, reducido (de 0,5 en 0,5 puntos) si con el de la tabla el margen del primer año baja de MARGEN_MIN. */
  function descuentoAplicable(lista, m) {
    for (var d = m.descuento; d > 0.0001; d = Math.round((d - 0.005) * 1000) / 1000) if (margen(r2(lista * (1 - d)), m).pct / 100 >= MARGEN_MIN) return d;
    return 0;
  }
  /** Cuota mensual más baja que mantiene el margen mínimo del primer año con esa forma de pago. */
  function minimoConMargen(m) {
    var e = mesesEsperados(m), imp = m.implementacion ? IMPLEMENTACION.monto : IMPLEMENTACION.anual;
    // (c·e + imp)(1 − cobranza) − fijos·e − impl = MARGEN_MIN (c·e + imp)  →  c = (fijos·e + impl − imp(1 − cobranza − MARGEN_MIN)) / (e (1 − cobranza − MARGEN_MIN))
    var f = 1 - COSTOS.cobranza - MARGEN_MIN;
    return Math.ceil(((COSTOS.atencion_mes + COSTOS.ia_mes) * e + COSTOS.implementacion - imp * f) / (e * f) * 10) / 10;
  }
  /** Plan Archivo general (S/ al año, sin IGV) según el número de trabajadores al terminar el servicio. */
  function planArchivo(n) {
    n = Math.max(1, Math.floor(Number(n)) || 1);
    for (var i = 0; i < PLAN_ARCHIVO.general.length; i++) if (n <= PLAN_ARCHIVO.general[i][0]) return PLAN_ARCHIVO.general[i][1];
    return PLAN_ARCHIVO.general[PLAN_ARCHIVO.general.length - 1][1];
  }
  /** Precio «desde» (con y sin IGV) para la web. */
  function desde() { return { sin_igv: MICRO.minimo, con_igv: r2(MICRO.minimo * (1 + IGV)) }; }
  function soles(x) { return "S/ " + Number(x).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  g.HRTarifario = { VERSION: "2026-10-08.2", TRAMOS: TRAMOS, ETIQUETAS_TRAMO: ETIQUETAS_TRAMO, MODULOS: MODULOS, PAQUETES: PAQUETES,
    MICRO: MICRO, IGV: IGV, INCLUIDO: INCLUIDO, IMPLEMENTACION: IMPLEMENTACION, PLAN_ARCHIVO: PLAN_ARCHIVO, planArchivo: planArchivo,
    cotizar: cotizar, desde: desde, tramoDe: tramoDe, normalizar: normalizar, soles: soles,
    MODALIDADES: MODALIDADES, COSTOS: COSTOS, MARGEN_MIN: MARGEN_MIN, modalidad: modalidad, margen: margen, propuesta: propuesta, minimoConMargen: minimoConMargen, descuentoAplicable: descuentoAplicable };
})(typeof window !== "undefined" ? window : globalThis);
