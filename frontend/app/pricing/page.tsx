"use client";

import { Check, CreditCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Protected } from "@/components/Protected";
import { createPaymentOrder, verifyPayment } from "@/lib/api";
import type { PlanType } from "@/lib/types";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function PricingPage() {
  async function checkout(plan: PlanType) {
    const order = await createPaymentOrder(plan);
    if (order.keyId === "rzp_mock_local") {
      await verifyPayment({
        razorpayOrderId: order.orderId,
        razorpayPaymentId: `pay_mock_${Date.now()}`,
        razorpaySignature: "mock-local-signature"
      });
      window.location.href = "/dashboard";
      return;
    }
    await loadRazorpay();
    const checkout = new window.Razorpay!({
      key: order.keyId,
      amount: order.amountPaise,
      currency: order.currency,
      name: "ClipAI",
      description: plan === "PREMIUM_YEARLY" ? "Premium yearly" : "Premium monthly",
      order_id: order.orderId,
      handler: async (response: any) => {
        await verifyPayment({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature
        });
        window.location.href = "/dashboard";
      },
      theme: { color: "#126c6a" }
    });
    checkout.open();
  }

  return (
    <Protected>
      <AppShell>
        <h1 className="mb-2 text-2xl font-bold">Pricing</h1>
        <p className="mb-6 text-sm text-slate-500">Upgrade for longer recordings, higher quality processing, and private sharing controls.</p>
        <div className="grid gap-4 md:grid-cols-2">
          <Plan name="Free" price="₹0" features={["10 recordings", "720p playback", "Basic sharing"]} />
          <Plan name="Premium" price="₹999 / month" features={["Unlimited recordings", "1080p processing", "Priority queue", "AI captions ready"]} action={<Button onClick={() => checkout("PREMIUM_MONTHLY")}><CreditCard className="h-4 w-4" />Upgrade</Button>} />
        </div>
      </AppShell>
    </Protected>
  );
}

function Plan({ name, price, features, action }: { name: string; price: string; features: string[]; action?: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold">{name}</h2>
      <p className="mt-2 text-3xl font-bold">{price}</p>
      <ul className="my-6 grid gap-2 text-sm text-slate-600">
        {features.map((feature) => <li key={feature} className="flex items-center gap-2"><Check className="h-4 w-4 text-brand" />{feature}</li>)}
      </ul>
      {action ?? <Button variant="secondary" disabled>Current plan</Button>}
    </article>
  );
}

function loadRazorpay() {
  return new Promise<void>((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout failed to load"));
    document.body.appendChild(script);
  });
}
