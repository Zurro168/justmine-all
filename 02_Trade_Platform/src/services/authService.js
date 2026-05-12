/**
 * Authentication Service — SHA-256 hash-based password verification.
 */
import { verifyPassword } from '../utils/hashPassword';
import users from '../data/users.json';
import roster from '../data/employee-roster.json';

const authService = {
  async login(username, password) {
    return new Promise(async (resolve, reject) => {
      setTimeout(async () => {
        const user = users.find(u => u.username === username);
        if (user && user.passwordHash) {
          const isValid = await verifyPassword(password, user.passwordHash);
          if (isValid) {
            const { passwordHash: _, ...userWithoutPassword } = user;
            resolve(userWithoutPassword);
          } else {
            reject(new Error('用户名或密码错误，请重试'));
          }
        } else {
          reject(new Error('用户名或密码错误，请重试'));
        }
      }, 800);
    });
  },

  async registerByRoster(nameOrEnglishName, newPassword) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const match = roster.find(e =>
          (e.name === nameOrEnglishName || e.englishName.toLowerCase() === nameOrEnglishName.toLowerCase())
        );

        if (match) {
          const newUser = {
            username: nameOrEnglishName.replace(/\s+/g, '_').toLowerCase(),
            name: match.name,
            role: match.role,
            category: 'EMPLOYEE',
            company: '正矿供应链',
            avatar: match.name.slice(0, 1)
          };
          resolve(newUser);
        } else {
          reject(new Error('未在员工花名册中找到该姓名，请核对或联系行政部。'));
        }
      }, 1000);
    });
  },

  getCategoryName(category) {
    const map = {
      'EMPLOYEE': '内部员工',
      'UPSTREAM': '上游供应',
      'DOWNSTREAM': '下游客户',
      'SERVICE': '第三方服务'
    };
    return map[category] || '未知类别';
  }
};

export default authService;
