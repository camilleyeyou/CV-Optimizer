import React, { useState, useEffect } from 'react';
import './OnboardingTutorial.css';

const tutorialSteps = [
  {
    title: 'Welcome to CV Optimizer',
    description: 'Create professional, ATS-friendly resumes to increase your job prospects',
    image: '/tutorial/welcome.png',
  },
  {
    title: 'Step 1: Choose a Template',
    description: 'Select from modern, professional templates designed to help you stand out',
    image: '/tutorial/templates.png',
  },
  {
    title: 'Step 2: Fill in Your Details',
    description: 'Our smart form guides you through adding your personal info, experience, and skills',
    image: '/tutorial/form.png',
  },
  {
    title: 'Step 3: Optimize with AI',
    description: 'Get personalized suggestions to improve your resume based on job descriptions',
    image: '/tutorial/ai.png',
  },
  {
    title: 'Step 4: Analyze ATS Compatibility',
    description: 'Check how well your resume matches specific job requirements',
    image: '/tutorial/analyze.png',
  },
  {
    title: 'Step 5: Generate a Cover Letter',
    description: 'Create tailored cover letters to complement your resume',
    image: '/tutorial/cover-letter.png',
  },
  {
    title: 'Ready to Get Started?',
    description: 'Let\'s create a resume that gets you noticed!',
    image: '/tutorial/ready.png',
  }
];

const OnboardingTutorial = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Check if the user has already seen the tutorial
    const tutorialSeen = localStorage.getItem('tutorialComplete');
    if (tutorialSeen === 'true') {
      setIsVisible(false);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark tutorial as complete in localStorage
    localStorage.setItem('tutorialComplete', 'true');
    setIsVisible(false);
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) {
    return null;
  }

  const currentTutorialStep = tutorialSteps[currentStep];

  return (
    <div className="onboarding-overlay">
      <div className="tutorial-modal">
        <button className="close-button" onClick={handleSkip}>×</button>
        
        <div className="tutorial-content">
          <div className="tutorial-image">
            <img 
              src={currentTutorialStep.image} 
              alt={`Tutorial step ${currentStep + 1}`} 
            />
          </div>
          
          <div className="tutorial-text">
            <h2>{currentTutorialStep.title}</h2>
            <p>{currentTutorialStep.description}</p>
          </div>
        </div>
        
        <div className="tutorial-progress">
          {tutorialSteps.map((_, index) => (
            <div 
              key={index} 
              className={`progress-dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => setCurrentStep(index)}
            />
          ))}
        </div>
        
        <div className="tutorial-actions">
          {currentStep > 0 && (
            <button className="previous-button" onClick={handlePrevious}>
              Previous
            </button>
          )}
          
          <button className="skip-button" onClick={handleSkip}>
            Skip Tutorial
          </button>
          
          <button className="next-button" onClick={handleNext}>
            {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingTutorial;
