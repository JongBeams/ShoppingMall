/**
 * Zustand 스토어 테스트
 */
import { renderHook, act } from '@testing-library/react'
import { useAuthStore } from '../lib/store'

describe('useAuthStore', () => {
  beforeEach(() => {
    // 각 테스트 전에 스토어 초기화
    useAuthStore.setState({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    })
  })

  it('초기 상태가 올바르게 설정되어야 함', () => {
    const { result } = renderHook(() => useAuthStore())

    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.refreshToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('로그인 시 사용자 정보가 설정되어야 함', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      full_name: 'Test User',
      user_type: 'buyer' as const,
    }

    act(() => {
      result.current.login(mockUser, 'access-token', 'refresh-token')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.accessToken).toBe('access-token')
    expect(result.current.refreshToken).toBe('refresh-token')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('로그아웃 시 상태가 초기화되어야 함', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      full_name: 'Test User',
      user_type: 'buyer' as const,
    }

    // 먼저 로그인
    act(() => {
      result.current.login(mockUser, 'access-token', 'refresh-token')
    })

    // 로그아웃
    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.accessToken).toBeNull()
    expect(result.current.refreshToken).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('사용자 정보 업데이트가 정상 작동해야 함', () => {
    const { result } = renderHook(() => useAuthStore())

    const mockUser = {
      id: 'test-id',
      email: 'test@example.com',
      full_name: 'Test User',
      user_type: 'buyer' as const,
    }

    act(() => {
      result.current.login(mockUser, 'access-token', 'refresh-token')
    })

    act(() => {
      result.current.updateUser({ full_name: 'Updated Name' })
    })

    expect(result.current.user?.full_name).toBe('Updated Name')
    expect(result.current.user?.email).toBe('test@example.com') // 다른 필드는 유지
  })

  it('Access Token만 업데이트할 수 있어야 함', () => {
    const { result } = renderHook(() => useAuthStore())

    act(() => {
      result.current.setAccessToken('new-access-token')
    })

    expect(result.current.accessToken).toBe('new-access-token')
  })
})
