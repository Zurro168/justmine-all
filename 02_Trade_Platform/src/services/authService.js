/**
 * Authentication Service - SHA-256 hash-based password verification.
 */
import { verifyPassword } from '../utils/hashPassword';
import users from '../data/users.json';
import roster from '../data/employee-roster.json';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const authService = {
  async login(username, password) {
    await delay(800);
    const user = users.find(u => u.username === username);
    if (!user?.passwordHash) {
      throw new Error('用户名或密码错误，请重试');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      throw new Error('用户名或密码错误，请重试');
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async registerByRoster(nameOrEnglishName, newPassword) {
    await delay(1000);
    if (!newPassword?.trim()) {
      throw new Error('请设置登录密码');
    }

    const match = roster.find(e =>
      e.name === nameOrEnglishName || e.englishName.toLowerCase() === nameOrEnglishName.toLowerCase()
    );

    if (!match) {
      throw new Error('未在员工花名册中找到该姓名，请核对或联系行政部。');
    }

    return {
      username: nameOrEnglishName.replace(/\s+/g, '_').toLowerCase(),
      name: match.name,
      role: match.role,
      category: 'EMPLOYEE',
      company: '正矿供应链',
      avatar: match.name.slice(0, 1)
    };
  },

  getCategoryName(category) {
    const map = {
      EMPLOYEE: '内部员工',
      UPSTREAM: '上游供应',
      DOWNSTREAM: '下游客户',
      SERVICE: '第三方服务'
    };
    return map[category] || '未知类别';
  }
};

export default authService;
