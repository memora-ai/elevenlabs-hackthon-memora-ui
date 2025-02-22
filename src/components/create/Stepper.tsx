import React from 'react';
import { useTranslation } from 'react-i18next';
import { HiCheck } from 'react-icons/hi';

interface StepperProps {
  currentStep: 'intro' | 'basic' | 'video' | 'social';
}

const Stepper: React.FC<StepperProps> = ({ currentStep }) => {
  const { t } = useTranslation();

  const steps = [
    { id: 'basic', name: t('Basic Info'), description: t('Personal details') },
    { id: 'video', name: t('Video Record'), description: t('Video recording') },
    { id: 'social', name: t('Social Import'), description: t('Instagram data') }
  ];

  const getStepStatus = (stepId: string) => {
    if (currentStep === 'intro') return 'upcoming';
    if (stepId === currentStep) return 'current';
    if (
      (stepId === 'basic' && ['video', 'social'].includes(currentStep)) ||
      (stepId === 'video' && currentStep === 'social')
    ) return 'complete';
    return 'upcoming';
  };

  console.log('currentStep in Stepper:', currentStep);

  return (
    <div className="sticky top-16 left-0 right-0 z-10">
      <div className="border-b border-secondary-light bg-neutral-light/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-8">
          <nav aria-label="Progress" className="py-4">
            <ol className="flex items-center justify-between">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className="relative flex-1">
                  <div className="group flex items-center">
                    <span className="flex items-center">
                      <span
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 
                          ${getStepStatus(step.id) === 'complete'
                            ? 'bg-primary shadow-md shadow-primary/10'
                            : getStepStatus(step.id) === 'current'
                            ? 'border-2 border-primary bg-neutral-light'
                            : 'border-2 border-secondary-light'
                          }`}
                      >
                        {getStepStatus(step.id) === 'complete' ? (
                          <HiCheck className="w-5 h-5 text-neutral-light" />
                        ) : (
                          <span
                            className={`text-sm font-medium ${
                              getStepStatus(step.id) === 'current'
                                ? 'text-primary'
                                : 'text-neutral-dark/40'
                            }`}
                          >
                            {stepIdx + 1}
                          </span>
                        )}
                      </span>
                      <div className="ml-3 flex flex-col">
                        <span
                          className={`text-sm font-medium transition-colors ${
                            getStepStatus(step.id) === 'complete'
                              ? 'text-neutral-dark'
                              : getStepStatus(step.id) === 'current'
                              ? 'text-primary'
                              : 'text-neutral-dark/40'
                          }`}
                        >
                          {step.name}
                        </span>
                        <span className={`text-xs ${
                          getStepStatus(step.id) === 'upcoming' 
                            ? 'text-neutral-dark/40'
                            : 'text-neutral-dark/60'
                        }`}>
                          {step.description}
                        </span>
                      </div>
                    </span>
                  </div>

                  {stepIdx !== steps.length - 1 && (
                    <div
                      className={`hidden md:block absolute top-4 left-0 -ml-px mt-0.5 w-full h-0.5 transition-all duration-300
                        ${getStepStatus(step.id) === 'complete'
                          ? 'bg-primary'
                          : 'bg-secondary-light'
                        }`}
                      style={{ left: '50%', width: '100%' }}
                      aria-hidden="true"
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Stepper;