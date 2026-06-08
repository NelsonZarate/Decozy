import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { UploadArea } from "@/components/ui/UploadArea";
import { StyleSelector } from "@/components/ui/StyleSelector";
import { CustomInstructions } from "@/components/ui/CustomInstructions";
import { GenerateButton } from "@/components/ui/GenerateButton";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-surface">
      <Header />

      <main className="flex-1 px-4 pb-24">
        {/* Upload Section */}
        <section className="mb-8">
          <h2 className="font-serif text-xl font-medium leading-7 text-primary-container mb-1">
            Upload your space
          </h2>
          <p className="text-xs leading-4 text-on-surface-variant mb-3">
            Take a photo or upload an image of the room you want to redesign.
          </p>
          <UploadArea />
        </section>

        {/* Style Selection */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-medium leading-6 text-primary-container">
              Select Style
            </h2>
            <button className="text-xs font-medium text-outline hover:text-on-surface-variant tracking-[0.05em] transition-colors">
              See all
            </button>
          </div>
          <StyleSelector />
        </section>

        {/* Custom Instructions */}
        <section className="mb-8">
          <h2 className="font-serif text-lg font-medium leading-6 text-primary-container mb-3">
            Custom Instructions
          </h2>
          <CustomInstructions />
        </section>

        {/* Generate */}
        <GenerateButton />
      </main>

      <BottomNav />
    </div>
  );
}
