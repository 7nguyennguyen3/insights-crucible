"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, FileText, Sparkles } from "lucide-react";
import { FaYoutube } from "react-icons/fa6";
import { HiDocumentText } from "react-icons/hi2";

const AnimatedCrucibleFlow = () => {
  const [animationState, setAnimationState] = useState<
    | "startToA"
    | "atA"
    | "arcToB"
    | "processing"
    | "toC"
    | "atC"
    | "toEnd"
    | "finished"
    | "paused"
  >("paused");
  const [animationCycle, setAnimationCycle] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const pointAref = useRef<HTMLDivElement>(null);
  const pointBref = useRef<HTMLDivElement>(null);
  const pointCref = useRef<HTMLDivElement>(null);
  // 🗑️ REMOVE: This ref is no longer needed, as it created a circular dependency.
  // const movingElementRef = useRef<HTMLDivElement>(null);

  const [positions, setPositions] = useState({
    start: 0,
    a: 0,
    b: 0,
    c: 0,
    end: 0,
  });

  useEffect(() => {
    const calculatePositions = () => {
      // We only need the main container and target points to exist.
      if (
        sectionRef.current &&
        pointAref.current &&
        pointBref.current &&
        pointCref.current
      ) {
        const containerRect = sectionRef.current.getBoundingClientRect();
        const aRect = pointAref.current.getBoundingClientRect();
        const bRect = pointBref.current.getBoundingClientRect();
        const cRect = pointCref.current.getBoundingClientRect();

        // 🔧 FIX: Use responsive width of the moving element
        // sm: w-6 (24px), md: w-8 (32px), lg: w-10 (40px)
        const getMovingElementWidth = () => {
          if (window.innerWidth >= 1024) return 40; // lg
          if (window.innerWidth >= 768) return 32; // md
          return 24; // sm
        };
        const movingElementWidth = getMovingElementWidth();

        const getCenter = (targetRect: DOMRect) =>
          targetRect.left -
          containerRect.left +
          targetRect.width / 2 -
          movingElementWidth / 2;

        setPositions({
          start: -movingElementWidth, // Start from left edge, outside container
          a: getCenter(aRect),
          b: getCenter(bRect),
          c: getCenter(cRect),
          end: containerRect.width, // End at right edge, outside container
        });
      }
    };

    calculatePositions();
    window.addEventListener("resize", calculatePositions);

    return () => {
      window.removeEventListener("resize", calculatePositions);
    };
  }, [isVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isVisible) {
      setAnimationState("paused");
      return;
    }

    let isActive = true;
    const timeoutIds: NodeJS.Timeout[] = [];

    const runAnimation = async () => {
      if (!isActive) return;

      setAnimationCycle((prev) => prev + 1);

      if (!isActive) return;
      setAnimationState("startToA");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 1000);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      setAnimationState("atA");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 800);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      setAnimationState("arcToB");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 1500);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      setAnimationState("processing");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 1200);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      setAnimationState("toC");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 1000);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      setAnimationState("atC");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 800);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      setAnimationState("toEnd");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 1000);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      setAnimationState("finished");
      await new Promise((resolve) => {
        const id = setTimeout(resolve, 1500);
        timeoutIds.push(id);
      });

      if (!isActive) return;
      const nextId = setTimeout(() => {
        if (isActive) runAnimation();
      }, 100);
      timeoutIds.push(nextId);
    };

    const initialTimer = setTimeout(runAnimation, 500);
    timeoutIds.push(initialTimer);

    return () => {
      isActive = false;
      timeoutIds.forEach((id) => clearTimeout(id));
      setAnimationState("paused");
    };
  }, [isVisible]);

  return (
    <div
      ref={sectionRef}
      className="relative w-full max-w-4xl mx-auto py-8 sm:py-12 md:py-16"
    >
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-slate-300 via-teal-400 to-slate-300 dark:from-slate-500 dark:via-teal-400 dark:to-slate-500 transform -translate-y-1/2" />

      <div className="flex items-center justify-between px-4 sm:px-6 md:px-8">
        <div className="flex flex-col items-center space-y-2 sm:space-y-3 md:space-y-4">
          <motion.div
            ref={pointAref}
            className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl border-2 sm:border-4 flex items-center justify-center shadow-lg transition-colors duration-500 ${
              animationState === "atA"
                ? "bg-slate-600 border-slate-500"
                : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            }`}
            animate={{
              scale: animationState === "atA" ? [1, 1.05, 1] : 1,
            }}
            transition={{
              scale: {
                duration: 1.5,
                repeat: animationState === "atA" ? Infinity : 0,
                ease: "easeInOut",
              },
            }}
          >
            <FaYoutube
              className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 transition-colors duration-500 ${
                animationState === "atA"
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            />
          </motion.div>
          <div className="text-center">
            <h3
              className="text-sm sm:text-base md:text-lg font-bold text-slate-800 
            dark:text-slate-200 mb-1 sm:mb-2"
            >
              Input
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-[100px] sm:max-w-xs text-center">
              YouTube URL
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 sm:space-y-3 md:space-y-4">
          <motion.div
            ref={pointBref}
            className={`relative w-12 h-12 sm:w-15 sm:h-15 md:w-17 md:h-17 rounded-full flex items-center justify-center shadow-xl transition-colors duration-500 ${
              animationState === "processing"
                ? "bg-orange-600 border-orange-500"
                : "bg-slate-100 dark:bg-slate-700 border-2 sm:border-4 border-slate-300 dark:border-slate-600"
            }`}
            animate={
              animationState === "processing"
                ? {
                    scale: [1, 1.05, 1],
                    rotate: [0, 1, -1, 0],
                  }
                : {}
            }
            transition={{
              duration: 1,
              repeat: animationState === "processing" ? 2 : 0,
              ease: "easeInOut",
            }}
          >
            <BrainCircuit
              className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 transition-colors duration-500 ${
                animationState === "processing"
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            />
            <AnimatePresence>
              {animationState === "processing" && (
                <>
                  {[...Array(2)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-yellow-400 rounded-full"
                      style={{
                        top: window.innerWidth >= 768 ? -8 : -6,
                        left:
                          i === 0
                            ? window.innerWidth >= 768
                              ? -8
                              : -6
                            : window.innerWidth >= 768
                              ? 8
                              : 6,
                      }}
                      initial={{ scale: 0, y: 0, opacity: 0.8 }}
                      animate={{
                        scale: [0, 1, 0],
                        y: [
                          0,
                          window.innerWidth >= 768 ? -20 : -15,
                          window.innerWidth >= 768 ? -35 : -25,
                        ],
                        opacity: [0.8, 0.6, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut",
                      }}
                    />
                  ))}
                </>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="text-center">
            <h3 className="text-sm sm:text-base md:text-lg font-bold text-slate-800 dark:text-slate-200 mb-1 sm:mb-2">
              Process
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-[100px] sm:max-w-xs text-center">
              AI Analysis
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center space-y-2 sm:space-y-3 md:space-y-4">
          <motion.div
            ref={pointCref}
            className={`relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl border-2 sm:border-4 flex items-center justify-center shadow-lg transition-colors duration-500 ${
              animationState === "atC"
                ? "bg-green-600 border-green-500"
                : "bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600"
            }`}
            animate={{
              scale: animationState === "atC" ? [1, 1.05, 1] : 1,
            }}
            transition={{
              scale: {
                duration: 1.5,
                repeat: animationState === "atC" ? Infinity : 0,
                ease: "easeInOut",
              },
            }}
          >
            <HiDocumentText
              className={`w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 transition-colors duration-500 ${
                animationState === "atC"
                  ? "text-white"
                  : "text-slate-600 dark:text-slate-300"
              }`}
            />
          </motion.div>
          <div className="text-center">
            <h3
              className="text-sm sm:text-base md:text-lg font-bold text-slate-800 
            dark:text-slate-200 mb-1 sm:mb-2"
            >
              Output
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-[100px] sm:max-w-xs text-center">
              Structured Insights
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {animationState !== "paused" &&
          animationState !== "finished" &&
          positions.a > 0 && (
            <motion.div
              key={animationCycle}
              className="absolute top-1/2 transform -translate-y-1/2"
              initial={{
                x:
                  animationState === "startToA" ? positions.start : positions.a,
                opacity: animationState === "startToA" ? 0 : 1,
              }}
              animate={{
                x:
                  animationState === "startToA"
                    ? positions.a
                    : animationState === "atA"
                      ? positions.a
                      : animationState === "arcToB"
                        ? positions.b
                        : animationState === "processing"
                          ? positions.b
                          : animationState === "toC"
                            ? positions.c
                            : animationState === "atC"
                              ? positions.c
                              : animationState === "toEnd"
                                ? positions.end
                                : positions.c,
                y: 0,
                scale:
                  animationState === "processing" ? [1, 1.1, 1, 1.1, 1] : 1,
                opacity: animationState === "toEnd" ? 0 : 1,
              }}
              transition={{
                x: {
                  duration:
                    animationState === "startToA"
                      ? 1.0
                      : animationState === "arcToB"
                        ? 1.5
                        : animationState === "toC"
                          ? 1.0
                          : animationState === "toEnd"
                            ? 1.0
                            : 0.3,
                  ease: "easeInOut",
                },
                scale: {
                  duration: 0.4,
                  repeat: animationState === "processing" ? 3 : 0,
                },
                opacity: {
                  duration: animationState === "toEnd" ? 0.5 : 0.3,
                  ease: "easeOut",
                },
              }}
            >
              <motion.div
                // 🗑️ REMOVE: The ref is no longer attached here.
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-slate-700 dark:bg-slate-300 rounded-md sm:rounded-lg shadow-lg flex items-center justify-center"
                animate={{
                  rotate: animationState === "processing" ? [0, 10, -10, 0] : 0,
                }}
                transition={{
                  rotate: {
                    duration: 0.6,
                    repeat: animationState === "processing" ? 4 : 0,
                  },
                }}
              >
                {animationState === "toC" ||
                animationState === "atC" ||
                animationState === "toEnd" ? (
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-400" />
                ) : (
                  <FileText className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-white dark:text-slate-700" />
                )}
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedCrucibleFlow;
