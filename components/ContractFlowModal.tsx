"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ContractClientInfoForm } from "./ContractClientInfoForm";
import { ContractModal } from "./ContractModal";
import { ContractSuccessDialog } from "./ContractSuccessDialog";
import { AlertCircle } from "lucide-react";

interface ContractFlowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface FormData {
  clientName: string;
  email: string;
  phone: string;
  startDate: string;
  location: string;
  signature: string;
}

export function ContractFlowModal({
  open,
  onOpenChange,
  onComplete,
}: ContractFlowModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    clientName: "",
    email: "",
    phone: "",
    startDate: new Date().toISOString().split("T")[0],
    location: "",
    signature: "",
  });

  const handleComplete = async () => {
    setShowSuccessDialog(true);
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    if (onComplete) {
      onComplete();
    }
    // Reset the form state after completion
    setStep(1);
    setFormData({
      clientName: "",
      email: "",
      phone: "",
      startDate: new Date().toISOString().split("T")[0],
      location: "",
      signature: "",
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={() => {}} modal={true}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start gap-4 p-4 mb-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <DialogTitle className="text-yellow-800 mb-2">
                  Important Notice
                </DialogTitle>
                <DialogDescription className="text-yellow-700">
                  This agreement is required to use our platform. You must
                  complete and accept this agreement to proceed. This ensures
                  both parties understand their responsibilities and helps us
                  maintain a professional relationship. You cannot skip or exit
                  this step.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          {step === 1 ? (
            <ContractClientInfoForm
              initialData={formData}
              onSubmit={(data) => {
                setFormData(data);
                setStep(2);
              }}
            />
          ) : (
            <ContractModal
              {...formData}
              onBack={() => setStep(1)}
              onAccept={handleComplete}
              onOpenChange={() => {}} // Prevent closing from ContractModal
            />
          )}
        </DialogContent>
      </Dialog>

      <ContractSuccessDialog
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
        onComplete={handleSuccessDialogClose}
      />
    </>
  );
}
