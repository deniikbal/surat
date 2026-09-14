declare module "pdfmake/build/pdfmake.js" {
  interface PdfMakeDoc {}
  interface PdfMakeInstance {
    vfs: Record<string, string>
    createPdf: (doc: unknown) => { download: (filename?: string) => void }
  }
  const pdfMake: PdfMakeInstance
  export default pdfMake
}

declare module "pdfmake/build/vfs_fonts.js" {
  const vfs: { pdfMake?: { vfs: Record<string, string> } } & Record<string, string>
  export = vfs
}
