import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { paymentsService } from '../services/paymentsService';
import { Payment, PaymentFilters } from '../types/payment';
import { getCurrentUser } from '../utils/auth';
import { hasPermission, DEFAULT_ROLES } from '../utils/permissions';

const statusLabels: Record<string, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  cancelled: 'Отменён',
  failed: 'Ошибка',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-gray-100 text-gray-800',
};

const methodLabels: Record<string, string> = {
  online: 'Онлайн',
  cash: 'Наличные',
  card: 'Карта',
  transfer: 'Перевод',
};

interface Pagination {
  current_page: number;
  per_page: number;
  total_count: number;
  total_pages: number;
}

const Payments: React.FC = () => {
  const user = getCurrentUser();
  const canViewPayments = hasPermission(user, DEFAULT_ROLES, 'view_payments');

  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  // Фильтры
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');

  const loadPayments = useCallback(async (page = 1) => {
    if (!canViewPayments) return;
    setLoading(true);
    try {
      const filters: PaymentFilters = {};
      if (statusFilter) filters.status = statusFilter as PaymentFilters['status'];
      if (fromDate) filters.from_date = fromDate;
      if (toDate) filters.to_date = toDate;

      const result = await paymentsService.getAll(filters);
      setPayments(result.payments);
      setPagination(result.pagination);
    } catch (error: any) {
      toast.error(error.message || 'Ошибка загрузки платежей');
    } finally {
      setLoading(false);
    }
  }, [canViewPayments, statusFilter, fromDate, toDate]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const formatAmount = (amount: string) => {
    return parseFloat(amount).toLocaleString('ru-RU');
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!canViewPayments) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          У вас нет прав для просмотра платежей
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Платежи</h1>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Все</option>
              <option value="pending">Ожидает оплаты</option>
              <option value="paid">Оплачен</option>
              <option value="cancelled">Отменён</option>
              <option value="failed">Ошибка</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">От</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">До</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
          {(statusFilter || fromDate || toDate) && (
            <button
              onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Загрузка...</div>
        ) : payments.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Платежи не найдены</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Клиент</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Услуга</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Встреча</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-500">Сумма</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Способ</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500">Статус</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Дата</th>
                    <th className="px-4 py-3 text-center font-medium text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {payments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">#{payment.id}</td>
                      <td className="px-4 py-3 font-medium">
                        {payment.client?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {payment.service?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {payment.appointment
                          ? `${payment.appointment.date} ${payment.appointment.time}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {payment.discount_amount && parseFloat(payment.discount_amount) > 0 ? (
                          <div>
                            <span className="text-gray-400 line-through text-xs mr-1">
                              {formatAmount(payment.amount)}
                            </span>
                            <span>{formatAmount(payment.final_amount)} ₽</span>
                          </div>
                        ) : (
                          <span>{formatAmount(payment.amount)} ₽</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {methodLabels[payment.payment_method] || payment.payment_method}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[payment.status] || ''}`}>
                          {statusLabels[payment.status] || payment.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {formatDate(payment.created_at)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => setSelectedPayment(payment)}
                          className="text-primary hover:underline text-sm"
                        >
                          Подробнее
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <div className="text-sm text-gray-500">
                  Показано {payments.length} из {pagination.total_count}
                </div>
                <div className="flex gap-2">
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => loadPayments(page)}
                      className={`px-3 py-1 rounded text-sm ${
                        page === pagination.current_page
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Модальное окно деталей */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Платёж #{selectedPayment.id}</h2>
              <button onClick={() => setSelectedPayment(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Статус:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedPayment.status]}`}>
                  {statusLabels[selectedPayment.status]}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Клиент:</span>
                <span className="font-medium">{selectedPayment.client?.name || '—'}</span>
              </div>

              {selectedPayment.client?.phone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Телефон:</span>
                  <span>{selectedPayment.client.phone}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-500">Услуга:</span>
                <span>{selectedPayment.service?.name || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Способ оплаты:</span>
                <span>{methodLabels[selectedPayment.payment_method] || selectedPayment.payment_method}</span>
              </div>

              <hr />

              <div className="flex justify-between">
                <span className="text-gray-500">Сумма:</span>
                <span className="font-medium">{formatAmount(selectedPayment.amount)} ₽</span>
              </div>

              {selectedPayment.discount_amount && parseFloat(selectedPayment.discount_amount) > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Скидка:</span>
                    <span className="text-green-600">
                      -{formatAmount(selectedPayment.discount_amount)} ₽
                      {selectedPayment.discount_type === 'percent' && selectedPayment.discount_value && (
                        <span className="text-xs ml-1">({selectedPayment.discount_value}%)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Итого:</span>
                    <span>{formatAmount(selectedPayment.final_amount)} ₽</span>
                  </div>
                </>
              )}

              {selectedPayment.appointment && (
                <>
                  <hr />
                  <div className="flex justify-between">
                    <span className="text-gray-500">Встреча:</span>
                    <span>{selectedPayment.appointment.date} в {selectedPayment.appointment.time}</span>
                  </div>
                  {selectedPayment.appointment.employee && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Специалист:</span>
                      <span>{selectedPayment.appointment.employee.name}</span>
                    </div>
                  )}
                </>
              )}

              {selectedPayment.payment_link && (
                <>
                  <hr />
                  <div>
                    <span className="text-gray-500 text-sm">Ссылка на оплату:</span>
                    <a
                      href={selectedPayment.payment_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-primary hover:underline text-sm mt-1 truncate"
                    >
                      {selectedPayment.payment_link}
                    </a>
                  </div>
                </>
              )}

              {selectedPayment.paid_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Оплачен:</span>
                  <span>{formatDateTime(selectedPayment.paid_at)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs text-gray-400">
                <span>Создан:</span>
                <span>{formatDateTime(selectedPayment.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
