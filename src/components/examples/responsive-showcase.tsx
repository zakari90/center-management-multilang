'use client'

import { useState } from 'react'
import { ResponsiveContainer } from '@/components/ui/responsive-container'
import { ResponsiveGrid } from '@/components/ui/responsive-container'
import { ResponsiveFlex } from '@/components/ui/responsive-container'
import { ResponsiveText } from '@/components/ui/responsive-container'
import { ResponsiveSpacing } from '@/components/ui/responsive-container'
import { ResponsiveCard, ResponsiveCardHeader, ResponsiveCardContent, ResponsiveCardFooter, ResponsiveCardStats, ResponsiveCardFeature } from '@/components/ui/responsive-card'
import { ResponsiveButton, ResponsiveButtonGroup, ResponsiveIconButton, ResponsiveFloatingActionButton } from '@/components/ui/responsive-button'
import { ResponsiveForm, ResponsiveFormField, ResponsiveInput, ResponsiveTextarea, ResponsiveSelect, ResponsiveCheckbox, ResponsiveFormActions, ResponsiveFormGroup } from '@/components/ui/responsive-form'
import { ResponsiveNavigation, ResponsiveNavItem, ResponsiveBreadcrumb, ResponsiveTabs, ResponsiveTabList, ResponsiveTab, ResponsiveTabContent, ResponsivePagination } from '@/components/ui/responsive-navigation'
import { ResponsiveTable } from '@/components/ui/responsive-table'
import { AccessibilityProvider, SkipLink, ScreenReaderOnly } from '@/components/ui/accessibility'
import { FadeIn, SlideIn, ScaleIn, Stagger, HoverScale, HoverGlow, LoadingSpinner, Pulse, Bounce, Typewriter, MorphingText } from '@/components/ui/animations'
import { ErrorBoundary, ErrorState, LoadingState, EmptyState, SuccessState, InfoState } from '@/components/ui/error-handling'
import { LazyWrapper, SkeletonFallback, PerformanceMonitor, VirtualList, LazyImage } from '@/components/ui/performance'
import { Users, Settings, BarChart3, Smartphone, Monitor, Tablet, Download, Share, Plus, RefreshCw, Home, Search, Filter, MoreHorizontal, Eye, EyeOff, Zap, Clock, Database, Wifi, WifiOff, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'

// Sample data for the table
const sampleData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-15' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'User', status: 'Inactive', lastLogin: '2024-01-10' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'Moderator', status: 'Active', lastLogin: '2024-01-14' },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'User', status: 'Pending', lastLogin: '2024-01-12' },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'Admin', status: 'Active', lastLogin: '2024-01-16' }
]

const tableColumns = [
  { key: 'name', title: 'Name', sortable: true, filterable: true },
  { key: 'email', title: 'Email', sortable: true, filterable: true },
  { key: 'role', title: 'Role', sortable: true, filterable: true },
  { key: 'status', title: 'Status', sortable: true, filterable: true },
  { key: 'lastLogin', title: 'Last Login', sortable: true }
]

