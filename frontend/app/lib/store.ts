/**
 * Zustand 전역 상태 관리 스토어 (보안 강화 + 토큰 자동 갱신)
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface User {
  id: string
  email: string
  full_name: string
  user_type: 'buyer' | 'seller'
  phone?: string
}

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isRefreshing: boolean // ✅ 토큰 갱신 중 플래그

  // Actions
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  updateUser: (user: Partial<User>) => void
  setAccessToken: (token: string) => void
  refreshAccessToken: () => Promise<boolean> // ✅ 토큰 자동 갱신
}

// ✅ 토큰 자동 갱신 스케줄러 (29분마다 실행)
let refreshTimer: NodeJS.Timeout | null = null

const scheduleTokenRefresh = (refreshToken: string) => {
  // 기존 타이머 제거
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }

  // 29분마다 토큰 갱신 (Access Token 만료 30분 전에 갱신)
  refreshTimer = setInterval(async () => {
    const { refreshAccessToken } = useAuthStore.getState()
    const success = await refreshAccessToken()

    if (!success) {
      console.error('[Auth] Token refresh failed, logging out')
      useAuthStore.getState().logout()
    }
  }, 29 * 60 * 1000) // 29분
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isRefreshing: false,

      login: async (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        })

        // ✅ 토큰 자동 갱신 스케줄 시작
        scheduleTokenRefresh(refreshToken)

        console.log('[Auth] Login successful, token refresh scheduled')
      },

      logout: async () => {
        const { refreshToken } = get()

        // ✅ 서버에 로그아웃 요청 (Refresh Token 무효화)
        if (refreshToken) {
          try {
            await fetch(`${API_BASE_URL}/auth/logout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: refreshToken }),
            })
            console.log('[Auth] Server logout successful')
          } catch (error) {
            console.error('[Auth] Server logout failed:', error)
          }
        }

        // ✅ 토큰 갱신 스케줄러 중지
        if (refreshTimer) {
          clearInterval(refreshTimer)
          refreshTimer = null
        }

        // ✅ 로컬 상태 초기화
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        })

        console.log('[Auth] Logout complete')
      },

      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      setAccessToken: (token) => set({ accessToken: token }),

      // ✅ Access Token 자동 갱신
      refreshAccessToken: async () => {
        const { refreshToken, isRefreshing } = get()

        // 이미 갱신 중이면 대기
        if (isRefreshing) {
          console.log('[Auth] Token refresh already in progress')
          return false
        }

        if (!refreshToken) {
          console.error('[Auth] No refresh token available')
          return false
        }

        set({ isRefreshing: true })

        try {
          const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          })

          if (!response.ok) {
            throw new Error(`Token refresh failed: ${response.status}`)
          }

          const data = await response.json()

          // ✅ 새 Access Token 저장
          set({
            accessToken: data.access_token,
            isRefreshing: false,
          })

          console.log('[Auth] Access token refreshed successfully')
          return true
        } catch (error) {
          console.error('[Auth] Token refresh error:', error)
          set({ isRefreshing: false })
          return false
        }
      },
    }),
    {
      name: 'auth-storage', // localStorage 키
      partialize: (state) => ({
        user: state.user,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        // ✅ accessToken은 메모리에만 저장 (보안 강화)
      }),
      // ✅ 로컬스토리지에서 복원 후 토큰 갱신 스케줄 재시작
      onRehydrateStorage: () => (state) => {
        if (state?.refreshToken) {
          scheduleTokenRefresh(state.refreshToken)
          console.log('[Auth] Token refresh scheduler restored from storage')
        }
      },
    }
  )
)
