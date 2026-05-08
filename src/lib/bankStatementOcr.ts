import type { LoggerMessage } from "tesseract.js";

export type OcrProgress = {
  status: string;
  progress: number;
};

const isPdf = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

async function renderPdfPages(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.mjs",
    import.meta.url,
  ).toString();

  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pageImages: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Could not prepare PDF page for OCR.");
    }

    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    pageImages.push(canvas.toDataURL("image/png"));
  }

  return pageImages;
}

export async function extractBankStatementText(
  file: File,
  onProgress?: (progress: OcrProgress) => void,
) {
  const tesseract = await import("tesseract.js");
  const images = isPdf(file) ? await renderPdfPages(file) : [file];
  const pageTexts: string[] = [];

  for (let index = 0; index < images.length; index += 1) {
    const result = await tesseract.recognize(images[index], "eng", {
      logger: (message: LoggerMessage) => {
        onProgress?.({
          status: images.length > 1
            ? `Page ${index + 1}/${images.length}: ${message.status}`
            : message.status,
          progress: ((index + message.progress) / images.length) * 100,
        });
      },
    });
    pageTexts.push(result.data.text);
  }

  onProgress?.({ status: "OCR complete", progress: 100 });
  return pageTexts.join("\n");
}
