'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import CRMLayout from '../components/CRMLayout';
import Pagination from '../components/Pagination';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

interface Document {
  id: string;
  filename: string;
  file_size: number;
  status: 'processing' | 'completed' | 'failed';
  uploaded_at: string;
  chunk_count?: number;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // 관리자 로그인 체크
    const adminToken = localStorage.getItem('admin_token');
    if (!adminToken) {
      router.push('/crm/login');
      return;
    }

    fetchDocuments();
  }, [router]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/documents`);
      if (!response.ok) throw new Error('문서 목록 조회 실패');

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error('문서 목록 조회 실패:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('PDF 파일만 업로드 가능합니다.');
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        setError('파일 크기는 50MB 이하여야 합니다.');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('파일을 선택해주세요.');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || '업로드 실패');
      }

      const data = await response.json();
      setSuccess(` 업로드 성공! ${data.chunk_count}개의 청크로 임베딩되었습니다.`);
      setSelectedFile(null);

      // 파일 인풋 초기화
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

      // 목록 새로고침
      fetchDocuments();

      // 3초 후 성공 메시지 제거
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || '업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/documents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('삭제 실패');
      }

      alert('문서가 삭제되었습니다.');
      fetchDocuments();
    } catch (err: any) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="rounded-full bg-green-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-green-600">완료</span>;
      case 'processing':
        return <span className="rounded-full bg-yellow-700 px-2 py-0.5 text-xs font-medium text-white dark:bg-yellow-600">처리중</span>;
      case 'failed':
        return <span className="rounded-full bg-red-900 px-2 py-0.5 text-xs font-medium text-white dark:bg-red-600">실패</span>;
      default:
        return null;
    }
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
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">AI 문서관리</h1>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            PDF 문서를 업로드하여 AI 챗봇이 학습할 수 있도록 합니다
          </p>
        </section>

        {/* Upload Section */}
        <section className="mt-3 border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 className="mb-3 text-base font-bold text-gray-900 dark:text-white">
            문서 업로드
          </h2>

          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300">
              PDF 파일 선택 (최대 50MB)
            </label>
            <div className="flex items-center gap-2">
              <input
                id="file-input"
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="w-full text-xs text-gray-900 file:mr-3 file:cursor-pointer file:border-0 file:bg-gray-900 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white hover:file:bg-gray-800 dark:text-gray-300 dark:file:bg-white dark:file:text-gray-900 dark:hover:file:bg-gray-100"
              />
              <button
                onClick={handleUpload}
                disabled={!selectedFile || uploading}
                className="whitespace-nowrap border border-gray-900 bg-gray-900 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100"
              >
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </div>
            {selectedFile && (
              <p className="mt-1.5 text-xs text-gray-600 dark:text-gray-400">
                📄 {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}
          </div>

          {error && (
            <div className="mb-3 border border-red-600 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-500 dark:bg-red-950/40 dark:text-red-200">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="mb-3 border border-green-600 bg-green-50 p-2.5 text-xs text-green-700 dark:border-green-500 dark:bg-green-950/40 dark:text-green-200">
              {success}
            </div>
          )}

          {/* 안내 */}
          <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
            <p className="mb-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
              📌 사용 안내
            </p>
            <ul className="list-inside list-disc space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
              <li>PDF 파일을 업로드하면 자동으로 텍스트를 추출하여 임베딩합니다</li>
              <li>업로드된 문서는 AI 챗봇이 답변할 때 참고 자료로 사용됩니다</li>
              <li>상품 가이드, 정책 문서, FAQ 등을 업로드하세요</li>
            </ul>
          </div>
        </section>

        {/* Documents List */}
        <section className="mt-3 border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <div className="border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                업로드된 문서
              </h2>
              <span className="rounded-full bg-gray-900 px-2.5 py-0.5 text-xs font-bold text-white dark:bg-white dark:text-gray-900">
                {documents.length}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-gray-200 bg-gray-50 text-xs font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                <tr>
                  <th className="px-4 py-2">파일명</th>
                  <th className="px-4 py-2">크기</th>
                  <th className="px-4 py-2">청크 수</th>
                  <th className="px-4 py-2">상태</th>
                  <th className="px-4 py-2">업로드 일시</th>
                  <th className="px-4 py-2 text-center">작업</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      업로드된 문서가 없습니다.
                    </td>
                  </tr>
                ) : (
                  documents.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((doc) => (
                    <tr
                      key={doc.id}
                      className="border-b border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-white">
                        {doc.filename}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        {formatFileSize(doc.file_size)}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        {doc.chunk_count || '-'}
                      </td>
                      <td className="px-4 py-2.5">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-4 py-2.5 text-gray-700 dark:text-gray-300">
                        {formatDate(doc.uploaded_at)}
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(documents.length / itemsPerPage)}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalItems={documents.length}
          />
        </section>
      </div>
    </CRMLayout>
  );
}
