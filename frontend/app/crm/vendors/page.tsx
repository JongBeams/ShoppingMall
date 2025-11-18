'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';

export default function VendorsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // 가짜 판매자 데이터
  const [vendors] = useState([
    {
      id: 'V001',
      businessName: 'OO농장',
      ownerName: '김농부',
      businessNumber: '123-45-67890',
      category: '식품',
      phone: '010-1234-5678',
      email: 'farm@example.com',
      status: 'pending',
      appliedAt: '2025-11-18 14:30',
    },
    {
      id: 'V002',
      businessName: '스마트스토어',
      ownerName: '이사장',
      businessNumber: '234-56-78901',
      category: '전자제품',
      phone: '010-2345-6789',
      email: 'smart@example.com',
      status: 'pending',
      appliedAt: '2025-11-18 13:00',
    },
    {
      id: 'V003',
      businessName: '패션몰',
      ownerName: '박디자이너',
      businessNumber: '345-67-89012',
      category: '의류',
      phone: '010-3456-7890',
      email: 'fashion@example.com',
      status: 'approved',
      appliedAt: '2025-11-17 16:20',
      approvedAt: '2025-11-18 09:00',
    },
    {
      id: 'V004',
      businessName: '건강식품',
      ownerName: '최건강',
      businessNumber: '456-78-90123',
      category: '건강식품',
      phone: '010-4567-8901',
      email: 'health@example.com',
      status: 'approved',
      appliedAt: '2025-11-16 11:15',
      approvedAt: '2025-11-17 10:30',
    },
    {
      id: 'V005',
      businessName: '부정판매자',
      ownerName: '정불법',
      businessNumber: '567-89-01234',
      category: '기타',
      phone: '010-5678-9012',
      email: 'bad@example.com',
      status: 'rejected',
      appliedAt: '2025-11-15 14:50',
      rejectedAt: '2025-11-16 09:20',
    },
  ]);

  useEffect(() => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }
    setIsLoading(false);
  }, [router]);

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

  const handleApprove = (vendorId: string) => {
    if (confirm('판매자를 승인하시겠습니까?')) {
      alert(`판매자 ${vendorId} 승인 완료`);
      // TODO: 실제 승인 API 호출
    }
  };

  const handleReject = (vendorId: string) => {
    if (confirm('판매자 신청을 반려하시겠습니까?')) {
      alert(`판매자 ${vendorId} 반려 완료`);
      // TODO: 실제 반려 API 호출
    }
  };

  const filteredVendors = vendors.filter((vendor) => {
    const matchesSearch =
      vendor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.businessNumber.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
                {filteredVendors.length}
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상호명, 대표자명, 사업자번호로 검색"
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
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
            {filteredVendors.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                판매자 신청이 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상호명
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        대표자
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        사업자번호
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        카테고리
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        연락처
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        신청일시
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                        상태
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendors.map((vendor) => (
                      <tr
                        key={vendor.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-3 py-3 text-xs font-medium text-gray-900 dark:text-white">
                          {vendor.businessName}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.ownerName}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.businessNumber}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.category}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.phone}
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 dark:text-gray-400">
                          {vendor.appliedAt}
                        </td>
                        <td className="px-3 py-3">{getStatusBadge(vendor.status)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                              상세
                            </button>
                            {vendor.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(vendor.id)}
                                  className="border border-green-600 bg-green-600 px-2 py-1 text-xs font-medium text-white hover:bg-green-700 dark:border-green-500 dark:bg-green-500"
                                >
                                  승인
                                </button>
                                <button
                                  onClick={() => handleReject(vendor.id)}
                                  className="border border-red-600 bg-red-600 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 dark:border-red-500 dark:bg-red-500"
                                >
                                  반려
                                </button>
                              </>
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
        </section>
      </div>
    </CRMLayout>
  );
}
