"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { HamburgerMenu } from "@/components/layout/HamburgerMenu";
import { ProjectsProvider } from "@/components/projects/ProjectsContext";
import { CartProvider } from "@/components/cart/CartContext";
import { FloatingCart } from "@/components/cart/FloatingCart";

export default function TabsLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ProjectsProvider>
      <CartProvider>
        <div className="flex flex-col min-h-screen max-w-md mx-auto w-full bg-surface">
          <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
          <Header onMenuClick={() => setMenuOpen(true)} />
          <div className="flex-1 flex flex-col bg-surface-page">{children}</div>
          <FloatingCart />
          <BottomNav />
        </div>
      </CartProvider>
    </ProjectsProvider>
  );
}
