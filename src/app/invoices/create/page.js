"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../components/AuthProvider";
import { useToast } from "../../../components/ui/toast";
import Layout from "../../components/Layout";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PlusIcon,
  TrashIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  UserIcon,
  PhoneIcon,
  CalculatorIcon,
} from "@heroicons/react/24/outline";

export default function CreateInvoicePage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  // Data states
  const [customers, setCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [frames, setFrames] = useState([]);
  const [loading, setLoading] = useState(false);

  // Customer search and management
  const [mobileSearch, setMobileSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [customerNotFound, setCustomerNotFound] = useState(false);
  const [mobileSuggestions, setMobileSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // New customer form
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
  });

  // Invoice data
  const [invoiceData, setInvoiceData] = useState({
    customerId: "",
    items: [
      {
        id: 1,
        type: "category", // "category" or "frame"
        categoryId: "",
        frameId: "",
        description: "",
        qty: 1,
        unitPrice: 0,
        discount: 0,
        total: 0,
      },
    ],
    subtotal: 0,
    totalDiscount: 0,
    advancePaid: 0,
    finalTotal: 0,
    balanceDue: 0,
    notes: "",
  });

  useEffect(() => {
    fetchCustomers();
    fetchCategories();
    fetchFrames();

    // Check if customerId is passed from dashboard
    const customerId = searchParams.get("customerId");
    if (customerId) {
      // Pre-select the customer
      setInvoiceData((prev) => ({ ...prev, customerId }));
    }
  }, [searchParams]);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);

        // If customerId is in URL, auto-select that customer
        const customerId = searchParams.get("customerId");
        if (customerId) {
          const customer = data.find((c) => c._id === customerId);
          if (customer) {
            setSelectedCustomer(customer);
            setMobileSearch(customer.mobile);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
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

  // Mobile autocomplete functionality
  const handleMobileInputChange = (value) => {
    setMobileSearch(value);

    if (value.length >= 3) {
      // Filter customers whose mobile numbers contain the input value
      const suggestions = customers
        .filter((customer) => customer.mobile.includes(value))
        .slice(0, 10); // Limit to 10 suggestions

      setMobileSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setMobileSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (customer) => {
    setMobileSearch(customer.mobile);
    setSelectedCustomer(customer);
    setInvoiceData((prev) => ({ ...prev, customerId: customer._id }));
    setCustomerNotFound(false);
    setShowAddCustomer(false);
    setShowSuggestions(false);
    setMobileSuggestions([]);
    toast.success(`Customer selected: ${customer.name}`);
  };

  // Mobile search functionality
  const handleMobileSearch = async () => {
    if (!mobileSearch.trim()) {
      toast.warning("Please enter a mobile number");
      return;
    }

    const customer = customers.find((c) => c.mobile === mobileSearch.trim());

    if (customer) {
      setSelectedCustomer(customer);
      setInvoiceData((prev) => ({ ...prev, customerId: customer._id }));
      setCustomerNotFound(false);
      setShowAddCustomer(false);
      toast.success(`Customer found: ${customer.name}`);
    } else {
      setSelectedCustomer(null);
      setCustomerNotFound(true);
      setShowAddCustomer(true);
      setNewCustomer((prev) => ({ ...prev, mobile: mobileSearch.trim() }));
      toast.warning("Customer not found. You can add them below.");
    }
  };

  // Add new customer
  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.mobile.trim()) {
      toast.warning("Name and mobile number are required");
      return;
    }

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
        setSelectedCustomer(customer);
        setInvoiceData((prev) => ({ ...prev, customerId: customer._id }));
        setShowAddCustomer(false);
        setCustomerNotFound(false);
        setNewCustomer({ name: "", mobile: "", email: "", address: "" });
        toast.success(`Customer ${customer.name} added successfully!`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to add customer");
      }
    } catch (error) {
      console.error("Add customer error:", error);
      toast.error("Failed to add customer");
    }
  };

  // Item management
  const handleAddItem = () => {
    const newId = Math.max(...invoiceData.items.map((item) => item.id), 0) + 1;
    setInvoiceData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: newId,
          type: "category",
          categoryId: "",
          frameId: "",
          description: "",
          qty: 1,
          unitPrice: 0,
          discount: 0,
          total: 0,
        },
      ],
    }));
  };

  const handleRemoveItem = (itemId) => {
    if (invoiceData.items.length > 1) {
      setInvoiceData((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== itemId),
      }));
    }
  };

  const handleItemChange = (itemId, field, value) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.id === itemId) {
          const updatedItem = { ...item, [field]: value };

          // Handle type change
          if (field === "type") {
            updatedItem.categoryId = "";
            updatedItem.frameId = "";
            updatedItem.description = "";
            updatedItem.unitPrice = 0;
          }

          // Handle category selection
          else if (field === "categoryId" && value) {
            const selectedCategory = categories.find((c) => c._id === value);
            if (selectedCategory) {
              updatedItem.description = selectedCategory.name;
              updatedItem.unitPrice = selectedCategory.price;
            }
          }

          // Handle frame selection
          else if (field === "frameId" && value) {
            const selectedFrame = frames.find((f) => f._id === value);
            if (selectedFrame) {
              updatedItem.description = selectedFrame.name;
              updatedItem.unitPrice = selectedFrame.unitPrice;
            }
          }

          // Calculate item total
          const subtotal = updatedItem.qty * updatedItem.unitPrice;
          const discountAmount = (subtotal * updatedItem.discount) / 100;
          updatedItem.total = subtotal - discountAmount;

          return updatedItem;
        }
        return item;
      }),
    }));
  };

  // Calculate all totals
  const calculateTotals = useCallback(() => {
    const subtotal = invoiceData.items.reduce((sum, item) => {
      return sum + item.qty * item.unitPrice;
    }, 0);

    const totalDiscount = invoiceData.items.reduce((sum, item) => {
      const itemSubtotal = item.qty * item.unitPrice;
      return sum + (itemSubtotal * item.discount) / 100;
    }, 0);

    const finalTotal = subtotal - totalDiscount;
    const balanceDue = finalTotal - invoiceData.advancePaid;

    setInvoiceData((prev) => ({
      ...prev,
      subtotal,
      totalDiscount,
      finalTotal,
      balanceDue,
    }));
  }, [invoiceData.items, invoiceData.advancePaid]);

  // Handle advance payment change
  const handleAdvanceChange = (value) => {
    const advance = parseFloat(value) || 0;
    setInvoiceData((prev) => ({
      ...prev,
      advancePaid: advance,
      balanceDue: prev.finalTotal - advance,
    }));
  };

  // Create invoice
  const handleCreateInvoice = async (e) => {
    e.preventDefault();

    if (!invoiceData.customerId) {
      toast.warning("Please select or add a customer");
      return;
    }

    if (
      invoiceData.items.some(
        (item) => !item.description || item.qty <= 0 || item.unitPrice < 0
      )
    ) {
      toast.warning("Please fill in all item details correctly");
      return;
    }

    try {
      setLoading(true);

      // Prepare invoice data for API
      const invoicePayload = {
        customerId: invoiceData.customerId,
        items: invoiceData.items.map((item) => ({
          type: item.type === "category" ? "service" : "frame",
          description: item.description,
          qty: item.qty,
          unitPrice: item.unitPrice,
          discount: item.discount,
          refId: item.type === "category" ? item.categoryId : item.frameId,
        })),
        subtotal: invoiceData.subtotal,
        totalDiscount: invoiceData.totalDiscount,
        advancePaid: invoiceData.advancePaid,
        finalTotal: invoiceData.finalTotal,
        balanceDue: invoiceData.balanceDue,
        notes: invoiceData.notes,
      };

      const response = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(invoicePayload),
      });

      if (response.ok) {
        const invoice = await response.json();
        toast.success("Transaction completed successfully!");
        router.push(`/invoices/${invoice._id}`);
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to create transaction");
      }
    } catch (error) {
      console.error("Create invoice error:", error);
      toast.error("Failed to create transaction");
    } finally {
      setLoading(false);
    }
  };

  // Update totals when items change
  useEffect(() => {
    calculateTotals();
  }, [calculateTotals]);

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <CalculatorIcon className="h-8 w-8 mr-3 text-indigo-400" />
              New Transaction
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Process a new transaction for photography services and products
            </p>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-8">
            {/* Customer Search & Management */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <UserIcon className="h-5 w-5 mr-2 text-indigo-400" />
                Customer Information
              </h3>

              {/* Mobile Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Search Customer by Mobile Number
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <PhoneIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Enter mobile number..."
                      value={mobileSearch}
                      onChange={(e) => handleMobileInputChange(e.target.value)}
                      onKeyPress={(e) =>
                        e.key === "Enter" && handleMobileSearch()
                      }
                      onFocus={() => {
                        if (
                          mobileSearch.length >= 3 &&
                          mobileSuggestions.length > 0
                        ) {
                          setShowSuggestions(true);
                        }
                      }}
                      onBlur={() => {
                        // Delay hiding suggestions to allow for clicks
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                      className="pl-10 w-full px-4 py-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                    />

                    {/* Mobile Number Suggestions Dropdown */}
                    {showSuggestions && mobileSuggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {mobileSuggestions.map((customer) => (
                          <div
                            key={customer._id}
                            onClick={() => handleSuggestionSelect(customer)}
                            className="px-4 py-3 hover:bg-gray-600 cursor-pointer border-b border-gray-600 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white font-medium">
                                  {customer.name}
                                </p>
                                <p className="text-gray-300 text-sm">
                                  {customer.mobile}
                                </p>
                                {customer.email && (
                                  <p className="text-gray-400 text-xs">
                                    {customer.email}
                                  </p>
                                )}
                              </div>
                              <div className="text-indigo-400 text-sm">
                                Click to select
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleMobileSearch}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
                  >
                    <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
                    Search
                  </button>
                </div>
              </div>

              {/* Selected Customer Display */}
              {selectedCustomer && (
                <div className="mb-6 p-4 bg-green-900/20 border border-green-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-green-300 font-medium">
                        {selectedCustomer.name}
                      </h4>
                      <p className="text-green-400 text-sm">
                        Mobile: {selectedCustomer.mobile}
                      </p>
                      {selectedCustomer.email && (
                        <p className="text-green-400 text-sm">
                          Email: {selectedCustomer.email}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCustomer(null);
                        setInvoiceData((prev) => ({ ...prev, customerId: "" }));
                        setMobileSearch("");
                      }}
                      className="text-green-400 hover:text-green-300 text-sm"
                    >
                      Change Customer
                    </button>
                  </div>
                </div>
              )}

              {/* Add New Customer Form */}
              {showAddCustomer && (
                <div className="border border-yellow-600 bg-yellow-900/20 rounded-lg p-6">
                  <h4 className="text-yellow-300 font-medium mb-4 flex items-center">
                    <UserPlusIcon className="h-4 w-4 mr-2" />
                    Add New Customer
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Enter customer name"
                        value={newCustomer.name}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Mobile Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={newCustomer.mobile}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            mobile: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        placeholder="customer@example.com"
                        value={newCustomer.email}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Address (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="Enter address"
                        value={newCustomer.address}
                        onChange={(e) =>
                          setNewCustomer((prev) => ({
                            ...prev,
                            address: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleAddCustomer}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                    >
                      <UserPlusIcon className="h-4 w-4 mr-2" />
                      Add Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCustomer(false);
                        setCustomerNotFound(false);
                        setNewCustomer({
                          name: "",
                          mobile: "",
                          email: "",
                          address: "",
                        });
                      }}
                      className="px-4 py-2 bg-gray-600 text-gray-200 hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Billing Information */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-white">
                  Billing Information
                </h3>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="text-indigo-400 hover:text-indigo-300 flex items-center text-sm font-medium"
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add Item
                </button>
              </div>

              <div className="space-y-4">
                {invoiceData.items.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 items-end p-4 border border-gray-600 rounded-lg bg-gray-750"
                  >
                    {/* Type Selection */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) =>
                          handleItemChange(item.id, "type", e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      >
                        <option
                          value="category"
                          style={{
                            backgroundColor: "#374151",
                            color: "#ffffff",
                          }}
                        >
                          Category
                        </option>
                        <option
                          value="frame"
                          style={{
                            backgroundColor: "#374151",
                            color: "#ffffff",
                          }}
                        >
                          Frame
                        </option>
                      </select>
                    </div>

                    {/* Category/Frame Selection */}
                    <div className="col-span-3">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        {item.type === "category" ? "Category" : "Frame"}
                      </label>
                      {item.type === "category" ? (
                        <select
                          value={item.categoryId}
                          onChange={(e) =>
                            handleItemChange(
                              item.id,
                              "categoryId",
                              e.target.value
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                        >
                          <option
                            value=""
                            style={{
                              backgroundColor: "#374151",
                              color: "#ffffff",
                            }}
                          >
                            Select category
                          </option>
                          {categories.map((category) => (
                            <option
                              key={category._id}
                              value={category._id}
                              style={{
                                backgroundColor: "#374151",
                                color: "#ffffff",
                              }}
                            >
                              {category.name} - LKR {category.price}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={item.frameId}
                          onChange={(e) =>
                            handleItemChange(item.id, "frameId", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                        >
                          <option
                            value=""
                            style={{
                              backgroundColor: "#374151",
                              color: "#ffffff",
                            }}
                          >
                            Select frame
                          </option>
                          {frames.map((frame) => (
                            <option
                              key={frame._id}
                              value={frame._id}
                              style={{
                                backgroundColor: "#374151",
                                color: "#ffffff",
                              }}
                            >
                              {frame.name} - LKR {frame.unitPrice}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.qty}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "qty",
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      />
                    </div>

                    {/* Unit Price */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "unitPrice",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                        disabled={item.categoryId || item.frameId}
                      />
                    </div>

                    {/* Discount */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Discount %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={item.discount}
                        onChange={(e) =>
                          handleItemChange(
                            item.id,
                            "discount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      />
                    </div>

                    {/* Total */}
                    <div className="col-span-1">
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-600 rounded-md text-sm font-medium text-white text-center">
                        {item.total.toFixed(2)}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="col-span-1">
                      {invoiceData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Summary */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center">
                <CalculatorIcon className="h-5 w-5 mr-2 text-indigo-400" />
                Payment Summary
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Details */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Advance Payment (LKR)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={invoiceData.advancePaid}
                      onChange={(e) => handleAdvanceChange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Notes (Optional)
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
                      className="w-full px-3 py-2 border border-gray-600 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 bg-gray-700 text-white"
                      placeholder="Additional notes or special instructions..."
                    />
                  </div>
                </div>

                {/* Totals Summary */}
                <div className="bg-gray-700 p-4 rounded-lg">
                  <div className="space-y-3 text-white">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal:</span>
                      <span>LKR {invoiceData.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-red-400">
                      <span>Total Discount:</span>
                      <span>- LKR {invoiceData.totalDiscount.toFixed(2)}</span>
                    </div>
                    <hr className="border-gray-600" />
                    <div className="flex justify-between font-medium">
                      <span>Final Total:</span>
                      <span>LKR {invoiceData.finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-yellow-400">
                      <span>Advance Paid:</span>
                      <span>LKR {invoiceData.advancePaid.toFixed(2)}</span>
                    </div>
                    <hr className="border-gray-600" />
                    <div className="flex justify-between text-lg font-bold text-indigo-400">
                      <span>Balance Due:</span>
                      <span>LKR {invoiceData.balanceDue.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.push("/invoices")}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !invoiceData.customerId}
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors"
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
                    Processing...
                  </>
                ) : (
                  <>
                    <CalculatorIcon className="h-4 w-4 mr-2" />
                    Generate Invoice
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
