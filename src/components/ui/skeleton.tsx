import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md", className)}
      style={{
        backgroundColor: "oklch(var(--background-color-300)/0.6)",
      }}
      {...props}
    />
  )
}

export { Skeleton }
