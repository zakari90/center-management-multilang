'use client'

import { cn } from '@/lib/utils'
import { ReactNode, useEffect, useRef, useState } from 'react'

interface AnimationProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  trigger?: 'mount' | 'scroll' | 'hover' | 'click'
  direction?: 'up' | 'down' | 'left' | 'right' | 'fade' | 'scale'
  distance?: number
  once?: boolean
}

export function Animate({
  children,
  className,
  delay = 0,
  duration = 300,
  trigger = 'mount',
  direction = 'fade',
  distance = 20,
  once = true
}: AnimationProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isTriggered, setIsTriggered] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (trigger === 'mount') {
      const timer = setTimeout(() => setIsVisible(true), delay)
      return () => clearTimeout(timer)
    }

    if (trigger === 'scroll') {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (once) {
              observer.disconnect()
            }
          } else if (!once) {
            setIsVisible(false)
          }
        },
        { threshold: 0.1 }
      )

      if (elementRef.current) {
        observer.observe(elementRef.current)
      }

      return () => observer.disconnect()
    }
  }, [trigger, delay, once])

  const handleClick = () => {
    if (trigger === 'click') {
      setIsTriggered(!isTriggered)
    }
  }

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true)
    }
  }

  const handleMouseLeave = () => {
    if (trigger === 'hover' && !once) {
      setIsVisible(false)
    }
  }

  const getAnimationClasses = () => {
    const baseClasses = 'transition-all ease-out'
    const durationClass = `duration-${duration}`
    
    if (!isVisible && !isTriggered) {
      switch (direction) {
        case 'up':
          return `${baseClasses} ${durationClass} transform translate-y-${distance} opacity-0`
        case 'down':
          return `${baseClasses} ${durationClass} transform -translate-y-${distance} opacity-0`
        case 'left':
          return `${baseClasses} ${durationClass} transform translate-x-${distance} opacity-0`
        case 'right':
          return `${baseClasses} ${durationClass} transform -translate-x-${distance} opacity-0`
        case 'scale':
          return `${baseClasses} ${durationClass} transform scale-95 opacity-0`
        case 'fade':
        default:
          return `${baseClasses} ${durationClass} opacity-0`
      }
    }

    return `${baseClasses} ${durationClass} transform translate-y-0 translate-x-0 scale-100 opacity-100`
  }

  return (
    <div
      ref={elementRef}
      className={cn(getAnimationClasses(), className)}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </div>
  )
}

interface FadeInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  trigger?: 'mount' | 'scroll' | 'hover' | 'click'
  once?: boolean
}

export function FadeIn({
  children,
  className,
  delay = 0,
  duration = 300,
  trigger = 'mount',
  once = true
}: FadeInProps) {
  return (
    <Animate
      direction="fade"
      delay={delay}
      duration={duration}
      trigger={trigger}
      once={once}
      className={className}
    >
      {children}
    </Animate>
  )
}

interface SlideInProps {
  children: ReactNode
  className?: string
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  distance?: number
  trigger?: 'mount' | 'scroll' | 'hover' | 'click'
  once?: boolean
}

export function SlideIn({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 300,
  distance = 20,
  trigger = 'mount',
  once = true
}: SlideInProps) {
  return (
    <Animate
      direction={direction}
      delay={delay}
      duration={duration}
      distance={distance}
      trigger={trigger}
      once={once}
      className={className}
    >
      {children}
    </Animate>
  )
}

interface ScaleInProps {
  children: ReactNode
  className?: string
  delay?: number
  duration?: number
  trigger?: 'mount' | 'scroll' | 'hover' | 'click'
  once?: boolean
}

export function ScaleIn({
  children,
  className,
  delay = 0,
  duration = 300,
  trigger = 'mount',
  once = true
}: ScaleInProps) {
  return (
    <Animate
      direction="scale"
      delay={delay}
      duration={duration}
      trigger={trigger}
      once={once}
      className={className}
    >
      {children}
    </Animate>
  )
}

interface StaggerProps {
  children?: ReactNode[]
  className?: string
  staggerDelay?: number
  delay?: number
  duration?: number
  trigger?: 'mount' | 'scroll' | 'hover' | 'click'
  once?: boolean
}

export function Stagger({
  children,
  className,
  staggerDelay = 100,
  delay = 0,
  duration = 300,
  trigger = 'mount',
  once = true
}: StaggerProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {children?.map((child, index) => (
        <Animate
          key={index}
          direction="fade"
          delay={delay + (index * staggerDelay)}
          duration={duration}
          trigger={trigger}
          once={once}
        >
          {child}
        </Animate>
      ))}
    </div>
  )
}

