import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import * as pdfjsLib from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { pdfUrl, saveProgress } from "./api";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type PdfReaderProps = {
  bookId: string;
  onSelection: (selection: string, pageNumber: number) => void;
  onProgressSaved: () => void;
};

type TextItemLike = {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
};

export function PdfReader({ bookId, onSelection, onProgressSaved }: PdfReaderProps) {
  const [pdf, setPdf] = useState<PDFDocumentProxy | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [status, setStatus] = useState("Loading PDF");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textLayerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    setPdf(null);
    setPageNumber(1);
    setPageCount(0);
    setStatus("Loading PDF");

    pdfjsLib
      .getDocument(pdfUrl(bookId))
      .promise.then((document) => {
        if (cancelled) {
          document.destroy();
          return;
        }
        setPdf(document);
        setPageCount(document.numPages);
        setStatus("");
      })
      .catch((error: unknown) => {
        setStatus(error instanceof Error ? error.message : "Failed to load PDF");
      });

    return () => {
      cancelled = true;
    };
  }, [bookId]);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !textLayerRef.current) {
      return;
    }

    let cancelled = false;
    const canvas = canvasRef.current;
    const textLayer = textLayerRef.current;
    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    setStatus("Rendering page");
    textLayer.replaceChildren();

    pdf.getPage(pageNumber).then(async (page) => {
      if (cancelled) {
        return;
      }

      const viewport = page.getViewport({ scale });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      textLayer.style.width = `${viewport.width}px`;
      textLayer.style.height = `${viewport.height}px`;

      await page.render({ canvasContext: context, viewport }).promise;
      if (cancelled) {
        return;
      }

      const textContent = await page.getTextContent();
      textLayer.replaceChildren(
        ...textContent.items.flatMap((item) => {
          if (!("str" in item) || !item.str.trim()) {
            return [];
          }

          return [
            createTextSpan(
              {
                str: item.str,
                transform: item.transform,
                width: item.width,
                height: item.height
              },
              viewport
            )
          ];
        })
      );

      setStatus("");
      void saveProgress(bookId, pageNumber, pdf.numPages).then(onProgressSaved).catch(() => undefined);
    });

    return () => {
      cancelled = true;
    };
  }, [bookId, onProgressSaved, pageNumber, pdf, scale]);

  function handleMouseUp() {
    const selection = window.getSelection()?.toString().replace(/\s+/g, " ").trim() ?? "";
    if (selection) {
      onSelection(selection, pageNumber);
    }
  }

  return (
    <section className="reader-main" aria-label="PDF reader">
      <div className="reader-toolbar">
        <button type="button" className="icon-button" onClick={() => setPageNumber((page) => Math.max(1, page - 1))}>
          <ChevronLeft size={18} />
          <span className="sr-only">Previous page</span>
        </button>
        <div className="page-meter">
          {pageNumber} / {pageCount || "-"}
        </div>
        <button
          type="button"
          className="icon-button"
          onClick={() => setPageNumber((page) => Math.min(pageCount || page, page + 1))}
        >
          <ChevronRight size={18} />
          <span className="sr-only">Next page</span>
        </button>
        <div className="toolbar-divider" />
        <button type="button" className="icon-button" onClick={() => setScale((value) => Math.max(0.7, value - 0.1))}>
          <ZoomOut size={18} />
          <span className="sr-only">Zoom out</span>
        </button>
        <button type="button" className="icon-button" onClick={() => setScale((value) => Math.min(2.2, value + 0.1))}>
          <ZoomIn size={18} />
          <span className="sr-only">Zoom in</span>
        </button>
      </div>

      <div className="pdf-scroll">
        {status ? (
          <div className="loading-state">
            <Loader2 size={20} className="spin" />
            <span>{status}</span>
          </div>
        ) : null}
        <div className="pdf-page" onMouseUp={handleMouseUp}>
          <canvas ref={canvasRef} />
          <div ref={textLayerRef} className="text-layer" />
        </div>
      </div>
    </section>
  );
}

function createTextSpan(item: TextItemLike, viewport: { transform: number[] }) {
  const span = document.createElement("span");
  const transform = pdfjsLib.Util.transform(viewport.transform, item.transform);
  const fontHeight = Math.hypot(transform[2], transform[3]);
  const left = transform[4];
  const top = transform[5] - fontHeight;

  span.textContent = item.str;
  span.style.left = `${left}px`;
  span.style.top = `${top}px`;
  span.style.fontSize = `${fontHeight}px`;
  span.style.height = `${fontHeight}px`;
  span.style.position = "absolute";
  span.style.whiteSpace = "pre";
  span.style.color = "transparent";
  span.style.cursor = "text";
  span.style.transformOrigin = "0% 0%";
  return span;
}
