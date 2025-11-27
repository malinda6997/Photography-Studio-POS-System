"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../components/AuthProvider";
import Layout from "../../components/Layout";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

export default function CreateInvoicePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [showNewCustomer, setShowNewCustomer] = useState(false);

  const [invoiceData, setInvoiceData] = useState({
    customerId: "",
    items: [
      {
        type: "service",
        description: "",
        qty: 1,
        unitPrice: 0,
        refId: null,
      },
    ],
    advancePaid: 0,
    notes: "",
  });

  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    email: "",
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
    fetchFrames();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchFrames = async () => {
    try {
      const response = await fetch("/api/frames", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setFrames(data);
      }
    } catch (error) {
      console.error("Failed to fetch frames:", error);
    }
  };

  const handleAddItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          type: "service",
          description: "",
          qty: 1,
          unitPrice: 0,
          refId: null,
        },
      ],
    }));
  };

  const handleRemoveItem = (index) => {
    if (invoiceData.items.length > 1) {
      setInvoiceData((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleItemChange = (index, field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };

          // If type changes to frame, find the frame details
          if (field === "type" && value === "frame") {
            updatedItem.refId = null;
            updatedItem.description = "";
            updatedItem.unitPrice = 0;
          } else if (field === "refId" && value) {
            const selectedFrame = frames.find((f) => f._id === value);
            if (selectedFrame) {
              updatedItem.description = selectedFrame.name;
              updatedItem.unitPrice = selectedFrame.unitPrice;
            }
          }

          return updatedItem;
        }
        return item;
      }),
    }));
  };

  const calculateTotal = () => {
    return invoiceData.items.reduce((total, item) => {
      return total + item.qty * item.unitPrice;
    }, 0);
  };

  const handleCreateCustomer = async () => {
    try {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(newCustomer),
      });

      if (response.ok) {
        const customer = await response.json();
        setCustomers((prev) => [customer, ...prev]);
        setInvoiceData((prev) => ({ ...prev, customerId: customer._id }));
        setNewCustomer({ name: "", mobile: "", email: "", notes: "" });
        setShowNewCustomer(false);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create customer");
      }
    } catch (error) {
      console.error("Create customer error:", error);
      alert("Failed to create customer");
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    if (!invoiceData.customerId) {
      alert("Please select a customer");
      return;
    }

    if (
      invoiceData.items.some(
        (item) => !item.description || item.qty <= 0 || item.unitPrice < 0
      )
    ) {
      alert("Please fill in all item details correctly");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(invoiceData),
      });

      if (response.ok) {
        const invoice = await response.json();
        alert("Invoice created successfully!");
        router.push(`/invoices/${invoice._id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create invoice");
      }
    } catch (error) {
      console.error("Create invoice error:", error);
      alert("Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.mobile.includes(customerSearch)
  );

  return (
    <Layout>
      <div className="py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Create Invoice
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Generate a new invoice for customer orders
            </p>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Customer Information
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(!showNewCustomer)}
                  className="text-indigo-600 hover:text-indigo-500 flex items-center text-sm"
                >
                  <UserPlusIcon className="h-4 w-4 mr-1" />
                  New Customer
                </button>
              </div>

              {showNewCustomer ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={newCustomer.name}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Mobile Number *"
                    value={newCustomer.mobile}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        mobile: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                  <input
                    type="email"
                    placeholder="Email (Optional)"
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCreateCustomer}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Add Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(false)}
                      className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="relative mb-4">
                    <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <select
                    value={invoiceData.customerId}
                    onChange={(e) =>
                      setInvoiceData((prev) => ({
                        ...prev,
                        customerId: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Select a customer</option>
                    {filteredCustomers.map((customer) => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.mobile}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Invoice Items
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-indigo-600 hover:text-indigo-500 flex items-center text-sm"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {invoiceData.items.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-12 gap-4 items-end p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  >
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) =>
                          handleItemChange(index, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="service">Service</option>
                        <option value="frame">Frame</option>
                      </select>
                    </div>

                    {item.type === "frame" ? (
                      <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Frame
                        </label>
                        <select
                          value={item.refId || ""}
                          onChange={(e) =>
                            handleItemChange(index, "refId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select a frame</option>
                          {frames.map((frame) => (
                            <option key={frame._id} value={frame._id}>
                              {frame.name} (LKR {frame.unitPrice})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="col-span-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          placeholder="Enter service description"
                        />
                      </div>
                    )}

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "qty",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            index,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        disabled={item.type === "frame" && item.refId}
                      />
                    </div>

                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-sm font-medium">
                        {(item.qty * item.unitPrice).toFixed(2)}
                      </div>
                    </div>

                    <div className="col-span-1">
                      {invoiceData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          className="p-2 text-red-600 hover:text-red-800"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary and Payment */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Additional Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Advance Payment
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={invoiceData.advancePaid}
                        onChange={(e) =>
                          setInvoiceData((prev) => ({
                            ...prev,
                            advancePaid: parseFloat(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        value={invoiceData.notes}
                        onChange={(e) =>
                          setInvoiceData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        rows="3"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Additional notes..."
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                    Invoice Summary
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>LKR {calculateTotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Advance Payment:</span>
                      <span>LKR {invoiceData.advancePaid.toFixed(2)}</span>
                    </div>
                    <hr />
                    <div className="flex justify-between font-medium">
                      <span>Balance Due:</span>
                      <span>
                        LKR{" "}
                        {(calculateTotal() - invoiceData.advancePaid).toFixed(
                          2
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/invoices")}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Creating...
                  </>
                ) : (
                  "Create Invoice"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
