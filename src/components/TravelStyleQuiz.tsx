import { useState } from 'react'
import type { TravelStyle, StyleQuestion, TravelStyleResult } from '../types'
import { Sparkles, Compass, Coffee, Crown, Footprints, Utensils } from 'lucide-react'

const styleIcons: Record<TravelStyle, React.ReactNode> = {
  '冒险探索': <Compass className="w-5 h-5" />,
  '休闲度假': <Sparkles className="w-5 h-5" />,
  '文化深度': <Footprints className="w-5 h-5" />,
  '美食之旅': <Utensils className="w-5 h-5" />,
  '极致尊享': <Crown className="w-5 h-5" />,
  '穷游体验': <Coffee className="w-5 h-5" />
}

const styleDescriptions: Record<TravelStyle, string> = {
  '冒险探索': '喜欢刺激和未知挑战，探索人迹罕至的目的地',
  '休闲度假': '追求身心放松，享受慵懒的旅行时光',
  '文化深度': '对历史、艺术、人文有浓厚兴趣',
  '美食之旅': '为了美食而旅行，品尝地道美味',
  '极致尊享': '追求高品质服务和奢华体验',
  '穷游体验': '精打细算，用最少的钱看最多的世界'
}

const questions: StyleQuestion[] = [
  {
    id: 'q1',
    question: '周末你想怎么度过？',
    options: [
      { text: '去郊外徒步或攀岩', style: '冒险探索', icon: '🧗' },
      { text: '睡到自然醒，去spa', style: '休闲度假', icon: '💆' },
      { text: '参观博物馆或古建筑', style: '文化深度', icon: '🏛️' },
      { text: '打卡网红餐厅', style: '美食之旅', icon: '🍜' },
      { text: '住五星级酒店', style: '极致尊享', icon: '👑' },
      { text: '坐绿皮火车去小众城市', style: '穷游体验', icon: '🚂' }
    ]
  },
  {
    id: 'q2',
    question: '旅行中你最看重什么？',
    options: [
      { text: '刺激的体验和冒险', style: '冒险探索', icon: '🎢' },
      { text: '舒适的住宿和放松', style: '休闲度假', icon: '🏖️' },
      { text: '了解当地历史文化', style: '文化深度', icon: '📜' },
      { text: '品尝当地美食', style: '美食之旅', icon: '🍲' },
      { text: '高品质服务和体验', style: '极致尊享', icon: '✨' },
      { text: '自由和低成本', style: '穷游体验', icon: '🎒' }
    ]
  },
  {
    id: 'q3',
    question: '理想中的旅行目的地是？',
    options: [
      { text: '原始森林或高山', style: '冒险探索', icon: '🏔️' },
      { text: '海边度假村', style: '休闲度假', icon: '🏝️' },
      { text: '历史悠久的古城', style: '文化深度', icon: '🏰' },
      { text: '美食之都', style: '美食之旅', icon: '🍜' },
      { text: '高端度假海岛', style: '极致尊享', icon: '🌟' },
      { text: '冷门但有特色的地方', style: '穷游体验', icon: '🔍' }
    ]
  },
  {
    id: 'q4',
    question: '旅行预算怎么分配？',
    options: [
      { text: '大部分花在体验活动', style: '冒险探索', icon: '🎿' },
      { text: '住宿占大头', style: '休闲度假', icon: '🛏️' },
      { text: '门票和导览', style: '文化深度', icon: '🎫' },
      { text: '美食和餐厅', style: '美食之旅', icon: '🍽️' },
      { text: '全部要最好的', style: '极致尊享', icon: '💎' },
      { text: '能省则省', style: '穷游体验', icon: '💰' }
    ]
  },
  {
    id: 'q5',
    question: '你喜欢的旅行节奏是？',
    options: [
      { text: '充实紧凑，不浪费一分钟', style: '冒险探索', icon: '⚡' },
      { text: '慢悠悠，随性而为', style: '休闲度假', icon: '🌊' },
      { text: '深度游，一个地方待很久', style: '文化深度', icon: '🔎' },
      { text: '跟着美食地图走', style: '美食之旅', icon: '🗺️' },
      { text: '不赶时间，享受每一刻', style: '极致尊享', icon: '🕰️' },
      { text: '灵活机动，说走就走', style: '穷游体验', icon: '🦋' }
    ]
  }
]

