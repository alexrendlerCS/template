import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      discountType, // 'percent' or 'amount'
      value,
      maxRedemptions,
      expiresAt,
      currency,
      trainerId,
    } = body;

    // Create coupon in Stripe
    const coupon = await stripe.coupons.create({
      percent_off: discountType === "percent" ? value : undefined,
      amount_off: discountType === "amount" ? value : undefined,
      currency: discountType === "amount" ? currency : undefined,
      max_redemptions: maxRedemptions || undefined,
      redeem_by: expiresAt
        ? Math.floor(new Date(expiresAt).getTime() / 1000)
        : undefined,
      duration: "once",
      name: code,
    });

    // Create promotion code in Stripe
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: maxRedemptions || undefined,
      expires_at: expiresAt
        ? Math.floor(new Date(expiresAt).getTime() / 1000)
        : undefined,
    });

    // Store in DB
    const supabase = createClient();
    const { error } = await supabase.from("discount_codes").insert({
      code,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promo.id,
      percent_off: discountType === "percent" ? value : null,
      amount_off: discountType === "amount" ? value : null,
      currency: discountType === "amount" ? currency : null,
      max_redemptions: maxRedemptions || null,
      expires_at: expiresAt || null,
      created_by: trainerId,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      code,
      stripe_coupon_id: coupon.id,
      stripe_promotion_code_id: promo.id,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
