import * as Dialog from "@radix-ui/react-dialog";
import { ReactNode } from "react";

interface CustomDialogProps {
  trigger: ReactNode;
  title: string; // title is required for accessibility
  description?: string;
  showTitle?: boolean; // if false, title will be visually hidden but still available for screen readers
  children: ReactNode;
}

export function CustomDialog({
  trigger,
  title,
  description,
  showTitle = true,
  children,
  open,
  onOpenChange,
}: CustomDialogProps & {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 dark:bg-black/80 fixed inset-0" />
        <Dialog.Content className="fixed top-1/2 left-1/2 max-h-[85vh] w-[90vw] max-w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-lg bg-background border p-6 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title
              className={
                showTitle === false
                  ? "sr-only"
                  : "font-medium text-lg text-foreground"
              }
            >
              {title}
            </Dialog.Title>
          </div>
          {description && (
            <Dialog.Description className="sr-only">
              {description}
            </Dialog.Description>
          )}
          <div className="overflow-auto max-h-[60vh]">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
