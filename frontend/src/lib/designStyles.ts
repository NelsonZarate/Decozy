export interface DesignStyle {
  /** Label shown to the user in the style selector. */
  name: string;
  /** Thumbnail used in the style selector card. */
  image: string;
  /**
   * Hidden English instruction appended to the user's prompt before it is sent
   * to the backend. The user never sees this text.
   */
  prompt: string;
}

export const designStyles: DesignStyle[] = [
  {
    name: "Keep Current",
    image: "",
    prompt:
      "Maintain the current style of design already present in this image and only apply the requested changes while preserving the existing aesthetic.",
  },
  {
    name: "Scandinavian",
    image:
      "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=300&h=300&fit=crop&q=80",
    prompt:
      "The style of the requested items must follow Scandinavian design: light woods, clean lines, muted neutral tones, minimal ornamentation, and a cozy, functional feel.",
  },
  {
    name: "Industrial",
    image: "https://planner5d.com/blog/content/images/2025/07/industrial-style.webp",
    prompt:
      "The style of the requested items must follow industrial design: raw materials, exposed metal and brick, weathered wood, and a utilitarian, urban-loft aesthetic.",
  },
  {
    name: "Minimalist",
    image:
      "https://cdn.apartmenttherapy.info/image/upload/f_jpg,q_auto:eco,c_fill,g_auto,w_1500,ar_4:3/at%2Fhouse%20tours%2F2023-House-Tours%2F2023-October%2Fmiranda-co%2Ftours-brooklyn-miranda-co-6",
    prompt:
      "The style of the requested items must follow minimalist design: simple forms, clutter-free layouts, neutral palettes, and a strong focus on function and negative space.",
  },
  {
    name: "Mid-Century",
    image:
      "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=300&h=300&fit=crop&q=80",
    prompt:
      "The style of the requested items must follow mid-century modern design: organic curves, tapered wooden legs, warm retro tones, and clean functional silhouettes.",
  },
  {
    name: "Bohemian",
    image:
      "https://chandelierslife.com/cdn/shop/articles/thumbnail_46d8851b-3fb0-485a-98ba-aaf952087285.jpg?v=1737637408",
    prompt:
      "The style of the requested items must follow bohemian design: eclectic layered textures, rich warm colors, natural materials, plants, and an artistic free-spirited feel.",
  },
  {
    name: "Japanese",
    image: "https://web-japan.org/trends/img/fas202503_interior01L.jpg",
    prompt:
      "The style of the requested items must follow Japanese design: natural materials, low furniture, serene neutral tones, clean lines, and a calm, balanced, zen aesthetic.",
  },
  {
    name: "Art Deco",
    image:
      "https://cdn.shopify.com/s/files/1/0710/7693/8014/files/contemporary-japanese-wall-art-set-of-3-wall-art-prints-599676.webp?v=1758281424",
    prompt:
      "The style of the requested items must follow Art Deco design: bold geometric patterns, luxurious materials, rich jewel tones, metallic accents, and glamorous symmetry.",
  },
  {
    name: "Coastal",
    image:
      "https://images.unsplash.com/photo-1779903726785-7cf25bed78f7?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTV8fGNvYXN0YWwlMjBpbnRlcmlvciUyMGRlc2lnbnxlbnwwfHwwfHx8MA%3D%3D",
    prompt:
      "The style of the requested items must follow coastal design: airy light spaces, soft blues and whites, natural fibers, and a relaxed beach-house atmosphere.",
  },
  {
    name: "Farmhouse",
    image:
      "https://cdn.decorilla.com/online-decorating/wp-content/uploads/2023/04/Modern-farmhouse-decor-in-an-open-living-space-by-Decorilla-1024x683.jpeg?width=900",
    prompt:
      "The style of the requested items must follow farmhouse design: rustic warm woods, shiplap textures, vintage accents, and a cozy, welcoming country aesthetic.",
  },
  {
    name: "Mediterranean",
    image:
      "https://mobilious.com/cdn/shop/articles/Mediterranean_Interior_Design.png?v=1746261208",
    prompt:
      "The style of the requested items must follow Mediterranean design: warm earthy tones, terracotta, wrought iron, textured plaster walls, and a sunny coastal-European feel.",
  },
  {
    name: "Contemporary",
    image:
      "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=300&h=300&fit=crop&q=80",
    prompt:
      "The style of the requested items must follow contemporary design: sleek current trends, neutral palettes with bold accents, clean lines, and refined modern finishes.",
  },
  {
    name: "Rustic",
    image:
      "https://cdn.decorilla.com/online-decorating/wp-content/uploads/2024/12/Mountain-rustic-home-before-and-after-by-Decorilla-1024x683.jpeg?width=900",
    prompt:
      "The style of the requested items must follow rustic design: raw natural wood, stone, organic textures, and a rugged, warm, nature-inspired aesthetic.",
  },
];

/** Returns the hidden English prompt phrase for a given style name. */
export function getStylePrompt(name: string | null): string | null {
  if (!name) return null;
  return designStyles.find((style) => style.name === name)?.prompt ?? null;
}
