"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { ImageIcon } from "lucide-react"

interface ProductImageProps {
  src?: string | null
  alt: string
  className?: string
  fallbackClassName?: string
  showFallbackIcon?: boolean
}

export function ProductImage({ 
  src, 
  alt, 
  className, 
  fallbackClassName,
  showFallbackIcon = true 
}: ProductImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoading, setImageLoading] = useState(true)

  // Reset error/loading when src changes so a new URL can load
  useEffect(() => {
    if (src) {
      setImageError(false)
      setImageLoading(true)
    }
  }, [src])

  const handleImageLoad = () => {
    setImageLoading(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoading(false)
  }

  if (!src || imageError) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center",
        fallbackClassName,
        className
      )}>
        {showFallbackIcon ? (
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
        ) : (
          <span className="text-xs text-muted-foreground font-medium">No Image</span>
        )}
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageLoading && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "h-full w-full object-cover transition-opacity duration-200",
          imageLoading ? "opacity-0" : "opacity-100"
        )}
        onLoad={handleImageLoad}
        onError={handleImageError}
        loading="lazy"
      />
    </div>
  )
}