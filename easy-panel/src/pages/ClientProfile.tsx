import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clientsService } from '../services/clientsService';
import { appointmentsService } from '../services/appointmentsService';
import { paymentsService } from '../services/paymentsService';
import { Client } from '../types/client';
import { Appointment } from '../types/appointment';
import { Payment } from '../types/payment';
import toast from 'react-hot-toast';

const statusLabels: Record<string, string> = {
  completed: 'Состоялась',
  cancelled: 'Не состоялась',
};
const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};
const paymentStatusLabels: Record<string, string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  cancelled: 'Отменён',
  failed: 'Ошибка',
};
const paymentStatusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  failed: 'bg-gray-100 text-gray-800',
};

const ClientProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'appointments' | 'payments'>('info');

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    telegram: '',
    notes: '',
  });

  useEffect(() => {
    if (!id) return;
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [clientData, apptData, payData] = await Promise.all([
        clientsService.getClient(Number(id)),
        appointmentsService.getAll({ client_id: Number(id) }),
        paymentsService.getAll({ client_id: Number(id) }),
      ]);

      setClient(clientData);
      setForm({
        name: clientData.name || '',
        email: clientData.email || '',
        phone: clientData.phone || '',
        telegram: clientData.telegram || '',
        notes: clientData.notes || '',
      });
      setAppointments(apptData);
      setPayments(payData.payments);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка загрузки данных клиента');
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      const updated = await clientsService.updateClient(client.id, form);
      setClient(updated);
      setIsEditing(false);
      toast.success('Профиль клиента сохранён');
    } catch (err: any) {
      toast.error(err.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (!client) return;
    setForm({
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      telegram: client.telegram || '',
      notes: client.notes || '',
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-gray-500">Загрузка...</div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate('/clients')} className="mb-4 text-primary hover:underline text-sm">
        ← Назад к клиентам
      </button>

      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            {client.email && <p className="text-gray-500 text-sm mt-1">{client.email}</p>}
          </div>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
            >
              Редактировать
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
              >
                Отмена
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition text-sm disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          )}
        </div>

        {/* Вкладки */}
        <div className="flex border-b mb-6">
          {(['info', 'appointments', 'payments'] as const).map((tab) => {
            const labels = { info: 'Информация', appointments: `Записи (${appointments.length})`, payments: `Платежи (${payments.length})` };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 -mb-px font-medium border-b-2 transition-colors text-sm ${
                  activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-primary'
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Информация */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
              <input
                type="tel"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telegram</label>
              <input
                type="text"
                value={form.telegram}
                onChange={e => setForm({ ...form, telegram: e.target.value })}
                disabled={!isEditing}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Заметки</label>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                disabled={!isEditing}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* Записи */}
        {activeTab === 'appointments' && (
          <div>
            {appointments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Записей нет</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium">{appt.date}</span>
                      <span className="text-gray-500 ml-2">в {appt.time}</span>
                      {appt.service && <span className="text-gray-500 ml-2">— {appt.service.name}</span>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${appt.status ? statusColors[appt.status] || 'bg-blue-100 text-blue-800' : 'bg-blue-100 text-blue-800'}`}>
                      {appt.status ? statusLabels[appt.status] || appt.status : 'Запланирована'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Платежи */}
        {activeTab === 'payments' && (
          <div>
            {payments.length === 0 ? (
              <p className="text-gray-500 text-sm py-4">Платежей нет</p>
            ) : (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                    <div>
                      <span className="font-medium">{parseFloat(payment.amount).toLocaleString('ru-RU')} ₽</span>
                      {payment.service && <span className="text-gray-500 ml-2">— {payment.service.name}</span>}
                      <span className="text-gray-400 ml-2 text-xs">{new Date(payment.created_at).toLocaleDateString('ru-RU')}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${paymentStatusColors[payment.status] || ''}`}>
                      {paymentStatusLabels[payment.status] || payment.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientProfile;
