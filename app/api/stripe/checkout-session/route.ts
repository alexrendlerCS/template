import { createClient } from "@/lib/supabase-server";
import Stripe from "stripe";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const { userId, packageType, sessionsIncluded } = await req.json();

    console.log("🛒 Creating Stripe checkout session:", {
      userId,
      packageType,
      sessionsIncluded,
    });

    // Define valid pricing structure (cents)
    const pricingMatrix: Record<string, Record<number, number>> = {
      "In-Person Training": {
        8: 100000, // $1,000
        12: 138000, // $1,380
        16: 176000, // $1,760
        20: 200000, // $2,000
      },
      "Virtual Training": {
        4: 48000, // $480
        8: 92000, // $920
        12: 126000, // $1,260
        16: 160000, // $1,600
        20: 180000, // $1,800
      },
      "Partner Training": {
        4: 36000, // $360
        8: 68000, // $680
        12: 96000, // $960
        16: 120000, // $1,200
        20: 140000, // $1,400
      },
    };

    const amount = pricingMatrix?.[packageType]?.[sessionsIncluded];

    if (!amount) {
      console.error("❌ Invalid pricing configuration", {
        packageType,
        sessionsIncluded,
      });
      return NextResponse.json(
        { error: "Invalid package configuration" },
        { status: 400 }
      );
    }

    const origin =
      process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : process.env.NEXT_PUBLIC_SITE_URL || "https://your-production-url.com";

    // Get package-specific details
    const getPackageDetails = (type: string) => {
      const baseImageUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;
      switch (type) {
        case "In-Person Training":
          return {
            image: `${baseImageUrl}/placeholder.jpg`,
            description: `Transform your fitness journey with ${sessionsIncluded} personalized in-person training sessions! Work directly with your dedicated trainer in our fully-equipped facility. Book your sessions instantly after checkout. Sessions expire at month-end with a 4-day grace period.`,
          };
        case "Virtual Training":
          return {
            image: `${baseImageUrl}/placeholder-virtual.jpg`,
            description: `Achieve your fitness goals from anywhere with ${sessionsIncluded} live virtual training sessions! Get expert guidance and real-time form corrections through high-quality video calls. Book your convenient online sessions right after checkout. Sessions expire at month-end with a 4-day grace period.`,
          };
        case "Partner Training":
          return {
            image: `${baseImageUrl}/placeholder.jpg`,
            description: `Double the motivation with ${sessionsIncluded} partner training sessions! Train together and save while getting personalized attention from your dedicated trainer. Book your sessions instantly after checkout. Sessions expire at month-end with a 4-day grace period.`,
          };
        default:
          return {
            image: `${baseImageUrl}/placeholder.jpg`,
            description: `Get started with ${sessionsIncluded} personalized training sessions! Book your workouts right after checkout. Sessions expire at month-end with a 4-day grace period.`,
          };
      }
    };

    const packageDetails = getPackageDetails(packageType);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Transform with ${sessionsIncluded} ${packageType} Sessions 💪`,
              description: packageDetails.description,
              images: [packageDetails.image],
            },
            unit_amount: amount,
          },
          quantity: 1, // Total package, not per session
        },
      ],
      mode: "payment",
      success_url: `${origin}/client/packages?success=true`,
      cancel_url: `${origin}/client/packages?canceled=true`,
      custom_text: {
        submit: {
          message: "Can't wait to start your fitness journey! 🎉",
        },
      },
      custom_fields: [
        {
          key: "goals",
          label: {
            type: "custom",
            custom: "What are your main fitness goals?",
          },
          type: "text",
          optional: true,
        },
      ],
      metadata: {
        user_id: userId,
        sessions_included: sessionsIncluded.toString(),
        package_type: packageType,
      },
    });

    console.log("✅ Checkout session created:", {
      sessionId: session.id,
      amount,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("🔥 Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
