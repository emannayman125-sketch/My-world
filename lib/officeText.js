// Reads the text out of a .docx or .xlsx right in the browser, with no
// extra packages: both are zip files full of XML, and modern browsers can
// inflate zip entries themselves (DecompressionStream). Returns plain
// text, rows joined by newlines and cells by " | ".

const dec = new TextDecoder("utf-8");

async function inflateRaw(bytes) {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// Minimal zip reader: walks the central directory.
async function readZip(buf) {
  const v = new DataView(buf);
  const u8 = new Uint8Array(buf);
  let eocd = -1;
  for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65557); i--) {
    if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error("not_zip");
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (v.getUint32(p, true) !== 0x02014b50) break;
    const method = v.getUint16(p + 10, true);
    const csize = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const extraLen = v.getUint16(p + 30, true);
    const commentLen = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const name = dec.decode(u8.subarray(p + 46, p + 46 + nameLen));
    const lNameLen = v.getUint16(local + 26, true);
    const lExtraLen = v.getUint16(local + 28, true);
    const start = local + 30 + lNameLen + lExtraLen;
    files[name] = { method, data: u8.subarray(start, start + csize) };
    p += 46 + nameLen + extraLen + commentLen;
  }
  return {
    async text(name) {
      const f = files[name];
      if (!f) return null;
      const bytes = f.method === 0 ? f.data : await inflateRaw(f.data);
      return dec.decode(bytes);
    },
    names: Object.keys(files),
  };
}

function unxml(s) {
  return s
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, "&");
}

async function docxText(zip) {
  const xml = await zip.text("word/document.xml");
  if (!xml) throw new Error("empty");
  return unxml(
    xml
      .replace(/<w:tab\/>/g, "\t")
      .replace(/<\/w:p>/g, "\n")
      .replace(/<w:br[^>]*\/>/g, "\n")
      .replace(/<[^>]+>/g, "")
  ).replace(/\n{3,}/g, "\n\n").trim();
}

function colIndex(ref) {
  const letters = (ref.match(/^[A-Z]+/) || ["A"])[0];
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

async function xlsxText(zip) {
  const sharedXml = (await zip.text("xl/sharedStrings.xml")) || "";
  const shared = [...sharedXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    unxml([...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""))
  );
  const sheets = zip.names.filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort();
  const out = [];
  for (const name of sheets) {
    const xml = await zip.text(name);
    const rows = [];
    for (const rm of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
      const cells = [];
      for (const cm of rm[1].matchAll(/<c\s([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const attrs = cm[1];
        const body = cm[2] || "";
        const ref = (attrs.match(/r="([A-Z]+\d+)"/) || [])[1] || "A1";
        const type = (attrs.match(/t="(\w+)"/) || [])[1];
        const raw = (body.match(/<v>([\s\S]*?)<\/v>/) || [])[1];
        let val = "";
        if (type === "s" && raw != null) val = shared[+raw] || "";
        else if (type === "inlineStr") val = unxml([...body.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((t) => t[1]).join(""));
        else if (raw != null) val = unxml(raw);
        cells[colIndex(ref)] = val;
      }
      const line = Array.from(cells, (c) => c || "").join(" | ").replace(/(\s\|\s)+$/, "").trim();
      if (line) rows.push(line);
    }
    if (rows.length) out.push((sheets.length > 1 ? `[${name.replace(/^.*\//, "").replace(".xml", "")}]\n` : "") + rows.join("\n"));
  }
  return out.join("\n\n").trim();
}

export async function officeFileToText(file) {
  const buf = await file.arrayBuffer();
  const zip = await readZip(buf);
  const lower = file.name.toLowerCase();
  const text = lower.endsWith(".docx") ? await docxText(zip) : await xlsxText(zip);
  return text.slice(0, 20000);
}

export function isOfficeFile(file) {
  return /\.(docx|xlsx)$/i.test(file.name);
}
