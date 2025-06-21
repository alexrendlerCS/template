import { NextResponse } from "next/server";
import { Resend } from "resend";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

interface SessionEmailPayload {
  trainer_email: string;
  trainer_name: string;
  client_name: string;
  date: string;
  start_time: string;
  end_time: string;
  session_type: string;
  location?: string;
  notes?: string;
}

export async function POST(request: Request) {
  try {
    const body: SessionEmailPayload = await request.json();

    // Validate required fields
    const requiredFields: (keyof SessionEmailPayload)[] = [
      "trainer_email",
      "trainer_name",
      "client_name",
      "date",
      "start_time",
      "end_time",
      "session_type",
    ];

    const missingFields = requiredFields.filter((field) => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(", ")}` },
        { status: 400 }
      );
    }

    // Format the email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">New Training Session Booked</h2>
        
        <p style="font-size: 16px;">Hello ${body.trainer_name},</p>
        
        <p style="font-size: 16px;">A new training session has been booked with you.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0;">
            <strong>📅 Date:</strong> ${body.date}
          </p>
          <p style="margin: 10px 0;">
            <strong>⏰ Time:</strong> ${body.start_time} - ${body.end_time}
          </p>
          <p style="margin: 10px 0;">
            <strong>👤 Client:</strong> ${body.client_name}
          </p>
          <p style="margin: 10px 0;">
            <strong>🏋️ Session Type:</strong> ${body.session_type}
          </p>
          ${
            body.location
              ? `
          <p style="margin: 10px 0;">
            <strong>📍 Location:</strong> ${body.location}
          </p>
          `
              : ""
          }
          ${
            body.notes
              ? `
          <p style="margin: 10px 0;">
            <strong>📝 Notes:</strong> ${body.notes}
          </p>
          `
              : ""
          }
        </div>
        
        <p style="font-size: 16px;">You can view this session and manage your schedule in your <a href="${
          process.env.NEXT_PUBLIC_APP_URL
        }/trainer/schedule" style="color: #007bff;">dashboard</a>.</p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        
        <p style="color: #666; font-size: 14px;">
          — Fitness Trainer Scheduler Team
        </p>
      </div>
    `;

    // Send email with Resend
    await resend.emails.send({
      from: "Fitness Trainer <no-reply@coachkilday.com>",
      to: [body.trainer_email],
      subject: "New Training Session Booked",
      html: emailHtml,
    });

    return NextResponse.json(
      { message: "Session confirmation email sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to send session confirmation email:", error);
    return NextResponse.json(
      { error: "Failed to send session confirmation email" },
      { status: 500 }
    );
  }
}
