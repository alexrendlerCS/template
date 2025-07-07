import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { code, packageType, baseAmount } = await req.json();
    if (!code || !baseAmount) {
      return NextResponse.json(
        { valid: false, error: "Missing code or amount" },
        { status: 400 }
      );
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", code)
      .maybeSingle();
    if (error) {
      return NextResponse.json(
        { valid: false, error: "Error validating code" },
        { status: 400 }
      );
    }
    if (!data) {
      return NextResponse.json(
        { valid: false, error: "Invalid promo code" },
        { status: 404 }
      );
    }
    // Check expiry
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return NextResponse.json(
        { valid: false, error: "Promo code expired" },
        { status: 400 }
      );
    }
    // Check max redemptions (if needed)
    // ...
    let discountedAmount = baseAmount;
    let type = null;
    if (data.percent_off) {
      discountedAmount = Math.round(baseAmount * (1 - data.percent_off / 100));
      type = "percent";
    } else if (data.amount_off) {
      discountedAmount = Math.max(0, baseAmount - data.amount_off);
      type = "amount";
    }
    return NextResponse.json({ valid: true, discountedAmount, type });
  } catch (err) {
    return NextResponse.json(
      { valid: false, error: "Server error" },
      { status: 500 }
    );
  }
}
