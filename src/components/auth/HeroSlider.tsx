import React, { useEffect, useCallback, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Fade from 'embla-carousel-fade';
import Autoplay from 'embla-carousel-autoplay';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface HeroSlide {
  id: string;
  title: string | null;
  subtitle: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  cta_text: string | null;
  cta_link: string | null;
  overlay_opacity: number;
  text_align: 'left' | 'center' | 'right';
}

interface HeroSliderProps {
  slides: HeroSlide[];
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ slides }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 30 }, [
    Fade(),
    Autoplay({ delay: 5000, stopOnInteraction: false, stopOnMouseEnter: true })
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, onSelect]);

  if (!slides || slides.length === 0) {
    return (
      <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden z-0">
      <div className="embla w-full h-full" ref={emblaRef}>
        <div className="embla__container flex w-full h-full">
          {slides.map((slide, index) => (
            <div className="embla__slide relative w-full h-full flex-[0_0_100%] min-w-0" key={slide.id}>
              {/* Media Layer */}
              <div className="absolute inset-0 w-full h-full">
                {slide.media_type === 'video' && !isMobile ? (
                  <video
                    src={slide.media_url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover"
                    onError={(e) => {
                       // Fallback if video fails
                       (e.target as any).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full relative">
                    {slide.media_type === 'video' ? (
                      /* Mobile Video Fallback: Still use video tag but with playsInline and muted for mobile support */
                      <video
                        src={slide.media_url}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={slide.media_url}
                        alt={slide.title || ''}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                )}
                {/* Overlay */}
                <div
                  className="absolute inset-0 bg-slate-950"
                  style={{ opacity: slide.overlay_opacity || 0.5 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50" />
              </div>

              {/* Text Content Layer */}
              <div className={cn(
                "relative z-10 w-full h-full flex flex-col justify-center px-6 md:px-24",
                slide.text_align === 'center' ? 'items-center text-center' :
                slide.text_align === 'right' ? 'items-end text-right' : 'items-start text-left'
              )}>
                <div className="max-w-4xl">
                   <AnimatePresence mode="wait">
                     {selectedIndex === index && (
                       <motion.div
                         initial={{ opacity: 0, y: 30 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -30 }}
                         transition={{ duration: 0.8, ease: "easeOut" }}
                         className="space-y-6"
                       >

                         {slide.title && (
                           <h1 className="text-4xl md:text-6xl lg:text-8xl font-black text-white leading-[0.9] tracking-tighter uppercase">
                             {slide.title.split(' ').map((word, i, arr) => (
                               <span key={i} className={cn(i === arr.length - 1 ? "text-primary" : "")}>
                                 {word}{' '}
                               </span>
                             ))}
                           </h1>
                         )}

                         {slide.subtitle && (
                           <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl">
                             {slide.subtitle}
                           </p>
                         )}

                         {slide.cta_text && slide.cta_link && (
                           <div className="pt-4">
                             <Link to={slide.cta_link}>
                               <Button size="lg" className="bg-primary hover:bg-primary/90 text-white font-black rounded-full px-8 h-14 text-lg shadow-xl shadow-primary/20 group">
                                 {slide.cta_text}
                                 <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                               </Button>
                             </Link>
                           </div>
                         )}
                       </motion.div>
                     )}
                   </AnimatePresence>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={cn(
                "h-1.5 transition-all duration-500 rounded-full",
                selectedIndex === index ? "w-10 bg-primary" : "w-2 bg-white/20 hover:bg-white/40"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
