/* HRTIC · calculadora de beneficios sociales · v1.3 · 24/09/2026 (indemnización MYPE solo por dozavos; costo laboral del empleador;
   v1.3: tope de 90 remuneraciones diarias de la CTS de la pequeña empresa y textos por régimen en el costo laboral;
   v1.3.1: el Seguro Vida Ley es obligatorio también en la microempresa, D.S. 009-2020-TR, art. 2;
   v1.4: plazo fijo resuelto antes de tiempo en la MYPE: se muestran los dos cálculos, art. 56 MYPE y art. 76 LPCL;
   v1.5 (30/09/2026): la RMV y la asignación familiar dependen de la fecha: S/ 1,230 desde el 01/10/2026, D.S. N.º 015-2026-TR;
   v1.6 (30/09/2026): cálculo por beneficio (gratificación, CTS, vacaciones, indemnización), variables mes por mes y opción «gano la RMV»;
   la gratificación trunca toma la remuneración del mes anterior al cese, D.S. N.º 005-2002-TR, art. 5)
   Cálculo orientativo de la liquidación al cese. Normas: D.S. 001-97-TR (CTS), Ley 27735 y D.S. 005-2002-TR
   (gratificaciones), Ley 30334 (bonificación extraordinaria), D. Leg. 713 y D.S. 012-92-TR (vacaciones),
   D.S. 003-97-TR, arts. 10, 38 y 76 (indemnización), TUO D.S. 013-2013-PRODUCE (micro y pequeña empresa).
   Todo se calcula en el navegador: no se envía ningún dato. */
