interface ShareReportPdfOptions {
  element: HTMLElement;
  filename: string;
  title: string;
  shareText: string;
}

export type ShareReportPdfResult = "shared" | "downloaded" | "cancelled";

const PDF_WIDTH_MM = 297;
const PDF_HEIGHT_MM = 210;
const PDF_MARGIN_MM = 10;
const PDF_GAP_MM = 4;
const REPORT_WIDTH_PX = 1024;

function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function waitForReportContent(element: HTMLElement) {
  const deadline = Date.now() + 10000;
  while (
    element.querySelector('[data-pdf-loading="true"]') &&
    Date.now() < deadline
  ) {
    await new Promise((resolve) => window.setTimeout(resolve, 100));
  }
}

export async function shareReportPdf({
  element,
  filename,
  title,
  shareText,
}: ShareReportPdfOptions): Promise<ShareReportPdfResult> {
  const [{ default: html2canvas }, { jsPDF }, { autoTable }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  await document.fonts.ready;
  await waitForReportContent(element);

  const report = element.cloneNode(true) as HTMLElement;
  Object.assign(report.style, {
    position: "fixed",
    left: "-12000px",
    top: "0",
    width: `${REPORT_WIDTH_PX}px`,
    maxWidth: "none",
    backgroundColor: "#f9fafb",
    pointerEvents: "none",
    zIndex: "2147483647",
  });
  document.body.appendChild(report);

  try {
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
      compress: true,
    });
    pdf.setProperties({
      title,
      subject: shareText,
      creator: "Project Shepherd",
    });

    const contentWidth = PDF_WIDTH_MM - PDF_MARGIN_MM * 2;
    const contentHeight = PDF_HEIGHT_MM - PDF_MARGIN_MM * 2;
    const sections = Array.from(
      report.querySelectorAll<HTMLElement>(
        "[data-pdf-section], [data-pdf-table-section]",
      ),
    );
    const elements = sections.length > 0 ? sections : [report];
    let cursorY = PDF_MARGIN_MM;
    let hasContent = false;

    const addPage = () => {
      if (hasContent) {
        pdf.addPage("a4", "landscape");
      }
      cursorY = PDF_MARGIN_MM;
      hasContent = true;
    };

    for (const section of elements) {
      if (section.hasAttribute("data-pdf-table-section")) {
        const table = section.querySelector<HTMLTableElement>("[data-pdf-table]");
        if (!table) continue;

        if (hasContent && cursorY + 24 > PDF_HEIGHT_MM - PDF_MARGIN_MM) {
          addPage();
        } else if (!hasContent) {
          hasContent = true;
        }

        const sectionTitle = section.dataset.pdfTitle || "Detalle de asistencia";
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor(31, 41, 55);
        pdf.text(sectionTitle, PDF_MARGIN_MM, cursorY + 4);
        cursorY += 8;

        autoTable(pdf, {
          html: table,
          startY: cursorY,
          margin: {
            top: 18,
            right: PDF_MARGIN_MM,
            bottom: PDF_MARGIN_MM,
            left: PDF_MARGIN_MM,
          },
          theme: "grid",
          showHead: "everyPage",
          horizontalPageBreak: true,
          horizontalPageBreakRepeat: 0,
          horizontalPageBreakBehaviour: "immediately",
          styles: {
            font: "helvetica",
            fontSize: 7,
            cellPadding: 1.5,
            halign: "center",
            valign: "middle",
            lineColor: [226, 232, 240],
            lineWidth: 0.1,
            textColor: [55, 65, 81],
          },
          headStyles: {
            fillColor: [79, 70, 229],
            textColor: [255, 255, 255],
            fontStyle: "bold",
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: {
              cellWidth: 55,
              halign: "left",
              fontStyle: "bold",
            },
          },
          willDrawPage: (data) => {
            if (data.pageNumber === 1) return;
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);
            pdf.setTextColor(79, 70, 229);
            pdf.text(
              `${sectionTitle} (continuación)`,
              PDF_MARGIN_MM,
              PDF_MARGIN_MM,
            );
          },
        });

        const tableState = (
          pdf as unknown as { lastAutoTable?: { finalY?: number } }
        ).lastAutoTable;
        cursorY = (tableState?.finalY ?? PDF_MARGIN_MM) + PDF_GAP_MM;
        continue;
      }

      const reportRect = report.getBoundingClientRect();
      const sectionRect = section.getBoundingClientRect();
      const renderX =
        PDF_MARGIN_MM +
        ((sectionRect.left - reportRect.left) / reportRect.width) * contentWidth;
      const renderWidth = (sectionRect.width / reportRect.width) * contentWidth;
      const canvas = await html2canvas(section, {
        backgroundColor: "#ffffff",
        logging: false,
        scale: 2,
        useCORS: true,
      });
      const sectionHeight = (canvas.height * renderWidth) / canvas.width;

      if (sectionHeight <= contentHeight) {
        if (hasContent && cursorY + sectionHeight > PDF_HEIGHT_MM - PDF_MARGIN_MM) {
          addPage();
        } else if (!hasContent) {
          hasContent = true;
        }

        pdf.addImage(
          canvas.toDataURL("image/png"),
          "PNG",
          renderX,
          cursorY,
          renderWidth,
          sectionHeight,
          undefined,
          "FAST",
        );
        cursorY += sectionHeight + PDF_GAP_MM;
        continue;
      }

      const maxSliceHeightPx = Math.floor(
        (contentHeight * canvas.width) / renderWidth,
      );

      for (let offsetY = 0; offsetY < canvas.height; offsetY += maxSliceHeightPx) {
        if (hasContent && cursorY > PDF_MARGIN_MM) {
          addPage();
        } else if (!hasContent) {
          hasContent = true;
        }

        const sliceHeightPx = Math.min(maxSliceHeightPx, canvas.height - offsetY);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeightPx;
        const context = slice.getContext("2d");
        if (!context) {
          throw new Error("Unable to create the PDF canvas.");
        }
        context.drawImage(
          canvas,
          0,
          offsetY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx,
        );

        const sliceHeight = (sliceHeightPx * renderWidth) / canvas.width;
        pdf.addImage(
          slice.toDataURL("image/png"),
          "PNG",
          renderX,
          PDF_MARGIN_MM,
          renderWidth,
          sliceHeight,
          undefined,
          "FAST",
        );
        cursorY = PDF_MARGIN_MM + sliceHeight + PDF_GAP_MM;
      }
    }

    const file = new File([pdf.output("blob")], filename, {
      type: "application/pdf",
    });

    if (
      typeof navigator.share === "function" &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({
          files: [file],
          title,
          text: shareText,
        });
        return "shared";
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return "cancelled";
        }
        downloadFile(file);
        return "downloaded";
      }
    }

    downloadFile(file);
    return "downloaded";
  } finally {
    report.remove();
  }
}
