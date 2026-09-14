// Export PDF agenda surat (masuk/keluar) via pdfmake — sisi klien, tanpa server.
// Import dinamis: pdfmake hanya dimuat saat tombol ditekan.

type Row = Record<string, string | number | null>
export type Jenis = "masuk" | "keluar"

const SEKOLAH = "SMAN 1 BANTARUJEG"

const LABEL: Record<Jenis, { judul: string; kolom: Array<{ key: string; judul: string; w: number }> }> = {
  masuk: {
    judul: "LEMBAR AGENDA SURAT MASUK",
    kolom: [
      { key: "no_agenda", judul: "No. Agenda", w: 8 },
      { key: "tgl_surat", judul: "Tgl Surat", w: 9 },
      { key: "no_surat", judul: "No. Surat", w: 11 },
      { key: "pengirim", judul: "Pengirim", w: 16 },
      { key: "perihal", judul: "Perihal", w: 21 },
      { key: "sifat", judul: "Sifat", w: 7 },
      { key: "tujuan_disposisi", judul: "Ditulis ke", w: 12 },
      { key: "status", judul: "Status", w: 9 },
    ],
  },
  keluar: {
    judul: "LEMBAR AGENDA SURAT KELUAR",
    kolom: [
      { key: "no_agenda", judul: "No. Agenda", w: 8 },
      { key: "tgl_surat", judul: "Tgl Surat", w: 9 },
      { key: "no_surat", judul: "No. Surat", w: 11 },
      { key: "tujuan", judul: "Tujuan", w: 16 },
      { key: "perihal", judul: "Perihal", w: 23 },
      { key: "sifat", judul: "Sifat", w: 7 },
      { key: "cara_kirim", judul: "Cara Kirim", w: 10 },
      { key: "status", judul: "Status", w: 9 },
    ],
  },
}

// font TTF pdfmake hanya punya glif Latin → karakter eksotis dibuang/diganti
function sanitize(s: string) {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-")
    .replace(/…/g, "...").replace(/\u00a0/g, " ").replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
}

function tglPanjang(iso: string | null) {
  if (!iso) return "-"
  const d = new Date(iso)
  return isNaN(+d) ? iso : d.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
}

async function exportPdf(
  jenis: Jenis,
  rows: Row[],
  meta: { filter?: string; search?: string } = {},
) {
  if (!rows.length) return
  const cfg = LABEL[jenis]
  const [{ default: pdfMake }, vfs] = await Promise.all([
    import("pdfmake/build/pdfmake.js"),
    import("pdfmake/build/vfs_fonts.js"),
  ])
  const vfsObj = (vfs as { default?: unknown }).default ?? vfs
  pdfMake.vfs = vfsObj as Record<string, string>

  const ket = meta.filter && meta.filter !== "Semua" ? `Filter status: ${meta.filter}` : ""
  const cari = meta.search ? `Pencarian: "${sanitize(meta.search)}"` : ""
  const sub = [ket, cari].filter(Boolean).join("  ·  ")

  const doc = {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [28, 74, 28, 46] as number[],
    info: { title: `${cfg.judul} ${SEKOLAH}`, author: SEKOLAH },
    styles: {
      school: { fontSize: 14, bold: true },
      title: { fontSize: 13, bold: true, margin: [0, 3, 0, 1] as number[] },
      small: { fontSize: 8, color: "#555555" },
      th: { fontSize: 7.5, color: "white", bold: true },
      td: { fontSize: 8 },
    },
    defaultStyle: { font: "Roboto" },
    header: {
      table: {
        widths: ["*", "auto"],
        body: [[
          [
            { text: sanitize(SEKOLAH), style: "school" },
            { text: sanitize(cfg.judul), style: "title" },
            ...(sub ? [{ text: sanitize(sub), style: "small" }] : []),
          ],
          { text: ["Dicetak:", tglPanjang(new Date().toISOString())], alignment: "right", fontSize: 8, color: "#555555" },
        ]],
      },
      layout: "noBorders",
      margin: [28, 18, 28, 8] as number[],
    },
    footer: (page: number, pages: number) => ({
      text: `Halaman ${page} dari ${pages}  ·  ${rows.length} surat`,
      alignment: "center",
      fontSize: 7.5,
      color: "#888888",
      margin: [0, 6, 0, 0] as number[],
    }),
    content: [
      {
        table: {
          headerRows: 1,
          widths: cfg.kolom.map((c) => ({ percentage: c.w })),
          body: [
            cfg.kolom.map((c) => ({ text: sanitize(c.judul), style: "th" })),
            ...rows.map((r) =>
              cfg.kolom.map((c) => {
                const raw = c.key === "tgl_surat" ? tglPanjang(String(r[c.key] ?? "")) : String(r[c.key] ?? "-")
                return { text: sanitize(raw), style: "td" }
              }),
            ),
          ],
        },
        layout: {
          fillColor: (i: number) => (i === 0 ? "#1e3a8a" : i % 2 === 0 ? "#F4F6FB" : null),
          hLineColor: () => "#D6DBE6",
          vLineColor: () => "#D6DBE6",
          hLineWidth: (i: number) => (i <= 1 ? 0.8 : 0.4),
          vLineWidth: () => 0.4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
    ],
  } as Record<string, unknown>

  pdfMake.createPdf(doc as Parameters<typeof pdfMake.createPdf>[0]).download(
    `agenda-${jenis}-${new Date().toISOString().slice(0, 10)}.pdf`,
  )
}

export { exportPdf }
