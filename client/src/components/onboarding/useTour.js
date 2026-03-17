import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_PREFIX = 'cv-opt-tour-';

const useTour = (tour) => {
  const [currentStep, setCurrentStep] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [isActive, setIsActive] = useState(false);
  const originalStylesRef = useRef(null);
  const prevTargetRef = useRef(null);

  const steps = tour?.steps || [];
  const storageKey = `${STORAGE_PREFIX}${tour?.id}-done`;

  // Check if tour was already completed
  const isCompleted = () => {
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  };

  const markCompleted = useCallback(() => {
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {
      // ignore
    }
  }, [storageKey]);

  // Restore previous target's z-index
  const restoreTarget = useCallback(() => {
    if (prevTargetRef.current && originalStylesRef.current) {
      const el = prevTargetRef.current;
      el.style.position = originalStylesRef.current.position;
      el.style.zIndex = originalStylesRef.current.zIndex;
      el.style.pointerEvents = originalStylesRef.current.pointerEvents;
      prevTargetRef.current = null;
      originalStylesRef.current = null;
    }
  }, []);

  // Find next valid step (skip steps whose target doesn't exist or minWidth not met)
  const findValidStep = useCallback((startIdx, direction = 1) => {
    let idx = startIdx;
    while (idx >= 0 && idx < steps.length) {
      const step = steps[idx];
      if (step.minWidth && window.innerWidth < step.minWidth) {
        idx += direction;
        continue;
      }
      const el = document.querySelector(step.target);
      if (el) return idx;
      idx += direction;
    }
    return null;
  }, [steps]);

  // Update the target rect and elevate element
  const updateRect = useCallback((stepIdx) => {
    if (stepIdx == null || !steps[stepIdx]) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(steps[stepIdx].target);
    if (!el) {
      setTargetRect(null);
      return;
    }

    // Restore previous target
    restoreTarget();

    // Save original styles and elevate
    originalStylesRef.current = {
      position: el.style.position,
      zIndex: el.style.zIndex,
      pointerEvents: el.style.pointerEvents,
    };
    prevTargetRef.current = el;

    const computed = window.getComputedStyle(el);
    if (computed.position === 'static') {
      el.style.position = 'relative';
    }
    el.style.zIndex = '1001';
    el.style.pointerEvents = 'auto';

    // Scroll into view if needed
    const rect = el.getBoundingClientRect();
    if (rect.top < 0 || rect.bottom > window.innerHeight) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Recalc after scroll
      setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
      }, 350);
    } else {
      setTargetRect(rect);
    }
  }, [steps, restoreTarget]);

  // Auto-start tour on mount
  useEffect(() => {
    if (!tour || isCompleted()) return;

    const timer = setTimeout(() => {
      const firstValid = findValidStep(0, 1);
      if (firstValid != null) {
        setCurrentStep(firstValid);
        setIsActive(true);
      }
    }, 800);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tour?.id]);

  // Update rect when step changes
  useEffect(() => {
    if (!isActive || currentStep == null) return;
    updateRect(currentStep);
  }, [currentStep, isActive, updateRect]);

  // Recalc on resize/scroll
  useEffect(() => {
    if (!isActive) return;
    const handleResize = () => updateRect(currentStep);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
    };
  }, [isActive, currentStep, updateRect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => restoreTarget();
  }, [restoreTarget]);

  const endTour = useCallback(() => {
    restoreTarget();
    setIsActive(false);
    setCurrentStep(null);
    setTargetRect(null);
    markCompleted();
  }, [restoreTarget, markCompleted]);

  const next = useCallback(() => {
    const nextIdx = findValidStep(currentStep + 1, 1);
    if (nextIdx != null) {
      setCurrentStep(nextIdx);
    } else {
      endTour();
    }
  }, [currentStep, findValidStep, endTour]);

  const prev = useCallback(() => {
    const prevIdx = findValidStep(currentStep - 1, -1);
    if (prevIdx != null) {
      setCurrentStep(prevIdx);
    }
  }, [currentStep, findValidStep]);

  const skip = useCallback(() => {
    endTour();
  }, [endTour]);

  return {
    isActive,
    currentStep,
    totalSteps: steps.length,
    stepData: steps[currentStep] || null,
    targetRect,
    next,
    prev,
    skip,
  };
};

export default useTour;
