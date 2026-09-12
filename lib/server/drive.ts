// Upload lampiran surat ke Google Drive — pakai kredensial OAuth yang sama
// dengan Rekapin (folder terpisah: "Surat SMAN 1 Bantarujeg").
const CID = process.env.GOOGLE_DRIVE_CLIENT_ID
const CSEC = process.env.GOOGLE_DRIVE_CLIENT_SECRET
const RT = process.env.GOOGLE_DRIVE_REFRESH_TOKEN
const FOLDER = process.env.GOOGLE_DRIVE_FOLDER_ID

let cached: { token: string; exp: number } | null = null

async function token() {
  if (cached && cached.exp > Date.now()) return cached.token
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CID ?? "",
      client_secret: CSEC ?? "",
      refresh_token: RT ?? "",
      grant_type: "refresh_token",
    }),
  })
  const json = await res.json()
  if (!json.access_token) throw new Error("Drive token gagal: " + JSON.stringify(json).slice(0, 200))
  cached = { token: json.access_token, exp: Date.now() + 50 * 60 * 1000 }
  return json.access_token
}

export function driveViewUrl(fileId: string) {
  return `https://drive.google.com/file/d/${fileId}/view`
}

// uploadType=multipart: metadata JSON + isi file dalam satu request.
export async function uploadLampiran(file: File): Promise<{ fileId: string; name: string }> {
  if (!CID || !CSEC || !RT || !FOLDER) throw new Error("Kredensial Google Drive belum diisi")
  const tk = await token()
  const name = `${Date.now()}_${file.name.replace(/[^\w.\-() ]+/g, "_").slice(0, 120)}`
  const boundary = "----surat" + Date.now()
  const buf = Buffer.from(await file.arrayBuffer())
  const head = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      JSON.stringify({ name, parents: [FOLDER] }) +
      `\r\n--${boundary}\r\nContent-Type: ${file.type || "application/octet-stream"}\r\n\r\n`,
  )
  const tail = Buffer.from(`\r\n--${boundary}--`)

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${tk}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: Buffer.concat([head, buf, tail]),
    },
  )
  const json = await res.json()
  if (!json.id) throw new Error("Upload Drive gagal: " + JSON.stringify(json).slice(0, 200))

  // supaya link bisa dibuka petugas lain tanpa login Google.
  await fetch(`https://www.googleapis.com/drive/v3/files/${json.id}/permissions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${tk}`, "Content-Type": "application/json" },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  }).catch(() => undefined)

  return { fileId: json.id, name: file.name }
}

export async function deleteLampiran(fileId: string) {
  const tk = await token()
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${tk}` },
  })
  // 404 = sudah tidak ada di Drive, anggap beres.
  if (!res.ok && res.status !== 404) throw new Error("Hapus Drive gagal: " + res.status)
}