function calculateResult(answers: TravelStyle[]): TravelStyleResult {
  const scores: Record<TravelStyle, number> = {
    '冒险探索': 0,
    '休闲度假': 0,
    '文化深度': 0,
    '美食之旅': 0,
    '极致尊享': 0,
    '穷游体验': 0
  }

  answers.forEach(style => {
    scores[style]++
  })

  // 找出最高分
  const sortedStyles = Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .map(([style]) => style as TravelStyle)

  const primaryStyle = sortedStyles[0]
  const secondaryStyles = sortedStyles.slice(1, 3)

  const recommendations: Record<TravelStyle, string> = {
    '冒险探索': '推荐徒步、攀岩、漂流等户外活动，探索原生态目的地',
    '休闲度假': '推荐海岛、温泉、度假村，享受慢节奏旅行',
    '文化深度': '推荐博物馆、古城、文化遗产，深度了解当地历史',
    '美食之旅': '推荐美食之都、夜市、当地特色餐厅，味蕾环球旅行',
    '极致尊享': '推荐高端酒店、私人向导、VIP体验，奢华出行',
    '穷游体验': '推荐青旅、公交、免费景点，预算友好型探索'
  }

  return {
    primaryStyle,
    secondaryStyles,
    score: scores,
    description: styleDescriptions[primaryStyle],
    recommendation: recommendations[primaryStyle]
  }
}

interface TravelStyleQuizProps {
  onComplete: (result: TravelStyleResult) => void
  onSkip: () => void
}

export function TravelStyleQuiz({ onComplete, onSkip }: TravelStyleQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<TravelStyle[]>([])
  const [showResult, setShowResult] = useState(false)
  const [result, setResult] = useState<TravelStyleResult | null>(null)

  const handleSelect = (style: TravelStyle) => {
    const newAnswers = [...answers, style]
    setAnswers(newAnswers)

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    } else {
      // 完成所有问题
      const quizResult = calculateResult(newAnswers)
      setResult(quizResult)
      setShowResult(true)
    }
  }

  const handleComplete = () => {
    if (result) {
      onComplete(result)
    }
  }

  const progress = ((currentQuestion + 1) / questions.length) * 100

  if (showResult && result) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 mb-4">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">你的旅行风格</h2>
          <p className="text-slate-400">发现最适合你的旅行方式</p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-3xl">{styleIcons[result.primaryStyle]}</span>
            <h3 className="text-2xl font-bold text-white">{result.primaryStyle}</h3>
          </div>

          <p className="text-center text-slate-300 mb-4">{result.description}</p>

          <div className="flex justify-center gap-2 flex-wrap mb-4">
            {result.secondaryStyles.map(style => (
              <span key={style} className="px-3 py-1 bg-white/10 rounded-full text-sm text-slate-300">
                {style}
              </span>
            ))}
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
            <p className="text-center text-cyan-300 text-sm">{result.recommendation}</p>
          </div>
        </div>

        {/* 风格分布图 */}
        <div className="bg-white/5 rounded-2xl p-4 mb-6">
          <h4 className="text-sm font-medium text-slate-400 mb-3">风格分布</h4>
          <div className="space-y-2">
            {(Object.entries(result.score) as [TravelStyle, number][])
              .sort(([, a], [, b]) => b - a)
              .map(([style, score]) => (
                <div key={style} className="flex items-center gap-2">
                  <span className="w-20 text-xs text-slate-400">{style}</span>
                  <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full transition-all duration-500"
                      style={{ width: `${(score / questions.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 w-6">{score}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={onSkip}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors"
          >
            跳过，使用默认
          </button>
          <button
            onClick={handleComplete}
            className="flex-1 py-3 bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-500 hover:to-pink-500 text-white rounded-xl transition-all font-medium"
          >
            应用此风格
          </button>
        </div>
      </div>
    )
  }

  const question = questions[currentQuestion]

  return (
    <div className="max-w-2xl mx-auto">
      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>问题 {currentQuestion + 1} / {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-pink-400 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* 问题 */}
      <div className="text-center mb-8">
        <h2 className="text-xl font-medium text-white mb-2">{question.question}</h2>
        <p className="text-sm text-slate-400">选择最符合你的选项</p>
      </div>

      {/* 选项 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(option.style)}
            className="p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-xl transition-all text-left group"
          >
            <span className="text-2xl mb-2 block">{option.icon}</span>
            <span className="text-sm text-slate-200 group-hover:text-white">{option.text}</span>
          </button>
        ))}
      </div>

      {/* 跳过按钮 */}
      <button
        onClick={onSkip}
        className="w-full py-2 text-sm text-slate-500 hover:text-slate-400 transition-colors"
      >
        跳过风格测试，使用默认设置
      </button>
    </div>
  )
}

export default TravelStyleQuiz
