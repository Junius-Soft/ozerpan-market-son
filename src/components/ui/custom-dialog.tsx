import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
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
}: CustomDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="bg-black/50 dark:bg-black/80 data-[state=open]:animate-overlayShow fixed inset-0" />
        <Dialog.Content className="data-[state=open]:animate-contentShow fixed top-[50%] left-[50%] max-h-[85vh] w-[90vw] max-w-[600px] translate-x-[-50%] translate-y-[-50%] rounded-lg bg-background border p-6 shadow-lg">
          <Dialog.Title
            className={
              showTitle === false
                ? "sr-only"
                : "font-medium text-lg text-foreground"
            }
          >
            {title}
          </Dialog.Title>
          <div className="flex justify-between items-center mb-4 -mt-1">
            <div
              className={
                showTitle
                  ? "opacity-0 pointer-events-none"
                  : "opacity-0 pointer-events-none absolute"
              }
              aria-hidden
            >
              {title}
            </div>
            <Dialog.Close asChild>
              <button className="rounded-full w-6 h-6 inline-flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground ml-auto">
                <X className="w-4 h-4" />
              </button>
            </Dialog.Close>
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