export default function ResponsiveShowcase() {
  const [currentPage, setCurrentPage] = useState(1)
  const [activeTab, setActiveTab] = useState('overview')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
    role: '',
    newsletter: false
  })

  const handleFormChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
  }

  return (
    <AccessibilityProvider>
      <div className="min-h-screen bg-background">
        <SkipLink href="#main-content">Skip to main content</SkipLink>
        
        {/* Responsive Navigation */}
        <ResponsiveNavigation
          brand={
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">ResponsiveApp</span>
            </div>
          }
          actions={
            <div className="flex items-center space-x-2">
              <ResponsiveIconButton
                icon={<Search className="h-4 w-4" />}
                label="Search"
                variant="ghost"
                size="sm"
              />
              <ResponsiveIconButton
                icon={<Settings className="h-4 w-4" />}
                label="Settings"
                variant="ghost"
                size="sm"
              />
            </div>
          }
        >
          <ResponsiveNavItem href="#overview" active={activeTab === 'overview'}>
            Overview
          </ResponsiveNavItem>
          <ResponsiveNavItem href="#components" active={activeTab === 'components'}>
            Components
          </ResponsiveNavItem>
          <ResponsiveNavItem href="#forms" active={activeTab === 'forms'}>
            Forms
          </ResponsiveNavItem>
          <ResponsiveNavItem href="#tables" active={activeTab === 'tables'}>
            Tables
          </ResponsiveNavItem>
        </ResponsiveNavigation>

        {/* Breadcrumb */}
        <ResponsiveSpacing padding="sm" className="bg-muted/50">
          <ResponsiveContainer>
            <ResponsiveBreadcrumb
              items={[
                { label: 'Home', href: '/' },
                { label: 'Components', href: '/components' },
                { label: 'Responsive Showcase', current: true }
              ]}
            />
          </ResponsiveContainer>
        </ResponsiveSpacing>

        {/* Main Content */}
        <main id="main-content" className="py-8">
          <ResponsiveContainer>
            {/* Hero Section */}
            <FadeIn delay={100}>
              <ResponsiveSpacing padding="lg" className="text-center">
                <ResponsiveText size="2xl" weight="bold" className="mb-4">
                  Responsive Design Showcase
                </ResponsiveText>
                <ResponsiveText size="lg" color="muted" className="mb-8">
                  Experience modern, accessible, and performant UI components
                </ResponsiveText>
                <ResponsiveFlex justify="center" gap="md">
                  <ResponsiveButton size="lg" variant="default">
                    Get Started
                  </ResponsiveButton>
                  <ResponsiveButton size="lg" variant="outline">
                    Learn More
                  </ResponsiveButton>
                </ResponsiveFlex>
              </ResponsiveSpacing>
            </FadeIn>

            {/* Stats Cards */}
            <SlideIn direction="up" delay={200}>
              <ResponsiveSpacing padding="md" className="mb-8">
                <ResponsiveGrid cols={4} gap="md">
                  <ResponsiveCardStats
                    title="Total Users"
                    value="12,345"
                    description="Active users this month"
                    trend={{ value: 12, label: 'vs last month', positive: true }}
                    icon={<Users className="h-6 w-6" />}
                  />
                  <ResponsiveCardStats
                    title="Revenue"
                    value="$45,678"
                    description="Monthly revenue"
                    trend={{ value: 8, label: 'vs last month', positive: true }}
                    icon={<BarChart3 className="h-6 w-6" />}
                  />
                  <ResponsiveCardStats
                    title="Orders"
                    value="1,234"
                    description="Orders processed"
                    trend={{ value: -3, label: 'vs last month', positive: false }}
                    icon={<Settings className="h-6 w-6" />}
                  />
                  <ResponsiveCardStats
                    title="Satisfaction"
                    value="98%"
                    description="Customer satisfaction"
                    trend={{ value: 2, label: 'vs last month', positive: true }}
                    icon={<CheckCircle className="h-6 w-6" />}
                  />
                </ResponsiveGrid>
              </ResponsiveSpacing>
            </SlideIn>

            {/* Feature Cards */}
            <Stagger staggerDelay={100}>
              <ResponsiveSpacing padding="md" className="mb-8">
                <ResponsiveText size="xl" weight="semibold" className="mb-6 text-center">
                  Key Features
                </ResponsiveText>
                <ResponsiveGrid cols={3} gap="lg">
                  <HoverScale>
                    <ResponsiveCardFeature
                      title="Mobile First"
                      description="Designed with mobile devices in mind, ensuring optimal experience across all screen sizes"
                      icon={<Smartphone className="h-8 w-8" />}
                    />
                  </HoverScale>
                  <HoverScale>
                    <ResponsiveCardFeature
                      title="Accessibility"
                      description="Built with accessibility in mind, supporting screen readers and keyboard navigation"
                      icon={<Eye className="h-8 w-8" />}
                    />
                  </HoverScale>
                  <HoverScale>
                    <ResponsiveCardFeature
                      title="Performance"
                      description="Optimized for speed with lazy loading, code splitting, and efficient rendering"
                      icon={<Zap className="h-8 w-8" />}
                    />
                  </HoverScale>
                </ResponsiveGrid>
              </ResponsiveSpacing>
            </Stagger>

            {/* Tabs Section */}
            <ResponsiveSpacing padding="md" className="mb-8">
              <ResponsiveTabs orientation="horizontal">
                <ResponsiveTabList>
                  <ResponsiveTab
                    active={activeTab === 'overview'}
                    onClick={() => setActiveTab('overview')}
                  >
                    Overview
                  </ResponsiveTab>
                  <ResponsiveTab
                    active={activeTab === 'forms'}
                    onClick={() => setActiveTab('forms')}
                  >
                    Forms
                  </ResponsiveTab>
                  <ResponsiveTab
                    active={activeTab === 'tables'}
                    onClick={() => setActiveTab('tables')}
                  >
                    Tables
                  </ResponsiveTab>
                </ResponsiveTabList>
                
                <ResponsiveTabContent active={activeTab === 'overview'}>
                  <ResponsiveCard>
                    <ResponsiveCardHeader
                      title="Overview"
                      description="This section demonstrates various responsive components and their behavior across different screen sizes."
                    />
                    <ResponsiveCardContent>
                      <ResponsiveText className="mb-4">
                        This showcase demonstrates a comprehensive responsive design system with:
                      </ResponsiveText>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• Mobile-first responsive design patterns</li>
                        <li>• Accessible components with ARIA support</li>
                        <li>• Performance optimizations and lazy loading</li>
                        <li>• Smooth animations and micro-interactions</li>
                        <li>• Comprehensive error handling</li>
                        <li>• Dark mode support</li>
                      </ul>
                    </ResponsiveCardContent>
                  </ResponsiveCard>
                </ResponsiveTabContent>

                <ResponsiveTabContent active={activeTab === 'forms'}>
                  <ResponsiveCard>
                    <ResponsiveCardHeader
                      title="Responsive Forms"
                      description="Interactive forms that adapt to different screen sizes and input methods."
                    />
                    <ResponsiveCardContent>
                      <ResponsiveForm onSubmit={handleSubmit} spacing="md">
                        <ResponsiveFormGroup columns={2} gap="md">
                          <ResponsiveInput
                            label="Full Name"
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={(e) => handleFormChange('name', e.target.value)}
                            required
                            leftIcon={<Users className="h-4 w-4" />}
                          />
                          <ResponsiveInput
                            label="Email Address"
                            type="email"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={(e) => handleFormChange('email', e.target.value)}
                            required
                            leftIcon={<Settings className="h-4 w-4" />}
                          />
                        </ResponsiveFormGroup>
                        
                        <ResponsiveSelect
                          label="Role"
                          placeholder="Select your role"
                          value={formData.role}
                          onValueChange={(value) => handleFormChange('role', value)}
                          options={[
                            { value: 'admin', label: 'Administrator' },
                            { value: 'user', label: 'User' },
                            { value: 'moderator', label: 'Moderator' }
                          ]}
                        />
                        
                        <ResponsiveTextarea
                          label="Message"
                          placeholder="Enter your message here..."
                          value={formData.message}
                          onChange={(e) => handleFormChange('message', e.target.value)}
                          rows={4}
                        />
                        
                        <ResponsiveCheckbox
                          label="Subscribe to newsletter"
                          checked={formData.newsletter}
                          onCheckedChange={(checked) => handleFormChange('newsletter', checked)}
                        />
                        
                        <ResponsiveFormActions justify="end">
                          <ResponsiveButton variant="outline" type="button">
                            Cancel
                          </ResponsiveButton>
                          <ResponsiveButton type="submit">
                            Submit
                          </ResponsiveButton>
                        </ResponsiveFormActions>
                      </ResponsiveForm>
                    </ResponsiveCardContent>
                  </ResponsiveCard>
                </ResponsiveTabContent>

                <ResponsiveTabContent active={activeTab === 'tables'}>
                  <ResponsiveCard>
                    <ResponsiveCardHeader
                      title="Responsive Tables"
                      description="Data tables that adapt to different screen sizes with mobile-friendly views."
                    />
                    <ResponsiveCardContent>
                      <ResponsiveTable
                        data={sampleData}
                        columns={tableColumns}
                        searchable
                        sortable
                        filterable
                        pagination
                        pageSize={3}
                        mobileView="card"
                        breakpoint="md"
                        actions={(row) => (
                          <ResponsiveButtonGroup>
                            <ResponsiveButton size="sm" variant="outline">
                              Edit
                            </ResponsiveButton>
                            <ResponsiveButton size="sm" variant="outline">
                              Delete
                            </ResponsiveButton>
                          </ResponsiveButtonGroup>
                        )}
                      />
                    </ResponsiveCardContent>
                  </ResponsiveCard>
                </ResponsiveTabContent>
              </ResponsiveTabs>
            </ResponsiveSpacing>

            {/* Animation Showcase */}
            <ResponsiveSpacing padding="md" className="mb-8">
              <ResponsiveCard>
                <ResponsiveCardHeader
                  title="Animation Showcase"
                  description="Various animations and micro-interactions for enhanced user experience."
                />
                <ResponsiveCardContent>
                  <ResponsiveGrid cols={2} gap="md">
                    <HoverGlow>
                      <ResponsiveCard className="p-6 text-center">
                        <Pulse>
                          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="h-8 w-8 text-primary" />
                          </div>
                        </Pulse>
                        <ResponsiveText weight="semibold" className="mb-2">
                          Pulse Animation
                        </ResponsiveText>
                        <ResponsiveText size="sm" color="muted">
                          Continuous pulsing effect
                        </ResponsiveText>
                      </ResponsiveCard>
                    </HoverGlow>
                    
                    <HoverGlow>
                      <ResponsiveCard className="p-6 text-center">
                        <Bounce>
                          <div className="h-16 w-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <RefreshCw className="h-8 w-8 text-secondary" />
                          </div>
                        </Bounce>
                        <ResponsiveText weight="semibold" className="mb-2">
                          Bounce Animation
                        </ResponsiveText>
                        <ResponsiveText size="sm" color="muted">
                          Bouncing effect on load
                        </ResponsiveText>
                      </ResponsiveCard>
                    </HoverGlow>
                  </ResponsiveGrid>
                  
                  <div className="mt-6 text-center">
                    <ResponsiveText size="lg" className="mb-4">
                      <Typewriter text="This text is being typed out character by character..." speed={50} />
                    </ResponsiveText>
                    <ResponsiveText size="lg" className="mb-4">
                      <MorphingText
                        texts={['Responsive Design', 'Accessible UI', 'Performance Optimized', 'Mobile First']}
                        duration={2000}
                      />
                    </ResponsiveText>
                  </div>
                </ResponsiveCardContent>
              </ResponsiveCard>
            </ResponsiveSpacing>

            {/* Performance Monitor */}
            <ResponsiveSpacing padding="md" className="mb-8">
              <ResponsiveCard>
                <ResponsiveCardHeader
                  title="Performance Monitoring"
                  description="Real-time performance metrics and optimization features."
                />
                <ResponsiveCardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <ResponsiveText>Load Time</ResponsiveText>
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner size="sm" />
                        <ResponsiveText size="sm" color="muted">Measuring...</ResponsiveText>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <ResponsiveText>Memory Usage</ResponsiveText>
                      <ResponsiveText size="sm" color="muted">45.2 MB</ResponsiveText>
                    </div>
                    <div className="flex items-center justify-between">
                      <ResponsiveText>Network Status</ResponsiveText>
                      <div className="flex items-center space-x-2">
                        <Wifi className="h-4 w-4 text-green-500" />
                        <ResponsiveText size="sm" color="muted">Online</ResponsiveText>
                      </div>
                    </div>
                  </div>
                </ResponsiveCardContent>
              </ResponsiveCard>
            </ResponsiveSpacing>

            {/* Lazy Loading Demo */}
            <ResponsiveSpacing padding="md" className="mb-8">
              <ResponsiveCard>
                <ResponsiveCardHeader
                  title="Lazy Loading Demo"
                  description="Components that load only when needed for better performance."
                />
                <ResponsiveCardContent>
                  <LazyWrapper
                    fallback={<SkeletonFallback type="card" count={2} />}
                    delay={1000}
                  >
                    <ResponsiveGrid cols={2} gap="md">
                      <ResponsiveCard className="p-6">
                        <ResponsiveText weight="semibold" className="mb-2">
                          Lazy Loaded Content 1
                        </ResponsiveText>
                        <ResponsiveText size="sm" color="muted">
                          This content was loaded after a delay to demonstrate lazy loading.
                        </ResponsiveText>
                      </ResponsiveCard>
                      <ResponsiveCard className="p-6">
                        <ResponsiveText weight="semibold" className="mb-2">
                          Lazy Loaded Content 2
                        </ResponsiveText>
                        <ResponsiveText size="sm" color="muted">
                          This content was also loaded lazily for better performance.
                        </ResponsiveText>
                      </ResponsiveCard>
                    </ResponsiveGrid>
                  </LazyWrapper>
                </ResponsiveCardContent>
              </ResponsiveCard>
            </ResponsiveSpacing>

            {/* Error States Demo */}
            <ResponsiveSpacing padding="md" className="mb-8">
              <ResponsiveCard>
                <ResponsiveCardHeader
                  title="Error Handling Demo"
                  description="Various error states and user feedback mechanisms."
                />
                <ResponsiveCardContent>
                  <ResponsiveGrid cols={2} gap="md">
                    <ErrorState
                      error={new Error('Something went wrong')}
                      title="Error State"
                      description="This demonstrates how errors are handled gracefully."
                      onRetry={() => console.log('Retry clicked')}
                    />
                    <EmptyState
                      title="Empty State"
                      description="No data available to display."
                      icon={<AlertTriangle className="h-12 w-12 text-muted-foreground" />}
                      action={
                        <ResponsiveButton size="sm">
                          Add Data
                        </ResponsiveButton>
                      }
                    />
                  </ResponsiveGrid>
                </ResponsiveCardContent>
              </ResponsiveCard>
            </ResponsiveSpacing>
          </ResponsiveContainer>
        </main>

        {/* Floating Action Button */}
        <ResponsiveFloatingActionButton
          icon={<Plus className="h-6 w-6" />}
          label="Add new item"
          position="bottom-right"
          size="lg"
          onClick={() => console.log('FAB clicked')}
        />

        {/* Performance Monitor */}
        <PerformanceMonitor showMetrics={process.env.NODE_ENV === 'development'} />

        {/* Screen Reader Only Content */}
        <ScreenReaderOnly>
          This page demonstrates responsive design patterns and accessibility features.
          All interactive elements are keyboard accessible and screen reader friendly.
        </ScreenReaderOnly>
      </div>
    </AccessibilityProvider>
  )
}
