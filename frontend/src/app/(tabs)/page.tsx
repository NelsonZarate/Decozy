import { UploadArea } from "@/components/ui/UploadArea";
import { StyleSelector } from "@/components/ui/StyleSelector";
import { CustomInstructions } from "@/components/ui/CustomInstructions";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { ProcessingTray } from "@/components/ui/ProcessingTray";
import { UploadProvider } from "@/components/ui/UploadContext";

export default function DesignPage() {
  return (
    <UploadProvider>
      <main className="flex-1 flex flex-col px-4 pb-20">
        <section className="flex flex-col">
          <h2 className="font-serif text-xl font-medium leading-7 text-primary-container mb-1">
            Upload your space
          </h2>
          <p className="text-xs leading-4 text-on-surface-variant mb-2">
            Take a photo or upload an image of the room you want to redesign.
          </p>
          <UploadArea />
        </section>

        <section className="flex flex-col mt-auto">
          <h2 className="font-serif text-lg font-medium leading-6 text-primary-container mb-2">
            Select Style
          </h2>
          <StyleSelector />
        </section>

        <section className="flex flex-col mt-auto">
          <ProcessingTray />
          <h2 className="font-serif text-lg font-medium leading-6 text-primary-container mb-2">
            Custom Instructions
          </h2>
          <CustomInstructions />
        </section>

        <div className="mt-auto">
          <GenerateButton />
        </div>
      </main>
    </UploadProvider>
  );
}
