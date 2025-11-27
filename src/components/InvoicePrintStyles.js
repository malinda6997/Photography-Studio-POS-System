// Print-specific styles for invoice PDF generation
export const InvoicePrintStyles = () => (
  <style>{`
    @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        color: black !important;
        font-size: 12px !important;
        line-height: 1.4 !important;
      }
      
      .invoice-container {
        max-width: none !important;
        margin: 0 !important;
        padding: 20px !important;
        box-shadow: none !important;
        border: none !important;
      }
      
      .print\\:hidden {
        display: none !important;
      }
      
      .print\\:bg-none {
        background: white !important;
      }
      
      .print\\:text-black {
        color: black !important;
      }
      
      .print\\:border-none {
        border: none !important;
      }
      
      .print\\:shadow-none {
        box-shadow: none !important;
      }
      
      .bg-gradient-to-r,
      .bg-linear-to-r {
        background: linear-gradient(to right, #2563eb, #7c3aed) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      .bg-gradient-to-br,
      .bg-linear-to-br {
        background: linear-gradient(to bottom right, #f9fafb, #f3f4f6) !important;
        -webkit-print-color-adjust: exact !important;
      }
      
      /* Ensure proper page breaks */
      .invoice-header {
        page-break-inside: avoid;
      }
      
      .invoice-items {
        page-break-inside: auto;
      }
      
      .invoice-summary {
        page-break-inside: avoid;
      }
      
      /* Table styling for print */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
      }
      
      th, td {
        border: 1px solid #d1d5db !important;
        padding: 8px !important;
        text-align: left !important;
      }
      
      th {
        background: #f3f4f6 !important;
        font-weight: bold !important;
      }
      
      /* Page settings */
      @page {
        margin: 1cm;
        size: A4;
      }
    }
  `}</style>
);
