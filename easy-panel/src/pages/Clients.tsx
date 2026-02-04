import React, { useState } from 'react';
import { getCurrentUser } from '../utils/auth';
import { hasPermission } from '../utils/permissions';
import { DEFAULT_ROLES } from '../utils/permissions';

interface Client {
  id: number;
  name: string;
  email: string;
  phone: string;
  telegram: string;
  lastVisit: string;
  totalVisits: number;
  totalSpent: number;
  notes: string;
  payments: Array<{ id: number; service: string; amount: number; date: string; employeeId: number; }>;
  actions: Array<{ id: number; action: string; date: string; by: string }>;
}

const clients: Client[] = [
  {
    id: 1,
    name: 'Анна Петрова',
    email: 'anna.petrova@email.com',
    phone: '+7 (999) 123-45-67',
    telegram: 'https://t.me/annapetrov',
    lastVisit: '2024-01-15',
    totalVisits: 12,
    totalSpent: 45000,
    notes: 'Постоянный клиент, предпочитает утренние часы',
    payments: [
      { id: 1, service: 'Консультация', amount: 2000, date: '2024-01-10', employeeId: 101 },
      { id: 2, service: 'Массаж', amount: 2500, date: '2024-01-12', employeeId: 102 },
      { id: 3, service: 'Консультация', amount: 2000, date: '2024-01-15', employeeId: 101 },
    ],
    actions: [
      { id: 1, action: 'Профиль создан', date: '2023-12-01', by: 'admin' },
      { id: 2, action: 'Изменён телефон', date: '2024-01-05', by: 'admin' },
      { id: 3, action: 'Добавлен платёж', date: '2024-01-10', by: 'employee' },
    ],
  },
  {
    id: 2,
    name: 'Михаил Сидоров',
    email: 'mikhail.sidorov@email.com',
    phone: '+7 (999) 234-56-78',
    telegram: 'https://t.me/mikesidorov',
    lastVisit: '2024-01-10',
    totalVisits: 8,
    totalSpent: 32000,
    notes: 'Интересуется новыми услугами',
    payments: [
      { id: 4, service: 'Массаж', amount: 2500, date: '2024-01-09', employeeId: 102 },
      { id: 5, service: 'Консультация', amount: 2000, date: '2024-01-10', employeeId: 101 },
    ],
    actions: [
      { id: 4, action: 'Профиль создан', date: '2023-12-10', by: 'admin' },
    ],
  },
  {
    id: 3,
    name: 'Елена Козлова',
    email: 'elena.kozlova@email.com',
    phone: '+7 (999) 345-67-89',
    telegram: 'https://t.me/elenakozlova',
    lastVisit: '2023-12-20',
    totalVisits: 5,
    totalSpent: 18000,
    notes: 'Не посещала более месяца',
    payments: [],
    actions: [],
  },
  {
    id: 4,
    name: 'Дмитрий Волков',
    email: 'dmitry.volkov@email.com',
    phone: '+7 (999) 456-78-90',
    telegram: 'https://t.me/dmitryvolkov',
    lastVisit: '2024-01-18',
    totalVisits: 2,
    totalSpent: 8000,
    notes: 'Новый клиент, требует особого внимания',
    payments: [
      { id: 6, service: 'Консультация', amount: 2000, date: '2024-01-18', employeeId: 101 },
    ],
    actions: [
      { id: 5, action: 'Профиль создан', date: '2024-01-18', by: 'admin' },
    ],
  },
  {
    id: 5,
    name: 'Ольга Морозова',
    email: 'olga.morozova@email.com',
    phone: '+7 (999) 567-89-01',
    telegram: 'https://t.me/olgamorozova',
    lastVisit: '2024-01-12',
    totalVisits: 15,
    totalSpent: 55000,
    notes: 'VIP клиент, всегда довольна качеством',
    payments: [
      { id: 7, service: 'Консультация', amount: 2000, date: '2024-01-12', employeeId: 101 },
      { id: 8, service: 'Массаж', amount: 2500, date: '2024-01-12', employeeId: 102 },
      { id: 9, service: 'Консультация', amount: 2000, date: '2024-01-12', employeeId: 101 },
    ],
    actions: [
      { id: 6, action: 'Профиль создан', date: '2024-01-12', by: 'admin' },
    ],
  },
];

