import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { buffer } from "@/lib/raw-body";
import { createClient } from "@/lib/supabase-server";

export const runtime = "nodejs"; // ✅ Needed to run on Node.js (not edge)
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: NextRequest) {
  const rawBody = await buffer(req.body!); // ✅ This MUST be raw buffer
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("❌ Stripe webhook signature verification failed.", err);
    return new NextResponse("Webhook Error", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const userId = session.metadata?.user_id;
    const packageType = session.metadata?.package_type;
    const sessionsIncluded = parseInt(
      session.metadata?.sessions_included || "0"
    );

    const supabase = createClient();
    const { error } = await supabase.from("packages").insert({
      client_id: userId,
      package_type: packageType,
      sessions_included: sessionsIncluded,
      sessions_used: 0,
      status: "active",
      purchase_date: new Date().toISOString(),
      price: session.amount_total! / 100,
    });

    if (error) {
      console.error("❌ Failed to insert package:", error);
      return new NextResponse("DB Error", { status: 500 });
    }

    console.log("✅ Package successfully inserted!");
  }

  return new NextResponse("Webhook received", { status: 200 });
}