(function () {
  "use strict";

  /* Remuneración mínima vital según la fecha (v1.5, 30/09/2026). La asignación familiar es el 10 % de la RMV vigente
     (Ley N.º 25129, art. 1). Verificado en El Peruano:
     - S/ 930 desde el 01/04/2018: D.S. N.º 004-2018-TR.
     - S/ 1,025 desde el 01/05/2022: D.S. N.º 003-2022-TR.
     - S/ 1,130 desde el 01/01/2025: D.S. N.º 006-2024-TR.
     - S/ 1,230 desde el 01/10/2026: D.S. N.º 015-2026-TR (edición extraordinaria del 28/09/2026). El mismo decreto anuncia un
       segundo tramo de S/ 70 (hasta S/ 1,300) que se fijará por otro decreto supremo en el primer semestre de 2027:
       agregar aquí la fila cuando se publique. */
  var RMV_TABLA = [
    { desde: "2018-04-01", monto: 930, norma: "D.S. N.º 004-2018-TR" },
    { desde: "2022-05-01", monto: 1025, norma: "D.S. N.º 003-2022-TR" },
    { desde: "2025-01-01", monto: 1130, norma: "D.S. N.º 006-2024-TR" },
    { desde: "2026-10-01", monto: 1230, norma: "D.S. N.º 015-2026-TR" }
  ];
  function rmvEn(f) {
    var v = RMV_TABLA[0];
    for (var i = 0; i < RMV_TABLA.length; i++) if (fecha(RMV_TABLA[i].desde) <= f) v = RMV_TABLA[i];
    return { monto: v.monto, norma: v.norma, desde: v.desde, anterior: f < fecha(RMV_TABLA[0].desde) };
  }
  /* Fecha de hoy en Lima (UTC-5, sin horario de verano), como fecha UTC a medianoche. */
  function hoyLima() {
    var t = new Date(Date.now() - 5 * 3600000);
    return new Date(Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate()));
  }

  // ---------- fechas (en UTC para no depender de la zona horaria del navegador) ----------
  function fecha(txt) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(txt || "");
    return m ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])) : null;
  }
  function dia(y, mes, d) { return new Date(Date.UTC(y, mes, d)); }
  function masDias(f, n) { return new Date(f.getTime() + n * 86400000); }
  function finDeMes(y, mes) { return dia(y, mes + 1, 0).getUTCDate(); }
  function masMeses(f, n) {
    var y = f.getUTCFullYear(), mes = f.getUTCMonth() + n, d = f.getUTCDate();
    var yy = y + Math.floor(mes / 12), mm = ((mes % 12) + 12) % 12;
    return dia(yy, mm, Math.min(d, finDeMes(yy, mm)));
  }
  function difDias(a, b) { return Math.round((b.getTime() - a.getTime()) / 86400000); }

  /* Tiempo entre dos fechas, ambas incluidas: meses completos y días sueltos. */
  function tiempo(desde, hasta) {
    if (hasta < desde) return { meses: 0, dias: 0 };
    var m = 0;
    while (masDias(masMeses(desde, m + 1), -1) <= hasta) m++;
    var dias = difDias(masMeses(desde, m), hasta) + 1;
    return { meses: m, dias: Math.max(0, dias) };
  }

  /* Meses calendario completos laborados entre dos fechas (gratificación: no se cuentan los días). */
  function mesesCalendario(desde, hasta) {
    var n = 0, y = desde.getUTCFullYear(), mes = desde.getUTCMonth();
    for (var k = 0; k < 13; k++) {
      var ini = dia(y, mes, 1), fin = dia(y, mes, finDeMes(y, mes));
      if (ini > hasta) break;
      if (ini >= desde && fin <= hasta) n++;
      mes++; if (mes === 12) { mes = 0; y++; }
    }
    return n;
  }

  function r2(x) { return Math.round((x + 1e-9) * 100) / 100; }

  // ---------- cálculo ----------
  function calcular(d) {
    var ingreso = fecha(d.ingreso), cese = fecha(d.cese), notas = [], conceptos = [];
    if (!ingreso || !cese) return { error: "Ingresa la fecha de ingreso y la fecha de cese." };
    if (cese < ingreso) return { error: "La fecha de cese no puede ser anterior a la de ingreso." };
    var vreg = d.variablesMeses ? variablesRegulares(d.variablesMeses) : null;
    var sueldo = d.minima ? rmvEn(cese).monto : (+d.sueldo || 0), variables = vreg ? vreg.promedio : (+d.variables || 0);
    if (sueldo <= 0) return { error: "Ingresa tu remuneración mensual." };
    var reg = d.regimen || "general", mype = reg !== "general";
    var rmv = rmvEn(cese), RMV = rmv.monto, ASIGNACION = r2(RMV * 0.10);   // la vigente a la fecha de cese
    var af = d.asignacion ? ASIGNACION : 0;          // el TUO MYPE no la incluye (art. 50): se suma solo si la pagan
    var rc = sueldo + af + variables;               // remuneración computable mensual
    var factor = reg === "pequena" ? 0.5 : 1;       // pequeña empresa: la mitad (15 días de CTS, media gratificación)
    var tasaBonif = d.eps ? 0.0675 : 0.09;
    var total = tiempo(ingreso, cese);
    var anios = Math.floor(total.meses / 12), mesesSueltos = total.meses % 12;
    var cesY = cese.getUTCFullYear(), cesM = cese.getUTCMonth(), cesD = cese.getUTCDate();

    if (d.menosDe4h) {
      notas.push("Con una jornada menor de 4 horas diarias en promedio no corresponde la CTS (D.S. N.º 001-97-TR, art. 4) y la protección contra el despido arbitrario tiene reglas propias. Te conviene revisar tu caso en una consulta.");
    }
    if (mype && d.asignacion) {
      notas.push("El TUO D.S. N.º 013-2013-PRODUCE no incluye la asignación familiar entre los derechos del régimen MYPE (art. 50). La calculadora la suma porque indicas que la recibes: si se paga, forma parte de tu remuneración.");
    }
    if (!d.menosDe4h && sueldo < RMV) {
      notas.push("Tu remuneración es menor que la mínima vital vigente a tu fecha de cese (S/ " + RMV.toFixed(2) + ", " + rmv.norma + "). Si trabajas jornada completa, tu empleador debe pagarte al menos ese monto.");
    }
    if (rmv.anterior) {
      notas.push("Tu fecha de cese es anterior al 01/04/2018: la calculadora usa la RMV de S/ 930 como referencia. Ten en cuenta que los derechos laborales prescriben a los cuatro años desde el cese (Ley N.º 27321, art. único).");
    }

    // Gratificación de un semestre con la remuneración computable vigente en la fecha de referencia (v1.6): la de pago para la
    // gratificación que ya se cobró; la del mes anterior al cese para la trunca (D.S. N.º 005-2002-TR, art. 5).
    function rcEn(ref) { return (d.minima ? rmvEn(ref).monto : sueldo) + (d.asignacion ? r2(rmvEn(ref).monto * 0.10) : 0) + variables; }
    function gratificacion(desde, hasta, ref) {
      var meses = mesesCalendario(desde, hasta);
      return { meses: meses, monto: meses >= 1 ? rcEn(ref || cese) * factor / 6 * meses : 0 };
    }
    var refTrunca = finMesAnterior(cese);

    // 1. CTS trunca
    var cts = 0, detCts = "";
    if (reg !== "micro" && !d.menosDe4h && (total.meses >= 1)) {
      var iniSem = cesM >= 4 && cesM <= 9 ? dia(cesY, 4, 1) : (cesM >= 10 ? dia(cesY, 10, 1) : dia(cesY - 1, 10, 1));
      if (iniSem < ingreso) iniSem = ingreso;
      var tCts = tiempo(iniSem, cese);
      // Sexto de la gratificación percibida en el semestre de CTS (art. 18).
      var sexto = 0, pagoJul = dia(cesY, 6, 15), pagoDic = dia(iniSem.getUTCFullYear(), 11, 15);
      if (cesM >= 4 && cesM <= 9 && cese >= pagoJul && iniSem <= pagoJul) {
        var gJul = gratificacion(ingreso > dia(cesY, 0, 1) ? ingreso : dia(cesY, 0, 1), dia(cesY, 5, 30), pagoJul);
        sexto = gJul.monto / 6;
      } else if ((cesM >= 10 || cesM <= 3) && cese >= pagoDic && iniSem <= pagoDic) {
        var yD = pagoDic.getUTCFullYear();
        var gDic = gratificacion(ingreso > dia(yD, 6, 1) ? ingreso : dia(yD, 6, 1), dia(yD, 11, 31), pagoDic);
        sexto = gDic.monto / 6;
      }
      var rcCts = rc + sexto;
      cts = (rcCts * factor) / 12 * tCts.meses + (rcCts * factor) / 360 * tCts.dias;
      detCts = tCts.meses + " mes(es) y " + tCts.dias + " día(s) desde el " + fmtFecha(iniSem) +
               "; remuneración computable " + soles(rcCts) + (sexto ? " (incluye 1/6 de la gratificación)" : "") +
               (reg === "pequena" ? "; pequeña empresa: 15 remuneraciones diarias por año" : "");
      if (reg === "pequena") {
        // TUO D.S. 013-2013-PRODUCE, art. 50: 15 remuneraciones diarias por año completo de servicios, «hasta alcanzar un
        // máximo de noventa (90) remuneraciones diarias», es decir, 6 años. Se asume todo el tiempo en el régimen (v1.3).
        var previo = iniSem > ingreso ? tiempo(ingreso, masDias(iniSem, -1)) : { meses: 0, dias: 0 };
        var diasPrevios = 15 * (previo.meses / 12 + previo.dias / 360);
        var diasSem = 15 * (tCts.meses / 12 + tCts.dias / 360);
        var disponibles = Math.max(0, 90 - diasPrevios);
        if (diasSem > disponibles + 1e-9) {
          cts = rcCts / 30 * disponibles;
          detCts += disponibles > 0 ? "; solo " + (Math.round(disponibles * 100) / 100) + " remuneración(es) diaria(s) hasta el tope de 90"
                                    : "; el tope de 90 remuneraciones diarias ya se alcanzó";
          notas.push("En la pequeña empresa la CTS se computa a razón de 15 remuneraciones diarias por año, hasta un máximo de 90 (TUO D.S. N.º 013-2013-PRODUCE, art. 50): el tope se completa con 6 años de servicios. La calculadora asume que todo tu tiempo fue en el régimen de pequeña empresa; si la empresa se inscribió en el REMYPE después de tu ingreso, revisa tu caso en una consulta.");
        }
      }
      if ((cesM === 4 || cesM === 10) && cesD <= 15) {
        notas.push("Cesaste en la primera quincena de " + (cesM === 4 ? "mayo" : "noviembre") + ": revisa que tu empleador haya depositado la CTS del semestre anterior. La calculadora asume que sí.");
      }
    } else if (reg === "micro") {
      detCts = "La microempresa no paga CTS (TUO D.S. N.º 013-2013-PRODUCE).";
    } else if (total.meses < 1) {
      detCts = "Con menos de un mes de servicios no hay CTS (D.S. N.º 001-97-TR, art. 2).";
    }
    conceptos.push({ id: "cts", nombre: "CTS trunca", monto: r2(cts), detalle: detCts });

    // 2. Gratificación trunca + bonificación extraordinaria
    var grat = 0, bonif = 0, detGrat = "";
    if (reg !== "micro") {
      var iniG = cesM <= 5 ? dia(cesY, 0, 1) : dia(cesY, 6, 1);
      if (iniG < ingreso) iniG = ingreso;
      var g = gratificacion(iniG, cese, refTrunca);
      grat = g.monto;
      var yaDic = cesM === 11 && cesD >= 15;   // la gratificación de diciembre se paga hasta el 15
      if (yaDic) {
        if (d.diciembrePagada === false) {
          g = gratificacion(iniG, dia(cesY, 11, 31), dia(cesY, 11, 15));
          grat = g.monto;
        } else {
          g = { meses: 0, monto: 0 };
          grat = 0;
        }
      }
      detGrat = yaDic && d.diciembrePagada !== false ? "Cesaste después del 15 de diciembre: la gratificación de diciembre ya debió pagarse completa, así que no queda trunca de ese semestre" :
                g.meses + " mes(es) calendario completo(s) del semestre" + (g.meses < 1 ? ": se necesita al menos un mes íntegro (D.S. N.º 005-2002-TR)" : "") +
                (reg === "pequena" ? "; pequeña empresa: media remuneración por semestre" : "");
      if (cesM === 6 && cesD < 15 && !d.julioPagada && ingreso <= dia(cesY, 5, 30)) {
        var gj = gratificacion(ingreso > dia(cesY, 0, 1) ? ingreso : dia(cesY, 0, 1), dia(cesY, 5, 30), refTrunca);
        if (gj.monto > 0) {
          grat += gj.monto;
          detGrat += ". Se suma la gratificación de enero a junio (" + gj.meses + " mes(es)), porque cesaste antes del pago de julio";
        }
      }
      bonif = grat * tasaBonif;
    } else {
      detGrat = "La microempresa no paga gratificaciones (TUO D.S. N.º 013-2013-PRODUCE).";
    }
    conceptos.push({ id: "grat", nombre: "Gratificación trunca", monto: r2(grat), detalle: detGrat });
    conceptos.push({ id: "bonif", nombre: "Bonificación extraordinaria (" + (d.eps ? "6.75 %" : "9 %") + ")", monto: r2(bonif),
                     detalle: reg === "micro" ? "No corresponde." : "Ley N.º 30334: se paga junto con la gratificación, también la trunca." });

    // 3. Vacaciones: cada año completo de servicios da derecho a 30 días (15 en la MYPE). Si ese descanso no se goza
    //    dentro del año siguiente, además se debe la indemnización vacacional (D. Leg. N.º 713, art. 23). Los días que el
    //    trabajador ya gozó se imputan a los periodos más antiguos; si superan lo ganado, se descuentan del récord trunco.
    var diasAnio = mype ? 15 : 30, rdv = rc / 30, vacT = 0, detVac = "";
    var gozados = Math.max(0, Math.floor(+d.vacGozadas || 0)), resto = gozados;
    var diasPend = 0, diasVenc = 0, detPer = [];
    if (!d.menosDe4h) {
      for (var i = 1; i <= anios; i++) {
        var usa = Math.min(resto, diasAnio); resto -= usa;
        var queda = diasAnio - usa;
        var iniPer = masMeses(ingreso, 12 * (i - 1)), finPer = masDias(masMeses(ingreso, 12 * i), -1);
        var limite = masDias(masMeses(ingreso, 12 * (i + 1)), -1);   // último día para gozarlo
        var vencido = cese > limite;
        if (queda > 0) {
          if (vencido) diasVenc += queda; else diasPend += queda;
          detPer.push(fmtFecha(iniPer) + " al " + fmtFecha(finPer) + ": " + queda + " día(s) " +
                      (vencido ? "vencidos (no se gozaron hasta el " + fmtFecha(limite) + ")" : "pendientes"));
        }
      }
      if (total.meses >= 1) {
        var diasTrunco = diasAnio * (mesesSueltos / 12 + total.dias / 360);
        var desc = Math.min(resto, diasTrunco);
        vacT = rdv * (diasTrunco - desc);
        detVac = mesesSueltos + " mes(es) y " + total.dias + " día(s) de récord desde el " + fmtFecha(masMeses(ingreso, 12 * anios)) +
                 " (" + diasAnio + " días por año; D. Leg. N.º 713, art. 22)" +
                 (desc > 0 ? ". Se descuentan " + (Math.round(desc * 100) / 100) + " día(s) de vacaciones adelantadas" : "");
      } else {
        detVac = "Se necesita al menos un mes de servicios (D.S. N.º 012-92-TR, art. 23).";
      }
    } else {
      detVac = "Con una jornada menor de 4 horas diarias no hay descanso vacacional (D.S. N.º 012-92-TR, art. 11).";
    }
    conceptos.push({ id: "vac", nombre: "Vacaciones truncas", monto: r2(vacT), detalle: detVac });
    if (diasPend + diasVenc > 0) {
      conceptos.push({ id: "vacpend", nombre: "Vacaciones ganadas y no gozadas", monto: r2(rdv * (diasPend + diasVenc)),
                       detalle: (diasPend + diasVenc) + " día(s) × remuneración diaria de " + soles(rdv) + ". " + detPer.join("; ") });
    }
    if (diasVenc > 0) {
      conceptos.push({ id: "indvac", nombre: "Indemnización vacacional", monto: r2(rdv * diasVenc),
                       detalle: diasVenc + " día(s) de descanso no gozado dentro del año siguiente a cuando se ganó (D. Leg. N.º 713, art. 23, literal c)" });
      notas.push("La indemnización vacacional no corresponde a gerentes o representantes de la empresa que decidieron no gozar su descanso (D.S. N.º 012-92-TR, art. 24).");
    }
    if (gozados > 0 && diasPend + diasVenc === 0 && anios > 0) {
      notas.push("Con los " + gozados + " día(s) que indicas haber gozado, no quedan vacaciones pendientes de años completos.");
    }

    // 4. Indemnización
    var ind = 0, detInd = "", motivo = d.motivo || "renuncia", alternativas = null, sinInd = false;
    var enPrueba = total.meses < 3 || (total.meses === 3 && total.dias === 0);
    if (motivo === "despido" || motivo === "despido-modal") {
      if (enPrueba) {
        detInd = "Con 3 meses o menos de servicios no se supera el periodo de prueba: no hay indemnización por despido arbitrario (D.S. N.º 003-97-TR, arts. 10 y 38), salvo que el despido sea nulo.";
      } else if (motivo === "despido-modal") {
        var fin = fecha(d.finContrato);
        if (!fin || fin <= cese) {
          detInd = "Ingresa la fecha en que vencía tu contrato (posterior al cese).";
        } else {
          var falta = tiempo(masDias(cese, 1), fin);
          ind = Math.min(1.5 * rc * (falta.meses + falta.dias / 30), 12 * rc);
          detInd = "1.5 remuneraciones por cada mes que faltaba (" + falta.meses + " mes(es) y " + falta.dias + " día(s)), tope 12 (D.S. N.º 003-97-TR, art. 76)";
          if (reg !== "general") {
            // v1.4 (decisión de Ernesto, 24/09/2026): en la MYPE no hay norma expresa para el plazo fijo resuelto antes de tiempo.
            // Se muestran los dos cálculos posibles y el total no incluye la indemnización.
            var rdm = rc / 30, porA = reg === "pequena" ? 20 : 10, topeM = reg === "pequena" ? 120 : 90;
            var ind56 = Math.min(porA * rdm * (anios + mesesSueltos / 12), topeM * rdm);
            alternativas = [
              { id: "ind56", nombre: "Según la norma MYPE (por años de servicio)", monto: r2(ind56),
                detalle: porA + " remuneraciones diarias por año, con dozavos por los meses completos, tope " + topeM + " (TUO D.S. N.º 013-2013-PRODUCE, art. 56)" },
              { id: "ind76", nombre: "Según la regla general del plazo fijo (por meses que faltaban)", monto: r2(ind), detalle: detInd }
            ];
            sinInd = true;
            notas.push("Tu contrato era a plazo fijo en una " + (reg === "pequena" ? "pequeña empresa" : "microempresa") + ". La norma MYPE calcula la indemnización por despido injustificado por años de servicio (TUO D.S. N.º 013-2013-PRODUCE, art. 56); la ley general calcula la del contrato a plazo fijo resuelto antes de su vencimiento por los meses que faltaban (D.S. N.º 003-97-TR, art. 76). Ninguna norma dice de forma expresa cuál se aplica en la MYPE y no hemos ubicado un precedente vinculante: por eso te mostramos los dos montos. El total no incluye la indemnización.");
          }
        }
      } else {
        // Régimen general: dozavos y treintavos (D.S. 003-97-TR, art. 38). MYPE: solo dozavos, es decir, meses completos
        // (TUO D.S. 013-2013-PRODUCE, art. 56; igual en la Ley 32353, art. 50.2). Corrección del 24/09/2026.
        var fr = anios + mesesSueltos / 12 + (reg === "general" ? total.dias / 360 : 0);
        if (reg === "general") {
          ind = Math.min(1.5 * rc * fr, 12 * rc);
          detInd = "1.5 remuneraciones ordinarias por año, con dozavos y treintavos; tope 12 (D.S. N.º 003-97-TR, art. 38). Base: sueldo bruto con los conceptos remunerativos regulares";
        } else {
          var rd = rc / 30, porAnio = reg === "pequena" ? 20 : 10, tope = reg === "pequena" ? 120 : 90;
          ind = Math.min(porAnio * rd * fr, tope * rd);
          detInd = porAnio + " remuneraciones diarias por año, con dozavos por los meses completos (los días sueltos no se pagan), tope " + tope + " (TUO D.S. N.º 013-2013-PRODUCE, art. 56)";
        }
      }
      if (!sinInd) conceptos.push({ id: "ind", nombre: "Indemnización por despido arbitrario", monto: r2(ind), detalle: detInd });
    }

    var suma = 0;
    conceptos.forEach(function (c) { suma += c.monto; });
    if (vreg) { var nvl = notaVariables(vreg); if (nvl) notas.push(nvl); }
    if (d.asignacion && rmvEn(refTrunca).monto !== RMV && grat > 0 && !yaDic) notas.push("La gratificación trunca se calcula con la remuneración del mes anterior al cese (D.S. N.º 005-2002-TR, art. 5): la asignación familiar de ese mes era " + soles(r2(rmvEn(refTrunca).monto * 0.10)) + ".");
    notas.push("Es un cálculo orientativo. No incluye descuentos (AFP u ONP e impuesto), horas extras, utilidades, remuneraciones pendientes ni lo que diga tu contrato o un convenio colectivo.");
    if (alternativas) alternativas.forEach(function (a) { a.total = r2(suma + a.monto); });
    return { conceptos: conceptos, total: r2(suma), rc: r2(rc), asignacion: r2(af), alternativas: alternativas, rmv: rmv,
             servicio: anios + " año(s), " + mesesSueltos + " mes(es) y " + total.dias + " día(s)", notas: notas };
  }

  // ---------- costo laboral anual del empleador (v1.2, 24/09/2026) ----------
  /* Lo que la empresa paga en un año por un trabajador a jornada completa con remuneración fija, según el régimen.
     Bases verificadas el 24/09/2026:
     - Gratificaciones: Ley 27735, art. 5 (dos al año); pequeña empresa, media remuneración cada una (TUO D.S. 013-2013-PRODUCE, art. 50).
     - Bonificación extraordinaria: el aporte a EsSalud sobre la gratificación (Ley 30334, art. 3): 9 %, o 6.75 % con EPS.
     - CTS: por semestre, 1/12 de la remuneración computable por mes, que incluye 1/6 de la gratificación del semestre
       (D.S. 001-97-TR, arts. 18 y 21). Al año: rc × (1 + 1/6). Pequeña empresa: 15 remuneraciones diarias por año (TUO, art. 50).
     - EsSalud: 9 % de la remuneración, con base mínima de la RMV (Ley 26790, art. 6, literal a). No se aplica a la
       gratificación ni a la CTS (Ley 30334, art. 1; D.S. 001-97-TR).
     - Microempresa: sin CTS ni gratificaciones. SIS microempresas: S/ 15 mensuales por trabajador (TUO, art. 64.2; gob.pe/SIS).
     - Vida Ley desde el primer día para todo trabajador del sector privado, cualquiera sea su régimen, también la MYPE (D. Leg. 688,
       art. 1, modificado por el D.U. 044-2019; D.S. 009-2020-TR, art. 2; corregido el 24/09/2026) y SCTR en actividades de riesgo
       (Ley 26790, art. 19): la prima la fija la aseguradora; se suma solo si se ingresa su tasa.
     - Las vacaciones se pagan dentro de las 12 remuneraciones: no son un costo adicional salvo que se cubra al trabajador.
     No incluye utilidades, horas extras, movilidad ni otros conceptos variables. */
  var SIS_MICRO = 15;
  function costoLaboral(d) {
    var sueldo = +d.sueldo || 0;
    if (sueldo <= 0) return { error: "Ingresa la remuneración mensual del puesto." };
    var rmv = rmvEn(d.fecha ? fecha(d.fecha) : hoyLima()), RMV = rmv.monto, ASIGNACION = r2(RMV * 0.10);   // la vigente hoy
    var reg = d.regimen || "general", notas = [], filas = [];
    if (sueldo < RMV) return { error: "La remuneración no puede ser menor que la mínima vital vigente (S/ " + RMV.toFixed(2) + ", " + rmv.norma + ") para una jornada completa (TUO D.S. N.º 013-2013-PRODUCE, art. 52; en el régimen general, la RMV vigente)." };
    var af = d.asignacion ? ASIGNACION : 0, rc = sueldo + af;
    var salud = d.salud || (reg === "micro" ? "sis" : "essalud");
    if (reg !== "micro" && salud === "sis") salud = "essalud";
    var tasaBonif = salud === "eps" ? 0.0675 : 0.09;
    var remAnual = 12 * rc;
    filas.push({ id: "rem", nombre: "12 remuneraciones", monto: r2(remAnual),
                 detalle: soles(sueldo) + (af ? " + asignación familiar " + soles(af) + " (Ley N.º 25129)" : "") + " × 12. Incluyen el mes de vacaciones (" + (reg === "general" ? "30" : "15") + " días; " + (reg === "general" ? "D. Leg. N.º 713" : "TUO D.S. N.º 013-2013-PRODUCE, art. 55") + ")." });
    var grat = 0, bonif = 0, cts = 0;
    if (reg === "general") {
      grat = 2 * rc;
      cts = rc * (1 + 1 / 6);
      filas.push({ id: "grat", nombre: "Gratificaciones de julio y diciembre", monto: r2(grat), detalle: "Una remuneración cada una (Ley N.º 27735, art. 5)." });
    } else if (reg === "pequena") {
      grat = rc;
      cts = 0.5 * (rc + (rc / 2) / 6);
      filas.push({ id: "grat", nombre: "Gratificaciones de julio y diciembre", monto: r2(grat), detalle: "Media remuneración cada una (TUO D.S. N.º 013-2013-PRODUCE, art. 50)." });
    } else {
      filas.push({ id: "grat", nombre: "Gratificaciones", monto: 0, detalle: "La microempresa no paga gratificaciones ni CTS (TUO D.S. N.º 013-2013-PRODUCE, art. 50)." });
    }
    if (grat) {
      bonif = grat * tasaBonif;
      filas.push({ id: "bonif", nombre: "Bonificación extraordinaria (" + (salud === "eps" ? "6.75 %" : "9 %") + ")", monto: r2(bonif),
                   detalle: "El aporte a EsSalud sobre la gratificación, pagado al trabajador (Ley N.º 30334, art. 3)." });
      filas.push({ id: "cts", nombre: "CTS (depósitos de mayo y noviembre)", monto: r2(cts),
                   detalle: reg === "general" ? "Una remuneración computable al año, con 1/6 de la gratificación (D.S. N.º 001-97-TR, arts. 18 y 21)."
                                              : "15 remuneraciones diarias al año, con 1/6 de la gratificación (TUO D.S. N.º 013-2013-PRODUCE, art. 50; D.S. N.º 001-97-TR)." });
    }
    var saludMonto, saludDet;
    if (salud === "sis") {
      saludMonto = 12 * SIS_MICRO;
      saludDet = "SIS microempresas: S/ 15.00 al mes por trabajador (TUO D.S. N.º 013-2013-PRODUCE, art. 64.2). Si el trabajador está en EsSalud, elige esa opción.";
    } else {
      var base = Math.max(rc, RMV);
      saludMonto = 12 * 0.09 * base;
      saludDet = "9 % de " + soles(base) + " al mes; la base no puede ser menor que la RMV (Ley N.º 26790, art. 6). La gratificación y la CTS no pagan EsSalud (Ley N.º 30334, art. 1)" +
                 (salud === "eps" ? ". Con EPS el total sigue siendo 9 %: 6.75 % a EsSalud y 2.25 % como crédito para la EPS; el plan de la EPS puede costar más" : "") + ".";
    }
    filas.push({ id: "salud", nombre: salud === "sis" ? "Seguro de salud (SIS microempresas)" : "EsSalud (9 %)", monto: r2(saludMonto), detalle: saludDet });
    var vida = 0, sctr = 0;
    var tVida = +d.tasaVida || 0, tSctr = +d.tasaSctr || 0;
    if (tVida > 0) {
      vida = 12 * rc * tVida / 100;
      filas.push({ id: "vida", nombre: "Seguro Vida Ley (" + tVida + " % según póliza)", monto: r2(vida),
                   detalle: "Obligatorio desde el primer día para todo trabajador del sector privado, cualquiera sea su régimen laboral (D. Leg. N.º 688, art. 1, modificado por el D.U. N.º 044-2019; D.S. N.º 009-2020-TR, art. 2" + (reg === "pequena" ? "; para la pequeña empresa lo reitera el TUO D.S. N.º 013-2013-PRODUCE, art. 50" : "") + ")." });
    } else {
      notas.push("Falta el Seguro Vida Ley: es obligatorio desde el primer día para todo trabajador del sector privado, cualquiera sea su régimen laboral, también en la micro y pequeña empresa (D. Leg. N.º 688, art. 1, modificado por el D.U. N.º 044-2019; D.S. N.º 009-2020-TR, art. 2). Su prima la fija la aseguradora: ingrésala para sumarla.");
    }
    if (tSctr > 0) {
      sctr = 12 * rc * tSctr / 100;
      filas.push({ id: "sctr", nombre: "SCTR (" + tSctr + " % según póliza)", monto: r2(sctr),
                   detalle: "Solo en actividades de riesgo (Ley N.º 26790, art. 19" + (reg === "pequena" ? "; en la pequeña empresa, «cuando corresponda», TUO D.S. N.º 013-2013-PRODUCE, art. 50" : "") + ")." + (reg === "micro" ? " El TUO MYPE no lo menciona para la microempresa ni la excluye: si la actividad es de riesgo, revisa tu caso." : "") });
    }
    var total = 0;
    filas.forEach(function (f) { total += f.monto; });
    total = r2(total);
    if (reg === "pequena") notas.push("La CTS de la pequeña empresa tiene un tope de 90 remuneraciones diarias (TUO D.S. N.º 013-2013-PRODUCE, art. 50), que se completa con 6 años de servicios: desde entonces ya no suma al costo.");
    notas.push((reg === "micro" ? "La microempresa no reparte utilidades (TUO D.S. N.º 013-2013-PRODUCE, art. 50). "
               : "No incluye la participación en las utilidades, que corresponde si la empresa genera rentas de tercera categoría y tiene más de 20 trabajadores (D. Leg. N.º 892" + (reg === "pequena" ? "; en la pequeña empresa, TUO D.S. N.º 013-2013-PRODUCE, art. 50" : "") + "). ") +
               "Tampoco incluye horas extras, movilidad, bonos ni lo que diga un convenio colectivo. Los aportes a la AFP o a la ONP los paga el trabajador: se descuentan de su remuneración y no son un costo adicional para la empresa.");
    if (reg !== "general") notas.push("El régimen MYPE solo se aplica si la empresa está inscrita en el REMYPE. La Ley N.º 32353 mantiene estos mismos montos (arts. 44, 49 y 50) y rige al día siguiente de publicado su reglamento.");
    if (reg === "general" && d.asignacion === false) notas.push("Si el trabajador tiene hijos menores de 18 años, o mayores que siguen estudios superiores (hasta seis años después de cumplir 18), le corresponde asignación familiar: marca la casilla para sumarla (Ley N.º 25129; D.S. N.º 035-90-TR, art. 6).");
    notas.push("Remuneración mínima vital usada: S/ " + RMV.toFixed(2) + " (" + rmv.norma + "). El D.S. N.º 015-2026-TR anuncia un segundo tramo, hasta S/ 1,300, que requiere otro decreto supremo en el primer semestre de 2027: si se publica, la base mínima de EsSalud y la asignación familiar suben con él.");
    return { filas: filas, total: total, mensual: r2(total / 12), sobre: r2(total / remAnual * 100), rc: r2(rc), regimen: reg, notas: notas, rmv: rmv };
  }

  // ---------- v1.6 (30/09/2026): cálculo por beneficio, para el régimen general, la pequeña y la microempresa ----------
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "setiembre", "octubre", "noviembre", "diciembre"];

  /* Pagos variables mes por mes. Son regulares si se percibieron al menos 3 de los 6 meses: entonces se suman y se dividen
     entre 6 (D.S. N.º 001-97-TR, art. 16, para la CTS; D.S. N.º 005-2002-TR, art. 3, para la gratificación). */
  function variablesRegulares(meses) {
    var lista = (meses || []).slice(0, 6).map(function (x) { return Math.max(0, +x || 0); });
    var con = lista.filter(function (x) { return x > 0; }).length;
    var suma = lista.reduce(function (a, b) { return a + b; }, 0);
    return { con: con, suma: r2(suma), promedio: con >= 3 ? r2(suma / 6) : 0, regular: con >= 3 };
  }
  function notaVariables(v) {
    if (!v.suma) return null;
    return v.regular
      ? "Pagos variables: los recibiste en " + v.con + " de los 6 meses, así que son regulares. Se suman (" + soles(v.suma) + ") y se dividen entre 6: " + soles(v.promedio) + " al mes (D.S. N.º 001-97-TR, art. 16; D.S. N.º 005-2002-TR, art. 3)."
      : "Pagos variables: solo los recibiste en " + v.con + " de los 6 meses. Para contar deben repetirse al menos 3 meses de 6; por eso no entran en el cálculo.";
  }
  function finMesAnterior(f) { return dia(f.getUTCFullYear(), f.getUTCMonth(), 0); }
  /* El 15 de mayo y el 15 de noviembre no son feriados: si caen en sábado o domingo, el plazo pasa al lunes (D.S. N.º 001-97-TR, art. 22). */
  function siguienteHabil(f) { var w = f.getUTCDay(); return w === 6 ? masDias(f, 2) : (w === 0 ? masDias(f, 1) : f); }
  function sueldoEn(d, f) { return d.minima ? rmvEn(f).monto : (+d.sueldo || 0); }
  function asignacionEn(d, f) { return d.asignacion ? r2(rmvEn(f).monto * 0.10) : 0; }
  function textoAsignacion(f) { var m = rmvEn(f); return "asignación familiar " + soles(r2(m.monto * 0.10)) + " (10 % de la RMV de " + soles(m.monto) + " vigente al " + fmtFecha(f) + ", " + m.norma + "; Ley N.º 25129)"; }

  /* Gratificación de julio o de diciembre, completa o trunca (Ley N.º 27735; D.S. N.º 005-2002-TR; Ley N.º 30334). */
  function gratificacionPeriodo(d) {
    var reg = d.regimen || "general", anio = +d.anio, periodo = d.periodo === "diciembre" ? "diciembre" : "julio";
    var ingreso = fecha(d.ingreso), cese = d.cese ? fecha(d.cese) : null, notas = [];
    if (!anio || anio < 2018 || anio > 2100) return { error: "Elige el año de la gratificación." };
    if (!ingreso) return { error: "Ingresa tu fecha de ingreso." };
    if (!d.minima && !(+d.sueldo > 0)) return { error: "Ingresa tu remuneración mensual." };
    var ini = periodo === "julio" ? dia(anio, 0, 1) : dia(anio, 6, 1);
    var fin = periodo === "julio" ? dia(anio, 5, 30) : dia(anio, 11, 31);
    var pago = periodo === "julio" ? dia(anio, 6, 15) : dia(anio, 11, 15);
    if (ingreso > fin) return { error: "Ingresaste después del semestre de esta gratificación (" + fmtFecha(ini) + " al " + fmtFecha(fin) + ")." };
    if (cese && cese < ingreso) return { error: "La fecha de cese no puede ser anterior a la de ingreso." };
    if (cese && cese < ini) return { error: "Cesaste antes de que empezara el semestre de esta gratificación." };
    if (reg === "micro") {
      return { conceptos: [{ id: "grat", nombre: "Gratificación de " + periodo, monto: 0, detalle: "La microempresa no paga gratificaciones (TUO D.S. N.º 013-2013-PRODUCE)." }],
               total: 0, notas: ["Si tu empleador no está inscrito en el REMYPE, se aplica el régimen general: elige esa opción."], resumen: "Microempresa" };
    }
    var trunca = !!cese && cese < pago;              // no está laborando en la oportunidad de pago (Ley N.º 27735, arts. 6 y 7)
    var hasta = trunca && cese < fin ? cese : fin;
    var desde = ingreso > ini ? ingreso : ini;
    var meses = mesesCalendario(desde, hasta);
    var ref = trunca ? finMesAnterior(cese) : pago;  // trunca: remuneración del mes anterior al cese (D.S. N.º 005-2002-TR, art. 5)
    if (trunca && ref < ini) ref = ini;
    var sueldo = sueldoEn(d, ref), af = asignacionEn(d, ref), v = variablesRegulares(d.variablesMeses);
    if (!d.minima && sueldo < rmvEn(ref).monto && !d.menosDe4h) notas.push("Tu remuneración es menor que la mínima vital vigente al " + fmtFecha(ref) + " (" + soles(rmvEn(ref).monto) + "). A jornada completa, tu empleador debe pagarte al menos ese monto.");
    var rc = sueldo + af + v.promedio, factor = reg === "pequena" ? 0.5 : 1;
    var monto = meses >= 1 ? rc * factor / 6 * meses : 0, tasa = d.eps ? 0.0675 : 0.09;
    var detalle = meses + " mes(es) calendario completo(s) del " + fmtFecha(ini) + " al " + fmtFecha(fin) +
      (meses < 6 ? " (se cuentan solo meses completos: los días sueltos no suman)" : "") + " × " + (reg === "pequena" ? "media " : "") +
      "remuneración computable de " + soles(rc) + " ÷ 6. Base: sueldo " + soles(sueldo) + (af ? " + " + textoAsignacion(ref) : "") +
      (v.promedio ? " + variables " + soles(v.promedio) : "") + ".";
    if (meses < 1) detalle = "Se necesita al menos un mes calendario completo en el semestre (Ley N.º 27735, art. 7; D.S. N.º 005-2002-TR, art. 5).";
    var conceptos = [
      { id: "grat", nombre: (trunca ? "Gratificación trunca de " : "Gratificación de ") + periodo + " " + anio, monto: r2(monto), detalle: detalle },
      { id: "bonif", nombre: "Bonificación extraordinaria (" + (d.eps ? "6.75 %" : "9 %") + ")", monto: r2(monto * tasa),
        detalle: "Lo que el empleador pagaría a EsSalud sobre la gratificación se entrega al trabajador (Ley N.º 30334, art. 3). Con EPS es 6.75 %." }
    ];
    var nv = notaVariables(v); if (nv) notas.push(nv);
    notas.push(trunca ? "Cesaste antes del " + fmtFecha(pago) + ": te corresponde la gratificación trunca, que se paga con tu liquidación. Se calcula con la remuneración del mes anterior al cese (D.S. N.º 005-2002-TR, art. 5)."
                      : "Se paga dentro de la primera quincena de " + periodo + ": a más tardar el " + fmtFecha(pago) + " (Ley N.º 27735, art. 5). Se calcula con la remuneración vigente en esa oportunidad.");
    notas.push("La gratificación y la bonificación no pagan aportes a la AFP, a la ONP ni a EsSalud (Ley N.º 30334, art. 1). Sí puede corresponder la retención del impuesto a la renta de quinta categoría.");
    if (reg === "pequena") notas.push("Pequeña empresa inscrita en el REMYPE: media remuneración por cada gratificación (TUO D.S. N.º 013-2013-PRODUCE, art. 50).");
    if (reg !== "general" && d.asignacion) notas.push("El TUO D.S. N.º 013-2013-PRODUCE no incluye la asignación familiar entre los derechos del régimen MYPE (art. 50). Se suma porque indicas que la recibes.");
    notas.push("Cálculo orientativo. No incluye faltas injustificadas, licencias sin goce ni lo que diga un convenio colectivo.");
    var total = r2(conceptos[0].monto + conceptos[1].monto);
    return { conceptos: conceptos, total: total, rc: r2(rc), meses: meses, trunca: trunca, notas: notas,
             resumen: (trunca ? "Trunca" : "Completa o proporcional") + " · remuneración computable " + soles(rc) };
  }

  /* Depósito semestral de CTS de mayo o de noviembre (D.S. N.º 001-97-TR, arts. 2, 4, 9, 16, 18, 21 y 22). */
  function ctsDeposito(d) {
    var reg = d.regimen || "general", anio = +d.anio, periodo = d.periodo === "mayo" ? "mayo" : "noviembre";
    var ingreso = fecha(d.ingreso), notas = [];
    if (!anio || anio < 2018 || anio > 2100) return { error: "Elige el año del depósito." };
    if (!ingreso) return { error: "Ingresa tu fecha de ingreso." };
    if (!d.minima && !(+d.sueldo > 0)) return { error: "Ingresa tu remuneración mensual." };
    var ini = periodo === "noviembre" ? dia(anio, 4, 1) : dia(anio - 1, 10, 1);
    var fin = periodo === "noviembre" ? dia(anio, 9, 31) : dia(anio, 3, 30);
    var plazo = siguienteHabil(dia(anio, periodo === "noviembre" ? 10 : 4, 15));
    var mesRc = periodo === "noviembre" ? "octubre" : "abril";
    if (ingreso > fin) return { error: "Ingresaste después del semestre de este depósito (" + fmtFecha(ini) + " al " + fmtFecha(fin) + ")." };
    if (reg === "micro") return { conceptos: [{ id: "cts", nombre: "CTS de " + periodo, monto: 0, detalle: "La microempresa no deposita CTS (TUO D.S. N.º 013-2013-PRODUCE)." }], total: 0,
                                  notas: ["Si tu empleador no está inscrito en el REMYPE, se aplica el régimen general: elige esa opción."], resumen: "Microempresa" };
    if (d.menosDe4h) return { conceptos: [{ id: "cts", nombre: "CTS de " + periodo, monto: 0, detalle: "Con una jornada menor de 4 horas diarias en promedio no corresponde la CTS (D.S. N.º 001-97-TR, art. 4)." }], total: 0, notas: [], resumen: "Sin CTS" };
    var desde = ingreso > ini ? ingreso : ini, t = tiempo(desde, fin);
    if (tiempo(ingreso, fin).meses < 1) return { conceptos: [{ id: "cts", nombre: "CTS de " + periodo, monto: 0, detalle: "Con menos de un mes de servicios no hay CTS (D.S. N.º 001-97-TR, art. 2)." }], total: 0, notas: [], resumen: "Sin CTS" };
    var sueldo = sueldoEn(d, fin), af = asignacionEn(d, fin), v = variablesRegulares(d.variablesMeses);
    // Un sexto de la gratificación percibida en el semestre (art. 18): la de julio para noviembre; la de diciembre del año anterior para mayo.
    var grat, estimada = false, gd = String(d.gratificacion == null ? "" : d.gratificacion).trim();
    if (gd !== "" && !isNaN(+gd)) grat = Math.max(0, +gd);
    else {
      var g = gratificacionPeriodo({ regimen: reg, anio: periodo === "noviembre" ? anio : anio - 1, periodo: periodo === "noviembre" ? "julio" : "diciembre",
                                     ingreso: d.ingreso, sueldo: d.sueldo, minima: d.minima, asignacion: d.asignacion, variablesMeses: [] });
      grat = g.error ? 0 : g.conceptos[0].monto; estimada = true;
    }
    var sexto = grat / 6, rc = sueldo + af + v.promedio + sexto, factor = reg === "pequena" ? 0.5 : 1;
    var monto = rc * factor / 12 * t.meses + rc * factor / 360 * t.dias;
    var detalle = t.meses + " mes(es) y " + t.dias + " día(s) del " + fmtFecha(desde) + " al " + fmtFecha(fin) + ": " +
      (reg === "pequena" ? "la mitad de " : "") + soles(rc) + " ÷ 12 por mes y ÷ 360 por día. Remuneración computable de " + mesRc + ": sueldo " + soles(sueldo) +
      (af ? " + " + textoAsignacion(fin) : "") + (v.promedio ? " + variables " + soles(v.promedio) : "") + " + 1/6 de la gratificación (" + soles(grat) + " ÷ 6 = " + soles(r2(sexto)) + ").";
    if (reg === "pequena") {
      // TUO D.S. 013-2013-PRODUCE, art. 50: 15 remuneraciones diarias por año, hasta 90 (6 años). Se asume todo el tiempo en el régimen.
      var previo = ingreso < ini ? tiempo(ingreso, masDias(ini, -1)) : { meses: 0, dias: 0 };
      var diasPrevios = 15 * (previo.meses / 12 + previo.dias / 360), diasSem = 15 * (t.meses / 12 + t.dias / 360);
      var disponibles = Math.max(0, 90 - diasPrevios);
      if (diasSem > disponibles + 1e-9) {
        monto = rc / 30 * disponibles;
        detalle += disponibles > 0 ? " Solo " + (Math.round(disponibles * 100) / 100) + " remuneración(es) diaria(s) hasta el tope de 90." : " El tope de 90 remuneraciones diarias ya se alcanzó.";
        notas.push("En la pequeña empresa la CTS tiene un tope de 90 remuneraciones diarias (TUO D.S. N.º 013-2013-PRODUCE, art. 50). La calculadora asume que todo tu tiempo fue en ese régimen.");
      }
    }
    var nv = notaVariables(v); if (nv) notas.push(nv);
    if (estimada) notas.push("El sexto de la gratificación se estimó con tu remuneración y tu fecha de ingreso (" + soles(grat) + "). Si cobraste otro monto, escríbelo en el campo de la gratificación.");
    notas.push("Plazo del depósito: hasta el " + fmtFecha(plazo) + ". Son los primeros 15 días naturales de " + periodo + "; si el 15 cae en día inhábil, el depósito puede hacerse el primer día hábil siguiente (D.S. N.º 001-97-TR, arts. 21 y 22). La hoja de liquidación se entrega dentro de los 5 días hábiles del depósito (art. 29).");
    notas.push("La bonificación extraordinaria no forma parte del sexto: no es remunerativa (Ley N.º 30334, art. 3).");
    if (anio === 2026) notas.push("La Ley N.º 32322 permite retirar hasta el 100 % de los depósitos de CTS hasta el 31/12/2026.");
    notas.push("Cálculo orientativo. No descuenta faltas injustificadas ni licencias sin goce, ni incluye lo que diga un convenio colectivo.");
    return { conceptos: [{ id: "cts", nombre: "Depósito de CTS de " + periodo + " " + anio, monto: r2(monto), detalle: detalle }], total: r2(monto), rc: r2(rc),
             notas: notas, resumen: "Semestre del " + fmtFecha(ini) + " al " + fmtFecha(fin) + " · remuneración computable " + soles(rc) };
  }

  /* Vacaciones: ganadas y pendientes, vencidas con su indemnización y, si hubo cese, truncas (D. Leg. N.º 713; D.S. N.º 012-92-TR). */
  function vacacionesCalc(d) {
    var reg = d.regimen || "general", mype = reg !== "general", ingreso = fecha(d.ingreso);
    var corte = d.corte ? fecha(d.corte) : hoyLima(), cesado = !!d.cesado, notas = [];
    if (!ingreso) return { error: "Ingresa tu fecha de ingreso." };
    if (corte < ingreso) return { error: "La fecha de corte no puede ser anterior a la de ingreso." };
    if (!d.minima && !(+d.sueldo > 0)) return { error: "Ingresa tu remuneración mensual." };
    if (d.menosDe4h) return { conceptos: [{ id: "vac", nombre: "Vacaciones", monto: 0, detalle: "Con una jornada menor de 4 horas diarias no hay descanso vacacional (D.S. N.º 012-92-TR, art. 11)." }], total: 0, notas: [], resumen: "Sin descanso vacacional" };
    var sueldo = sueldoEn(d, corte), af = asignacionEn(d, corte), v = variablesRegulares(d.variablesMeses);
    var rc = sueldo + af + v.promedio, rdv = rc / 30, diasAnio = mype ? 15 : 30;
    var total = tiempo(ingreso, corte), anios = Math.floor(total.meses / 12), mesesSueltos = total.meses % 12;
    var resto = Math.max(0, Math.floor(+d.vacGozadas || 0)), diasPend = 0, diasVenc = 0, det = [], conceptos = [];
    for (var i = 1; i <= anios; i++) {
      var usa = Math.min(resto, diasAnio); resto -= usa;
      var queda = diasAnio - usa;
      var iniPer = masMeses(ingreso, 12 * (i - 1)), finPer = masDias(masMeses(ingreso, 12 * i), -1);
      var limite = masDias(masMeses(ingreso, 12 * (i + 1)), -1);
      var vencido = corte > limite;
      if (queda > 0) {
        if (vencido) diasVenc += queda; else diasPend += queda;
        det.push(fmtFecha(iniPer) + " al " + fmtFecha(finPer) + ": " + queda + " día(s) " + (vencido ? "vencidos (debían gozarse hasta el " + fmtFecha(limite) + ")" : "por gozar hasta el " + fmtFecha(limite)));
      }
    }
    if (diasPend > 0) conceptos.push({ id: "vacpend", nombre: cesado ? "Vacaciones ganadas y no gozadas" : "Vacaciones ganadas por gozar", monto: r2(rdv * diasPend),
      detalle: diasPend + " día(s) × remuneración diaria de " + soles(rdv) + ". " + det.filter(function (x) { return /por gozar/.test(x); }).join("; ") +
               (cesado ? "" : ". Mientras sigas trabajando se gozan como descanso; solo se pagan si cesas.") });
    if (diasVenc > 0) {
      conceptos.push({ id: "vacvenc", nombre: "Vacaciones vencidas: remuneración por el descanso no gozado", monto: r2(rdv * diasVenc),
        detalle: diasVenc + " día(s) × " + soles(rdv) + ". " + det.filter(function (x) { return /vencidos/.test(x); }).join("; ") });
      conceptos.push({ id: "indvac", nombre: "Indemnización vacacional", monto: r2(rdv * diasVenc),
        detalle: "Una remuneración más por el descanso que no se gozó dentro del año siguiente a cuando se ganó (D. Leg. N.º 713, art. 23, literal c)." });
      notas.push("La indemnización vacacional no corresponde a gerentes o representantes de la empresa que decidieron no gozar su descanso (D.S. N.º 012-92-TR, art. 24).");
    }
    var diasTrunco = diasAnio * (mesesSueltos / 12 + total.dias / 360);
    if (cesado) {
      if (total.meses >= 1) {
        var desc = Math.min(resto, diasTrunco);
        conceptos.push({ id: "vac", nombre: "Vacaciones truncas", monto: r2(rdv * (diasTrunco - desc)),
          detalle: mesesSueltos + " mes(es) y " + total.dias + " día(s) desde el " + fmtFecha(masMeses(ingreso, 12 * anios)) + " (" + diasAnio + " días por año, en dozavos y treintavos; D. Leg. N.º 713, art. 22)" +
                   (desc > 0 ? ". Se descuentan " + (Math.round(desc * 100) / 100) + " día(s) adelantados" : "") });
      } else {
        notas.push("Se necesita al menos un mes de servicios para las vacaciones truncas (D.S. N.º 012-92-TR, art. 23).");
      }
    } else {
      notas.push("Llevas " + mesesSueltos + " mes(es) y " + total.dias + " día(s) del periodo en curso (" + (Math.round(diasTrunco * 100) / 100) + " día(s) acumulados). El descanso se gana al completar el año y el récord de días efectivos (D. Leg. N.º 713, art. 10); si cesas antes, se pagan como vacaciones truncas.");
    }
    if (!conceptos.length) conceptos.push({ id: "vac", nombre: "Vacaciones", monto: 0, detalle: "No hay vacaciones pendientes con los datos ingresados." });
    var nv = notaVariables(v); if (nv) notas.push(nv);
    notas.push("Remuneración vacacional: la que percibirías si siguieras trabajando, con los conceptos regulares (D. Leg. N.º 713, art. 15). Base usada: sueldo " + soles(sueldo) + (af ? " + " + textoAsignacion(corte) : "") + (v.promedio ? " + variables " + soles(v.promedio) : "") + " = " + soles(rc) + ".");
    notas.push(mype ? "Micro y pequeña empresa inscritas en el REMYPE: 15 días de descanso por año (TUO D.S. N.º 013-2013-PRODUCE, art. 55)." : "Régimen general: 30 días de descanso por año (D. Leg. N.º 713, art. 10).");
    notas.push("La calculadora asume que cumpliste el récord de días efectivos de cada año y que los días gozados se aplican a los periodos más antiguos.");
    var suma = 0; conceptos.forEach(function (c) { suma += c.monto; });
    return { conceptos: conceptos, total: r2(suma), rc: r2(rc), notas: notas,
             resumen: "Tiempo de servicios al " + fmtFecha(corte) + ": " + anios + " año(s), " + mesesSueltos + " mes(es) y " + total.dias + " día(s)" };
  }

  /* Indemnización por despido arbitrario o por resolución anticipada de un contrato a plazo fijo: reutiliza la liquidación. */
  function indemnizacionCalc(d) {
    var r = calcular({ regimen: d.regimen, ingreso: d.ingreso, cese: d.cese, sueldo: d.sueldo, variablesMeses: d.variablesMeses,
                       asignacion: d.asignacion, motivo: d.motivo, finContrato: d.finContrato, vacGozadas: 0, minima: d.minima });
    if (r.error) return r;
    var ind = r.conceptos.filter(function (c) { return c.id === "ind"; });
    var notas = r.notas.filter(function (t) { return /indemniz|plazo fijo|periodo de prueba|mínima vital/i.test(t); });
    notas.push("La indemnización es la única reparación por el despido arbitrario (D.S. N.º 003-97-TR, art. 34). Si el despido fue nulo o fraudulento, puedes pedir la reposición: revisa el caso antes de firmar.");
    notas.push("El plazo para demandar por despido es de 30 días naturales de producido (D.S. N.º 003-97-TR, art. 36).");
    notas.push("No incluye CTS, gratificación ni vacaciones: calcúlalos en la liquidación completa.");
    if (r.alternativas) return { conceptos: [], alternativas: r.alternativas.map(function (a) { return { id: a.id, nombre: a.nombre, monto: a.monto, detalle: a.detalle }; }),
                                 total: null, notas: notas, resumen: "Tiempo de servicios: " + r.servicio + " · remuneración " + soles(r.rc) };
    var monto = ind.length ? ind[0].monto : 0;
    return { conceptos: ind.length ? ind : [{ id: "ind", nombre: "Indemnización", monto: 0, detalle: "Con renuncia o fin del plazo no hay indemnización." }],
             total: monto, notas: notas, resumen: "Tiempo de servicios: " + r.servicio + " · remuneración " + soles(r.rc) };
  }

  function fmtFecha(f) {
    return ("0" + f.getUTCDate()).slice(-2) + "/" + ("0" + (f.getUTCMonth() + 1)).slice(-2) + "/" + f.getUTCFullYear();
  }
  function soles(x) {
    return "S/ " + x.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  // ---------- formulario ----------
  function iniciar() {
    var form = document.getElementById("form-calculadora");
    if (!form) return;
    var salida = document.getElementById("calc-salida");
    var campo = function (n) { return form.elements[n]; };
    function visibles() {
      var reg = campo("regimen").value, motivo = campo("motivo").value, cese = fecha(campo("cese").value);
      if (campo("minima")) { campo("sueldo").disabled = campo("minima").checked; campo("sueldo").closest(".campo").hidden = campo("minima").checked; }
      form.querySelectorAll(".solo-general").forEach(function (el) { el.hidden = reg !== "general"; });
      form.querySelectorAll(".solo-modal").forEach(function (el) { el.hidden = motivo !== "despido-modal"; });
      var julio = !!cese && cese.getUTCMonth() === 6 && cese.getUTCDate() < 15 && reg !== "micro";
      form.querySelectorAll(".solo-julio").forEach(function (el) { el.hidden = !julio; });
      var dic = !!cese && cese.getUTCMonth() === 11 && cese.getUTCDate() >= 15 && reg !== "micro";
      form.querySelectorAll(".solo-diciembre").forEach(function (el) { el.hidden = !dic; });
    }
    function mostrar() {
      var d = {
        regimen: campo("regimen").value, ingreso: campo("ingreso").value, cese: campo("cese").value,
        sueldo: campo("sueldo").value, variables: campo("variables") ? campo("variables").value : 0, asignacion: campo("asignacion").checked,
        minima: campo("minima") ? campo("minima").checked : false,
        variablesMeses: campo("v1") ? [1, 2, 3, 4, 5, 6].map(function (i) { return campo("v" + i).value; }) : null,
        eps: campo("eps").checked, motivo: campo("motivo").value, finContrato: campo("finContrato").value,
        vacGozadas: campo("vacGozadas").value,
        menosDe4h: campo("menosDe4h").checked, julioPagada: campo("julioPagada").checked,
        diciembrePagada: !campo("diciembreNoPagada").checked
      };
      var r = calcular(d);
      if (r.error) {
        salida.innerHTML = '<p class="aviso aviso-error" role="alert">' + r.error + "</p>";
        return;
      }
      var filas = r.conceptos.map(function (c) {
        return "<tr><td><strong>" + c.nombre + "</strong><br><span class=\"calc-nota\">" + c.detalle + "</span></td><td class=\"num\">" + soles(c.monto) + "</td></tr>";
      }).join("");
      salida.innerHTML =
        '<span class="kicker">' + (r.alternativas ? "Resultado estimado sin la indemnización" : "Resultado estimado") + '</span>' +
        '<p class="total">' + soles(r.total) + "</p>" +
        '<p class="calc-nota">Tiempo de servicios: ' + r.servicio + " · Remuneración computable: " + soles(r.rc) +
        " · RMV a la fecha de cese: " + soles(r.rmv.monto) + " (" + r.rmv.norma + ")</p>" +
        '<div class="tabla-scroll"><table class="tabla-guia"><thead><tr><th>Concepto</th><th class="num">Monto</th></tr></thead><tbody>' +
        filas + "</tbody></table></div>" +
        (r.alternativas ? '<p style="margin-top:16px"><strong>Indemnización: dos cálculos posibles</strong></p>' +
          '<div class="tabla-scroll"><table class="tabla-guia"><thead><tr><th>Cálculo</th><th class="num">Monto</th></tr></thead><tbody>' +
          r.alternativas.map(function (a) {
            return "<tr><td><strong>" + a.nombre + "</strong><br><span class=\"calc-nota\">" + a.detalle + "</span><br><span class=\"calc-nota\"><strong>Total con este cálculo: " +
                   soles(a.total) + "</strong></span></td><td class=\"num\">" + soles(a.monto) + "</td></tr>";
          }).join("") + "</tbody></table></div>" : "") +
        r.notas.map(function (t) { return '<p class="calc-nota">' + t + "</p>"; }).join("") +
        '<p><a class="boton boton-primario" href="consultas.html?servicio=escrita#registrar">Que un especialista revise mi liquidación</a></p>';
      salida.focus();
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "calculo-liquidacion-" + d.regimen, title: "Cálculo de liquidación", event: true });
      }
    }
    form.addEventListener("change", visibles);
    form.addEventListener("submit", function (e) { e.preventDefault(); mostrar(); });
    visibles();
  }

  function iniciarCosto() {
    var form = document.getElementById("form-costo");
    if (!form) return;
    var salida = document.getElementById("costo-salida");
    function visibles() {
      var reg = form.elements.regimen.value;
      form.querySelectorAll(".solo-micro").forEach(function (el) { el.hidden = reg !== "micro"; });
      form.querySelectorAll(".no-micro").forEach(function (el) { el.hidden = reg === "micro"; });
    }
    form.addEventListener("change", visibles);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var reg = form.elements.regimen.value;
      var r = costoLaboral({
        regimen: reg, sueldo: form.elements.sueldo.value, asignacion: form.elements.asignacion.checked,
        salud: reg === "micro" ? form.elements.saludMicro.value : (form.elements.eps.checked ? "eps" : "essalud"),
        tasaVida: form.elements.tasaVida.value, tasaSctr: form.elements.tasaSctr.value
      });
      if (r.error) { salida.innerHTML = '<p class="aviso aviso-error" role="alert">' + r.error + "</p>"; return; }
      var filas = r.filas.map(function (f) {
        return "<tr><td><strong>" + f.nombre + "</strong><br><span class=\"calc-nota\">" + f.detalle + "</span></td><td class=\"num\">" + soles(f.monto) + "</td></tr>";
      }).join("");
      salida.innerHTML =
        '<span class="kicker">Costo laboral anual estimado</span>' +
        '<p class="total">' + soles(r.total) + "</p>" +
        '<p class="calc-nota">En promedio, ' + soles(r.mensual) + " al mes: " + r.sobre.toFixed(1) + " % de las 12 remuneraciones.</p>" +
        '<div class="tabla-scroll"><table class="tabla-guia"><thead><tr><th>Concepto al año</th><th class="num">Monto</th></tr></thead><tbody>' +
        filas + "</tbody></table></div>" +
        r.notas.map(function (t) { return '<p class="calc-nota">' + t + "</p>"; }).join("") +
        '<p><a class="boton boton-primario" href="/empresas.html#linea-02">Revisar la estructura salarial con HRTIC</a></p>';
      salida.focus();
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: "calculo-costo-laboral-" + reg, title: "Cálculo de costo laboral", event: true });
      }
    });
    visibles();
  }


  // ---------- formularios por beneficio (v1.6) ----------
  var ETIQUETAS_MESES = { julio: [0, 1, 2, 3, 4, 5], diciembre: [6, 7, 8, 9, 10, 11], mayo: [10, 11, 0, 1, 2, 3], noviembre: [4, 5, 6, 7, 8, 9] };
  function leerBeneficio(form) {
    var el = form.elements, val = function (n) { return el[n] ? (el[n].type === "checkbox" ? el[n].checked : el[n].value) : undefined; };
    var vm = [];
    for (var i = 1; i <= 6; i++) if (el["v" + i]) vm.push(el["v" + i].value);
    return { regimen: val("regimen"), periodo: val("periodo"), anio: val("anio"), ingreso: val("ingreso"), cese: val("cese"),
             sueldo: val("sueldo"), minima: !!val("minima"), asignacion: !!val("asignacion"), eps: !!val("eps"), menosDe4h: !!val("menosDe4h"),
             gratificacion: val("gratificacion"), corte: val("corte"), cesado: !!val("cesado"), vacGozadas: val("vacGozadas"),
             motivo: val("motivo"), finContrato: val("finContrato"), variablesMeses: vm };
  }
  function pintarBeneficio(salida, r, cta) {
    if (r.error) { salida.innerHTML = '<p class="aviso aviso-error" role="alert">' + r.error + "</p>"; return; }
    var fila = function (c) { return "<tr><td><strong>" + c.nombre + "</strong><br><span class=\"calc-nota\">" + c.detalle + "</span></td><td class=\"num\">" + soles(c.monto) + "</td></tr>"; };
    salida.innerHTML =
      '<span class="kicker">' + (r.total === null ? "Dos cálculos posibles" : "Resultado estimado") + "</span>" +
      (r.total === null ? "" : '<p class="total">' + soles(r.total) + "</p>") +
      (r.resumen ? '<p class="calc-nota">' + r.resumen + "</p>" : "") +
      ((r.conceptos && r.conceptos.length) || r.alternativas ? '<div class="tabla-scroll"><table class="tabla-guia"><thead><tr><th>Concepto</th><th class="num">Monto</th></tr></thead><tbody>' +
        (r.conceptos || []).map(fila).join("") + (r.alternativas || []).map(fila).join("") + "</tbody></table></div>" : "") +
      r.notas.map(function (t) { return '<p class="calc-nota">' + t + "</p>"; }).join("") +
      '<p><a class="boton boton-primario" href="' + cta.href + '">' + cta.texto + "</a></p>";
    salida.focus();
  }
  function iniciarBeneficio(formId, salidaId, fn, cta, evento) {
    var form = document.getElementById(formId);
    if (!form) return;
    var salida = document.getElementById(salidaId);
    function visibles() {
      var el = form.elements;
      var min = el.minima && el.minima.checked;
      if (el.sueldo) { el.sueldo.disabled = !!min; el.sueldo.closest(".campo").hidden = !!min; }
      form.querySelectorAll(".solo-modal").forEach(function (x) { x.hidden = !(el.motivo && el.motivo.value === "despido-modal"); });
      form.querySelectorAll(".solo-cesado").forEach(function (x) { x.hidden = !(el.cesado && el.cesado.checked); });
      var p = el.periodo ? el.periodo.value : "";
      var idx = ETIQUETAS_MESES[p];
      for (var i = 1; i <= 6; i++) {
        var lab = form.querySelector('label[for="' + formId + "-v" + i + '"]');
        if (lab) lab.textContent = idx ? MESES[idx[i - 1]].charAt(0).toUpperCase() + MESES[idx[i - 1]].slice(1) : "Mes " + i;
      }
      var etq = form.querySelector("[data-etiqueta-sueldo]");
      if (etq && el.cese) etq.textContent = el.cese.value ? "Remuneración del mes anterior a tu cese (S/)" : "Remuneración mensual vigente al momento del pago (S/)";
    }
    form.addEventListener("change", visibles);
    form.addEventListener("input", function (e) { if (e.target.name === "cese") visibles(); });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var d = leerBeneficio(form), r = fn(d);
      pintarBeneficio(salida, r, cta);
      if (!r.error && window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: evento + "-" + d.regimen, title: evento, event: true });
    });
    visibles();
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { calcular: calcular, costoLaboral: costoLaboral, tiempo: tiempo, mesesCalendario: mesesCalendario, rmvEn: rmvEn, fecha: fecha,
                       gratificacionPeriodo: gratificacionPeriodo, ctsDeposito: ctsDeposito, vacacionesCalc: vacacionesCalc,
                       indemnizacionCalc: indemnizacionCalc, variablesRegulares: variablesRegulares };
  } else {
    window.HRTICcalc = { calcular: calcular, costoLaboral: costoLaboral, gratificacionPeriodo: gratificacionPeriodo, ctsDeposito: ctsDeposito,
                         vacacionesCalc: vacacionesCalc, indemnizacionCalc: indemnizacionCalc };
    var arrancar = function () {
      iniciar(); iniciarCosto();
      var consulta = { href: "consultas.html?servicio=escrita#registrar", texto: "Que un especialista revise mi caso" };
      iniciarBeneficio("f-grati", "s-grati", gratificacionPeriodo, consulta, "calculo-gratificacion");
      iniciarBeneficio("f-cts", "s-cts", ctsDeposito, consulta, "calculo-cts");
      iniciarBeneficio("f-vac", "s-vac", vacacionesCalc, consulta, "calculo-vacaciones");
      iniciarBeneficio("f-ind", "s-ind", indemnizacionCalc, consulta, "calculo-indemnizacion");
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar); else arrancar();
  }
})();
