import { saveAs } from "file-saver";
import { PDF } from "../pages/combine-pdf/types";

function extractFileName(pdfFiles: PDF[]): string {
    let _file_name = "";

    pdfFiles.forEach((pdf) => {
        _file_name += `_${pdf.title.split(".pdf")[0].split(" ")[0]}`;
    })

    return _file_name;
}

export default async function mergePDF(pdfFiles: PDF[]) {
    const fileName = extractFileName(pdfFiles);

    // pdf-lib is only needed once someone actually combines documents, but this
    // module is pulled in eagerly by the Redux store. Importing it here keeps it
    // out of the entry chunk so it is fetched on first use instead of on load.
    const { PDFDocument } = await import("pdf-lib");

    // eslint-disable-next-line no-useless-catch
    try {
        const finalPdfDoc = await PDFDocument.create();

        // This works but, some promise resolve before the others: which then scatters the order of the files.
        // await Promise.all(
        //   pdfFiles.map(async (pdf) => {
        //     const pdfBytes = await fetch(pdf.source).then((res) => res.arrayBuffer());

        //     const pdfDoc = await PDFDocument.load(pdfBytes);

        //     const copiedPages = await finalPdfDoc.copyPages(
        //       pdfDoc,
        //       pdfDoc.getPageIndices()
        //     );

        //     copiedPages.forEach((page) => finalPdfDoc.addPage(page));
        //   })
        // )

        for (let index = 0; index < pdfFiles.length; index++) {
            const pdf = pdfFiles[index];
            console.log("Combining ", pdfFiles[index].title);
            const pdfBytes = await fetch(pdf.source).then((res) => res.arrayBuffer());

            const pdfDoc = await PDFDocument.load(pdfBytes);

            const copiedPages = await finalPdfDoc.copyPages(
                pdfDoc,
                pdfDoc.getPageIndices()
            );

            copiedPages.forEach((page) => finalPdfDoc.addPage(page));
        }

        // It now works!
        const finalPdfBytes = await finalPdfDoc.save();

        saveAs(
            new Blob([finalPdfBytes], { type: "application/pdf" }),
            fileName ?? "pdf-lib_modification.pdf"
        );
    } catch (error) {
        // throw error;
        console.log(error)
    }
}
