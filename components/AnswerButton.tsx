'use client'

import { motion } from 'framer-motion'

interface Props {
  letter: string
  text: string
  isSelected: boolean
  isCorrect?: boolean
  isWrong?: boolean
  onClick: () => void
  disabled: boolean
}

export default function AnswerButton({
  letter,
  text,
  isSelected,
  isCorrect,
  isWrong,
  onClick,
  disabled,
}: Props) {
  const getButtonClass = () => {
    if (isCorrect) {
      return 'bg-green-500/30 border-2 border-green-500'
    }
    if (isWrong) {
      return 'bg-red-500/30 border-2 border-red-500'
    }
    if (isSelected) {
      return 'bg-cosmic-cyan/30 border-2 border-cosmic-cyan'
    }
    return 'glass hover:bg-white/10'
  }

  const getLetterClass = () => {
    if (isCorrect) return 'bg-green-500'
    if (isWrong) return 'bg-red-500'
    if (isSelected) return 'bg-cosmic-cyan'
    return 'bg-space-700'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={`${getButtonClass()} rounded-xl p-6 text-left transition-all w-full`}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full ${getLetterClass()} flex items-center justify-center font-bold text-lg flex-shrink-0`}
        >
          {letter}
        </div>
        <div className="flex-1 font-semibold">{text}</div>
        {isCorrect && (
          <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
        )}
        {isWrong && (
          <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        )}
      </div>
    </motion.button>
  )
}
