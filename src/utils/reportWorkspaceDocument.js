const mm = (value) => `${value}mm`;
export const reportMillimeters = mm;
export const reportDate = (value) =>
  value ? value.slice(0, 10).split("-").reverse().join("/") : "";
export const safeSpreadsheetCell = (value) => {
  const text = String(value ?? "");
  return /^\s*[=+@\-\t\r]/.test(text) ? "'" + text : text;
};
export function reportTables(model) {
  return [
    {
      title: "Resumo operacional",
      columns: ["Indicador", "Quantidade"],
      rows: model.summary,
    },
    {
      title: "Indicadores complementares",
      columns: ["Métrica", "Resultado"],
      rows: model.extra,
    },
    ...(model.content === "detailed" ? model.collections : []),
  ].filter((t) => t.rows.length);
}
export async function prepareReportDocument(model) {
  const pdfModule = await import("jspdf"),
    jsPDF = pdfModule.jsPDF || pdfModule.default?.jsPDF || pdfModule.default;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const width = 182,
    pages = [{ blocks: [] }];
  let y = 49;
  const addPage = () => {
    pages.push({ blocks: [] });
    y = 49;
  };
  function textBlock(title, text) {
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(text, width);
    let part = [];
    for (const line of lines) {
      if (y + 12 + part.length * 4 > 269) {
        pages.at(-1).blocks.push({ kind: "text", title, y, lines: part });
        addPage();
        part = [];
      }
      part.push(line);
    }
    if (part.length) {
      pages.at(-1).blocks.push({ kind: "text", title, y, lines: part });
      y += 12 + part.length * 4;
    }
  }
  let section = 0;
  for (const t of reportTables(model)) {
    section++;
    const columns = t.columns.length ? t.columns : ["Informação"],
      widths =
        columns.length === 2
          ? [width * 0.67, width * 0.33]
          : columns.map(() => width / columns.length);
    let block;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const headerLines = columns.map((label, i) =>
        doc.splitTextToSize(label, widths[i] - 4),
      ),
      headerHeight = Math.max(
        7,
        ...headerLines.map((lines) => lines.length * 4 + 3),
      );
    const start = () => {
      block = {
        kind: "table",
        headerLines,
        headerHeight,
        title: `${section}. ${t.title}`,
        columns,
        widths,
        y,
        rows: [],
      };
      pages.at(-1).blocks.push(block);
      y += 7 + headerHeight;
    };
    if (y + 28 > 269) addPage();
    start();
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    for (const row of t.rows) {
      const cells = columns.map((_, i) =>
          doc.splitTextToSize(String(row[i] ?? ""), widths[i] - 4),
        ),
        lineCount = Math.max(1, ...cells.map((lines) => lines.length));
      for (let offset = 0; offset < lineCount;) {
        const available = Math.min(45, Math.floor((269 - y - 3) / 4));
        if (available < 1) {
          addPage();
          start();
          continue;
        }
        const count = Math.min(available, lineCount - offset),
          part = cells.map((lines) => lines.slice(offset, offset + count)),
          height = Math.max(7, count * 4 + 3);
        if (y + height > 269) {
          addPage();
          start();
          continue;
        }
        block.rows.push({ cells: part, height });
        y += height;
        offset += count;
        if (offset < lineCount) {
          addPage();
          start();
        }
      }
    }
    y += 8;
  }
  textBlock(
    `${++section}. Escopo e critérios`,
    `Filtros: ${model.scope}. Fuso: ${model.timeZone || "America/Recife"}. Período: ${reportDate(model.start)} a ${reportDate(model.end)}. Registros de cadastro representam a situação atual. Sem amostra é diferente de zero registros. Dados pessoais conforme as permissões.`,
  );
  if (model.notes) textBlock("Observações", model.notes);
  // The same page plan is used by the visible preview and PDF export.
  for (let n = 0; n < pages.length; n++) {
    if (n) doc.addPage();
    doc.setDrawColor(114, 49, 239);
    doc.setLineWidth(0.65);
    doc.line(14, 11, 196, 11);
    doc.setTextColor(36, 15, 80);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text(doc.splitTextToSize(model.title, width), 14, 20);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(106, 91, 145);
    doc.text(doc.splitTextToSize(model.condominiumName, width), 14, 27);
    doc.setFontSize(8);
    doc.text(
      `Relatório nº ${model.number} • Emitido em ${reportDate(model.emittedDay || model.generatedAt)}`,
      14,
      34,
    );
    doc.text(
      `Período: ${reportDate(model.start)} a ${reportDate(model.end)}`,
      14,
      39,
    );
    doc.text(`Responsável: ${model.responsible}`, 196, 39, {
      align: "right",
      maxWidth: 95,
    });
    doc.setFont("helvetica", "bold");
    doc.setTextColor(36, 15, 80);
    doc.text(
      model.content === "summary" ? "Resumo executivo" : "Relatório detalhado",
      14,
      44,
    );
    for (const b of pages[n].blocks) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(36, 15, 80);
      doc.text(b.title, 14, b.y + 3);
      if (b.kind === "text") {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(9);
        doc.setTextColor(86, 75, 111);
        doc.text(b.lines, 14, b.y + 10);
        continue;
      }
      doc.setDrawColor(125, 65, 232);
      doc.setLineWidth(0.2);
      doc.line(14, b.y + 5, 196, b.y + 5);
      let top = b.y + 7;
      doc.setFillColor(242, 239, 250);
      doc.rect(14, top, width, b.headerHeight, "F");
      let x = 14;
      doc.setFontSize(9);
      for (let i = 0; i < b.columns.length; i++) {
        doc.text(b.headerLines[i], x + 2, top + 4.6);
        x += b.widths[i];
      }
      top += b.headerHeight;
      for (const row of b.rows) {
        x = 14;
        doc.setFont("helvetica", "normal");
        doc.setTextColor(77, 66, 101);
        doc.setDrawColor(222, 216, 236);
        doc.setLineWidth(0.15);
        for (let i = 0; i < row.cells.length; i++) {
          doc.rect(x, top, b.widths[i], row.height);
          doc.text(row.cells[i], x + 2, top + 4.6);
          x += b.widths[i];
        }
        top += row.height;
      }
    }
    doc.setDrawColor(135, 71, 239);
    doc.line(14, 281, 196, 281);
    doc.setFontSize(8);
    doc.setTextColor(86, 75, 111);
    doc.text("InfinityCondo • Documento administrativo", 14, 287);
    doc.text(`Página ${n + 1} de ${pages.length}`, 196, 287, {
      align: "right",
    });
  }
  // Optional logo; a missing/unreadable image never blocks emission.
  let logoDataUrl = null;
  if (model.logoUrl) {
    try {
      if (
        /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(
          model.logoUrl,
        ) &&
        model.logoUrl.length < 2000000
      )
        logoDataUrl = model.logoUrl;
      else {
        const url = new URL(model.logoUrl, location.origin);
        if (url.protocol === "https:" || url.origin === location.origin) {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
            credentials:
              url.origin === location.origin ? "same-origin" : "omit",
            referrerPolicy: "no-referrer",
          });
          const blob = await response.blob();
          if (
            response.ok &&
            blob.size < 1500000 &&
            /^image\/(png|jpeg|webp)$/.test(blob.type)
          )
            logoDataUrl = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
        }
      }
      if (logoDataUrl) {
        doc.setPage(1);
        const image = doc.getImageProperties(logoDataUrl),
          ratio = Math.min(18 / image.width, 12 / image.height),
          imageWidth = image.width * ratio,
          imageHeight = image.height * ratio;
        doc.addImage(
          logoDataUrl,
          logoDataUrl.startsWith("data:image/png")
            ? "PNG"
            : logoDataUrl.startsWith("data:image/webp")
              ? "WEBP"
              : "JPEG",
          196 - imageWidth,
          13,
          imageWidth,
          imageHeight,
        );
      }
    } catch {
      logoDataUrl = null;
    }
  }

  return { pages, logoDataUrl, blob: doc.output("blob") };
}
function download(blob, name) {
  const url = URL.createObjectURL(blob),
    anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export async function downloadReportDocument(model, format, pdf) {
  const name = `InfinityCondo-relatorio-${model.number}`;
  if (format === "PDF") {
    download(pdf || (await prepareReportDocument(model)).blob, name + ".pdf");
    return;
  }
  const identity = [
    ["Condomínio", model.condominiumName],
    ["Relatório", model.number],
    ["Período", `${reportDate(model.start)} a ${reportDate(model.end)}`],
    ["Unidade", model.scope],
    ["Responsável", model.responsible],
    [
      "Emissão",
      new Date(model.generatedAt).toLocaleString("pt-BR", {
        timeZone: model.timeZone || "America/Recife",
      }),
    ],
    ["Fuso horário", model.timeZone || "America/Recife"],
    [
      "Conteúdo",
      model.content === "summary" ? "Resumo executivo" : "Detalhado",
    ],
  ];
  const tables = reportTables(model);
  if (format === "XLSX") {
    const mod = await import("exceljs"),
      book = new (mod.default || mod).Workbook();
    book.creator = "InfinityCondo";
    const sheet = book.addWorksheet("Identificação");
    sheet.addRows(identity.map((row) => row.map(safeSpreadsheetCell)));
    let index = 0;
    for (const table of tables) {
      const s = book.addWorksheet(
        `${++index}-${table.title}`.replace(/[\\/*?:[\]]/g, " ").slice(0, 31),
      );
      s.addRow(table.columns);
      const numeric = (column) =>
        /^(Quantidade|Resultado|Andar|Capacidade|Consumo|Leitura|Valor|Ciências|Intervalo)/.test(
          column,
        );
      for (const row of table.rows) {
        const added = s.addRow(
          row.map((value, index) => {
            const text = String(value ?? "");
            const time = /^(\d+) h (\d+) min$/.exec(text);
            if (numeric(table.columns[index]) && time)
              return (+time[1] * 60 + +time[2]) / 1440;
            return numeric(table.columns[index]) &&
              /^-?\d[\d.]*([,]\d+)?%?$/.test(text)
              ? Number(
                  text.replaceAll(".", "").replace(",", ".").replace("%", ""),
                ) / (text.endsWith("%") ? 100 : 1)
              : safeSpreadsheetCell(value);
          }),
        );
        row.forEach((value, index) => {
          if (numeric(table.columns[index]) && String(value).endsWith("%"))
            added.getCell(index + 1).numFmt = "0.00%";
          else if (
            numeric(table.columns[index]) &&
            /^\d+ h \d+ min$/.test(String(value))
          )
            added.getCell(index + 1).numFmt = "[h]:mm";
        });
      }
      s.getRow(1).font = { bold: true, color: { argb: "FF281150" } };
      s.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFF1ECFC" },
      };
      s.columns.forEach((c) => (c.width = 30));
      s.views = [{ state: "frozen", ySplit: 1 }];
      s.eachRow((row) => (row.alignment = { wrapText: true, vertical: "top" }));
    }
    if (model.notes)
      sheet.addRow(["Observações", safeSpreadsheetCell(model.notes)]);
    sheet.columns = [{ width: 24 }, { width: 80 }];
    sheet.getColumn(1).font = { bold: true, color: { argb: "FF281150" } };
    sheet.eachRow((row) => {
      row.alignment = { wrapText: true, vertical: "top" };
    });
    download(
      new Blob([await book.xlsx.writeBuffer()], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      name + ".xlsx",
    );
    return;
  }
  const rows = [
    [model.title],
    ...identity,
    [],
    ...tables.flatMap((t) => [[t.title], t.columns, ...t.rows, []]),
    ["Observações", model.notes],
  ];
  const quote = (value) =>
    '"' + safeSpreadsheetCell(value).replaceAll('"', '""') + '"';
  download(
    new Blob(
      ["\uFEFF" + rows.map((row) => row.map(quote).join(";")).join("\r\n")],
      { type: "text/csv;charset=utf-8" },
    ),
    name + ".csv",
  );
}