const Clients: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [viewClient, setViewClient] = useState<Client | null>(null);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const user = getCurrentUser();
  if (!user) return null;

  const canViewAllClients = hasPermission(user, DEFAULT_ROLES, 'view_all_clients');
  const canManageAllClients = hasPermission(user, DEFAULT_ROLES, 'manage_all_clients');
  const canViewPayments = hasPermission(user, DEFAULT_ROLES, 'view_all_payments');
  const canManageClients = hasPermission(user, DEFAULT_ROLES, 'manage_clients');
  const canDeleteClients = hasPermission(user, DEFAULT_ROLES, 'manage_all_clients');

  const filteredClients = clients
    .filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm);
      // Если нет права на всех — показываем только клиентов, у которых есть сессия с этим сотрудником
      if (!canViewAllClients) {
        return matchesSearch && client.payments.some(p => p.employeeId === user.id);
      }
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'lastVisit':
          return new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime();
        case 'totalVisits':
          return b.totalVisits - a.totalVisits;
        case 'totalSpent':
          return b.totalSpent - a.totalSpent;
        default:
          return 0;
      }
    });

  return (
    <div className="p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Клиенты</h1>
        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2">
          ➕ Добавить клиента
        </button>
      </div>
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
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="name">По имени</option>
              <option value="lastVisit">По последнему визиту</option>
              <option value="totalVisits">По количеству визитов</option>
              <option value="totalSpent">По сумме покупок</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
              🔄 Сбросить
            </button>
          </div>
        </div>
      </div>
      {/* Список клиентов */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Клиент</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Контакты</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telegram</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Последний визит</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Визиты</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сумма</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-semibold mr-3">
                        {client.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.name}</div>
                        <div className="text-sm text-gray-500">ID: {client.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{client.email}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <a href={client.telegram} target="_blank" rel="noopener noreferrer" title="Написать в Telegram" className="text-blue-500 text-2xl hover:text-blue-700">✈️</a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(client.lastVisit).toLocaleDateString('ru-RU')}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.totalVisits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.totalSpent.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-primary hover:text-blue-700" onClick={() => setViewClient(client)}>👁️</button>
                      {canManageClients && (
                        <button className="text-gray-600 hover:text-gray-900" onClick={() => setEditClient(client)}>✏️</button>
                      )}
                      {canDeleteClients && (
                        <button className="text-red-600 hover:text-red-900">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* Модалка просмотра клиента */}
      {viewClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-2xl w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Карточка клиента</h3>
            <div className="mb-4">
              <div className="font-bold text-lg mb-1">{viewClient.name}</div>
              <div className="text-gray-600 mb-1">{viewClient.email} | {viewClient.phone}</div>
              <a href={viewClient.telegram} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Telegram</a>
            </div>
            <div className="mb-4">
              <div className="font-semibold mb-2">История оплат</div>
              <ul className="space-y-1">
                {(canViewPayments
                  ? viewClient.payments
                  : viewClient.payments.filter(p => p.employeeId === user.id)
                ).map(p => (
                  <li key={p.id} className="flex justify-between text-sm">
                    <span>{p.date} — {p.service}</span>
                    <span className="font-semibold">{p.amount.toLocaleString('ru-RU')} ₽</span>
                  </li>
                ))}
                {((!canViewPayments && viewClient.payments.filter(p => p.employeeId === user.id).length === 0) || (canViewPayments && viewClient.payments.length === 0)) && (
                  <li className="text-gray-400">Нет оплат</li>
                )}
              </ul>
            </div>
            {/* История действий — только если есть права на всех клиентов */}
            {canViewAllClients && (
              <div className="mb-4">
                <div className="font-semibold mb-2">История действий</div>
                <ul className="space-y-1">
                  {viewClient.actions.map(a => (
                    <li key={a.id} className="flex justify-between text-sm">
                      <span>{a.date}</span>
                      <span>{a.action} ({a.by})</span>
                    </li>
                  ))}
                  {viewClient.actions.length === 0 && <li className="text-gray-400">Нет действий</li>}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setViewClient(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Модалка редактирования клиента */}
      {editClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-semibold mb-4">Редактировать клиента</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Имя</label>
                <input
                  type="text"
                  value={editClient.name}
                  onChange={e => setEditClient({ ...editClient, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={editClient.email}
                  onChange={e => setEditClient({ ...editClient, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Телефон</label>
                <input
                  type="tel"
                  value={editClient.phone}
                  onChange={e => setEditClient({ ...editClient, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telegram</label>
                <input
                  type="text"
                  value={editClient.telegram}
                  onChange={e => setEditClient({ ...editClient, telegram: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setEditClient(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Отмена
              </button>
              <button
                onClick={() => { setEditClient(null); alert('Изменения сохранены!'); }}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients; 