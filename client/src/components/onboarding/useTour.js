import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'cv-opt-tour-';

const useTour = (tour) => {
  const [currentStep, setCurrentStep] = useState(null);
  const [targetRect, setTargetRect] = useState(null);
  const [isActive, setIsActive] = useState(false);

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

  // No-op kept for call-site compatibility. We intentionally do NOT mutate the
  // target element's styles anymore — the SVG mask reveals it through the
  // overlay's cutout, so it doesn't need elevating, and elevating it failed
  // anyway whenever the target sat inside an ancestor stacking context
  // (e.g. the header's backdrop-filter), leaving it stuck behind the overlay.
  const restoreTarget = useCallback(() => {}, []);

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
