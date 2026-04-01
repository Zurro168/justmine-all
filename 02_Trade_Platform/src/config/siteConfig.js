/**
 * 正矿供应链 - 全局配置文件
 * 
 * 您可以在这里快速修改网站上的公司信息、联系方式和社交媒体链接。
 * 修改后，网站上所有引用的地方都会自动同步更新。
 */

export const siteConfig = {
  // --- 基础品牌信息 ---
  brand: {
    name: "正矿供应链",
    fullName: "正矿供应链（广东）有限公司",
    englishName: "Zhengkuang Supply Chain",
    englishFullName: "Zhengkuang Supply Chain (Guangdong) Co., Ltd",
    logo: "/logo.png", // 建议放在 public 文件夹下
    slogan: "产业 + 科技 + 金融。专注于高端矿产资源供应链服务，致力于成为进口供应链数字化领先企业，打造进口矿产产业互联网平台。",
  },

  // --- 联系方式 ---
  contact: {
    address: "广东省湛江市经开区海滨大道北荣盛滨海国际写字楼26楼",
    phone: "135 7008 3166",
    contactPerson: "王国东",
    email: "sc@zhengkuangsk.com",
    workingHours: "周一至周五 9:00 - 18:00",
  },

  // --- 社交媒体与二维码 ---
  social: {
    wechatPublic: {
      name: "正矿供应链公众号",
      qrCode: "/assets/wechat-public-qr.png", // 以后替换此路径的图片即可
      id: "正矿供应链",
    },
    weCom: {
      name: "企业微信客服",
      qrCode: "/assets/wecom-qr.jpg", // 以后替换此路径的图片即可
      desc: "扫码添加企微顾问",
    },
  },

  // --- 备案信息 ---
  icp: "粤ICP备XXXXXXXX号",

  // --- 快捷功能开关 ---
  features: {
    showNotifications: true,
    enableMultiLanguage: true,
    enableSearch: true,
  }
};
