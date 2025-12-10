'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';
import Pagination from '../components/Pagination';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_number: string;
  owner_name: string;
  phone: string;
  email: string;
  category: string | null;
  approval_status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
}

export default function VendorsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    fetchVendors();
  }, [router]);

  const fetchVendors = async () => {
    try {
      const adminToken = localStorage.getItem('admin_token');
      const params = new URLSearchParams();

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchQuery.trim()) {
        params.append('search', searchQuery);
      }

      const url = `${API_BASE_URL}/admin/vendors${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data);
      }
    } catch (error) {
      console.error('판매자 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어나 필터 변경 시 재조회
  useEffect(() => {
    if (!isLoading) {
      fetchVendors();
    }
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; color: string }> = {
      pending: {
        label: '승인대기',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      },
      approved: {
        label: '승인완료',
        color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      },
      rejected: {
        label: '반려',
        color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`inline-block px-2 py-1 text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const handleSearch = () => {
    fetchVendors();
  };

  const handleApprove = async (vendorId: string) => {
    if (!confirm('판매자를 승인하시겠습니까?')) return;

    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        alert('판매자가 승인되었습니다.');
        fetchVendors(); // 목록 새로고침
      } else {
        const error = await response.json();
        alert(error.detail || '승인 처리 실패');
      }
    } catch (error) {
      console.error('승인 처리 실패:', error);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (vendorId: string) => {
    if (!confirm('판매자 신청을 반려하시겠습니까?')) return;

    const reason = prompt('반려 사유를 입력하세요 (선택사항):');

    try {
      const adminToken = localStorage.getItem('admin_token');
      const url = new URL(`${API_BASE_URL}/admin/vendors/${vendorId}/reject`);
      if (reason) {
        url.searchParams.append('rejection_reason', reason);
      }

      const response = await fetch(url.toString(), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        alert('판매자 신청이 반려되었습니다.');
        fetchVendors(); // 목록 새로고침
      } else {
        const error = await response.json();
        alert(error.detail || '반려 처리 실패');
      }
    } catch (error) {
      console.error('반려 처리 실패:', error);
      alert('반려 처리 중 오류가 발생했습니다.');
    }
  };

  const handleCancelApproval = async (vendorId: string) => {
    if (!confirm('판매자 승인을 취소하시겠습니까?')) return;

    try {
      const adminToken = localStorage.getItem('admin_token');
      const response = await fetch(`${API_BASE_URL}/admin/vendors/${vendorId}/cancel-approval`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        alert('판매자 승인이 취소되었습니다.');
        fetchVendors(); // 목록 새로고침
      } else {
        const error = await response.json();
        alert(error.detail || '승인 취소 실패');
      }
    } catch (error) {
      console.error('승인 취소 실패:', error);
      alert('승인 취소 중 오류가 발생했습니다.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <CRMLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600 dark:text-gray-400">로딩 중...</div>
        </div>
      </CRMLayout>
    );
  }

  return (
    <CRMLayout>
      <div className="min-h-screen">
        {/* Header */}
        <section className="border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">판매자 승인</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">판매자 신청 승인 및 관리</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">전체 판매자</h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {vendors.length}
              </span>
            </div>

            {/* Search */}
            <div className="flex flex-1 gap-2 md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="상호명, 대표자명, 사업자번호로 검색"
                className="flex-1 border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
              <button
                onClick={handleSearch}
                className="border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-medium text-white hover:bg-gray-800 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                검색
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'all'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'pending'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              승인대기
            </button>
            <button
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'approved'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              승인완료
            </button>
            <button
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 text-xs font-medium transition ${
                statusFilter === 'rejected'
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              반려
            </button>
          </div>
        </section>

        {/* Vendors List */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="p-4">
            {vendors.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                판매자 신청이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상호명
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        대표자
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        사업자번호
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        카테고리
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        연락처
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        신청일시
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상태
                      </th>
                      <th className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((vendor) => (
                      <tr
                        key={vendor.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                      >
                        <td className="whitespace-nowrap px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {vendor.business_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.owner_name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.business_number}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.category || '-'}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.phone}
                        </td>
                        <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {formatDate(vendor.created_at)}
                        </td>
                        <td className="px-3 py-3">{getStatusBadge(vendor.approval_status)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {vendor.approval_status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(vendor.id)}
                                  className="whitespace-nowrap border border-green-600 bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 dark:border-green-500 dark:bg-green-500"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => handleReject(vendor.id)}
                                  className="whitespace-nowrap border border-red-600 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-500"
                                >
                                  반려
                                </button>
                              </>
                            )}
                            {vendor.approval_status === 'approved' && (
                              <button
                                onClick={() => handleCancelApproval(vendor.id)}
                                className="whitespace-nowrap border border-orange-600 bg-orange-600 px-2 py-1 text-xs font-medium text-white hover:bg-orange-700 dark:border-orange-500 dark:bg-orange-500"
                              >
                                승인취소
                              </button>
                            )}
                            {vendor.approval_status === 'rejected' && (
                              <button
                                onClick={() => handleApprove(vendor.id)}
                                className="whitespace-nowrap border border-green-600 bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 dark:border-green-500 dark:bg-green-500"
                              >
                                재승인
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(vendors.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={vendors.length}
          />
        </section>
      </div>
    </CRMLayout>
  );
}
