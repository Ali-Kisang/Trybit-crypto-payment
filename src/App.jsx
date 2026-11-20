import React from "react";
import TryBitCheckout from "./components/TryBitCheckout.jsx";

export default function App() {
  return (
    <TryBitCheckout
      demoMode={true}
      plan={{
        name: "Annual Premium",
        description: "Unlock exclusive features and get more from our platform.",
        originalPrice: 96,
        discount: 19.2,
        total: 76.8,
        currency: "USD",
        features: [
          "Unlimited premium access",
          "Exclusive features",
          "Priority support"
        ]
      }}
      onCreateInvoice={async ({ currency, plan }) => {
        // LIVE INTEGRATION:
        // Call your own backend here. Never call TryBit directly from React
        // and never expose the TryBit API key in browser code.
        //
        // Example:
        // const response = await fetch("/api/subscriptions/checkout", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //     Authorization: `Bearer ${localStorage.getItem("token")}`
        //   },
        //   body: JSON.stringify({ currency, planId: plan.id })
        // });
        // if (!response.ok) throw new Error("Could not create invoice");
        // return response.json();

        console.info("Connect this callback to your backend:", { currency, plan });
        throw new Error("Demo mode is enabled. Connect onCreateInvoice to your backend for live invoices.");
      }}
      onCheckStatus={async (invoiceId) => {
        // LIVE INTEGRATION:
        // GET /api/payments/:invoiceId/status from your backend.
        // Return { status: "pending" | "paid" | "expired" | "failed" }.
        console.info("Connect payment status polling:", invoiceId);
        return { status: "pending" };
      }}
    />
  );
}