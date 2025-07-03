import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient, supabaseAdmin } from "@/lib/supabase-server";
import buffer from "@/lib/raw-body";

// 💡 RECOMMENDATION: Add a unique constraint to packages.transaction_id in Supabase
// for additional safety against duplicate package creation:
// ALTER TABLE packages ADD CONSTRAINT packages_transaction_id_unique UNIQUE (transaction_id);

// Use the appropriate webhook secret based on environment
// In development, use STRIPE_CLI_WEBHOOK_SECRET (from Stripe CLI)
// In production, use STRIPE_WEBHOOK_SECRET (from Stripe Dashboard)
const endpointSecret =
  process.env.NODE_ENV === "production"
    ? process.env.STRIPE_WEBHOOK_SECRET!
    : process.env.STRIPE_CLI_WEBHOOK_SECRET!;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Route Segment Config
export const config = {
  api: {
    bodyParser: false,
  },
  runtime: "nodejs",
  dynamic: "force-dynamic",
};

export async function POST(req: Request) {
  try {
    console.log("🎣 Webhook received");
    console.log("🔧 Environment:", process.env.NODE_ENV);
    console.log(
      "🔑 Using webhook secret:",
      endpointSecret ? "✅ Secret configured" : "❌ No secret found"
    );

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

    // Get the raw body
    const rawBody = await buffer(req.body!);
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
          !session.metadata?.package_type ||
          !session.metadata?.original_sessions ||
          !session.metadata?.is_prorated ||
          !session.metadata?.expiry_date
        ) {
          console.error("❌ Missing required metadata:", {
            metadata: session.metadata,
            required: {
              user_id: session.metadata?.user_id,
              sessions_included: session.metadata?.sessions_included,
              original_sessions: session.metadata?.original_sessions,
              is_prorated: session.metadata?.is_prorated,
              package_type: session.metadata?.package_type,
              expiry_date: session.metadata?.expiry_date,
            },
          });
          return NextResponse.json(
            { error: "Missing required session metadata" },
            { status: 400 }
          );
        }

        // Parse metadata values
        const sessionsIncluded = parseInt(session.metadata.sessions_included);
        const originalSessions = session.metadata.original_sessions
          ? parseInt(session.metadata.original_sessions)
          : sessionsIncluded;
        const isProrated = session.metadata.is_prorated === "true";

        try {
          // 🔒 EARLY DUPLICATE CHECK: Check if this transaction has already been processed
          // by looking for an existing payment with the same transaction_id
          const {
            data: existingTransactionPayment,
            error: transactionPaymentError,
          } = await supabaseAdmin
            .from("payments")
            .select("*")
            .eq("transaction_id", session.id)
            .single();

          if (
            transactionPaymentError &&
            transactionPaymentError.code !== "PGRST116"
          ) {
            console.log("🔍 Payment check error:", transactionPaymentError);
          }

          // If payment exists, transaction was already processed - exit early
          if (existingTransactionPayment) {
            console.log("📦 Transaction already processed:", {
              transactionId: session.id,
              paymentId: existingTransactionPayment.id,
              packageId: existingTransactionPayment.package_id,
              amount: existingTransactionPayment.amount,
            });
            return NextResponse.json({ status: "success" });
          }

          // Validate package type first
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

          // Check for existing payment first
          const { data: existingPayment, error: paymentError } =
            await supabaseAdmin
              .from("payments")
              .select("*")
              .eq("transaction_id", session.id)
              .single();

          console.log("🔍 Checking for existing payment:", {
            exists: !!existingPayment,
            payment: existingPayment,
            transactionId: session.id,
          });

          if (paymentError && paymentError.code !== "PGRST116") {
            console.error(
              "❌ Error checking for existing payment:",
              paymentError
            );
            throw new Error(
              `Failed to check for existing payment: ${paymentError.message}`
            );
          }

          // First, create or update the payment record with package_type
          if (existingPayment) {
            console.log("⚠️ Updating existing payment with package type:", {
              paymentId: existingPayment.id,
              packageType,
            });

            const { error: updatePaymentError } = await supabaseAdmin
              .from("payments")
              .update({
                package_type: packageType,
              })
              .eq("id", existingPayment.id);

            if (updatePaymentError) {
              console.error("❌ Failed to update payment:", updatePaymentError);
              console.warn("⚠️ Payment update failed but continuing...");
            }
          } else {
            console.log("💳 Creating new payment with package type:", {
              client_id: session.metadata.user_id,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              session_count: parseInt(session.metadata.sessions_included),
              package_type: packageType,
            });

            const { error: createPaymentError } = await supabaseAdmin
              .from("payments")
              .insert({
                client_id: session.metadata.user_id,
                trainer_id: null,
                amount: session.amount_total ? session.amount_total / 100 : 0,
                session_count: sessionsIncluded,
                package_type: packageType,
                method: "stripe",
                status: "completed",
                transaction_id: session.id,
                paid_at: new Date().toISOString(),
              });

            if (createPaymentError) {
              console.error("❌ Failed to create payment:", createPaymentError);
              console.warn("⚠️ Payment creation failed but continuing...");
            }
          }

          // Get the current date in YYYY-MM-DD format for the purchase date
          const currentDate = new Date().toISOString().split("T")[0];

          // Now handle the package
          let packageId;

          // Check for existing active package
          const { data: existingPackage, error: existingPackageError } =
            await supabaseAdmin
              .from("packages")
              .select("*")
              .eq("client_id", session.metadata.user_id)
              .eq("package_type", packageType)
              .eq("status", "active")
              .single();

          console.log("🔄 Starting package processing", {
            sessionCount: session.metadata.sessions_included,
            packageType: session.metadata.package_type,
            transactionId: session.id,
          });

          console.log("📊 Package calculation details", {
            initialSessionCount: Number(session.metadata.sessions_included),
            parsedSessionCount: parseInt(session.metadata.sessions_included),
            sessionCountType: typeof session.metadata.sessions_included,
          });

          console.log("📦 Creating package with:", {
            sessions_included: sessionsIncluded,
            original_sessions: originalSessions,
            is_prorated: isProrated,
            price: session.amount_total ? session.amount_total / 100 : 0,
            expiry_date: session.metadata.expiry_date,
          });

          console.log("📦 Existing package state", {
            exists: existingPackage !== null,
            package: existingPackage,
            intendedSessions: Number(session.metadata.sessions_included),
          });

          if (existingPackage) {
            console.log("📦 Checking existing package:", {
              id: existingPackage.id,
              type: packageType,
              currentSessions: existingPackage.sessions_included,
              hasTransactionId: !!existingPackage.transaction_id,
              currentTransactionId: existingPackage.transaction_id,
              newTransactionId: session.id,
            });

            // If the package has no transaction_id, treat it as a new package
            if (!existingPackage.transaction_id) {
              console.log(
                "🆕 Existing package has no transaction_id, treating as new package"
              );

              const { data: updatedPackage, error: updateError } =
                await supabaseAdmin
                  .from("packages")
                  .update({
                    sessions_included: parseInt(
                      session.metadata.sessions_included
                    ),
                    transaction_id: session.id,
                    purchase_date: currentDate,
                  })
                  .eq("id", existingPackage.id)
                  .select()
                  .single();

              if (updateError) {
                console.error("❌ Failed to update package:", {
                  error: updateError,
                  packageId: existingPackage.id,
                  attemptedSessions: parseInt(
                    session.metadata.sessions_included
                  ),
                });
                console.warn(
                  "⚠️ Package update failed but payment was recorded"
                );
              } else {
                console.log("✅ Successfully updated package:", {
                  id: existingPackage.id,
                  oldSessions: existingPackage.sessions_included,
                  newSessions: updatedPackage.sessions_included,
                  operation: "set",
                });
              }
              packageId = existingPackage.id;
            }
            // If it's the same transaction, skip update
            else if (existingPackage.transaction_id === session.id) {
              console.log("⚠️ Transaction already processed, skipping update");
              packageId = existingPackage.id;
            }
            // If it has a different transaction_id, add sessions
            else {
              const newSessionCount =
                existingPackage.sessions_included +
                parseInt(session.metadata.sessions_included);

              console.log("🔢 Adding sessions to existing package:", {
                currentSessions: existingPackage.sessions_included,
                currentOriginalSessions: existingPackage.original_sessions,
                addingSessions: parseInt(session.metadata.sessions_included),
                newTotal: newSessionCount,
                newOriginalSessions:
                  existingPackage.original_sessions + sessionsIncluded,
                operation: "add",
              });

              const { data: updatedPackage, error: updateError } =
                await supabaseAdmin
                  .from("packages")
                  .update({
                    sessions_included: newSessionCount,
                    original_sessions:
                      existingPackage.original_sessions + sessionsIncluded,
                    transaction_id: session.id,
                    purchase_date: currentDate,
                  })
                  .eq("id", existingPackage.id)
                  .select()
                  .single();

              if (updateError) {
                console.error("❌ Failed to update package:", {
                  error: updateError,
                  packageId: existingPackage.id,
                  currentSessions: existingPackage.sessions_included,
                  attemptedAdd: parseInt(session.metadata.sessions_included),
                });
                console.warn(
                  "⚠️ Package update failed but payment was recorded"
                );
              } else {
                console.log("✅ Successfully updated package:", {
                  id: existingPackage.id,
                  oldSessions: existingPackage.sessions_included,
                  addedSessions: parseInt(session.metadata.sessions_included),
                  newTotal: updatedPackage.sessions_included,
                  operation: "add",
                });
              }
              packageId = existingPackage.id;
            }
          } else {
            // Create new package
            console.log("🆕 Creating new package:", {
              type: packageType,
              sessions: parseInt(session.metadata.sessions_included),
              operation: "create",
            });

            const { data: newPackage, error: createError } = await supabaseAdmin
              .from("packages")
              .insert({
                client_id: session.metadata.user_id,
                package_type: packageType,
                sessions_included: sessionsIncluded,
                original_sessions: originalSessions,
                is_prorated: isProrated,
                sessions_used: 0,
                price: session.amount_total ? session.amount_total / 100 : 0,
                purchase_date: currentDate,
                transaction_id: session.id,
                status: "active",
                expiry_date: new Date(session.metadata.expiry_date),
              })
              .select()
              .single();

            if (createError) {
              console.error("❌ Failed to create package:", {
                error: createError,
                attemptedSessions: parseInt(session.metadata.sessions_included),
              });
              console.warn(
                "⚠️ Package creation failed but payment was recorded"
              );
            } else {
              console.log("✅ Successfully created package:", {
                id: newPackage.id,
                sessions: newPackage.sessions_included,
                type: newPackage.package_type,
                operation: "create",
              });
              packageId = newPackage.id;
            }
          }

          console.log("✅ Final package state", {
            result: packageId,
            expectedSessions: Number(session.metadata.sessions_included),
            actualSessions: existingPackage
              ? existingPackage.sessions_included
              : Number(session.metadata.sessions_included),
          });

          // After package creation/update, update the payment record
          if (packageId) {
            console.log("💳 Updating payment record with package ID:", {
              packageId,
              transactionId: session.id,
              packageType,
            });

            const { error: paymentUpdateError } = await supabaseAdmin
              .from("payments")
              .update({
                package_id: packageId,
                package_type: packageType, // Ensure package_type is set during update
              })
              .eq("transaction_id", session.id);

            if (paymentUpdateError) {
              console.error("❌ Failed to update payment with package ID:", {
                error: paymentUpdateError,
                transactionId: session.id,
                packageId,
                packageType,
              });
            }
          }

          return NextResponse.json({ status: "success" });
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
        // 🔒 Only checkout.session.completed performs DB writes - exit early
        return NextResponse.json({ status: "success" });
      }

      case "charge.succeeded": {
        const charge = event.data.object as Stripe.Charge;
        console.log("💳 Charge succeeded:", charge.id);
        // 🔒 Only checkout.session.completed performs DB writes - exit early
        return NextResponse.json({ status: "success" });
      }

      case "charge.updated": {
        const charge = event.data.object as Stripe.Charge;
        console.log("📝 Charge updated:", charge.id);
        // 🔒 Only checkout.session.completed performs DB writes - exit early
        return NextResponse.json({ status: "success" });
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
