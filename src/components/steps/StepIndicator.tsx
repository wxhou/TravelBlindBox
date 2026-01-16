import React from 'react'

interface StepIndicatorProps {
  currentStep: number
  totalSteps?: number
}

export function StepIndicator({ currentStep, totalSteps = 5 }: StepIndicatorProps) {
  return (
    <div className="flex justify-center mb-4">
      <div className="flex space-x-2">
        {Array.from({ length: totalSteps }, (_, i) => i).map((step) => (
          <div
            key={step}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              step <= currentStep ? 'bg-gradient-to-r from-cyan-400 to-pink-400' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
