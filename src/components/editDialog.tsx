"use client"

import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ReactNode, useState } from "react"
import { useTranslations } from "next-intl"

type EditDialogProps = {
  title: string
  trigger: ReactNode
  children: ReactNode
  onSave: () => void
}

export function EditDialog({ title, trigger, children, onSave }: EditDialogProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('EditDialog')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {children}
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              onSave()
              setOpen(false)
            }}
          >
            {t('saveChanges')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

