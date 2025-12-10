'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CRMLayout from '../components/CRMLayout';
import Pagination from '../components/Pagination';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface ProductReport {
  id: string;
  product_id: string;
  product_name: string;
  product_thumbnail: string | null;
  reporter_id: string;
  reporter_name: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  report_count: number;
}

export default function ProductReportsPage() {
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [filteredReports, setFilteredReports] = useState<ProductReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewing' | 'resolved' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    let result = [...reports];

    // 상태 필터
    if (statusFilter !== 'all') {
      result = result.filter((report) => report.status === statusFilter);
    }

    // 검색 필터
    if (searchQuery) {
      result = result.filter((report) =>
        report.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.reporter_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredReports(result);
    setCurrentPage(1);
  }, [reports, statusFilter, searchQuery]);

  const fetchReports = async () => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/product-reports`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('신고 목록 조회 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (reportId: string, newStatus: string) => {
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) return;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/product-reports/${reportId}/status?new_status=${newStatus}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (response.ok) {
        alert('상태가 변경되었습니다.');
        fetchReports();
      } else {
        alert('상태 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('상태 변경 실패:', error);
      alert('상태 변경 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: any = {
      pending: { label: '대기중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      reviewing: { label: '검토중', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
      resolved: { label: '처리완료', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      rejected: { label: '반려', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
    };
    return statusMap[status] || { label: status, color: 'bg-gray-100 text-gray-800' };
  };

  const getReasonLabel = (reason: string) => {
    const reasonMap: Record<string, string> = {
      fake: '위조/모조품',
      illegal: '불법 상품',
      inappropriate: '부적절한 콘텐츠',
      fraud: '사기/허위 정보',
      defective: '불량/하자 상품',
      other: '기타',
    };
    return reasonMap[reason] || reason;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">신고 상품 관리</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">구매자가 신고한 상품 목록을 관리합니다</p>
        </section>

        {/* Controls Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">신고 목록</h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {filteredReports.length}
              </span>
            </div>
            <div className="flex-1 md:max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명 또는 신고자 검색"
                className="w-full border border-gray-300 bg-white px-3 py-1.5 text-xs text-gray-900 transition focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-white"
              />
            </div>
          </div>
          <div className="flex gap-1">
            {['all', 'pending', 'reviewing', 'resolved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status as typeof statusFilter)}
                className={`border px-2.5 py-1 text-xs font-medium transition ${
                  statusFilter === status
                    ? 'border-gray-900 bg-gray-900 text-white dark:border-white dark:bg-white dark:text-gray-900'
                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-white'
                }`}
              >
                {status === 'all' ? '전체' : status === 'pending' ? '대기중' : status === 'reviewing' ? '검토중' : status === 'resolved' ? '처리완료' : '반려'}
              </button>
            ))}
          </div>
        </section>

        {/* Table Section */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <tr>
                <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">상품</th>
                <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">신고 사유</th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-gray-300">신고자</th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-gray-300">신고 횟수</th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-gray-300">상태</th>
                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-700 dark:text-gray-300">신고일</th>
                <th className="px-4 py-2 font-medium text-gray-700 dark:text-gray-300">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    신고 내역이 없습니다
                  </td>
                </tr>
              ) : (
                filteredReports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden border border-gray-200 dark:border-gray-700">
                          {report.product_thumbnail ? (
                            <Image
                              src={report.product_thumbnail}
                              alt={report.product_name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-gray-100 text-gray-400 dark:bg-gray-800">
                              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/products/${report.product_id}`}
                          target="_blank"
                          className="font-medium text-gray-900 hover:underline dark:text-white"
                        >
                          {report.product_name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">{getReasonLabel(report.reason)}</p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{report.description}</p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{report.reporter_name}</td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="font-bold text-red-600 dark:text-red-400">{report.report_count}건</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${getStatusBadge(report.status).color}`}>
                        {getStatusBadge(report.status).label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(report.created_at)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={report.status}
                        onChange={(e) => handleStatusChange(report.id, e.target.value)}
                        className="border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="pending">대기중</option>
                        <option value="reviewing">검토중</option>
                        <option value="resolved">처리완료</option>
                        <option value="rejected">반려</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(filteredReports.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={filteredReports.length}
          />
        </section>
      </div>
    </CRMLayout>
  );
}
