'use client';

import { useEffect, useRef, RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import Lenis from '@studio-freight/lenis';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Hook to integrate GSAP ScrollTrigger with Lenis smooth scroll
 */
export function useGSAPWithLenis() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Update ScrollTrigger on Lenis scroll
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    lenis.on('scroll', () => {
      ScrollTrigger.update();
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);
}

/**
 * Hook for scroll-triggered fade in animations
 */
export function useScrollFadeIn(ref: RefObject<HTMLElement>, options = {}) {
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    gsap.fromTo(
      element,
      { 
        opacity: 0, 
        y: 50 
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          end: 'top 50%',
          toggleActions: 'play none none reverse',
          ...options,
        },
      }
    );
  }, [ref, options]);
}

/**
 * Hook for parallax effect on scroll
 */
export function useParallax(ref: RefObject<HTMLElement>, speed = 0.5) {
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    gsap.to(element, {
      y: () => window.innerHeight * speed,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: true,
      },
    });
  }, [ref, speed]);
}

/**
 * Hook for silver shimmer effect on scroll
 */
export function useShimmerOnScroll(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    if (!ref.current) return;

    const element = ref.current;

    gsap.to(element, {
      backgroundPosition: '200% center',
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
      },
    });
  }, [ref]);
}

/**
 * Hook for stagger animations on children
 */
export function useStaggerAnimation(
  containerRef: RefObject<HTMLElement>,
  childrenSelector: string,
  options = {}
) {
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const children = container.querySelectorAll(childrenSelector);

    gsap.fromTo(
      children,
      { opacity: 0, y: 30 },
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: container,
          start: 'top 75%',
          toggleActions: 'play none none reverse',
          ...options,
        },
      }
    );
  }, [containerRef, childrenSelector, options]);
}

export { gsap, ScrollTrigger };
