import React from 'react'

interface StepNavigationProps {
  currentStep: number
  totalSteps: number
  onStepChange: (step: number) => void
  onNext: () => void
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onStepChange,
  onNext
}: StepNavigationProps) {
  if (currentStep === 0) return null

  return (
    <div className="flex justify-center mt-4 space-x-3">
      <button
        onClick={() => onStepChange(0)}
        className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-body hover:bg-white/10 transition-colors text-sm"
      >
        首页
      </button>
      <button
        onClick={() => onStepChange(currentStep - 1)}
        className="px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg text-slate-300 font-body hover:bg-white/10 transition-colors text-sm"
      >
        上一步
      </button>
      {currentStep < totalSteps - 1 && (
        <button
          onClick={onNext}
          className="px-4 py-2 bg-gradient-to-r from-cyan-400 to-pink-400 rounded-lg text-white font-body hover:from-cyan-500 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-cyan-400/25 text-sm"
        >
          下一步
        </button>
      )}
    </div>
  )
}
