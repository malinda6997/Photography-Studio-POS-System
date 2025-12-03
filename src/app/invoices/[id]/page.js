"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Separator } from "../../../components/ui/separator";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import {
  ArrowLeftIcon,
  PrinterIcon,
  CurrencyDollarIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function InvoiceDetails() {
  const params = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");
  const componentRef = useRef();

  const fetchInvoice = useCallback(async () => {
    if (!params.id) return;

    try {
      console.log(`Fetching invoice with ID: ${params.id}`);
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Invoice data received:", data);
        setInvoice(data);
        setNotes(data.notes || "");
      } else {
        const error = await response.json();
        console.error("Failed to fetch invoice:", error);
        setInvoice(null);
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id, fetchInvoice]);

  const handlePayment = async () => {
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      alert("Please enter a valid payment amount");
      return;
    }

    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          paymentAmount: parseFloat(paymentAmount),
          notes: notes,
        }),
      });

      if (response.ok) {
        const updatedInvoice = await response.json();
        setInvoice(updatedInvoice);
        setPaymentAmount("");
        setPaymentMode(false);
        alert("Payment recorded successfully");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to record payment");
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      alert("Error recording payment");
    }
  };

  // Enhanced print function using react-to-print
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Invoice_${
      invoice?.invoiceNo
    }_${invoice?.customer?.name?.replace(/\s+/g, "_")}`,
    onBeforeGetContent: () => {
      // Add print-ready class to optimize print styling
      if (componentRef.current) {
        componentRef.current.classList.add("pdf-ready");
      }
    },
    onAfterPrint: () => {
      // Remove print-ready class after printing
      if (componentRef.current) {
        componentRef.current.classList.remove("pdf-ready");
      }
    },
  });

  // PDF download function using react-to-print (simplified)
  const handleDownloadPDF = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Invoice_${invoice?.invoiceNo}_${
      invoice?.customer?.name?.replace(/\s+/g, "_") || "Customer"
    }`,
    onBeforeGetContent: () => {
      // Add print-ready class to optimize print styling
      if (componentRef.current) {
        componentRef.current.classList.add("pdf-ready");
      }
      return Promise.resolve();
    },
    onAfterPrint: () => {
      // Remove print-ready class after printing
      if (componentRef.current) {
        componentRef.current.classList.remove("pdf-ready");
      }
    },
  });

  // Simple and reliable PDF download function
  const handleSimplePDF = () => {
    if (!invoice) {
      alert("Invoice not loaded");
      return;
    }

    try {
      // Set document title for PDF filename
      const originalTitle = document.title;
      const fileName = `Invoice_${invoice.invoiceNo}_${
        invoice.customer?.name?.replace(/[^a-zA-Z0-9]/g, "_") || "Customer"
      }`;
      document.title = fileName;

      // Add PDF optimization classes
      document.body.classList.add("pdf-ready", "single-page-pdf");
      if (componentRef.current) {
        componentRef.current.classList.add("pdf-ready", "single-page-pdf");
      }

      // Hide non-printable elements
      const nonPrintElements = document.querySelectorAll(
        ".print\\:hidden, .no-print"
      );
      const originalStyles = [];
      nonPrintElements.forEach((el, index) => {
        originalStyles[index] = el.style.display;
        el.style.display = "none";
      });

      // Trigger print dialog
      setTimeout(() => {
        window.print();

        // Restore everything after print
        setTimeout(() => {
          document.title = originalTitle;
          document.body.classList.remove("pdf-ready", "single-page-pdf");
          if (componentRef.current) {
            componentRef.current.classList.remove(
              "pdf-ready",
              "single-page-pdf"
            );
          }
          nonPrintElements.forEach((el, index) => {
            el.style.display = originalStyles[index];
          });
        }, 100);
      }, 100);
    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  // Advanced PDF generation using html2canvas and jsPDF (Single Page)
  const handleAdvancedPDF = async () => {
    if (!invoice || !componentRef.current) {
      alert("Invoice not loaded or element not found");
      return;
    }

    try {
      // Show loading state
      const originalButtonContent = document.activeElement?.innerHTML;
      if (document.activeElement) {
        document.activeElement.innerHTML = "⏳ Generating PDF...";
        document.activeElement.disabled = true;
      }

      // Hide elements that shouldn't be in PDF
      const elementsToHide =
        componentRef.current.querySelectorAll(".print\\:hidden");
      elementsToHide.forEach((el) => (el.style.display = "none"));

      // Add PDF-ready styling for single page
      componentRef.current.classList.add("pdf-ready", "single-page-pdf");

      // Generate canvas from the invoice element
      const canvas = await html2canvas(componentRef.current, {
        scale: 1.5, // Optimized for single page
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: componentRef.current.scrollWidth,
        height: componentRef.current.scrollHeight,
        onclone: (clonedDoc) => {
          // Apply compact print styles to the cloned document
          const style = clonedDoc.createElement("style");
          style.textContent = `
            body { font-size: 11px !important; line-height: 1.2 !important; }
            .print\\:hidden { display: none !important; }
            .print\\:bg-none { background: white !important; }
            .print\\:text-black { color: black !important; }
            .bg-gradient-to-r { background: linear-gradient(to right, #2563eb, #7c3aed) !important; }
            .bg-gradient-to-br { background: linear-gradient(to bottom right, #f9fafb, #f3f4f6) !important; }
            .p-6 { padding: 16px !important; }
            .p-8 { padding: 20px !important; }
            .mb-8 { margin-bottom: 16px !important; }
            .mb-6 { margin-bottom: 12px !important; }
            table { font-size: 10px !important; }
            th, td { padding: 4px !important; }
          `;
          clonedDoc.head.appendChild(style);
        },
      });

      // Create PDF (single page, fit content)
      const imgData = canvas.toDataURL("image/png", 0.8);
      const pdf = new jsPDF("p", "mm", "a4");

      // Calculate dimensions to fit on single page
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      const margin = 10;
      const availableWidth = pdfWidth - margin * 2;
      const availableHeight = pdfHeight - margin * 2;

      const imgAspectRatio = canvas.width / canvas.height;
      let imgWidth = availableWidth;
      let imgHeight = availableWidth / imgAspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > availableHeight) {
        imgHeight = availableHeight;
        imgWidth = availableHeight * imgAspectRatio;
      }

      // Center the image on the page
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      // Add image to PDF (single page only)
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

      // Save the PDF
      const filename = `Invoice_${invoice.invoiceNo}_${
        invoice.customer?.name?.replace(/\s+/g, "_") || "Customer"
      }.pdf`;
      pdf.save(filename);

      // Restore elements and states
      elementsToHide.forEach((el) => (el.style.display = ""));
      componentRef.current.classList.remove("pdf-ready", "single-page-pdf");

      if (document.activeElement) {
        document.activeElement.innerHTML = originalButtonContent || "📄";
        document.activeElement.disabled = false;
      }
    } catch (error) {
      console.error("Advanced PDF generation error:", error);
      alert("Error generating PDF. Please try the simple PDF or Print option.");

      // Restore button state
      if (document.activeElement) {
        document.activeElement.innerHTML = "📄";
        document.activeElement.disabled = false;
      }
    }
  };

  const getStatusColor = (status) => {
    // Black background with white text for all statuses
    return "bg-black text-white px-2 py-1 font-semibold";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Invoice Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            The invoice you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link href="/invoices">
            <Button>Back to Invoices</Button>
          </Link>
        </div>
      </div>
    );
  }

  const remainingBalance = invoice.subtotal - invoice.totalPaid;

  return (
    <div
      className="container mx-auto px-6 py-8 max-w-4xl invoice-container"
      data-invoice="true"
    >
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/invoices">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back to Invoices
          </Button>
        </Link>
        <div className="flex gap-2">
          {remainingBalance > 0 && (
            <Button
              onClick={() => setPaymentMode(!paymentMode)}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <CurrencyDollarIcon className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button
            onClick={handleSimplePDF}
            variant="outline"
            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            title="Download as PDF (Works with Ctrl+P → Save as PDF)"
          >
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
            Download PDF
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600"
          >
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {paymentMode && remainingBalance > 0 && (
        <Card className="mb-6 print:hidden">
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentAmount">Payment Amount</Label>
                <Input
                  id="paymentAmount"
                  type="number"
                  placeholder={`Max: $${remainingBalance.toFixed(2)}`}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  max={remainingBalance}
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Payment notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handlePayment}>Record Payment</Button>
              <Button variant="outline" onClick={() => setPaymentMode(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card
        className="print:shadow-none print:border-none print:m-0"
        ref={componentRef}
      >
        {/* Simple Professional Header */}
        <div className="bg-white p-6 print:p-4">
          {/* Centered Logo */}
          <div className="text-center mb-6 print:mb-4">
            <img
              src="/logo.png"
              alt="Shine Art Studio"
              className="h-24 w-auto print:h-20 mx-auto mb-3 print:mb-2"
              style={{ maxWidth: "300px", height: "auto" }}
            />
            <div className="text-lg text-black print:text-base">
              Photography & Digital Printing | Professional Studio Services
            </div>
            <div className="text-sm text-black print:text-xs mt-2">
              (555) 123-4567 | info@shineartstudio.com | 123 Photography Street,
              Studio City, CA 90210
            </div>
          </div>

          {/* Invoice Header */}
          <div className="text-center border-t border-b border-black py-4 print:py-3 mb-6 print:mb-4">
            <h1 className="text-3xl font-bold print:text-xl text-black">
              INVOICE
            </h1>
            <div className="text-xl print:text-lg font-semibold mt-2 text-black">
              #{invoice.invoiceNo}
            </div>
            <div className="text-base print:text-sm mt-1 text-black">
              Date: {new Date(invoice.date).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Simple Information Section */}
        <div className="p-6 print:p-4">
          <div className="grid grid-cols-2 gap-8 print:gap-6 mb-8 print:mb-6">
            {/* Bill To Section */}
            <div>
              <h3 className="text-lg font-bold mb-4 print:text-base print:mb-3 text-black">
                BILL TO:
              </h3>
              <div className="space-y-2 print:space-y-1">
                <div className="text-lg font-bold text-black print:text-base">
                  {invoice.customer?.name}
                </div>
                <div className="text-base print:text-sm text-black">
                  {invoice.customer?.mobile}
                </div>
                {invoice.customer?.email && (
                  <div className="text-base print:text-sm text-black">
                    {invoice.customer.email}
                  </div>
                )}
                <div className="text-sm print:text-xs text-black mt-3">
                  Customer ID: {invoice.customer?._id?.slice(-6) || "N/A"}
                </div>
              </div>
            </div>

            {/* Invoice Details */}
            <div className="text-right">
              <h3 className="text-lg font-bold mb-4 print:text-base print:mb-3 text-black">
                INVOICE DETAILS:
              </h3>
              <div className="space-y-2 print:space-y-1">
                <div className="text-base print:text-sm text-black">
                  <strong>Status:</strong>
                  <Badge
                    className={`${getStatusColor(
                      invoice.paymentStatus
                    )} text-sm print:text-xs ml-2`}
                  >
                    {invoice.paymentStatus?.toUpperCase()}
                  </Badge>
                </div>
                <div className="text-base print:text-sm text-black">
                  <strong>Created by:</strong> {invoice.createdBy?.name}
                </div>
                <div className="text-base print:text-sm text-black">
                  <strong>Due Date:</strong>{" "}
                  {new Date(
                    new Date(invoice.date).getTime() + 30 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
                </div>
                <div className="text-sm print:text-xs text-black">
                  Invoice ID: {invoice._id?.slice(-8) || "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Simple Services Table */}
          <div className="mb-8 print:mb-6">
            <h2 className="text-xl font-bold print:text-lg mb-4 print:mb-3 text-black">
              SERVICE DETAILS
            </h2>

            <table className="w-full text-base print:text-sm border-collapse border border-black">
              <thead>
                <tr className="border-b border-black">
                  <th className="text-left p-4 print:p-3 font-bold text-black">
                    Description
                  </th>
                  <th className="text-center p-4 print:p-3 font-bold text-black">
                    Qty
                  </th>
                  <th className="text-right p-4 print:p-3 font-bold text-black">
                    Rate
                  </th>
                  <th className="text-right p-4 print:p-3 font-bold text-black">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoice.items?.map((item, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-300 print:border-black"
                  >
                    <td className="p-4 print:p-3 text-left text-black">
                      {item.description}
                    </td>
                    <td className="p-4 print:p-3 text-center text-black">
                      {item.qty}
                    </td>
                    <td className="p-4 print:p-3 text-right text-black">
                      ${item.unitPrice?.toFixed(2)}
                    </td>
                    <td className="p-4 print:p-3 text-right font-semibold text-black">
                      ${item.total?.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Simple Payment Summary */}
          <div className="flex justify-between items-start">
            <div className="w-1/2">
              {invoice.notes && (
                <div>
                  <h3 className="text-lg font-bold mb-3 print:text-base print:mb-2 text-black">
                    ADDITIONAL NOTES:
                  </h3>
                  <p className="text-base print:text-sm text-black leading-relaxed">
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>

            <div className="w-80 print:w-64">
              <h3 className="text-lg font-bold mb-4 print:text-base print:mb-3 text-center text-black">
                PAYMENT SUMMARY
              </h3>
              <div className="p-4 print:p-3">
                <div className="space-y-3 print:space-y-2">
                  <div className="flex justify-between text-base print:text-sm">
                    <span className="font-medium text-black">Subtotal:</span>
                    <span className="font-bold text-black">
                      ${invoice.subtotal?.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-base print:text-sm">
                    <span className="font-medium text-black">Amount Paid:</span>
                    <span className="font-bold text-black">
                      ${invoice.totalPaid?.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-3 print:pt-2">
                    {remainingBalance > 0 && (
                      <div className="flex justify-between text-lg print:text-base font-bold">
                        <span className="text-black">BALANCE DUE:</span>
                        <span className="text-black">
                          ${remainingBalance.toFixed(2)}
                        </span>
                      </div>
                    )}
                    {remainingBalance <= 0 && (
                      <div className="text-center">
                        <div className="text-black font-bold text-lg print:text-base">
                          FULLY PAID
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Footer at Bottom */}
      <div className="mt-16 print:mt-12 text-center">
        <div className="text-base print:text-sm font-bold mb-2 print:mb-1 text-black">
          THANK YOU FOR YOUR BUSINESS
        </div>
        <div className="text-sm print:text-xs text-black">
          Questions about this invoice? Contact us at info@shineartstudio.com or
          (555) 123-4567
        </div>
        <div className="text-xs print:text-xs mt-2 print:mt-1 text-black">
          Shine Art Studio - Professional Photography Services - Invoice #
          {invoice.invoiceNo}
        </div>
      </div>
    </div>
  );
}
