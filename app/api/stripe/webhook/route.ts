import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient, supabaseAdmin } from "@/lib/supabase-server";

// Use the test webhook secret when in development
const endpointSecret =
  process.env.NODE_ENV === "development"
    ? "whsec_8c2b4dd5f85cfbd52646b3dc13f4e0b1f61240101b481c10cad5b134200eae84"
    : process.env.STRIPE_WEBHOOK_SECRET!;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// This is important - we need to tell Next.js not to parse the body
export const bodyParser = false;

export async function POST(req: Request) {
  try {
    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    console.log("📝 Received webhook with signature:", signature);

    if (!signature) {
      console.error("❌ No stripe signature found in request headers");
      return NextResponse.json(
        { error: "No stripe signature found" },
        { status: 400 }
      );
    }

    // Get the raw body as text first
    const rawBody = await req.text();
    console.log("📝 Raw body length:", rawBody.length, "bytes");

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );
      console.log("✅ Successfully verified webhook signature");
    } catch (err) {
      console.log("❌ Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    console.log("📦 Event type:", event.type);

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("💳 Payment successful for session:", session.id);
        console.log("📦 Session metadata:", session.metadata);

        // Check if we have the required metadata
        if (
          !session.metadata?.user_id ||
          !session.metadata?.sessions_included ||
          !session.metadata?.package_type
        ) {
          console.error(
            "❌ Missing required metadata in session:",
            session.metadata
          );
          return NextResponse.json(
            { error: "Missing required session metadata" },
            { status: 400 }
          );
        }

        try {
          // Use supabaseAdmin to bypass RLS
          const { error: packageError } = await supabaseAdmin
            .from("packages")
            .insert({
              client_id: session.metadata.user_id,
              sessions_included: parseInt(session.metadata.sessions_included),
              sessions_used: 0,
              package_type: session.metadata.package_type,
              purchase_date: new Date().toISOString(),
              price: session.amount_total ? session.amount_total / 100 : 0, // Convert from cents to dollars
            })
            .select()
            .single();

          if (packageError) {
            console.error("❌ Database error:", packageError);
            throw packageError;
          }

          // Create payment record with exact field names from the schema
          const { error: paymentError } = await supabaseAdmin
            .from("payments")
            .insert({
              client_id: session.metadata.user_id,
              trainer_id: null, // This will be null for package purchases
              amount: session.amount_total ? session.amount_total / 100 : 0,
              session_count: parseInt(session.metadata.sessions_included),
              method: "stripe", // matches the schema
              status: "completed",
              transaction_id: session.id, // matches the schema
              paid_at: new Date().toISOString(), // matches the schema
            });

          if (paymentError) {
            console.error("❌ Database error:", paymentError);
            throw paymentError;
          }
        } catch (error) {
          console.error("❌ Database error:", error);
          return NextResponse.json(
            { error: "Failed to process payment" },
            { status: 500 }
          );
        }

        console.log("✅ Successfully processed payment and created package");
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log("💰 Payment intent succeeded:", paymentIntent.id);
        break;
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("💳 Charge succeeded:", charge.id);
        break;
      }

      case "charge.updated": {
        const charge = event.data.object as Stripe.Charge;
        console.log("📝 Charge updated:", charge.id);
        break;
      }

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("❌ Error processing webhook:", err);
    return NextResponse.json(
      {
        error: "Webhook Error",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 400 }
    );
  }
}
