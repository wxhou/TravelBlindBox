import { useState } from 'react'
import type { TravelRoute } from '../types'
import { X, Check, Calendar, MapPin, DollarSign, Loader2 } from 'lucide-react'

interface BookingConfirmModalProps {
  route: TravelRoute
  isOpen: boolean
  onClose: () => void
  onConfirm: (contactInfo: ContactInfo) => Promise<void>
}

export interface ContactInfo {
  name: string
  phone: string
  email: string
  notes: string
  travelDate: string
  adults: number
  children: number
}

export function BookingConfirmModal({ route, isOpen, onClose, onConfirm }: BookingConfirmModalProps) {
  const [step, setStep] = useState<'confirm' | 'form' | 'submitting' | 'success'>('confirm')
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    name: '',
    phone: '',
    email: '',
    notes: '',
    travelDate: '',
    adults: 2,
    children: 0
  })

  if (!isOpen) return null

  const handleConfirm = async () => {
    setStep('submitting')
    try {
      await onConfirm(contactInfo)
      setStep('success')
    } catch (error) {
      console.error('预订失败:', error)
      setStep('form')
    }
  }

  const handleClose = () => {
    setStep('confirm')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white">
            {step === 'confirm' && '确认预订'}
            {step === 'form' && '填写联系信息'}
            {step === 'submitting' && '正在提交'}
            {step === 'success' && '预订成功'}
          </h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {step === 'confirm' && (
            <>
              {/* Route Summary */}
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <h4 className="text-white font-medium mb-2">{route.title}</h4>
                <p className="text-slate-400 text-sm mb-3">{route.description}</p>
                <div className="flex flex-wrap gap-3 text-sm">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <Calendar className="w-4 h-4" />
                    <span>{route.duration}天</span>
                  </div>
                  <div className="flex items-center gap-1 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                    <span>¥{(route.totalCost || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">专业旅行规划师1对1服务</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">24小时内确认行程方案</span>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-300">专属定制服务，无额外费用</span>
                </div>
              </div>

              <button
                onClick={() => setStep('form')}
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all"
              >
                确认继续
              </button>
            </>
          )}

          {step === 'form' && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleConfirm()
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">出发日期 *</label>
                  <input
                    type="date"
                    required
                    value={contactInfo.travelDate}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, travelDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">出行人数</label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <span className="text-xs text-slate-500">成人</span>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={contactInfo.adults}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, adults: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs text-slate-500">儿童</span>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={contactInfo.children}
                        onChange={(e) => setContactInfo(prev => ({ ...prev, children: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">您的姓名 *</label>
                <input
                  type="text"
                  required
                  placeholder="请输入姓名"
                  value={contactInfo.name}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">联系电话 *</label>
                  <input
                    type="tel"
                    required
                    placeholder="请输入手机号"
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">电子邮箱</label>
                  <input
                    type="email"
                    placeholder="请输入邮箱（选填）"
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">备注信息</label>
                <textarea
                  placeholder="特殊需求或补充说明（选填）"
                  rows={3}
                  value={contactInfo.notes}
                  onChange={(e) => setContactInfo(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-400/50 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-400 to-pink-400 hover:from-cyan-500 hover:to-pink-500 text-white rounded-xl font-medium transition-all"
              >
                提交预订
              </button>
            </form>
          )}

          {step === 'submitting' && (
            <div className="text-center py-8">
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-white font-medium mb-2">正在提交您的预订...</p>
              <p className="text-slate-400 text-sm">请稍候片刻</p>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">预订成功！</h4>
              <p className="text-slate-400 text-sm mb-4">
                我们的旅行规划师将在24小时内<br />联系您确认行程细节
              </p>
              <div className="bg-white/5 rounded-xl p-4 mb-4">
                <p className="text-slate-400 text-xs">订单编号</p>
                <p className="text-white font-mono">{generateOrderId()}</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-colors"
              >
                完成
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// 生成订单编号
function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `TB${timestamp}${random}`
}

export default BookingConfirmModal
