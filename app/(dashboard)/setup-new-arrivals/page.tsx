"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Loader2, AlertCircle, ExternalLink, Copy } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface SetupStep {
  id: string
  title: string
  description: string
  status: 'pending' | 'loading' | 'success' | 'error'
  action?: () => Promise<string>
  result?: string
}

export default function SetupNewArrivalsPage() {
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'database',
      title: 'Create Database Table',
      description: 'Create the new_arrivals table with sample data',
      status: 'pending',
      action: async () => {
        const response = await fetch('/api/setup/create-new-arrivals-table', {
          method: 'POST'
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to create table')
        return result.message || 'Database table created successfully'
      }
    },
    {
      id: 'storage',
      title: 'Setup Supabase Storage',
      description: 'Create storage bucket and policies for image uploads',
      status: 'pending',
      action: async () => {
        const response = await fetch('/api/setup/create-storage-bucket', {
          method: 'POST'
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to setup storage')
        return result.message || 'Storage bucket created successfully'
      }
    }
  ])

  const updateStepStatus = (stepId: string, status: SetupStep['status'], result?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, result } : step
    ))
  }

  const runStep = async (step: SetupStep) => {
    if (!step.action) return

    updateStepStatus(step.id, 'loading')
    
    try {
      const result = await step.action()
      updateStepStatus(step.id, 'success', result)
      toast.success(`${step.title} completed successfully`)
    } catch (error) {
      console.error(`Error in ${step.title}:`, error)
      updateStepStatus(step.id, 'error', error instanceof Error ? error.message : 'Unknown error')
      toast.error(`Failed: ${step.title}`)
    }
  }

  const runAllSteps = async () => {
    for (const step of steps) {
      if (step.action && step.status !== 'success') {
        await runStep(step)
        // Small delay between steps
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copied to clipboard')
  }

  const allCompleted = steps.every(step => step.status === 'success')

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-3xl font-bold text-foreground">New Arrivals Setup</h2>
          <p className="text-muted-foreground mt-1">
            Set up your New Arrivals management system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={runAllSteps} disabled={allCompleted}>
            {allCompleted ? 'Setup Complete' : 'Run All Steps'}
          </Button>
          {allCompleted && (
            <Link href="/new-arrivals">
              <Button>
                Go to New Arrivals
                <ExternalLink className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Setup Steps */}
      <div className="space-y-4">
        {steps.map((step, index) => (
          <Card key={step.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {step.status === 'pending' && (
                    <Badge variant="secondary">Pending</Badge>
                  )}
                  {step.status === 'loading' && (
                    <Badge variant="secondary">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Running...
                    </Badge>
                  )}
                  {step.status === 'success' && (
                    <Badge variant="default">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Complete
                    </Badge>
                  )}
                  {step.status === 'error' && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Error
                    </Badge>
                  )}
                  {step.action && step.status !== 'success' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => runStep(step)}
                      disabled={step.status === 'loading'}
                    >
                      {step.status === 'loading' ? 'Running...' : 'Run Step'}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            {step.result && (
              <CardContent>
                <div className={`p-3 rounded-lg text-sm ${
                  step.status === 'success' 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {step.result}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Coffee Shop Integration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">API Endpoint for Coffee Shop</h4>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                GET /api/public/new-arrivals
              </code>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => copyToClipboard('/api/public/new-arrivals')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-medium mb-2">Sample Response</h4>
            <pre className="p-3 bg-muted rounded text-xs overflow-x-auto">
{`{
  "success": true,
  "data": [
    {
      "id": "arrival-123",
      "title": "Protein Waffles",
      "description": "Build your own protein-packed waffle...",
      "imageUrl": "/newarrival.jfif",
      "buttonText": "Try Now",
      "redirectLink": "/menu?category=cat-17",
      "displayOrder": 1
    }
  ],
  "count": 1
}`}
            </pre>
          </div>

          <div>
            <h4 className="font-medium mb-2">Environment Variables Required</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 p-2 bg-muted rounded text-sm">
                  SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
                </code>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => copyToClipboard('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Success Message */}
      {allCompleted && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-800">Setup Complete!</h3>
                <p className="text-sm text-green-700">
                  Your New Arrivals management system is ready to use. You can now create, edit, and manage new arrivals with image uploads.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}