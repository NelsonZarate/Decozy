"use client";

import Image from "next/image";
import { useUpload } from "@/components/ui/UploadContext";

const styles = [
  {
    name: "Keep Current",
    image: "",
  },
  {
    name: "Scandinavian",
    image: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=300&h=300&fit=crop&q=80",
  },
  {
    name: "Industrial",
    image: "https://planner5d.com/blog/content/images/2025/07/industrial-style.webp",
  },
  {
    name: "Minimalist",
    image: "https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_4:3/at%2Fhouse%20tours%2F2023-House-Tours%2F2023-October%2Fmiranda-co%2Ftours-brooklyn-miranda-co-6",
  },
  {
    name: "Mid-Century",
    image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&h=300&fit=crop&q=80",
  },
  {
    name: "Bohemian",
    image: "https://chandelierslife.com/cdn/shop/articles/thumbnail_46d8851b-3fb0-485a-98ba-aaf952087285.jpg?v=1737637408",
  },
  {
    name: "Japanese",
    image: "https://web-japan.org/trends/img/fas202503_interior01L.jpg",
  },
  {
    name: "Art Deco",
    image: "https://cdn.shopify.com/s/files/1/0710/7693/8014/files/contemporary-japanese-wall-art-set-of-3-wall-art-prints-599676.webp?v=1758281424",
  },
  {
    name: "Coastal",
    image: "https://images.unsplash.com/photo-1779903726785-7cf25bed78f7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNvYXN0YWwlMjBpbnRlcmlvciUyMGRlc2lnbnxlbnwwfHwwfHx8MA%3D%3D",
  },
  {
    name: "Farmhouse",
    image: "https://cdn.decorilla.com/online-decorating/wp-content/uploads/2023/04/Modern-farmhouse-decor-in-an-open-living-space-by-Decorilla-1024x683.jpeg?width=900",
  },
  {
    name: "Mediterranean",
    image: "https://mobilious.com/cdn/shop/articles/Mediterranean_Interior_Design.png?v=1746261208",
  },
  {
    name: "Contemporary",
    image: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=300&h=300&fit=crop&q=80",
  },
  {
    name: "Rustic",
    image: "https://cdn.decorilla.com/online-decorating/wp-content/uploads/2024/12/Mountain-rustic-home-before-and-after-by-Decorilla-1024x683.jpeg?width=900",
  },
];

export function StyleSelector() {
  const { imageUrl, selectedStyle, setSelectedStyle } = useUpload();

  return (
    <div className="flex gap-3 overflow-x-auto py-2.5 -mx-2 px-2 scrollbar-hide">
      {styles.map((style) => {
        // The "Keep Current" card mirrors the uploaded/captured image.
        const isKeepCurrent = style.name === "Keep Current";
        const effectiveImage = isKeepCurrent ? imageUrl : style.image;

        return (
        <button
          key={style.name}
          onClick={() => setSelectedStyle(style.name)}
          className={`relative flex-shrink-0 w-[150px] h-[150px] rounded-lg overflow-hidden transition-all ${
            selectedStyle === style.name
              ? "ring-2 ring-secondary ring-offset-2 ring-offset-surface scale-105"
              : ""
          }`}
        >
          {effectiveImage ? (
            <Image
              src={effectiveImage}
              alt={style.name}
              fill
              sizes="150px"
              unoptimized={isKeepCurrent}
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-on-surface-variant">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <span className="absolute bottom-2 left-2 text-white text-[10px] font-semibold tracking-[0.03em]">
            {style.name}
          </span>
        </button>
        );
      })}
    </div>
  );
}
