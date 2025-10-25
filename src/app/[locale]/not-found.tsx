import { getTranslations } from "next-intl/server"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default async function NotFound() {
  const t = await getTranslations("notFound")

  return (

      <div className="flex items-center justify-center h-screen bg-muted/20">
        <Card className="p-8 max-w-md">
          <div className="flex flex-col items-center justify-center mb-6">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mb-2" />
            <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground text-lg mb-8 text-center">{t("description")}</p>
          <div className="flex justify-center">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/">{t("goHome")}</Link>
            </Button>
          </div>
        </Card>
      </div>

  )
}
