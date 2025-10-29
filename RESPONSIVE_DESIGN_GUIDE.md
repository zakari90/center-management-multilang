# Responsive Design System Guide

This comprehensive guide covers the responsive design system implemented for the center management PWA application, including best practices, components, and usage examples.

## Table of Contents

1. [Overview](#overview)
2. [Design Principles](#design-principles)
3. [Responsive Breakpoints](#responsive-breakpoints)
4. [Component Library](#component-library)
5. [Accessibility Features](#accessibility-features)
6. [Performance Optimizations](#performance-optimizations)
7. [Animation System](#animation-system)
8. [Error Handling](#error-handling)
9. [Usage Examples](#usage-examples)
10. [Best Practices](#best-practices)

## Overview

The responsive design system provides a comprehensive set of components and utilities designed for modern web applications. It follows a mobile-first approach and includes:

- **Responsive Components**: Adapt to different screen sizes automatically
- **Accessibility Support**: ARIA labels, keyboard navigation, screen reader support
- **Performance Optimizations**: Lazy loading, code splitting, virtual scrolling
- **Animation System**: Smooth transitions and micro-interactions
- **Error Handling**: Comprehensive error states and user feedback
- **Dark Mode Support**: Built-in theme switching capabilities

## Design Principles

### 1. Mobile-First Approach
All components are designed for mobile devices first, then enhanced for larger screens:

```tsx
// Mobile-first responsive grid
<ResponsiveGrid cols={1} className="sm:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</ResponsiveGrid>
```

### 2. Progressive Enhancement
Components work on basic devices and are enhanced for capable ones:

```tsx
// Basic functionality works everywhere
<ResponsiveButton size="md" touch={true}>
  Click me
</ResponsiveButton>
```

### 3. Accessibility First
All components include proper ARIA attributes and keyboard navigation:

```tsx
<ResponsiveIconButton
  icon={<Search className="h-4 w-4" />}
  label="Search"
  aria-label="Search for content"
/>
```

## Responsive Breakpoints

The system uses Tailwind CSS breakpoints with custom responsive utilities:

| Breakpoint | Min Width | Usage |
|------------|-----------|-------|
| `xs` | 0px | Mobile phones |
| `sm` | 476px | Large mobile phones |
| `md` | 640px | Tablets (portrait) |
| `lg` | 768px | Tablets (landscape) |
| `xl` | 1024px | Desktop |
| `2xl` | 1280px | Large desktop |

### Custom Responsive Utilities

```css
/* Container responsive padding */
.container-responsive {
  @apply px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16;
}

/* Responsive text sizing */
.text-responsive-lg {
  @apply text-lg sm:text-xl md:text-2xl;
}

/* Responsive grid */
.grid-responsive-3 {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3;
}
```

## Component Library

### Responsive Container Components

#### ResponsiveContainer
Main container with responsive padding and max-width:

```tsx
<ResponsiveContainer size="lg" padding="md" maxWidth="7xl">
  <h1>Content</h1>
</ResponsiveContainer>
```

#### ResponsiveGrid
Responsive grid layout with automatic column adjustment:

```tsx
<ResponsiveGrid cols={3} gap="md" responsive={true}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</ResponsiveGrid>
```

#### ResponsiveFlex
Flexible container with responsive direction:

```tsx
<ResponsiveFlex direction="responsive" justify="between" align="center">
  <div>Left content</div>
  <div>Right content</div>
</ResponsiveFlex>
```

### Responsive Card Components

#### ResponsiveCard
Base card component with responsive variants:

```tsx
<ResponsiveCard variant="elevated" size="lg" hover={true}>
  <ResponsiveCardHeader title="Card Title" description="Description" />
  <ResponsiveCardContent>Content goes here</ResponsiveCardContent>
  <ResponsiveCardFooter>Footer content</ResponsiveCardFooter>
</ResponsiveCard>
```

#### ResponsiveCardStats
Specialized card for displaying statistics:

```tsx
<ResponsiveCardStats
  title="Total Users"
  value="12,345"
  description="Active users this month"
  trend={{ value: 12, label: 'vs last month', positive: true }}
  icon={<Users className="h-6 w-6" />}
/>
```

### Responsive Button Components

#### ResponsiveButton
Main button component with responsive sizing:

```tsx
<ResponsiveButton
  size="md"
  variant="default"
  loading={false}
  fullWidth={false}
  touch={true}
>
  Click me
</ResponsiveButton>
```

#### ResponsiveButtonGroup
Group of buttons with responsive layout:

```tsx
<ResponsiveButtonGroup orientation="horizontal" spacing="md">
  <ResponsiveButton>Button 1</ResponsiveButton>
  <ResponsiveButton>Button 2</ResponsiveButton>
</ResponsiveButtonGroup>
```

#### ResponsiveFloatingActionButton
Floating action button for mobile interfaces:

```tsx
<ResponsiveFloatingActionButton
  icon={<Plus className="h-6 w-6" />}
  label="Add new item"
  position="bottom-right"
  size="lg"
/>
```

### Responsive Form Components

#### ResponsiveForm
Main form container with responsive spacing:

```tsx
<ResponsiveForm onSubmit={handleSubmit} spacing="md">
  <ResponsiveFormField label="Name" required>
    <ResponsiveInput
      placeholder="Enter your name"
      value={name}
      onChange={(e) => setName(e.target.value)}
    />
  </ResponsiveFormField>
</ResponsiveForm>
```

#### ResponsiveFormGroup
Group form fields with responsive layout:

```tsx
<ResponsiveFormGroup columns={2} gap="md">
  <ResponsiveInput label="First Name" />
  <ResponsiveInput label="Last Name" />
</ResponsiveFormGroup>
```

### Responsive Navigation Components

#### ResponsiveNavigation
Main navigation with mobile menu:

```tsx
<ResponsiveNavigation
  brand={<Logo />}
  actions={<UserMenu />}
  mobileMenu={<MobileMenu />}
>
  <ResponsiveNavItem href="/dashboard">Dashboard</ResponsiveNavItem>
  <ResponsiveNavItem href="/users">Users</ResponsiveNavItem>
</ResponsiveNavigation>
```

#### ResponsiveTabs
Tab navigation with responsive layout:

```tsx
<ResponsiveTabs orientation="horizontal">
  <ResponsiveTabList>
    <ResponsiveTab active={activeTab === 'tab1'}>Tab 1</ResponsiveTab>
    <ResponsiveTab active={activeTab === 'tab2'}>Tab 2</ResponsiveTab>
  </ResponsiveTabList>
  <ResponsiveTabContent active={activeTab === 'tab1'}>
    Content 1
  </ResponsiveTabContent>
</ResponsiveTabs>
```

### Responsive Table Component

#### ResponsiveTable
Data table with mobile-friendly views:

```tsx
<ResponsiveTable
  data={data}
  columns={columns}
  searchable={true}
  sortable={true}
  filterable={true}
  pagination={true}
  mobileView="card"
  breakpoint="md"
  actions={(row) => <ActionButtons row={row} />}
/>
```

## Accessibility Features

### AccessibilityProvider
Main accessibility context provider:

```tsx
<AccessibilityProvider>
  <App />
</AccessibilityProvider>
```

### Skip Links
Allow keyboard users to skip to main content:

```tsx
<SkipLink href="#main-content">Skip to main content</SkipLink>
```

### Screen Reader Support
Hide content from visual display but keep it for screen readers:

```tsx
<ScreenReaderOnly>
  This content is only visible to screen readers
</ScreenReaderOnly>
```

### ARIA Components
Components with proper ARIA attributes:

```tsx
<ARIAButton
  pressed={isPressed}
  onPressedChange={setIsPressed}
  aria-label="Toggle feature"
>
  Toggle
</ARIAButton>
```

## Performance Optimizations

### Lazy Loading
Load components only when needed:

```tsx
<LazyWrapper fallback={<SkeletonFallback type="card" />}>
  <ExpensiveComponent />
</LazyWrapper>
```

### Virtual Scrolling
Handle large lists efficiently:

```tsx
<VirtualList
  items={largeList}
  itemHeight={60}
  containerHeight={400}
  renderItem={(item, index) => <ListItem item={item} />}
/>
```

### Performance Monitoring
Track performance metrics:

```tsx
<PerformanceMonitor
  showMetrics={true}
  onMetricsUpdate={(metrics) => console.log(metrics)}
/>
```

### Code Splitting
Split code for better loading performance:

```tsx
const LazyComponent = createLazyComponent(
  () => import('./HeavyComponent'),
  <SkeletonFallback type="card" />
)
```

## Animation System

### Basic Animations
Simple entrance animations:

```tsx
<FadeIn delay={200}>
  <div>Content fades in</div>
</FadeIn>

<SlideIn direction="up" distance={20}>
  <div>Content slides up</div>
</SlideIn>

<ScaleIn>
  <div>Content scales in</div>
</ScaleIn>
```

### Staggered Animations
Animate multiple items with delays:

```tsx
<Stagger staggerDelay={100}>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stagger>
```

### Hover Effects
Interactive hover animations:

```tsx
<HoverScale scale={1.05}>
  <div>Hover to scale</div>
</HoverScale>

<HoverGlow glowColor="rgba(59, 130, 246, 0.5)">
  <div>Hover for glow effect</div>
</HoverGlow>
```

### Text Animations
Animated text effects:

```tsx
<Typewriter
  text="This text types out character by character"
  speed={50}
/>

<MorphingText
  texts={['Text 1', 'Text 2', 'Text 3']}
  duration={2000}
/>
```

## Error Handling

### Error Boundary
Catch and handle component errors:

```tsx
<ErrorBoundary
  fallback={<CustomErrorFallback />}
  onError={(error, errorInfo) => console.log(error)}
>
  <App />
</ErrorBoundary>
```

### Error States
Display different error states:

```tsx
<ErrorState
  error={error}
  title="Something went wrong"
  description="Please try again"
  onRetry={handleRetry}
/>

<EmptyState
  title="No data found"
  description="Try adjusting your search criteria"
  action={<Button>Add Data</Button>}
/>
```

### Loading States
Show loading indicators:

```tsx
<LoadingState message="Loading data..." size="lg" />
```

## Usage Examples

### Complete Page Layout

```tsx
export default function DashboardPage() {
  return (
    <AccessibilityProvider>
      <SkipLink href="#main-content">Skip to main content</SkipLink>
      
      <ResponsiveNavigation
        brand={<Logo />}
        actions={<UserMenu />}
      >
        <ResponsiveNavItem href="/dashboard">Dashboard</ResponsiveNavItem>
        <ResponsiveNavItem href="/users">Users</ResponsiveNavItem>
      </ResponsiveNavigation>

      <main id="main-content">
        <ResponsiveContainer>
          <FadeIn>
            <ResponsiveSpacing padding="lg">
              <ResponsiveText size="2xl" weight="bold">
                Dashboard
              </ResponsiveText>
            </ResponsiveSpacing>
          </FadeIn>

          <SlideIn direction="up" delay={200}>
            <ResponsiveGrid cols={3} gap="md">
              <ResponsiveCardStats
                title="Total Users"
                value="1,234"
                trend={{ value: 12, label: 'vs last month', positive: true }}
              />
              <ResponsiveCardStats
                title="Revenue"
                value="$45,678"
                trend={{ value: 8, label: 'vs last month', positive: true }}
              />
              <ResponsiveCardStats
                title="Orders"
                value="567"
                trend={{ value: -3, label: 'vs last month', positive: false }}
              />
            </ResponsiveGrid>
          </SlideIn>

          <ResponsiveSpacing padding="md">
            <ResponsiveTable
              data={users}
              columns={userColumns}
              searchable
              sortable
              pagination
              mobileView="card"
            />
          </ResponsiveSpacing>
        </ResponsiveContainer>
      </main>

      <ResponsiveFloatingActionButton
        icon={<Plus className="h-6 w-6" />}
        label="Add user"
        onClick={handleAddUser}
      />
    </AccessibilityProvider>
  )
}
```

### Form with Validation

```tsx
export default function UserForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    newsletter: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission
  }

  return (
    <ResponsiveForm onSubmit={handleSubmit} spacing="md">
      <ResponsiveFormGroup columns={2} gap="md">
        <ResponsiveInput
          label="Full Name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          error={errors.name}
        />
        <ResponsiveInput
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          required
          error={errors.email}
        />
      </ResponsiveFormGroup>

      <ResponsiveSelect
        label="Role"
        value={formData.role}
        onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
        options={[
          { value: 'admin', label: 'Administrator' },
          { value: 'user', label: 'User' }
        ]}
      />

      <ResponsiveCheckbox
        label="Subscribe to newsletter"
        checked={formData.newsletter}
        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, newsletter: checked }))}
      />

      <ResponsiveFormActions justify="end">
        <ResponsiveButton variant="outline" type="button">
          Cancel
        </ResponsiveButton>
        <ResponsiveButton type="submit" loading={isSubmitting}>
          Save User
        </ResponsiveButton>
      </ResponsiveFormActions>
    </ResponsiveForm>
  )
}
```

## Best Practices

### 1. Mobile-First Design
- Start with mobile layout and enhance for larger screens
- Use responsive utilities consistently
- Test on actual devices, not just browser dev tools

### 2. Accessibility
- Always provide proper ARIA labels
- Ensure keyboard navigation works
- Test with screen readers
- Use semantic HTML elements

### 3. Performance
- Use lazy loading for heavy components
- Implement virtual scrolling for large lists
- Optimize images and assets
- Monitor performance metrics

### 4. Animation Guidelines
- Keep animations subtle and purposeful
- Respect user's motion preferences
- Use animations to guide user attention
- Avoid excessive motion

### 5. Error Handling
- Provide clear error messages
- Offer recovery actions
- Log errors for debugging
- Gracefully handle network failures

### 6. Testing
- Test on multiple devices and screen sizes
- Use automated accessibility testing
- Test with keyboard navigation
- Verify performance on slow connections

## Conclusion

This responsive design system provides a comprehensive foundation for building modern, accessible, and performant web applications. By following the patterns and best practices outlined in this guide, you can create user experiences that work seamlessly across all devices and user capabilities.

For more examples and advanced usage patterns, see the `ResponsiveShowcase` component in `src/components/examples/responsive-showcase.tsx`.
