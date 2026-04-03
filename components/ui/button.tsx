import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const brandBtn =
  'border-2 border-[#5d3b2a] bg-white text-[#5d3b2a] shadow-sm hover:bg-[#5d3b2a] hover:text-white hover:shadow-md active:scale-[0.98]'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#5d3b2a]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white aria-invalid:ring-destructive/30 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: brandBtn,
        destructive:
          'border-2 border-destructive bg-white text-destructive hover:bg-destructive hover:text-white shadow-sm hover:shadow-md',
        outline: brandBtn,
        secondary:
          'border-2 border-border bg-white text-foreground hover:bg-muted hover:border-border shadow-sm',
        ghost:
          'border-2 border-transparent bg-transparent text-[#5d3b2a] hover:bg-[#5d3b2a]/10 hover:border-[#5d3b2a]/20',
        link: 'border-0 border-transparent bg-transparent text-[#5d3b2a] shadow-none underline-offset-4 hover:underline hover:bg-transparent',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
