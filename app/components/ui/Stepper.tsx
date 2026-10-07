"use client";

import React from "react";
import { Check } from "lucide-react";

export interface StepItem {
  id: number;
  title: string;
  description?: string;
}

export interface StepperProps {
  steps: StepItem[];
  currentStep: number;
  onStepClick?: (stepId: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  onStepClick,
}) => {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {steps.map((step, idx) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;

          return (
            <React.Fragment key={step.id}>
              {/* Connector line */}
              {idx > 0 && (
                <div
                  className={`flex-1 h-0.5 mx-2 sm:mx-4 transition-colors duration-300 ${
                    step.id <= currentStep
                      ? "bg-indigo-600 dark:bg-indigo-500"
                      : "bg-slate-200 dark:bg-slate-700"
                  }`}
                />
              )}

              {/* Step indicator circle */}
              <div
                onClick={() => onStepClick && isCompleted && onStepClick(step.id)}
                className={`flex items-center gap-3 group ${
                  onStepClick && isCompleted ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-200 ${
                    isCompleted
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 shadow-sm"
                      : isCurrent
                      ? "bg-indigo-600 text-white dark:bg-indigo-500 ring-4 ring-indigo-100 dark:ring-indigo-950/60 shadow-md scale-105"
                      : "bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                  }`}
                >
                  {isCompleted ? <Check className="w-5 h-5 stroke-[2.5]" /> : step.id}
                </div>

                <div className="hidden md:block text-left">
                  <p
                    className={`text-xs font-semibold leading-none ${
                      isCurrent
                        ? "text-indigo-600 dark:text-indigo-400"
                        : isCompleted
                        ? "text-slate-900 dark:text-slate-100"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    Step {step.id}
                  </p>
                  <p
                    className={`text-sm font-medium mt-1 ${
                      isCurrent
                        ? "text-slate-900 font-semibold dark:text-white"
                        : "text-slate-500 dark:text-slate-400"
                    }`}
                  >
                    {step.title}
                  </p>
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
