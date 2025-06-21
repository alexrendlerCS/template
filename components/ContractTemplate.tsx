import { cn } from "@/lib/utils";

interface ContractTemplateProps {
  clientName: string;
  email: string;
  phone: string;
  startDate: string;
  location: string;
  signature: string;
  signatureDate: string;
  isMinor?: boolean;
  parentName?: string;
  parentSignature?: string;
  parentSignatureDate?: string;
  minorDOB?: string;
  trainerSignature: string;
  trainerSignatureDate: string;
  className?: string;
}

export function ContractTemplate({
  clientName,
  email,
  phone,
  startDate,
  location,
  signature,
  signatureDate,
  isMinor,
  parentName,
  parentSignature,
  parentSignatureDate,
  minorDOB,
  trainerSignature,
  trainerSignatureDate,
  className,
}: ContractTemplateProps) {
  return (
    <div className={cn("space-y-6 text-sm leading-relaxed", className)}>
      <header className="text-center space-y-4">
        <h1 className="text-xl font-bold">
          COACH KILDAY LLC | PERSONAL TRAINING AGREEMENT
        </h1>
        <div className="space-y-2">
          <p className="font-semibold">Business:</p>
          <p>Coach Kilday LLC</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p>Client Name: {clientName || "{{client_name}}"}</p>
            <p>Email: {email || "{{email}}"}</p>
            <p>Phone: {phone || "{{phone}}"}</p>
            <p>Start Date: {startDate || "{{start_date}}"}</p>
            <p>Training Location: {location || "{{location}}"}</p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="font-bold mb-2">
          1. LIABILITY WAIVER AND ASSUMPTION OF RISK
        </h2>
        <p>
          By signing this agreement, I, the undersigned client, voluntarily
          agree to participate in physical training sessions provided by Coach
          Kilday LLC and acknowledge and accept the following:
        </p>
        <ul className="list-disc ml-6 mt-2 space-y-2">
          <li>
            I affirm that I am physically able to participate in a fitness
            program and either have obtained medical clearance or take full
            responsibility for participating without it.
          </li>
          <li>
            I understand that physical exercise carries inherent risks,
            including but not limited to musculoskeletal injuries,
            cardiovascular events, other health complications and death.
          </li>
          <li>
            I hereby RELEASE, WAIVE, AND DISCHARGE Coach Kilday LLC, its owners,
            employees, agents, and independent contractors from ANY AND ALL
            LIABILITY, CLAIMS, OR DEMANDS arising from participation in training
            or use of facilities, INCLUDING THOSE CAUSED BY ORDINARY NEGLIGENCE.
          </li>
          <li>
            I agree to INDEMNIFY, DEFEND, AND HOLD HARMLESS Coach Kilday LLC and
            all affiliated parties from any claims or demands resulting from my
            participation or conduct.
          </li>
          <li>
            In the case of a medical emergency, I authorize Coach Kilday LLC to
            seek medical treatment on my behalf, understanding that I am
            responsible for any related expenses.
          </li>
          <li>
            I acknowledge that any nutrition or supplement advice provided is
            for informational purposes only and does not constitute medical
            advice. I release Coach Kilday LLC from any liability related to
            adverse effects resulting from nutrition or supplementation.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold mb-2">2. MEDIA RELEASE</h2>
        <p>
          I grant Coach Kilday LLC the right to use any photographs, videos, or
          testimonials of me for marketing, social media, or business promotion
          purposes unless I provide written notice requesting otherwise.
        </p>
      </section>

      <section>
        <h2 className="font-bold mb-2">3. SESSION USAGE POLICY</h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            Training sessions are sold in monthly packages or subscriptions
            based on billing cycles (e.g., June 5 – July 4).
          </li>
          <li>
            Clients are responsible for scheduling their own sessions. Coach
            Kilday LLC is not responsible for unused or unscheduled sessions.
          </li>
          <li>
            Any unused sessions must be used within two weeks after the end of
            the billing cycle. After this grace period, all unused sessions
            expire and are forfeited. No refunds or rollovers will be granted.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold mb-2">
          4. SUBSCRIPTION & CANCELLATION POLICY
        </h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            Subscriptions are billed automatically on a recurring monthly basis
            using the original sign-up date.
          </li>
          <li>
            Clients must submit cancellation requests via email to
            haley@coachkilday.com at least 30 days prior to their next billing
            date.
          </li>
          <li>
            Cancellations made within 30 days of the next billing date will
            result in one final charge, with services continuing through the end
            of that final paid cycle.
          </li>
          <li>
            This policy is non-negotiable and applies immediately upon
            enrollment.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold mb-2">
          5. MISSED SESSIONS, LATENESS & REFUNDS
        </h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            Clients arriving more than 15 minutes late may forfeit their session
            at the trainer's discretion.
          </li>
          <li>
            Sessions canceled with less than 24 hours' notice may be forfeited.
            Make-up sessions must be completed within the same calendar week of
            the original booking and are not guaranteed.
          </li>
          <li>
            All personal training sales are final. No refunds will be given for
            unused sessions, dissatisfaction, or early termination of the
            training agreement.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold mb-2">
          6. DISPUTE RESOLUTION & GOVERNING LAW
        </h2>
        <ul className="list-disc ml-6 space-y-2">
          <li>
            This agreement is governed by the laws of the State of Colorado.
          </li>
          <li>
            Any disputes arising under this agreement will be subject to the
            jurisdiction of the courts in Denver County, Colorado.
          </li>
          <li>
            Both parties agree to attempt mediation or binding arbitration
            before pursuing legal action.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="font-bold mb-2">7. ELECTRONIC SIGNATURE CONSENT</h2>
        <p>
          By signing this agreement, I agree that my electronic signature
          (including typed name or digital signature) is valid and enforceable
          under applicable federal and state law and carries the same legal
          effect as a handwritten signature.
        </p>
      </section>

      <section>
        <h2 className="font-bold mb-2">8. AGREEMENT ACKNOWLEDGMENT</h2>
        <p>
          By signing below, I acknowledge that I have read, understand, and
          agree to all terms in this Personal Training Agreement. I certify that
          I am entering into this agreement voluntarily and without duress.
        </p>
      </section>

      <section className="mt-8">
        <div>
          <p>Client Signature:</p>
          {signature && signature.startsWith("data:image/") ? (
            <img
              src={signature}
              alt="Client Signature"
              className="max-w-[200px] h-auto"
            />
          ) : (
            <p>{signature || "{{signature}}"}</p>
          )}
          <p>Date: {signatureDate || "{{signature_date}}"}</p>
        </div>

        {isMinor && (
          <div>
            <p>Parent/Guardian Name & Signature (if under 18 years old):</p>
            <p>{parentSignature || "{{parent_signature}}"}</p>
            <p>Date: {parentSignatureDate || "{{parent_signature_date}}"}</p>
            <p>DOB (if minor): {minorDOB || "{{minor_dob}}"}</p>
          </div>
        )}

        <div>
          <p>
            Trainer Signature: {trainerSignature || "{{trainer_signature}}"}
          </p>
          <p>Date: {trainerSignatureDate || "{{trainer_signature_date}}"}</p>
        </div>
      </section>
    </div>
  );
}
