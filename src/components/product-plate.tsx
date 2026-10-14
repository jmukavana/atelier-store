import { AspectRatio } from "@/components/ui/aspect-ratio";
import { cn } from "@/lib/utils";

/**
 * Stands in for real product photography, which this project deliberately
 * omits (no licensed imagery to display). Renders a tonal plate with the
 * product's initial set in the display serif, echoing an editorial
 * lookbook plate rather than a literal photo.
 */
export function ProductPlate({
  mark,
  ratio = 4 / 5,
  align = "center",
  className,
  markClassName,
}: {
  mark: string;
  ratio?: number;
  align?: "center" | "corner";
  className?: string;
  markClassName?: string;
}) {
  return (
    <AspectRatio
      ratio={ratio}
      className={cn(
        "plate",
        align === "corner" && "items-end justify-end p-8 sm:p-12",
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          "plate-mark leading-none",
          align === "center"
            ? "text-[18vw] sm:text-[6vw]"
            : "text-[12vw] opacity-40 sm:text-[4vw]",
          markClassName
        )}
      >
        {mark}
      </span>
    </AspectRatio>
  );
}
