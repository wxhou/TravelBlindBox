import { GeolocationService } from './geolocationService'
import type { GeolocationResult } from './geolocationService'

export interface EmergencyAlert {
  id: string
  type: 'natural_disaster' | 'weather' | 'security' | 'health' | 'transportation' | 'infrastructure' | 'public_safety'
  severity: 'low' | 'medium' | 'high' | 'critical'
  level: 1 | 2 | 3 | 4 | 5 // 紧急级别
  title: string
  description: string
  location: {
    lat: number
    lng: number
    address: string
    affectedRadius: number // 影响半径（米）
  }
  startTime: number
  estimatedEndTime?: number
  instructions: string[]
  resources: EmergencyResource[]
  contactInfo: EmergencyContact[]
  active: boolean
  source: string
  verified: boolean
  lastUpdated: number
}

export interface EmergencyResource {
  id: string
  name: string
  type: 'shelter' | 'hospital' | 'police' | 'fire_station' | 'evacuation_center' | 'emergency_supplies'
  location: {
    lat: number
    lng: number
    address: string
  }
  status: 'available' | 'limited' | 'unavailable' | 'full'
  capacity?: number
  currentOccupancy?: number
  contact: {
    phone: string
    hours: string
  }
  services: string[]
  accessibility: {
    wheelchairAccessible: boolean
    hasParking: boolean
    publicTransportAccess: boolean
  }
}

export interface EmergencyContact {
  id: string
  name: string
  type: 'police' | 'fire' | 'medical' | 'government' | 'embassy' | 'utility'
  phone: string
  emergency?: boolean
  hours: string
  description: string
  coverage: string
}

export interface EmergencyPlan {
  id: string
  name: string
  type: 'evacuation' | 'shelter' | 'communication' | 'medical' | 'travel'
  steps: EmergencyStep[]
  prerequisites: string[]
  estimatedDuration: number // 分钟
  difficulty: 'easy' | 'moderate' | 'difficult'
  equipment: string[]
}

export interface EmergencyStep {
  order: number
  title: string
  description: string
  timeEstimate: number // 分钟
  critical: boolean
  alternative?: string
}

export interface EmergencyRequest {
  id: string
  type: 'medical' | 'security' | 'fire' | 'evacuation' | 'information' | 'transportation'
  urgency: 'low' | 'medium' | 'high' | 'critical'
  location: {
    lat: number
    lng: number
    address: string
  }
  description: string
  contactInfo: {
    name: string
    phone: string
    email?: string
  }
  status: 'submitted' | 'received' | 'dispatched' | 'en_route' | 'completed' | 'cancelled'
  timestamp: number
  estimatedArrival?: number
  responder?: {
    name: string
    type: string
    contact: string
  }
}

export interface EmergencyCache {
  alerts: EmergencyAlert[]
  resources: EmergencyResource[]
  contacts: EmergencyContact[]
  timestamp: number
  expiresAt: number
}

export class EmergencyService {
  private static instance: EmergencyService
  private cache: Map<string, EmergencyCache> = new Map()
  private readonly CACHE_DURATION = 30 * 60 * 1000 // 30分钟
  private readonly UPDATE_INTERVAL = 5 * 60 * 1000 // 5分钟更新一次
  
  private emergencyContacts: EmergencyContact[] = this.initializeEmergencyContacts()
  private emergencyPlans: EmergencyPlan[] = this.initializeEmergencyPlans()

  static getInstance(): EmergencyService {
    if (!EmergencyService.instance) {
      EmergencyService.instance = new EmergencyService()
    }
    return EmergencyService.instance
  }

  async getEmergencyAlerts(location: string | GeolocationResult, radius: number = 10000): Promise<EmergencyAlert[]> {
    const cacheKey = this.generateCacheKey(location, radius)
    
    // 检查缓存
    const cached = this.cache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) {
      return cached.alerts
    }

