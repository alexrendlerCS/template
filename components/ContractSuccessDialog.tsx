import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle } from "lucide-react";

interface ContractSuccessDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

export function ContractSuccessDialog({
  open,
  onOpenChange,
  onComplete,
}: ContractSuccessDialogProps) {
  const handleContinue = () => {
    onOpenChange(false);
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <DialogTitle>Contract Accepted!</DialogTitle>
              <DialogDescription>
                Your contract has been signed and a copy has been sent to your
                email.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Next, you'll need to connect your Google Calendar to start
            scheduling training sessions. This will help you manage your
            appointments and receive reminders.
          </p>
        </div>
        <DialogFooter>
          <Button type="button" className="w-full" onClick={handleContinue}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
