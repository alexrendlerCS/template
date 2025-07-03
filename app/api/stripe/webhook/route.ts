import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { createClient, supabaseAdmin } from "@/lib/supabase-server";
import buffer from "@/lib/raw-body";

// Use the webhook secret from environment variable
// For local development with Stripe CLI, use the CLI's webhook secret
// For production, use the environment variable
const endpointSecret =
  process.env.NODE_ENV === "development"
    ? process.env.STRIPE_CLI_WEBHOOK_SECRET ||
      process.env.STRIPE_WEBHOOK_SECRET!
    : process.env.STRIPE_WEBHOOK_SECRET!;

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
  console.log("🎣 Webhook endpoint hit", {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
  });

  try {
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
    console.log(
      "📦 Raw body preview:",
      rawBody.toString().substring(0, 200) + "..."
    );
    console.log(
      "🔑 Using webhook secret:",
      endpointSecret.substring(0, 10) + "..."
    );

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        endpointSecret
      );
      console.log(
        "✅ Successfully verified webhook signature, event type:",
        event.type,
        "Event ID:",
        event.id
      );
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err);
      console.error("🔍 Debug info:", {
        signatureHeader: signature,
        secretUsed: endpointSecret.substring(0, 10) + "...",
        bodyLength: rawBody.length,
        error: err instanceof Error ? err.message : "Unknown error",
      });
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
          userId: session.metadata?.user_id,
          packageType: session.metadata?.package_type,
          sessionsIncluded: session.metadata?.sessions_included,
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

        console.log("📊 Parsed metadata values:", {
          sessionsIncluded,
          originalSessions,
          isProrated,
          userId: session.metadata.user_id,
          packageType: session.metadata.package_type,
        });

        try {
          // Get the current date in YYYY-MM-DD format for the purchase date
          const currentDate = new Date().toISOString().split("T")[0];
          let packageId: string | undefined;

          // Check if this transaction has already been processed
          const {
            data: existingPackageByTransaction,
            error: transactionError,
          } = await supabaseAdmin
            .from("packages")
            .select("*")
            .eq("transaction_id", session.id)
            .single();

          if (transactionError) {
            console.log("🔍 Transaction check error:", transactionError);
          }

          console.log("🔍 Transaction check result:", {
            exists: !!existingPackageByTransaction,
            transactionId: session.id,
            packageId: existingPackageByTransaction?.id,
          });

          if (existingPackageByTransaction) {
            console.log("📦 Transaction already processed:", {
              transactionId: session.id,
              packageId: existingPackageByTransaction.id,
              sessions: existingPackageByTransaction.sessions_included,
            });
            return NextResponse.json({ status: "success" });
          }

          // Check for existing active packages
          const { data: existingPackages, error: existingPackageError } =
            await supabaseAdmin
              .from("packages")
              .select("*")
              .eq("client_id", session.metadata.user_id)
              .eq("package_type", session.metadata.package_type)
              .eq("status", "active")
              .order("purchase_date", { ascending: false });

          if (existingPackageError) {
            console.error(
              "❌ Error fetching existing packages:",
              existingPackageError
            );
          }

          console.log("📦 Existing packages query result:", {
            count: existingPackages?.length || 0,
            packages: existingPackages?.map((pkg) => ({
              id: pkg.id,
              sessions: pkg.sessions_included,
              used: pkg.sessions_used,
              purchaseDate: pkg.purchase_date,
              transactionId: pkg.transaction_id,
            })),
          });

          // Get the most recent package if any exist
          const existingPackage = existingPackages?.[0];

          if (existingPackage) {
            console.log("🔄 Found existing package to update:", {
              id: existingPackage.id,
              currentSessions: existingPackage.sessions_included,
              usedSessions: existingPackage.sessions_used,
              purchaseDate: existingPackage.purchase_date,
              addingSessions: sessionsIncluded,
            });

            // Always add sessions to the most recent package
            const newSessionCount =
              existingPackage.sessions_included + sessionsIncluded;
            // Don't update original_sessions - it should remain the original value
            // Only update sessions_included to add the new sessions

            console.log("📝 Attempting package update:", {
              packageId: existingPackage.id,
              currentSessions: existingPackage.sessions_included,
              addingSessions: sessionsIncluded,
              newTotal: newSessionCount,
              currentOriginal: existingPackage.original_sessions,
              transactionId: session.id,
            });

            const { data: updatedPackage, error: updateError } =
              await supabaseAdmin
                .from("packages")
                .update({
                  sessions_included: newSessionCount,
                  transaction_id: session.id,
                  purchase_date: currentDate,
                })
                .eq("id", existingPackage.id)
                .select()
                .single();

            if (updateError) {
              console.error("❌ Package update failed:", {
                error: updateError,
                packageId: existingPackage.id,
                attempted: {
                  sessions: newSessionCount,
                  transactionId: session.id,
                },
              });
            } else {
              console.log("✅ Package successfully updated:", {
                id: updatedPackage.id,
                oldSessions: existingPackage.sessions_included,
                newSessions: updatedPackage.sessions_included,
                transactionId: updatedPackage.transaction_id,
              });
            }
            packageId = existingPackage.id;
          } else {
            console.log("🆕 No existing package found, creating new one:", {
              userId: session.metadata.user_id,
              packageType: session.metadata.package_type,
              sessions: sessionsIncluded,
            });

            // Create new package
            console.log("🆕 Creating new package:", {
              type: session.metadata.package_type,
              sessions: sessionsIncluded,
              operation: "create",
            });

            const { data: newPackage, error: createError } = await supabaseAdmin
              .from("packages")
              .insert({
                client_id: session.metadata.user_id,
                package_type: session.metadata.package_type,
                sessions_included: 0, // Start with 0 sessions to avoid double-counting
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
                attemptedSessions: sessionsIncluded,
              });

              // If it's a duplicate key error, try to find the existing package
              if (createError.code === "23505") {
                console.log(
                  "🔄 Duplicate package detected, looking for existing package..."
                );

                const { data: existingPackageByCriteria, error: findError } =
                  await supabaseAdmin
                    .from("packages")
                    .select("*")
                    .eq("client_id", session.metadata.user_id)
                    .eq("package_type", session.metadata.package_type)
                    .eq("purchase_date", currentDate)
                    .eq("sessions_included", sessionsIncluded)
                    .single();

                if (findError) {
                  console.error(
                    "❌ Error finding existing package:",
                    findError
                  );
                } else if (existingPackageByCriteria) {
                  console.log(
                    "✅ Found existing package for duplicate transaction:",
                    {
                      packageId: existingPackageByCriteria.id,
                      transactionId: existingPackageByCriteria.transaction_id,
                    }
                  );
                  packageId = existingPackageByCriteria.id;
                }
              }

              if (!packageId) {
                console.warn(
                  "⚠️ Package creation failed and no existing package found"
                );
              }
            } else {
              console.log("✅ Successfully created package with 0 sessions:", {
                id: newPackage.id,
                sessions: newPackage.sessions_included,
                type: newPackage.package_type,
                operation: "create",
              });

              // Now add the sessions to the newly created package
              console.log("🔄 Adding sessions to newly created package:", {
                packageId: newPackage.id,
                addingSessions: sessionsIncluded,
              });

              const { data: updatedPackage, error: updateError } =
                await supabaseAdmin
                  .from("packages")
                  .update({
                    sessions_included: sessionsIncluded,
                    original_sessions: originalSessions,
                  })
                  .eq("id", newPackage.id)
                  .select()
                  .single();

              if (updateError) {
                console.error("❌ Failed to add sessions to new package:", {
                  error: updateError,
                  packageId: newPackage.id,
                  attemptedSessions: sessionsIncluded,
                });
              } else {
                console.log("✅ Successfully added sessions to new package:", {
                  id: updatedPackage.id,
                  oldSessions: newPackage.sessions_included,
                  newSessions: updatedPackage.sessions_included,
                });
              }

              packageId = newPackage.id;
            }
          }

          console.log("✅ Final package state", {
            result: packageId,
            expectedSessions: sessionsIncluded,
            actualSessions: existingPackage
              ? existingPackage.sessions_included
              : sessionsIncluded,
          });

          // After package creation/update, create or update the payment record
          // Note: We'll create the payment record even if packageId is undefined
          // to ensure all successful payments are recorded
          console.log("💳 Processing payment record:", {
            packageId,
            transactionId: session.id,
            packageType: session.metadata.package_type,
            amount: session.amount_total ? session.amount_total / 100 : 0,
          });

          // First, check if payment record already exists
          const { data: existingPayment, error: paymentCheckError } =
            await supabaseAdmin
              .from("payments")
              .select("*")
              .eq("transaction_id", session.id)
              .single();

          if (paymentCheckError && paymentCheckError.code !== "PGRST116") {
            console.error(
              "❌ Error checking existing payment:",
              paymentCheckError
            );
          }

          if (existingPayment) {
            // Update existing payment record
            console.log("💳 Updating existing payment record:", {
              paymentId: existingPayment.id,
              packageId,
              packageType: session.metadata.package_type,
            });

            const { error: paymentUpdateError } = await supabaseAdmin
              .from("payments")
              .update({
                package_id: packageId,
                package_type: session.metadata.package_type,
              })
              .eq("transaction_id", session.id);

            if (paymentUpdateError) {
              console.error("❌ Failed to update payment with package ID:", {
                error: paymentUpdateError,
                transactionId: session.id,
                packageId,
                packageType: session.metadata.package_type,
              });
            } else {
              console.log("✅ Successfully updated payment record");
            }
          } else {
            // Create new payment record
            console.log("💳 Creating new payment record:", {
              clientId: session.metadata.user_id,
              transactionId: session.id,
              amount: session.amount_total ? session.amount_total / 100 : 0,
              sessionCount: sessionsIncluded,
              packageType: session.metadata.package_type,
              packageId,
            });

            const { data: newPayment, error: paymentCreateError } =
              await supabaseAdmin
                .from("payments")
                .insert({
                  client_id: session.metadata.user_id,
                  transaction_id: session.id,
                  amount: session.amount_total ? session.amount_total / 100 : 0,
                  session_count: sessionsIncluded,
                  status: "completed",
                  paid_at: currentDate,
                  package_id: packageId,
                  package_type: session.metadata.package_type,
                })
                .select()
                .single();

            if (paymentCreateError) {
              console.error("❌ Failed to create payment record:", {
                error: paymentCreateError,
                transactionId: session.id,
                packageId,
                packageType: session.metadata.package_type,
              });
            } else {
              console.log("✅ Successfully created payment record:", {
                paymentId: newPayment.id,
                amount: newPayment.amount,
                sessionCount: newPayment.session_count,
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
