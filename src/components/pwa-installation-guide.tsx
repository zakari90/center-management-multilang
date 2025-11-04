'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Smartphone, Monitor, Tablet, Download, Share, Plus, Settings, Globe } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface DeviceInfo {
  type: 'mobile' | 'desktop' | 'tablet'
  os: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'unknown'
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown'
}

export default function PWAInstallationGuide() {
  const t = useTranslations('PWAInstallation')
  const [isOpen, setIsOpen] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)

  const detectDevice = (): DeviceInfo => {
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : ''

    let type: 'mobile' | 'desktop' | 'tablet' = 'desktop'
    if (/mobile|android|iphone|ipod/.test(userAgent)) {
      type = 'mobile'
    } else if (/tablet|ipad/.test(userAgent)) {
      type = 'tablet'
    }

    let os: DeviceInfo['os'] = 'unknown'
    if (/iphone|ipad|ipod/.test(userAgent)) {
      os = 'ios'
    } else if (/android/.test(userAgent)) {
      os = 'android'
    } else if (/windows/.test(userAgent)) {
      os = 'windows'
    } else if (/macintosh|mac os x/.test(userAgent)) {
      os = 'macos'
    } else if (/linux/.test(userAgent)) {
      os = 'linux'
    }

    let browser: DeviceInfo['browser'] = 'unknown'
    if (/chrome/.test(userAgent) && !/edge/.test(userAgent)) {
      browser = 'chrome'
    } else if (/firefox/.test(userAgent)) {
      browser = 'firefox'
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      browser = 'safari'
    } else if (/edge/.test(userAgent)) {
      browser = 'edge'
    }

    return { type, os, browser }
  }

  const handleOpen = () => {
    setDeviceInfo(detectDevice())
    setIsOpen(true)
  }

  const getInstallationSteps = () => {
    if (!deviceInfo) return []

    const { type, os, browser } = deviceInfo

    if (type === 'mobile') {
      if (os === 'ios') {
        return [
          {
            step: 1,
            icon: <Share className="h-5 w-5" />,
            title: t('iosStep1Title'),
            description: t('iosStep1Description')
          },
          {
            step: 2,
            icon: <Plus className="h-5 w-5" />,
            title: t('iosStep2Title'),
            description: t('iosStep2Description')
          },
          {
            step: 3,
            icon: <Download className="h-5 w-5" />,
            title: t('iosStep3Title'),
            description: t('iosStep3Description')
          }
        ]
      } else if (os === 'android') {
        if (browser === 'chrome') {
          return [
            {
              step: 1,
              icon: <Download className="h-5 w-5" />,
              title: t('androidChromeStep1Title'),
              description: t('androidChromeStep1Description')
            },
            {
              step: 2,
              icon: <Plus className="h-5 w-5" />,
              title: t('androidChromeStep2Title'),
              description: t('androidChromeStep2Description')
            }
          ]
        } else {
          return [
            {
              step: 1,
              icon: <Settings className="h-5 w-5" />,
              title: t('androidOtherStep1Title'),
              description: t('androidOtherStep1Description')
            },
            {
              step: 2,
              icon: <Plus className="h-5 w-5" />,
              title: t('androidOtherStep2Title'),
              description: t('androidOtherStep2Description')
            }
          ]
        }
      }
    } else if (type === 'desktop') {
      if (browser === 'chrome' || browser === 'edge') {
        return [
          {
            step: 1,
            icon: <Download className="h-5 w-5" />,
            title: t('desktopChromeStep1Title'),
            description: t('desktopChromeStep1Description')
          },
          {
            step: 2,
            icon: <Plus className="h-5 w-5" />,
            title: t('desktopChromeStep2Title'),
            description: t('desktopChromeStep2Description')
          }
        ]
      } else if (browser === 'firefox') {
        return [
          {
            step: 1,
            icon: <Plus className="h-5 w-5" />,
            title: t('desktopFirefoxStep1Title'),
            description: t('desktopFirefoxStep1Description')
          },
          {
            step: 2,
            icon: <Download className="h-5 w-5" />,
            title: t('desktopFirefoxStep2Title'),
            description: t('desktopFirefoxStep2Description')
          }
        ]
      } else if (browser === 'safari') {
        return [
          {
            step: 1,
            icon: <Share className="h-5 w-5" />,
            title: t('desktopSafariStep1Title'),
            description: t('desktopSafariStep1Description')
          },
          {
            step: 2,
            icon: <Plus className="h-5 w-5" />,
            title: t('desktopSafariStep2Title'),
            description: t('desktopSafariStep2Description')
          }
        ]
      }
    }
    // Fallback for unsupported combinations
    return [
      {
        step: 1,
        icon: <Globe className="h-5 w-5" />,
        title: t('genericStep1Title'),
        description: t('genericStep1Description')
      },
      {
        step: 2,
        icon: <Settings className="h-5 w-5" />,
        title: t('genericStep2Title'),
        description: t('genericStep2Description')
      }
    ]
  }

  const getDeviceIcon = () => {
    if (!deviceInfo) return <Globe className="h-6 w-6" />
    switch (deviceInfo.type) {
      case 'mobile': return <Smartphone className="h-6 w-6" />
      case 'tablet': return <Tablet className="h-6 w-6" />
      case 'desktop': return <Monitor className="h-6 w-6" />
      default: return <Globe className="h-6 w-6" />
    }
  }

  const getDeviceName = () => {
    if (!deviceInfo) return t('unknownDevice')
    const { type, os, browser } = deviceInfo
    const osName = os.charAt(0).toUpperCase() + os.slice(1)
    const browserName = browser.charAt(0).toUpperCase() + browser.slice(1)
    return `${osName} ${browserName} (${type})`
  }

  const steps = getInstallationSteps()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" onClick={handleOpen}>
          {getDeviceIcon()}
          <span className="ml-2">{t('installationGuide')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDeviceIcon()}
            {t('title')}
          </DialogTitle>
          <DialogDescription>
            {t('description')} {getDeviceName()}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="steps" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="steps">{t('installationSteps')}</TabsTrigger>
            <TabsTrigger value="benefits">{t('benefits')}</TabsTrigger>
          </TabsList>

          <TabsContent value="steps" className="space-y-4">
            <div className="space-y-4">
              {steps.map((step, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                          {step.icon}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Step {step.step}</Badge>
                          <h3 className="font-semibold">{step.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('offlineAccess')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('offlineAccessDescription')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('fasterLoading')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('fasterLoadingDescription')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('nativeExperience')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('nativeExperienceDescription')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('notifications')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {t('notificationsDescription')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            {t('close')}
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            {t('gotIt')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
