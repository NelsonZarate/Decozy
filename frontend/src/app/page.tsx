"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { UploadArea } from "@/components/ui/UploadArea";
import { StyleSelector } from "@/components/ui/StyleSelector";
import { CustomInstructions } from "@/components/ui/CustomInstructions";
import { GenerateButton } from "@/components/ui/GenerateButton";
import { GalleryPage } from "@/components/GalleryPage";
import { MyItemsPage } from "@/components/MyItemsPage";

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("design");

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-surface">
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <Header onMenuClick={() => setMenuOpen(true)} />

      {activeTab === "design" && (
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
      )}

      {activeTab === "gallery" && <GalleryPage />}

      {activeTab === "my-items" && <MyItemsPage />}

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
