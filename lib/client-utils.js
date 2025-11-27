// Client-side utility functions only
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
  }).format(amount);
}

export function calculatePaymentStatus(subtotal, totalPaid) {
  if (totalPaid === 0) return "pending";
  if (totalPaid >= subtotal) return "paid";
  return "partial";
}
