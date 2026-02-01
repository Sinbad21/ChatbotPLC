'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function BackgroundAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Animate blobs on scroll
    gsap.to(blob1Ref.current, {
      y: -200,
      x: 100,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2,
      },
    });

    gsap.to(blob2Ref.current, {
      y: -150,
      x: -80,
      scale: 1.2,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2.5,
      },
    });

    gsap.to(blob3Ref.current, {
      y: -100,
      scale: 0.9,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 3,
      },
    });

    // Floating animation for blobs
    gsap.to(blob1Ref.current, {
      y: '+=20',
      x: '+=10',
      duration: 8,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to(blob2Ref.current, {
      y: '-=15',
      x: '-=15',
      duration: 10,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    gsap.to(blob3Ref.current, {
      y: '+=25',
      x: '+=5',
      duration: 12,
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut',
    });

    return () => {
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Large silver blob - top left */}
      <div
        ref={blob1Ref}
        className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(215,217,221,0.4) 0%, rgba(228,230,234,0.2) 50%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Medium blob - center right */}
      <div
        ref={blob2Ref}
        className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(196,199,204,0.35) 0%, rgba(215,217,221,0.15) 50%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Small blob - bottom center */}
      <div
        ref={blob3Ref}
        className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(241,242,244,0.5) 0%, rgba(228,230,234,0.2) 50%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Subtle grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
    </div>
  );
}
