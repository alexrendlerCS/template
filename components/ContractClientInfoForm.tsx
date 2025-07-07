"use client";

import { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabaseClient";

interface ContractClientInfoFormProps {
  initialData?: {
    clientName?: string;
    email?: string;
    phone?: string;
    startDate?: string;
    location?: string;
    signature?: string;
  };
  onSubmit: (data: {
    clientName: string;
    email: string;
    phone: string;
    startDate: string;
    location: string;
    signature: string;
  }) => void;
}

export function ContractClientInfoForm({
  initialData = {},
  onSubmit,
}: ContractClientInfoFormProps) {
  const [formData, setFormData] = useState({
    clientName: initialData.clientName || "",
    email: initialData.email || "",
    phone: initialData.phone || "",
    startDate: initialData.startDate || new Date().toISOString().split("T")[0],
    location: initialData.location || "",
    signature: initialData.signature || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);
  const supabase = createClient();

  useEffect(() => {
    // Try to prefill email from Supabase session
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.email && !formData.email) {
        setFormData((prev) => ({ ...prev, email: session.user.email! }));
      }
    };
    getSession();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial canvas size
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);

    signaturePadRef.current = new SignaturePad(canvas, {
      backgroundColor: "rgb(255, 255, 255)",
      penColor: "rgb(0, 0, 0)",
      velocityFilterWeight: 0.7,
      minWidth: 1,
      maxWidth: 2.5,
      throttle: 16,
      minDistance: 0,
    });

    // Handle window resize
    const resizeCanvas = () => {
      if (canvas) {
        const ratio = Math.max(window.devicePixelRatio || 1, 1);
        const oldData = signaturePadRef.current?.toData();

        canvas.width = canvas.offsetWidth * ratio;
        canvas.height = canvas.offsetHeight * ratio;
        ctx.scale(ratio, ratio);

        if (oldData) {
          signaturePadRef.current?.fromData(oldData);
        }
      }
    };

    window.addEventListener("resize", resizeCanvas);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = "Full name is required";
    } else if (formData.clientName.trim().length < 2) {
      newErrors.clientName =
        "Please enter your full name (at least 2 characters)";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email =
        "Please enter a valid email address (e.g., john@example.com)";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (formData.phone.replace(/\D/g, "").length < 10) {
      newErrors.phone =
        "Please enter a valid phone number (at least 10 digits)";
    }

    if (!formData.location.trim()) {
      newErrors.location = "Training location is required";
    } else if (formData.location.trim().length < 3) {
      newErrors.location = "Please enter a valid training location";
    }

    if (signaturePadRef.current?.isEmpty()) {
      newErrors.signature = "Please sign to accept the contract";
    } else if (signaturePadRef.current) {
      const signatureData = signaturePadRef.current.toDataURL();
      if (signatureData.length < 100) {
        newErrors.signature = "Please provide a more complete signature";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm() && signaturePadRef.current) {
      // Get signature data
      const signatureData = signaturePadRef.current.toDataURL();

      // Additional validation for mobile devices
      if (signatureData.length < 100) {
        setErrors((prev) => ({
          ...prev,
          signature: "Please provide a more complete signature",
        }));
        return;
      }

      // Check if signature is just a dot or very small
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let pixelCount = 0;

          // Count non-transparent pixels
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) pixelCount++;
          }

          if (pixelCount < 50) {
            setErrors((prev) => ({
              ...prev,
              signature: "Please provide a more complete signature",
            }));
            return;
          }
        }
      }

      console.log("Signature validation passed, length:", signatureData.length);

      onSubmit({
        ...formData,
        signature: signatureData,
      });
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Client Information</DialogTitle>
        <DialogDescription>
          Please provide your information to proceed with the contract.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label htmlFor="clientName">Full Name</Label>
          <Input
            id="clientName"
            value={formData.clientName}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, clientName: e.target.value }))
            }
            placeholder="Enter your full name"
            className={errors.clientName ? "border-red-500" : ""}
          />
          {errors.clientName && (
            <p className="text-sm text-red-500">{errors.clientName}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="Enter your email"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-500">{errors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, phone: e.target.value }))
            }
            placeholder="Enter your phone number"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-500">{errors.phone}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <Input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, startDate: e.target.value }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Training Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, location: e.target.value }))
            }
            placeholder="Enter training location"
            className={errors.location ? "border-red-500" : ""}
          />
          {errors.location && (
            <p className="text-sm text-red-500">{errors.location}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Signature</Label>
          <div className="border rounded-md p-2 bg-white">
            <canvas
              ref={canvasRef}
              className="w-full h-32"
              style={{
                width: "100%",
                height: "128px",
                touchAction: "none",
                userSelect: "none",
                cursor: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 8 8'%3E%3Ccircle cx='4' cy='4' r='3' fill='black'/%3E%3C/svg%3E") 4 4, pointer`,
              }}
            />
            <div
              id="signature-dot"
              className="pointer-events-none fixed z-50"
              style={{
                width: "4px",
                height: "4px",
                backgroundColor: "black",
                borderRadius: "50%",
                position: "fixed",
                pointerEvents: "none",
                transform: "translate(-50%, -50%)",
                transition: "transform 0.1s ease-out",
              }}
            />
          </div>
          {errors.signature && (
            <p className="text-sm text-red-500">{errors.signature}</p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
          >
            Clear Signature
          </Button>
        </div>

        <Button type="button" onClick={handleSubmit} className="w-full">
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </>
  );
}
