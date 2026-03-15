"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Database, Upload, Search, X } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function FetchVariationsPage() {
  const [exploring, setExploring] = useState(false)
  const [applying, setApplying] = useState(false)
  const [customVariations, setCustomVariations] = useState("")
  const [databaseStructure, setDatabaseStructure] = useState<any>(null)

  const exploreDatabaseStructure = async () => {
    try {
      setExploring(true)
      const response = await fetch('/api/setup/fetch-existing-variations', {
        method: 'GET',
      })

      if (response.ok) {
        const result = await response.json()
        setDatabaseStructure(result)
        toast.success(`Found ${result.data.accessibleTables} accessible tables in database`)
        console.log('Database structure:', result.data)
      } else {
        let errorMessage = 'Failed to explore database'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorData.message || errorMessage
          console.error('API Error:', errorData)
        } catch (parseError) {
          // If we can't parse the error response, use the status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
          console.error('Failed to parse error response:', parseError)
        }
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error exploring database:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to explore database')
      setDatabaseStructure(null)
    } finally {
      setExploring(false)
    }
  }

  const applyManualVariations = async () => {
    if (!customVariations.trim()) {
      toast.error("Please enter variations data")
      return
    }
    
    try {
      setApplying(true)
      const response = await fetch('/api/setup/manual-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variationsData: customVariations }),
      })

      if (response.ok) {
        const result = await response.json()
        toast.success(result.message)
      } else {
        const error = await response.json()
        throw new Error(error.error)
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to apply variations')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="font-serif text-3xl font-bold text-foreground">Fetch Existing Variations</h2>
        <p className="text-muted-foreground mt-1">
          Import variations from your existing coffee shop database
        </p>
      </div>

      {/* Database Explorer */}
      <Card className="border-border/40 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Structure Explorer
          </CardTitle>
          <CardDescription>
            Explore your database to find existing variation data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={exploreDatabaseStructure}
            disabled={exploring}
            className="w-full"
          >
            {exploring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exploring Database...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Explore Database Structure
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Variations Input */}
      <Card className="border-border/40 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Manual Variations Input
          </CardTitle>
          <CardDescription>
            Paste your existing variations data in JSON format
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="variations-input">Variations JSON Data</Label>
            <Textarea
              id="variations-input"
              placeholder="Paste your variations JSON here..."
              value={customVariations}
              onChange={(e) => setCustomVariations(e.target.value)}
              rows={10}
              className="font-mono text-sm"
            />
          </div>
          
          <Button 
            onClick={applyManualVariations}
            disabled={applying || !customVariations.trim()}
            className="w-full"
          >
            {applying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying Variations...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Apply Variations to All Products
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Database Structure Results */}
      {databaseStructure && (
        <Card className="border-border/40 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Structure Results
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDatabaseStructure(null)}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </CardTitle>
            <CardDescription>
              JSON response from database exploration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto">
              {JSON.stringify(databaseStructure, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Sample Variations */}
      <Card className="border-border/40 shadow-soft">
        <CardHeader>
          <CardTitle>Sample Coffee Shop Variations</CardTitle>
          <CardDescription>
            Copy this sample and modify it with your actual variations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-x-auto whitespace-pre-wrap">
{`[
  {
    "id": "size",
    "title": "Size",
    "type": "radio",
    "options": [
      {"id": "small", "label": "Small (8oz)", "priceModifier": 0},
      {"id": "medium", "label": "Medium (12oz)", "priceModifier": 0.50},
      {"id": "large", "label": "Large (16oz)", "priceModifier": 1.00}
    ]
  },
  {
    "id": "milk",
    "title": "Milk Options",
    "type": "radio", 
    "options": [
      {"id": "regular", "label": "Regular Milk", "priceModifier": 0},
      {"id": "almond", "label": "Almond Milk", "priceModifier": 0.60},
      {"id": "oat", "label": "Oat Milk", "priceModifier": 0.65}
    ]
  },
  {
    "id": "addons",
    "title": "Add-ons",
    "type": "checkbox",
    "options": [
      {"id": "extra-shot", "label": "Extra Shot", "priceModifier": 0.75},
      {"id": "whipped-cream", "label": "Whipped Cream", "priceModifier": 0.50}
    ]
  }
]`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}