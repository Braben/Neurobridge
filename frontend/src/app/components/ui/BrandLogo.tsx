// import Image from "next/image";

// interface BrandLogoProps {
//   className?: string;
//   compact?: boolean;
//   variant?: "blue" | "white";
// }

// export default function BrandLogo({
//   className = "",
//   compact = false,
//   variant = "blue",
// }: BrandLogoProps) {
//   const src =
//     variant === "white"
//       ? "/design-assets/logo-white-card.png"
//       : compact
//         ? "/design-assets/logo-transparent.png"
//         : "/design-assets/logo-blue-card.png";

//   return (
//     <Image
//       src={src}
//       alt="Neuro Bridge Africa"
//       width={compact ? 430 : 512}
//       height={compact ? 90 : 512}
//       priority
//       className={[
//         "h-auto object-contain",
//         compact ? "w-48 sm:w-56" : "w-52",
//         className,
//       ]
//         .filter(Boolean)
//         .join(" ")}
//     />
//   );
// }
import Image from "next/image";

interface BrandLogoProps {
  className?: string;
  compact?: boolean;
  variant?: "blue" | "white";
}

export default function BrandLogo({
  className = "",
  compact = false,
  variant = "blue",
}: BrandLogoProps) {
  const src =
    variant === "white"
      ? "/design-assets/logo-white-card.png"
      : compact
        ? "/design-assets/logo-transparent.png"
        : "/design-assets/logo-blue-card.png";

  // Apply default responsive widths ONLY if no custom width class is passed in className
  const hasCustomWidth = /\bw-/?.test(className);
  const defaultWidth = compact ? "w-48 sm:w-56" : "w-52";

  return (
    <Image
      src={src}
      alt="Neuro Bridge Africa Logo"
      width={compact ? 760 : 512}
      height={compact ? 160 : 512}
      priority
      className={[
        "h-auto object-contain",
        !hasCustomWidth && defaultWidth,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    />
  );
}
