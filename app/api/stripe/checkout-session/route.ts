import { createClient } from "@/lib/supabase-server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(req: Request) {
  try {
    const { userId, packageType, sessionsIncluded } = await req.json();

    console.log("Creating Stripe checkout session for:", {
      userId,
      packageType,
      sessionsIncluded,
    });

    // Calculate price based on package type and sessions
    // This is a simplified example - you would typically look up prices from your database
    const unitPrice = 6000; // $60.00 per session
    const totalAmount = unitPrice * sessionsIncluded;

    // Get the origin for success and cancel URLs
    const origin =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_SITE_URL || "https://your-production-url.com";

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${packageType} - ${sessionsIncluded} Sessions`,
              description: `Package of ${sessionsIncluded} personal training sessions`,
            },
            unit_amount: unitPrice,
          },
          quantity: sessionsIncluded,
        },
      ],
      mode: "payment",
      success_url: `${origin}/client/payment-methods?success=true`,
      cancel_url: `${origin}/client/payment-methods?canceled=true`,
      metadata: {
        user_id: userId,
        sessions_included: sessionsIncluded.toString(),
        package_type: packageType,
      },
    });

    console.log("Checkout session created successfully:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