interface ParallaxProps {
  children: ReactNode
  className?: string
  speed?: number
  direction?: 'up' | 'down'
  offset?: number
}

export function Parallax({
  children,
  className,
  speed = 0.5,
  direction = 'up',
  offset = 0
}: ParallaxProps) {
  const [scrollY, setScrollY] = useState(0)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      if (elementRef.current) {        
        const scrolled = window.scrollY
        const rate = scrolled * speed
        const yPos = direction === 'up' ? -(rate + offset) : (rate + offset)
        
        setScrollY(yPos)
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed, direction, offset])

  return (
    <div
      ref={elementRef}
      className={cn('transform', className)}
      style={{
        transform: `translateY(${scrollY}px)`
      }}
    >
      {children}
    </div>
  )
}

interface HoverScaleProps {
  children: ReactNode
  className?: string
  scale?: number
  duration?: number
  hoverClassName?: string
}

export function HoverScale({
  children,
  className,
  scale = 1.05,
  duration = 200,
  hoverClassName
}: HoverScaleProps) {
  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out',
        `hover:scale-${Math.round(scale * 100)}`,
        hoverClassName,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`
      }}
    >
      {children}
    </div>
  )
}

interface HoverGlowProps {
  children: ReactNode
  className?: string
  glowColor?: string
  intensity?: number
  duration?: number
}

export function HoverGlow({
  children,
  className,
  glowColor = 'var(--primary)',
  intensity = 0.5,
  duration = 300
}: HoverGlowProps) {
  return (
    <div
      className={cn(
        'transition-all duration-300 ease-out',
        'hover:shadow-lg hover:shadow-blue-500/25',
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        '--glow-color': glowColor,
        '--glow-intensity': intensity
      } as React.CSSProperties}
    >
      {children}
    </div>
  )
}

interface LoadingSpinnerProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

export function LoadingSpinner({
  className,
  size = 'md',
  color = 'currentColor'
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      style={{ color }}
    />
  )
}

interface PulseProps {
  children: ReactNode
  className?: string
  duration?: number
  delay?: number
}

export function Pulse({
  children,
  className,
  duration = 1000,
  delay = 0
}: PulseProps) {
  return (
    <div
      className={cn('animate-pulse', className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

interface BounceProps {
  children: ReactNode
  className?: string
  duration?: number
  delay?: number
}

export function Bounce({
  children,
  className,
  duration = 1000,
  delay = 0
}: BounceProps) {
  return (
    <div
      className={cn('animate-bounce', className)}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

interface ShakeProps {
  children: ReactNode
  className?: string
  duration?: number
  delay?: number
  trigger?: 'hover' | 'click' | 'focus'
}

export function Shake({
  children,
  className,
  duration = 500,
  delay = 0,
  trigger = 'hover'
}: ShakeProps) {
  const [isShaking, setIsShaking] = useState(false)

  const handleTrigger = () => {
    if (trigger === 'hover' || trigger === 'click' || trigger === 'focus') {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), duration)
    }
  }

  return (
    <div
      className={cn(
        'transition-transform duration-200 ease-out',
        isShaking && 'animate-pulse',
        className
      )}
      onMouseEnter={trigger === 'hover' ? handleTrigger : undefined}
      onClick={trigger === 'click' ? handleTrigger : undefined}
      onFocus={trigger === 'focus' ? handleTrigger : undefined}
      style={{
        animationDuration: `${duration}ms`,
        animationDelay: `${delay}ms`
      }}
    >
      {children}
    </div>
  )
}

interface TypewriterProps {
  text: string
  className?: string
  speed?: number
  delay?: number
  onComplete?: () => void
}

export function Typewriter({
  text,
  className,
  speed = 50,
  delay = 0
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('')
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex])
        setCurrentIndex(prev => prev + 1)
      }, speed)

      return () => clearTimeout(timer)
    }
  }, [currentIndex, text, speed])

  useEffect(() => {
    if (delay > 0) {
      const timer = setTimeout(() => {
        setCurrentIndex(0)
      }, delay)

      return () => clearTimeout(timer)
    }
  }, [delay])

  return (
    <span className={cn('inline-block', className)}>
      {displayedText}
      <span className="animate-pulse">|</span>
    </span>
  )
}

interface MorphingTextProps {
  texts: string[]
  className?: string
  duration?: number
  delay?: number
}

export function MorphingText({
  texts,
  className,
  duration = 2000,
}: MorphingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % texts.length)
    }, duration)

    return () => clearInterval(timer)
  }, [texts.length, duration])

  return (
    <span className={cn('transition-all duration-500 ease-in-out', className)}>
      {texts[currentIndex]}
    </span>
  )
}
