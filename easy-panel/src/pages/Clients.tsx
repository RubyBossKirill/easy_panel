import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/auth';
import { hasPermission } from '../utils/permissions';
import { DEFAULT_ROLES } from '../utils/permissions';
import { clientsService, Client } from '../services/clientsService';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [viewClient, setViewClient] = useState<Client | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const user = getCurrentUser();

  // Загрузка клиентов
  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await clientsService.getClients({
        search: searchTerm || undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
        page: page,
        per_page: 25,
      });

      setClients(response.data.clients);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err: any) {
      console.error('Failed to load clients:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить клиентов');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка при монтировании и изменении фильтров
  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortOrder]);

  // Поиск с debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (page === 1) {
        loadClients();
      } else {
        setPage(1); // Сброс на первую страницу при поиске
      }
    }, 500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

  // Проверка авторизации
  if (!user) return null;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canViewAllClients = hasPermission(user, DEFAULT_ROLES, 'view_all_clients');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const canManageAllClients = hasPermission(user, DEFAULT_ROLES, 'manage_all_clients');
  const canManageClients = hasPermission(user, DEFAULT_ROLES, 'manage_clients');
  const canDeleteClients = hasPermission(user, DEFAULT_ROLES, 'delete_clients');

  const handleDelete = async (clientId: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого клиента?')) return;

    try {
      await clientsService.deleteClient(clientId);
      alert('Клиент успешно удалён');
      loadClients(); // Перезагрузить список
    } catch (err: any) {
      alert(err.response?.data?.error || 'Не удалось удалить клиента');
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSortBy('name');
    setSortOrder('asc');
    setPage(1);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  };

  if (loading && clients.length === 0) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Загрузка клиентов...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Клиенты</h1>
        {canManageClients && (
          <button
            onClick={() => alert('Функционал создания клиента будет добавлен в следующей версии')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            ➕ Добавить клиента
          </button>
        )}
      </div>

      {/* Ошибка */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Фильтры и поиск */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Поиск</label>
            <input
              type="text"
              placeholder="Имя, email или телефон..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div></div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Сортировка</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as ['name' | 'email' | 'created_at', 'asc' | 'desc'];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="name-asc">По имени (А-Я)</option>
              <option value="name-desc">По имени (Я-А)</option>
              <option value="email-asc">По email (А-Я)</option>
              <option value="email-desc">По email (Я-А)</option>
              <option value="created_at-desc">Сначала новые</option>
              <option value="created_at-asc">Сначала старые</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleReset}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              🔄 Сбросить
            </button>
          </div>
        </div>
      </div>

      {/* Список клиентов */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        {clients.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchTerm ? 'Клиенты не найдены' : 'У вас пока нет клиентов'}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Контакты
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Telegram
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Создан
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Действия
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{client.name}</div>
                            <div className="text-sm text-gray-500">ID: {client.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{client.email || '—'}</div>
                        <div className="text-sm text-gray-500">{client.phone || '—'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {client.telegram ? (
                          <a
                            href={client.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✈️
                          </a>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(client.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => alert('Просмотр клиента будет добавлен в следующей версии')}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          👁️
                        </button>
                        {canManageClients && (
                          <button
                            onClick={() => alert('Редактирование клиента будет добавлено в следующей версии')}
                            className="text-yellow-600 hover:text-yellow-900 mr-3"
                          >
                            ✏️
                          </button>
                        )}
                        {canDeleteClients && (
                          <button
                            onClick={() => handleDelete(client.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            🗑️
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Назад
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Вперёд
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Страница <span className="font-medium">{page}</span> из{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ‹
                      </button>
                      {[...Array(totalPages)].map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => setPage(i + 1)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === i + 1
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        ›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {loading && clients.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg px-4 py-2">
          Загрузка...
        </div>
      )}
    </div>
  );
};

export default Clients;
