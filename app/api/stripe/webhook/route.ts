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
    console.log("🎣 Webhook received");

    // Get the signature from the header
    const signature = req.headers.get("stripe-signature");
    console.log("📝 Webhook signature:", signature);

    if (!signature) {
      console.error("❌ No stripe signature found in request headers");
      return NextResponse.json(
        { error: "No stripe signature found" },
        { status: 400 }
      );
    }

    // Get the raw body as text first
    const rawBody = await req.text();
    console.log("📦 Raw body length:", rawBody.length, "bytes");

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );
      console.log(
        "✅ Successfully verified webhook signature, event type:",
        event.type
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Webhook signature verification failed" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("💳 Payment successful for session:", {
          sessionId: session.id,
          metadata: session.metadata,
          amount: session.amount_total,
        });

        // Check if we have the required metadata
        if (
          !session.metadata?.user_id ||
          !session.metadata?.sessions_included ||
          !session.metadata?.package_type
        ) {
          console.error("❌ Missing required metadata:", {
            metadata: session.metadata,
            required: {
              user_id: session.metadata?.user_id,
              sessions_included: session.metadata?.sessions_included,
              package_type: session.metadata?.package_type,
            },
          });
          return NextResponse.json(
            { error: "Missing required session metadata" },
            { status: 400 }
          );
        }

        try {
          // Validate package type
          const validPackageTypes = [
            "In-Person Training",
            "Virtual Training",
            "Partner Training",
          ];
          const packageType = session.metadata.package_type;

          console.log("🔍 Validating package type:", {
            receivedType: packageType,
            validTypes: validPackageTypes,
            isValid: validPackageTypes.includes(packageType),
            metadata: session.metadata,
          });

          if (!validPackageTypes.includes(packageType)) {
            console.error("❌ Invalid package type:", {
              received: packageType,
              valid: validPackageTypes,
            });
            return NextResponse.json(
              { error: "Invalid package type" },
              { status: 400 }
            );
          }

          let packageId: string | undefined;

          // First check if a package exists for this transaction
          const { data: existingPackageByTransaction } = await supabaseAdmin
            .from("packages")
            .select("id, package_type")
            .eq("transaction_id", session.id)
            .single();

          if (existingPackageByTransaction) {
            console.log("⚠️ Package already exists for this transaction:", {
              packageId: existingPackageByTransaction.id,
              type: existingPackageByTransaction.package_type,
              transactionId: session.id,
            });
            packageId = existingPackageByTransaction.id;
          } else {
            // Check if package exists for this client/type/date combination
            const { data: existingPackage } = await supabaseAdmin
              .from("packages")
              .select("id, package_type, sessions_included, price")
              .eq("client_id", session.metadata.user_id)
              .eq("package_type", packageType)
              .eq("status", "active")
              .order("purchase_date", { ascending: false })
              .limit(1)
              .single();

            if (existingPackage) {
              console.log("⚠️ Found existing active package:", {
                packageId: existingPackage.id,
                type: existingPackage.package_type,
                currentSessions: existingPackage.sessions_included,
                addingSessions: parseInt(session.metadata.sessions_included),
              });

              // Update the existing package by adding the new sessions
              const { data: updatedPackage, error: updateError } =
                await supabaseAdmin
                  .from("packages")
                  .update({
                    sessions_included:
                      existingPackage.sessions_included +
                      parseInt(session.metadata.sessions_included),
                    price:
                      (existingPackage.price || 0) +
                      (session.amount_total ? session.amount_total / 100 : 0),
                    transaction_id: session.id, // Update with latest transaction
                  })
                  .eq("id", existingPackage.id)
                  .select()
                  .single();

              if (updateError) {
                console.error("❌ Failed to update existing package:", {
                  error: updateError,
                  packageId: existingPackage.id,
                });
                throw updateError;
              }

              console.log("✅ Updated existing package:", {
                id: updatedPackage.id,
                type: updatedPackage.package_type,
                newTotalSessions: updatedPackage.sessions_included,
                transactionId: updatedPackage.transaction_id,
              });
              packageId = existingPackage.id;
            } else {
              // Create new package with transaction ID
              const now = new Date();
              const purchaseDate = now.toISOString();
              console.log(
                "📅 Creating new package with timestamp:",
                purchaseDate
              );

              const packageData = {
                client_id: session.metadata.user_id,
                sessions_included: parseInt(session.metadata.sessions_included),
                sessions_used: 0,
                package_type: packageType,
                purchase_date: purchaseDate,
                price: session.amount_total ? session.amount_total / 100 : 0,
                transaction_id: session.id,
              };

              console.log("📦 Creating package with data:", packageData);

              const { data: newPackage, error: packageError } =
                await supabaseAdmin
                  .from("packages")
                  .insert(packageData)
                  .select()
                  .single();

              if (packageError) {
                console.error("❌ Failed to create package:", {
                  error: packageError,
                  data: packageData,
                });
                throw packageError;
              }

              console.log("✅ Created new package:", {
                id: newPackage.id,
                type: newPackage.package_type,
                purchaseDate: newPackage.purchase_date,
                transactionId: newPackage.transaction_id,
              });
              packageId = newPackage.id;
            }
          }

          // Check if payment already exists
          const { data: existingPayment } = await supabaseAdmin
            .from("payments")
            .select("id, package_type")
            .eq("transaction_id", session.id)
            .single();

          if (existingPayment) {
            console.log("⚠️ Payment already exists:", {
              paymentId: existingPayment.id,
              packageType: existingPayment.package_type,
              transactionId: session.id,
            });

            // If payment exists but doesn't have package type, update it
            if (!existingPayment.package_type) {
              console.log(
                "📝 Updating existing payment with package type:",
                packageType
              );
              const { data: updatedPayment, error: updateError } =
                await supabaseAdmin
                  .from("payments")
                  .update({
                    package_type: packageType,
                    package_id: packageId,
                  })
                  .eq("id", existingPayment.id)
                  .select()
                  .single();

              if (updateError) {
                console.error(
                  "❌ Failed to update payment with package type:",
                  updateError
                );
              } else {
                console.log("✅ Updated payment with package type:", {
                  paymentId: updatedPayment.id,
                  packageType: updatedPayment.package_type,
                  packageId: updatedPayment.package_id,
                });
              }
            }

            return NextResponse.json({ status: "already processed" });
          }

          // Create new payment record
          const paymentData = {
            client_id: session.metadata.user_id,
            trainer_id: null,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            session_count: parseInt(session.metadata.sessions_included),
            method: "stripe",
            status: "completed",
            transaction_id: session.id,
            paid_at: new Date().toISOString(),
            package_type: packageType,
            package_id: packageId,
          };

          console.log("💳 Creating payment record:", {
            paymentData,
            originalPackageType: packageType,
            metadataPackageType: session.metadata.package_type,
            hasPackageType: "package_type" in paymentData,
            packageTypeValue: paymentData.package_type,
            packageId,
            transactionId: session.id,
          });

          const { data: insertedPayment, error: paymentError } =
            await supabaseAdmin
              .from("payments")
              .insert(paymentData)
              .select()
              .single();

          if (paymentError) {
            console.error("❌ Failed to create payment record:", {
              error: paymentError,
              data: paymentData,
            });
            throw paymentError;
          }

          console.log("✅ Created payment record:", {
            id: insertedPayment.id,
            type: insertedPayment.package_type,
            package_type: insertedPayment.package_type,
            package_id: insertedPayment.package_id,
            paidAt: insertedPayment.paid_at,
            amount: insertedPayment.amount,
            sessionCount: insertedPayment.session_count,
            method: insertedPayment.method,
            status: insertedPayment.status,
          });

          return NextResponse.json({
            status: "success",
            payment: {
              id: insertedPayment.id,
              package_type: insertedPayment.package_type,
              package_id: insertedPayment.package_id,
            },
          });
        } catch (error) {
          console.error("❌ Error processing webhook:", {
            error,
            sessionId: session.id,
            metadata: session.metadata,
          });
          return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
          );
        }

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
