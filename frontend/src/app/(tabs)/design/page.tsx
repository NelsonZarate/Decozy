import { UploadArea } from "@/components/ui/UploadArea";
import { StyleSelector } from "@/components/ui/StyleSelector";
import { CustomInstructions } from "@/components/ui/CustomInstructions";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { ProcessingTray } from "@/components/ui/ProcessingTray";
import { UploadProvider } from "@/components/ui/UploadContext";

export default function DesignPage() {
  return (
    <UploadProvider>
      <main className="flex-1 flex flex-col px-4 pb-20 lg:grid lg:grid-cols-2 lg:gap-14 lg:items-center lg:content-center lg:max-w-6xl lg:mx-auto lg:w-full lg:px-8 lg:py-10">
        <section className="flex flex-col">
          <h2 className="font-serif text-xl font-medium leading-7 text-primary-container mb-1 lg:text-3xl lg:leading-9 lg:mb-2">
            Upload your space
          </h2>
          <p className="text-xs leading-4 text-on-surface-variant mb-2 lg:text-base lg:leading-6 lg:mb-5">
            Take a photo or upload an image of the room you want to redesign.
          </p>
          <UploadArea />
        </section>

        <div className="contents lg:flex lg:flex-col lg:gap-9">
          <section className="flex flex-col mt-auto lg:mt-0">
            <h2 className="font-serif text-lg font-medium leading-6 text-primary-container mb-2 lg:text-2xl lg:leading-8 lg:mb-4">
              Select Style
            </h2>
            <StyleSelector />
          </section>

          <section className="flex flex-col mt-auto lg:mt-0">
            <ProcessingTray />
            <h2 className="font-serif text-lg font-medium leading-6 text-primary-container mb-2 lg:text-2xl lg:leading-8 lg:mb-4">
              Custom Instructions
            </h2>
            <CustomInstructions />
          </section>

          <div className="mt-auto lg:mt-0">
            <GenerateButton />
          </div>
        </div>
      </main>
    </UploadProvider>
  );
}
