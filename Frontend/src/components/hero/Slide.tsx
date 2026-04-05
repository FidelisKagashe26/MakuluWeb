import { useState } from "react";
import { motion } from "framer-motion";

export type CarouselSlideData = {
  id: string;
  imageUrl: string;
  brightness: "dark" | "light";
  badge: string;
  title: string;
  scripture: string;
  description: string;
  primaryCta: {
    label: string;
    href: string;
  };
  secondaryCta: {
    label: string;
    href: string;
  };
};

type SlideProps = {
  slide: CarouselSlideData;
  direction: number;
};

const slideVariants = {
  enter: () => ({
    x: "100%",
    zIndex: 3
  }),
  center: {
    x: "0%",
    zIndex: 2
  },
  exit: () => ({
    x: "-100%",
    zIndex: 1
  })
};

const textVariants = {
  hidden: () => ({
    opacity: 0.22,
    x: "-58vw",
    y: 0
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0
  },
  exit: () => ({
    opacity: 0.12,
    x: "18vw",
    y: 0
  })
};

export default function Slide({ slide, direction }: SlideProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const bodyStyle = {
    fontFamily: '"Nunito", "Inter", sans-serif',
    textShadow: "0 3px 16px rgba(0,0,0,0.34)"
  };

  return (
    <motion.article
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 1.8, ease: [0.4, 0, 0.2, 1] }}
      className="absolute inset-0 overflow-hidden"
    >
      {!imageFailed ? (
        <img
          src={slide.imageUrl}
          alt={slide.title}
          className="absolute inset-0 h-full w-full object-cover object-center transform-gpu"
          loading="eager"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[44%] bg-[linear-gradient(to_top,rgba(0,0,0,0.58),rgba(0,0,0,0.34)_38%,rgba(0,0,0,0.12)_68%,transparent)] backdrop-blur-[14px] [mask-image:linear-gradient(to_top,black_62%,transparent)]" />
      <div className="pointer-events-none absolute inset-x-[8%] bottom-[-6%] z-10 h-[24%] rounded-t-[999px] bg-white/8 opacity-70 blur-3xl" />

      <div className="absolute inset-0 z-20 flex items-end justify-center px-4 pb-14 md:px-6 md:pb-20">
        <motion.div
          custom={direction}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: 1.8, delay: 0, ease: [0.4, 0, 0.2, 1] }}
          className="mx-auto flex w-full max-w-6xl flex-col items-center text-center will-change-transform"
        >
          <div className="flex w-full max-w-3xl flex-col items-center px-6 py-5 md:px-8 md:py-6">
            {slide.badge ? (
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white" style={bodyStyle}>
                {slide.badge}
              </p>
            ) : null}

            {slide.title ? (
              <h1 className="mt-2 max-w-3xl text-2xl font-bold leading-tight text-white md:text-4xl" style={bodyStyle}>
                {slide.title}
              </h1>
            ) : null}

            {slide.scripture ? (
              <p
                className={`${slide.title ? "mt-4" : "mt-1"} text-xl font-semibold leading-tight text-white md:text-3xl`}
                style={bodyStyle}
              >
                {slide.scripture}
              </p>
            ) : null}

            {slide.description ? (
              <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-white md:text-lg" style={bodyStyle}>
                {slide.description}
              </p>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.article>
  );
}
