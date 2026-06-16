import { UploadArea } from "@/components/ui/UploadArea";
import { StyleSelector } from "@/components/ui/StyleSelector";
import { CustomInstructions } from "@/components/ui/CustomInstructions";
import { GenerateButton } from "@/components/ui/GenerateButton";

export default function DesignPage() {
  return (
    <main className="flex-1 px-4 pb-24">
      <section className="mb-8">
        <h2 className="font-serif text-xl font-medium leading-7 text-primary-container mb-1">
          Upload your space
        </h2>
        <p className="text-xs leading-4 text-on-surface-variant mb-3">
          Take a photo or upload an image of the room you want to redesign.
        </p>
        <UploadArea />
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-lg font-medium leading-6 text-primary-container mb-3">
          Select Style
        </h2>
        <StyleSelector />
      </section>

      <section className="mb-8">
        <h2 className="font-serif text-lg font-medium leading-6 text-primary-container mb-3">
          Custom Instructions
        </h2>
        <CustomInstructions />
      </section>

      <GenerateButton />
    </main>
  );
}
