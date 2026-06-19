"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthProvider";
import Link from "next/link";

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    id: "saved",
    label: "Saved Items",
    active: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();

  function handleSignIn() {
    onClose();
  }

  function handleSignOut() {
    signOut();
    onClose();
    router.push("/");
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-[75%] max-w-[300px] bg-white z-50 transform transition-transform duration-300 ease-in-out rounded-r-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-6 pt-10">
          {/* Account */}
          {isAuthenticated ? (
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-high">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&q=80"
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-on-surface text-base truncate">
                  {user?.name ?? "Member"}
                </h3>
                <p className="text-xs text-outline">Pro Member</p>
              </div>
            </div>
          ) : (
            <div className="mb-8">
              <p className="text-base font-semibold text-on-surface mb-1">
                Welcome to Decozy
              </p>
              <p className="text-xs text-outline mb-4">
                Sign in to save and sync your designs.
              </p>
            <Link
              href="/signin"
              onClick={handleSignIn}
              className="w-full py-3 flex items-center justify-center rounded-xl font-semibold text-sm text-surface bg-primary-container hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Sign In
            </Link>
            </div>
          )}

          {/* Menu Items */}
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors w-full text-left ${
                  item.active
                    ? "bg-secondary-container text-on-surface"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span className={item.active ? "text-secondary" : "text-on-surface-variant"}>
                  {item.icon}
                </span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* Sign Out pinned to the bottom */}
          {isAuthenticated && (
            <button
              onClick={handleSignOut}
              className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-error hover:bg-error-container/40 transition-colors w-full text-left"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          )}
        </div>
      </div>
    </>
  );
}
