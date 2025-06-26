import { createClient } from "@/lib/supabase-server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-05-28.basil",
});

export async function POST(request: Request) {
  try {
    console.log("Creating checkout session...");

    const supabase = createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error("Authentication error:", error);
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { priceId, packageType, sessionsIncluded } = await request.json();

    if (!priceId || !packageType || !sessionsIncluded) {
      console.error("Missing required fields:", {
        priceId,
        packageType,
        sessionsIncluded,
      });
      return new NextResponse("Missing required fields", { status: 400 });
    }

    console.log("Creating Stripe checkout session for:", {
      userId: user.id,
      packageType,
      sessionsIncluded,
    });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        user_id: user.id,
        package_type: packageType,
        sessions_included: sessionsIncluded.toString(),
      },
      customer_email: user.email!,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/client/packages?canceled=true`,
    });

    console.log("Checkout session created successfully:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Failed to create checkout session:", err);
    return new NextResponse(
      `Checkout Error: ${err instanceof Error ? err.message : "Unknown Error"}`,
      { status: 500 }
    );
  }
}
