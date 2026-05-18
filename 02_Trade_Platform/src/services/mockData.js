export const MOCK_PRICE_DATA = [
  { month: '1月', zircon: 15200, titanium: 2450 },
  { month: '2月', zircon: 15800, titanium: 2500 },
  { month: '3月', zircon: 16100, titanium: 2380 },
  { month: '4月', zircon: 15900, titanium: 2600 },
  { month: '5月', zircon: 16500, titanium: 2750 },
  { month: '6月', zircon: 17200, titanium: 2900 },
];

export const MOCK_ORDERS = [
  { id: 'ORD-2024001', product: '澳洲优级锆英砂', volume: '500 MT', status: '运输中', progress: 65, vessel: 'OCEAN STAR', eta: '2024-07-15' },
  { id: 'ORD-2024002', product: '莫桑比克钛精矿', volume: '2000 MT', status: '报关中', progress: 85, vessel: 'SILK ROAD 2', eta: '2024-07-08' },
  { id: 'ORD-2024003', product: '越南锆砂', volume: '150 MT', status: '已到港', progress: 100, vessel: 'LOCAL FEEDER', eta: '2024-07-01' },
];

// 模拟船位物流与异常预警
export const MOCK_ALERTS = [
  { id: 1, type: 'warning', message: '湛江港受台风影响，提货时间预计推迟48小时。' },
  { id: 2, type: 'info', message: '您的提单 #BL4492 已完成电放。' }
];

// 产品基准与品位扣减标准 (供结算引擎使用)
export const SETTLEMENT_RULES = {
  zircon: {
    baseGrade: 65,
    gradePremium: 150, // 超过每0.1%增值
    gradePenalty: 250, // 低于每0.1%扣减
    baseMoisture: 4, // 4% 基准水分
    maxMoisture: 6, // 上限罚款水分
  },
  titanium: {
    baseGrade: 50,
    gradePremium: 80,
    gradePenalty: 120,
    baseMoisture: 5,
    maxMoisture: 8,
  }
};
