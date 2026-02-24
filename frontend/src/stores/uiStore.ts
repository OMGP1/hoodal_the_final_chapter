import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
    sidebarOpen: boolean;
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark' | 'system';

    // Actions
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    toggleSidebarCollapse: () => void;
    setTheme: (theme: 'light' | 'dark' | 'system') => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            sidebarOpen: true,
            sidebarCollapsed: false,
            theme: 'light',

            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleSidebarCollapse: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setTheme: (theme) => {
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                } else {
                    // System preference
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.toggle('dark', prefersDark);
                }
                set({ theme });
            },
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ theme: state.theme, sidebarCollapsed: state.sidebarCollapsed }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    // Apply theme immediately on load
                    const theme = state.theme || 'light';
                    if (theme === 'dark') {
                        document.documentElement.classList.add('dark');
                    } else if (theme === 'light') {
                        document.documentElement.classList.remove('dark');
                    } else {
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        document.documentElement.classList.toggle('dark', prefersDark);
                    }
                }
            },
        }
    )
);