    try {
      const coordinates = await this.normalizeLocation(location)
      const alerts = await this.fetchEmergencyAlerts(coordinates, radius)
      
      // 缓存数据
      this.cache.set(cacheKey, {
        alerts,
        resources: [],
        contacts: this.emergencyContacts,
        timestamp: Date.now(),
        expiresAt: Date.now() + this.CACHE_DURATION
      })

      return alerts
    } catch (error) {
      console.error('获取紧急预警失败:', error)
      return []
    }
  }

  async getNearbyEmergencyResources(
    location: string | GeolocationResult,
    radius: number = 5000,
    types?: EmergencyResource['type'][]
  ): Promise<EmergencyResource[]> {
    try {
      const coordinates = await this.normalizeLocation(location)
      const resources = await this.fetchEmergencyResources(coordinates, radius, types)
      return resources
    } catch (error) {
      console.error('获取紧急资源失败:', error)
      return []
    }
  }

  async getEmergencyContacts(location?: string | GeolocationResult): Promise<EmergencyContact[]> {
    // 总是返回预设的紧急联系方式
    return this.emergencyContacts
  }

  async getEmergencyPlans(type: EmergencyPlan['type']): Promise<EmergencyPlan[]> {
    return this.emergencyPlans.filter(plan => plan.type === type)
  }

  async submitEmergencyRequest(request: Omit<EmergencyRequest, 'id' | 'timestamp' | 'status'>): Promise<EmergencyRequest> {
    const emergencyRequest: EmergencyRequest = {
      ...request,
      id: `emergency_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      status: 'submitted'
    }

    try {
      // 实际实现中需要发送到紧急服务API
      console.log('提交紧急请求:', emergencyRequest)
      
      // 模拟处理
      emergencyRequest.status = 'received'
      
      // 模拟派发
      setTimeout(() => {
        emergencyRequest.status = 'dispatched'
        emergencyRequest.responder = {
          name: '应急响应员',
          type: 'emergency_responder',
          contact: '123-456-7890'
        }
      }, 2000)

      return emergencyRequest
    } catch (error) {
      console.error('提交紧急请求失败:', error)
      throw new Error(`提交紧急请求失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  async callEmergencyNumber(type: 'police' | 'fire' | 'medical'): Promise<EmergencyContact | null> {
    const contact = this.emergencyContacts.find(c => c.type === type && c.emergency)
    if (contact) {
      // 在实际应用中，这里会触发电话拨号
      if (confirm(`确定要拨打紧急电话 ${contact.phone} (${contact.name}) 吗？`)) {
        // 模拟拨打电话
        console.log(`正在拨打紧急电话: ${contact.phone}`)
      }
    }
    return contact || null
  }

  async startEmergencyMonitoring(
    location: string | GeolocationResult,
    onAlert?: (alert: EmergencyAlert) => void,
    onCriticalUpdate?: (alert: EmergencyAlert) => void
  ): Promise<() => void> {
    const intervalId = setInterval(async () => {
      try {
        const alerts = await this.getEmergencyAlerts(location)
        
        const newAlerts = alerts.filter(alert => 
          alert.active && alert.startTime > Date.now() - this.UPDATE_INTERVAL
        )

        if (newAlerts.length > 0 && onAlert) {
          newAlerts.forEach(alert => onAlert(alert))
        }

        // 检查关键更新
        const criticalAlerts = alerts.filter(alert => 
          alert.severity === 'critical' && alert.lastUpdated > Date.now() - this.UPDATE_INTERVAL
        )

        if (criticalAlerts.length > 0 && onCriticalUpdate) {
          criticalAlerts.forEach(alert => onCriticalUpdate(alert))
        }
      } catch (error) {
        console.error('紧急监控更新失败:', error)
      }
    }, this.UPDATE_INTERVAL)

    // 返回停止函数
    return () => clearInterval(intervalId)
  }

  async generateEvacuationPlan(
    location: string | GeolocationResult,
    emergencyType: EmergencyAlert['type']
  ): Promise<EmergencyPlan | null> {
    try {
      const coordinates = await this.normalizeLocation(location)
      const nearbyResources = await this.getNearbyEmergencyResources(coordinates, 10000, ['shelter', 'evacuation_center'])
      
      const evacuationPlan: EmergencyPlan = {
        id: `evacuation_${Date.now()}`,
        name: `${emergencyType}疏散计划`,
        type: 'evacuation',
        steps: [
          {
            order: 1,
            title: '立即离开危险区域',
            description: '按照指示快速有序地离开危险区域，不要返回',
            timeEstimate: 5,
            critical: true
          },
          {
            order: 2,
            title: '前往最近的避难所',
            description: `前往最近的避难所: ${nearbyResources[0]?.name || '未找到合适避难所'}`,
            timeEstimate: 30,
            critical: true,
            alternative: '寻找其他安全地点'
          },
          {
            order: 3,
            title: '联系家人报平安',
            description: '及时通知家人你的安全状况和位置',
            timeEstimate: 10,
            critical: false
          },
          {
            order: 4,
            title: '等待进一步指示',
            description: '关注官方消息，听从现场指挥人员安排',
            timeEstimate: 60,
            critical: false
          }
        ],
        prerequisites: ['保持冷静', '随身携带重要证件', '关闭水电气'],
        estimatedDuration: 105,
        difficulty: 'moderate',
        equipment: ['身份证件', '手机充电器', '急救包', '重要药品', '现金']
      }

      return evacuationPlan
    } catch (error) {
      console.error('生成疏散计划失败:', error)
      return null
    }
  }

  clearCache(location?: string, radius?: number): void {
    if (location && radius) {
      const cacheKey = this.generateCacheKey(location, radius)
      this.cache.delete(cacheKey)
    } else {
      this.cache.clear()
    }
  }

  getCacheStatus(): { totalEntries: number; locations: string[] } {
    return {
      totalEntries: this.cache.size,
      locations: Array.from(this.cache.keys())
    }
  }

  private async normalizeLocation(location: string | GeolocationResult): Promise<GeolocationResult> {
    if (typeof location === 'string') {
      // 简化实现，实际需要地理编码
      return {
        latitude: 39.9042,
        longitude: 116.4074,
        accuracy: 1000,
        timestamp: Date.now()
      }
    }
    return location
  }

  private generateCacheKey(location: string | GeolocationResult, radius: number): string {
    const locationStr = typeof location === 'string' ? location : `${location.latitude},${location.longitude}`
    return `${locationStr}_${radius}`
  }

  private async fetchEmergencyAlerts(coordinates: GeolocationResult, radius: number): Promise<EmergencyAlert[]> {
    // 使用模拟数据
    return this.generateMockAlerts(coordinates)
  }

  private async fetchEmergencyResources(
    coordinates: GeolocationResult,
    radius: number,
    types?: EmergencyResource['type'][]
  ): Promise<EmergencyResource[]> {
    // 使用模拟数据
    return this.generateMockResources(coordinates, types)
  }

  private generateMockAlerts(coordinates: GeolocationResult): EmergencyAlert[] {
    const alerts: EmergencyAlert[] = []
    
    // 随机生成一些紧急预警
    if (Math.random() > 0.6) {
      alerts.push({
        id: `alert_${Date.now()}_1`,
        type: 'weather',
        severity: 'high',
        level: 3,
        title: '暴雨橙色预警',
        description: '预计未来2小时内有强降雨，可能引发城市内涝',
        location: {
          lat: coordinates.latitude,
          lng: coordinates.longitude,
          address: '当前位置附近',
          affectedRadius: 5000
        },
        startTime: Date.now() - 600000, // 10分钟前开始
        estimatedEndTime: Date.now() + 7200000, // 2小时后结束
        instructions: [
          '尽量减少外出',
          '避免前往低洼地区',
          '关注路况信息',
          '准备应急物品'
        ],
        resources: [],
        contactInfo: [],
        active: true,
        source: '气象部门',
        verified: true,
        lastUpdated: Date.now()
      })
    }

    return alerts
  }

  private generateMockResources(
    coordinates: GeolocationResult,
    types?: EmergencyResource['type'][]
  ): EmergencyResource[] {
    const allTypes = types || ['shelter', 'hospital', 'police', 'fire_station', 'evacuation_center']
    
    return allTypes.map((type, index) => ({
      id: `resource_${type}_${index}`,
      name: this.getResourceName(type),
      type,
      location: {
        lat: coordinates.latitude + (Math.random() - 0.5) * 0.02,
        lng: coordinates.longitude + (Math.random() - 0.5) * 0.02,
        address: `距离当前位置${Math.floor(Math.random() * 3000 + 500)}米`
      },
      status: Math.random() > 0.8 ? 'limited' : 'available',
      capacity: type === 'shelter' ? 500 : type === 'hospital' ? 200 : undefined,
      currentOccupancy: type === 'shelter' ? Math.floor(Math.random() * 400) : 
                       type === 'hospital' ? Math.floor(Math.random() * 150) : undefined,
      contact: {
        phone: this.getResourcePhone(type),
        hours: '24小时'
      },
      services: this.getResourceServices(type),
      accessibility: {
        wheelchairAccessible: Math.random() > 0.3,
        hasParking: Math.random() > 0.2,
        publicTransportAccess: Math.random() > 0.4
      }
    }))
  }

  private getResourceName(type: EmergencyResource['type']): string {
    const names: Record<EmergencyResource['type'], string> = {
      'shelter': '应急避难所',
      'hospital': '急救中心',
      'police': '公安局',
      'fire_station': '消防站',
      'evacuation_center': '疏散中心',
      'emergency_supplies': '应急物资储备点'
    }
    return names[type] || '应急设施'
  }

  private getResourcePhone(type: EmergencyResource['type']): string {
    const phones: Record<EmergencyResource['type'], string> = {
      'shelter': '010-12345678',
      'hospital': '120',
      'police': '110',
      'fire_station': '119',
      'evacuation_center': '010-87654321',
      'emergency_supplies': '010-11223344'
    }
    return phones[type] || '000-0000000'
  }

  private getResourceServices(type: EmergencyResource['type']): string[] {
    const services: Record<EmergencyResource['type'], string[]> = {
      'shelter': ['临时住宿', '食物供应', '医疗救助', '心理疏导'],
      'hospital': ['急诊治疗', '手术室', '重症监护', '药品供应'],
      'police': ['安全保护', '案件处理', '交通管理', '秩序维护'],
      'fire_station': ['消防救援', '医疗急救', '危险品处理', '安全检查'],
      'evacuation_center': ['人员疏散', '临时安置', '信息咨询', '物资发放'],
      'emergency_supplies': ['应急食品', '医疗用品', '生活用品', '救援设备']
    }
    return services[type] || ['基础服务']
  }

  private initializeEmergencyContacts(): EmergencyContact[] {
    return [
      {
        id: 'contact_police',
        name: '报警电话',
        type: 'police',
        phone: '110',
        emergency: true,
        hours: '24小时',
        description: '遇到治安问题时拨打',
        coverage: '全国'
      },
      {
        id: 'contact_fire',
        name: '火警电话',
        type: 'fire',
        phone: '119',
        emergency: true,
        hours: '24小时',
        description: '火灾和其他紧急救援',
        coverage: '全国'
      },
      {
        id: 'contact_medical',
        name: '急救电话',
        type: 'medical',
        phone: '120',
        emergency: true,
        hours: '24小时',
        description: '医疗急救服务',
        coverage: '全国'
      },
      {
        id: 'contact_government',
        name: '政府服务热线',
        type: 'government',
        phone: '12345',
        emergency: false,
        hours: '工作日9:00-17:00',
        description: '政府服务和投诉建议',
        coverage: '本地'
      }
    ]
  }

  private initializeEmergencyPlans(): EmergencyPlan[] {
    return [
      {
        id: 'plan_evacuation_fire',
        name: '火灾疏散计划',
        type: 'evacuation',
        steps: [
          {
            order: 1,
            title: '发现火情立即报警',
            description: '立即拨打119火警电话，报告详细地址和火势情况',
            timeEstimate: 2,
            critical: true
          },
          {
            order: 2,
            title: '迅速撤离',
            description: '用湿毛巾捂住口鼻，低姿势迅速撤离到安全区域',
            timeEstimate: 5,
            critical: true,
            alternative: '如果出口被堵，立即寻找其他逃生路线'
          },
          {
            order: 3,
            title: '清点人数',
            description: '到达安全区域后清点人数，确认所有人安全撤离',
            timeEstimate: 10,
            critical: true
          }
        ],
        prerequisites: ['保持冷静', '不要使用电梯', '不要返回取物品'],
        estimatedDuration: 17,
        difficulty: 'easy',
        equipment: ['湿毛巾', '手电筒', '灭火器', '逃生绳']
      },
      {
        id: 'plan_medical_emergency',
        name: '医疗急救计划',
        type: 'medical',
        steps: [
          {
            order: 1,
            title: '评估伤情',
            description: '快速评估伤员情况，判断急救优先级',
            timeEstimate: 1,
            critical: true
          },
          {
            order: 2,
            title: '拨打急救电话',
            description: '立即拨打120，提供准确的地址和伤情描述',
            timeEstimate: 2,
            critical: true
          },
          {
            order: 3,
            title: '现场急救',
            description: '在等待急救人员到达时进行必要的现场急救',
            timeEstimate: 15,
            critical: false
          }
        ],
        prerequisites: ['掌握基本急救知识', '准备急救包'],
        estimatedDuration: 18,
        difficulty: 'moderate',
        equipment: ['急救包', '体温计', '血压计', '绷带', '消毒用品']
      }
    ]
  }
}