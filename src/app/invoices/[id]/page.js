"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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
} from "@heroicons/react/24/outline";
import Link from "next/link";

export default function InvoiceDetails() {
  const params = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMode, setPaymentMode] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [notes, setNotes] = useState("");

  const fetchInvoice = useCallback(async () => {
    try {
      const response = await fetch(`/api/invoices/${params.id}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
        setNotes(data.notes || "");
      } else {
        console.error("Failed to fetch invoice");
      }
    } catch (error) {
      console.error("Error fetching invoice:", error);
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

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "partial":
        return "bg-yellow-100 text-yellow-800";
      case "pending":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
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
    <div className="container mx-auto px-6 py-8 max-w-4xl">
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
            >
              <CurrencyDollarIcon className="mr-2 h-4 w-4" />
              Record Payment
            </Button>
          )}
          <Button onClick={handlePrint} variant="outline">
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

      <Card className="print:shadow-none">
        <CardHeader className="text-center border-b">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-blue-600">
              Shine Art Studio
            </h1>
            <p className="text-gray-600">
              Photography & Digital Printing Services
            </p>
          </div>
          <div className="flex justify-between items-start">
            <div className="text-left">
              <h2 className="text-xl font-semibold">Invoice Details</h2>
              <p className="text-gray-600">Invoice #{invoice.invoiceNo}</p>
              <p className="text-sm text-gray-500">
                Date: {new Date(invoice.date).toLocaleDateString()}
              </p>
            </div>
            <Badge
              className={`${getStatusColor(invoice.paymentStatus)} text-sm`}
            >
              {invoice.paymentStatus?.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Name:</strong> {invoice.customer?.name}
                </p>
                <p>
                  <strong>Mobile:</strong> {invoice.customer?.mobile}
                </p>
                {invoice.customer?.email && (
                  <p>
                    <strong>Email:</strong> {invoice.customer.email}
                  </p>
                )}
                {invoice.customer?.address && (
                  <p>
                    <strong>Address:</strong> {invoice.customer.address}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Invoice Information</h3>
              <div className="space-y-1 text-sm">
                <p>
                  <strong>Created by:</strong> {invoice.createdBy?.name}
                </p>
                <p>
                  <strong>Created:</strong>{" "}
                  {new Date(invoice.createdAt).toLocaleString()}
                </p>
                {invoice.updatedAt &&
                  invoice.updatedAt !== invoice.createdAt && (
                    <p>
                      <strong>Updated:</strong>{" "}
                      {new Date(invoice.updatedAt).toLocaleString()}
                    </p>
                  )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="mb-6">
            <h3 className="font-semibold mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="text-left p-2">Description</th>
                    <th className="text-center p-2">Type</th>
                    <th className="text-center p-2">Qty</th>
                    <th className="text-right p-2">Unit Price</th>
                    <th className="text-right p-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items?.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2">{item.description}</td>
                      <td className="text-center p-2 capitalize">
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </td>
                      <td className="text-center p-2">{item.qty}</td>
                      <td className="text-right p-2">
                        ${item.unitPrice?.toFixed(2)}
                      </td>
                      <td className="text-right p-2 font-semibold">
                        ${item.total?.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-semibold">
                  ${invoice.subtotal?.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Total Paid:</span>
                <span className="font-semibold">
                  ${invoice.totalPaid?.toFixed(2)}
                </span>
              </div>
              {remainingBalance > 0 && (
                <div className="flex justify-between text-red-600 border-t pt-2">
                  <span className="font-semibold">Balance Due:</span>
                  <span className="font-bold">
                    ${remainingBalance.toFixed(2)}
                  </span>
                </div>
              )}
              {remainingBalance <= 0 && (
                <div className="flex justify-between text-green-600 border-t pt-2">
                  <span className="font-semibold">Status:</span>
                  <span className="font-bold">PAID IN FULL</span>
                </div>
              )}
            </div>
          </div>

          {invoice.notes && (
            <>
              <Separator className="my-6" />
              <div>
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                  {invoice.notes}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div className="mt-6 text-center text-xs text-gray-500 print:block">
        <p>Thank you for choosing Shine Art Studio!</p>
        <p>For inquiries, please contact us at your convenience.</p>
      </div>
    </div>
  );
}
