import { create } from 'zustand';

export const useStore = create((set) => ({
  activeTab: 'home',
  isLoggedIn: false,
  language: 'zh',
  user: JSON.parse(localStorage.getItem('zk_user')) || null,
  selectedKBArticle: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedKBArticle: (article) => set({ selectedKBArticle: article }),
  login: (userData) => {
    localStorage.setItem('zk_user', JSON.stringify(userData));
    set({ user: userData, isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem('zk_user');
    set({ user: null, isLoggedIn: false, selectedKBArticle: null });
  },
  toggleLogin: () => set((state) => ({ isLoggedIn: !state.isLoggedIn, user: state.isLoggedIn ? null : { name: 'JS', role: '运营员' } })),
  setLanguage: (lang) => set({ language: lang }),
}));
