import test from "node:test";
import assert from "node:assert/strict";
import {
  safeSpreadsheetCell,
  reportTables,
  prepareReportDocument,
} from "../src/utils/reportWorkspaceDocument.js";
function sampleReport() {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    number: "2026-TESTE",
    title: "RELATÓRIO EXECUTIVO CONDOMINIAL",
    condominiumName: "Condomínio",
    generatedAt: "2026-10-24T12:00:00Z",
    start: "2026-10-01",
    end: "2026-10-24",
    scope: "Todas as unidades",
    responsible: "Administração",
    summary: [["Registros", "1"]],
    extra: [],
    collections: [],
    notes: "",
    content: "summary",
    logoUrl: null,
  };
}
test("planilhas neutralizam injeção de fórmula e incluem somente o conteúdo selecionado", () => {
  for (const value of ["=HYPERLINK(1)", "+SUM(1)", "@SUM(1)", "-2", "\t=cmd"])
    assert.ok(safeSpreadsheetCell(value).startsWith("'"));
  assert.equal(safeSpreadsheetCell("Normal"), "Normal");
  const model = {
    summary: [["Registros", "1"]],
    extra: [],
    content: "summary",
    collections: [{ title: "Detalhes", columns: ["Nome"], rows: [["Pessoa"]] }],
  };
  assert.equal(reportTables(model).length, 1);
});
test("PDF e prévia compartilham plano de páginas, com repetição de cabeçalhos e limites A4", async () => {
  const preview = { model: sampleReport() };
  preview.model.content = "detailed";
  preview.model.collections = [
    {
      title: "Detalhamento",
      columns: ["Nome do registro", "Observação"],
      rows: Array.from({ length: 90 }, (_, i) => [
        "Registro " + (i + 1),
        "Observação administrativa",
      ]),
    },
  ];
  const prepared = await prepareReportDocument(preview.model);
  assert.ok(prepared.pages.length > 1);
  for (const page of prepared.pages)
    for (const block of page.blocks) {
      if (block.kind === "table") {
        assert.ok(block.headerLines.length);
        assert.ok(
          block.y +
            7 +
            block.headerHeight +
            block.rows.reduce((n, row) => n + row.height, 0) <=
            269,
        );
      }
    }
  assert.match(
    Buffer.from(await prepared.blob.arrayBuffer())
      .subarray(0, 8)
      .toString(),
    /%PDF/,
  );
});
test("campos longos são paginados sem cortar linhas ou extrapolar margens", async () => {
  const preview = { model: sampleReport() };
  preview.model.content = "detailed";
  const note = Array(700).fill("observação").join(" ");
  preview.model.collections = [
    {
      title: "Pendência longa",
      columns: ["Título", "Observações"],
      rows: [["Pendência", note]],
    },
  ];
  const prepared = await prepareReportDocument(preview.model);
  assert.ok(prepared.pages.length > 2);
  const blocks = prepared.pages
    .flatMap((p) => p.blocks)
    .filter((b) => b.kind === "table" && b.title.includes("Pendência longa"));
  assert.ok(blocks.length > 1);
  for (const b of blocks)
    assert.ok(
      b.y + 7 + b.headerHeight + b.rows.reduce((n, r) => n + r.height, 0) <=
        269,
    );
});
