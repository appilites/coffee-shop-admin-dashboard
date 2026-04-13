"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  onFileNameChange?: (fileName: string) => void
}

export function ImageUpload({ value, onChange, onFileNameChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(value || null)
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.')
      return
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File too large. Maximum size is 5MB.')
      return
    }

    setUploading(true)
    try {
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)

      // Upload to server
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      // Update form with the uploaded image URL
      onChange(result.url)
      setFileName(result.fileName)
      onFileNameChange?.(result.fileName)
      toast.success('Image uploaded successfully!')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to upload image')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (fileName) {
      try {
        // Delete from storage
        await fetch(`/api/upload?fileName=${fileName}`, {
          method: 'DELETE'
        })
      } catch (error) {
        console.error('Delete error:', error)
      }
    }

    setPreview(null)
    setFileName("")
    onChange("")
    onFileNameChange?.("")

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleUrlChange = (url: string) => {
    setPreview(url)
    onChange(url)
    setFileName("") // Clear filename for manual URLs
  }

  return (
    <div className="space-y-4">
      {/* File Upload Section */}
      <div>
        <Label>Upload Image</Label>
        {preview ? (
          <div className="relative mt-2">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleRemove}
              disabled={uploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <div className="flex flex-col items-center">
              <ImageIcon className="h-12 w-12 text-gray-400 mb-4" />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mb-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Image
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500">PNG, JPG, WebP up to 5MB</p>
            </div>
          </div>
        )}
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* OR Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Manual URL Input */}
      <div>
        <Label htmlFor="imageUrl">Image URL</Label>
        <Input
          id="imageUrl"
          type="url"
          value={value || ""}
          onChange={(e) => handleUrlChange(e.target.value)}
          placeholder="/newarrival.jfif or https://example.com/image.jpg"
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Use existing images like /newarrival.jfif or upload new ones
        </p>
      </div>
    </div>
  )
}