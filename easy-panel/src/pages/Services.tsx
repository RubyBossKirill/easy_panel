import React, { useState, useEffect } from 'react';
import { servicesService } from '../services/servicesService';
import { Service, CreateServiceData } from '../types/service';
import { User } from '../types';
import { usersService } from '../services/usersService';
import { toast } from 'react-hot-toast';
import { getCurrentUser } from '../utils/auth';

const Services: React.FC = () => {
  const user = getCurrentUser();
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  const [formData, setFormData] = useState<CreateServiceData>({
    name: '',
    description: '',
    price: 0,
    duration: 60,
    is_active: true,
  });

  const canManageSchedule = user?.role?.permissions?.includes('manage_schedule');

  useEffect(() => {
    loadData();
  }, []);

  if (!user) return null;

  if (!canManageSchedule) {
    return <div className="p-8 text-red-600 font-bold text-center text-xl">Нет доступа к услугам</div>;
  }

  const loadData = async () => {
    setLoading(true);
    try {
      const [servicesData, usersResponse] = await Promise.all([
        servicesService.getAll(),
        usersService.getUsers(),
      ]);
      setServices(servicesData || []);

      // Extract users from response
      const usersData = usersResponse?.data?.users || [];
      setEmployees(usersData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormData({
        name: service.name,
        description: service.description,
        employee_id: service.employee_id,
        price: parseFloat(service.price),
        duration: service.duration,
        is_active: service.is_active,
      });
    } else {
      setEditingService(null);
      setFormData({
        name: '',
        description: '',
        price: 0,
        duration: 60,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({
      name: '',
      description: '',
      price: 0,
      duration: 60,
      is_active: true,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.price || !formData.duration) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    console.log('Submitting formData:', formData);

    try {
      if (editingService) {
        await servicesService.update(editingService.id, formData);
        toast.success('Услуга обновлена');
      } else {
        await servicesService.create(formData);
        toast.success('Услуга создана');
      }
      handleCloseModal();
      loadData();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.response?.data?.errors?.join(', ') || 'Ошибка сохранения услуги');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Удалить эту услугу?')) return;

    try {
      await servicesService.delete(id);
      toast.success('Услуга удалена');
      loadData();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Ошибка удаления услуги');
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await servicesService.update(service.id, { is_active: !service.is_active });
      toast.success(service.is_active ? 'Услуга деактивирована' : 'Услуга активирована');
      loadData();
    } catch (error) {
      console.error('Error toggling service:', error);
      toast.error('Ошибка изменения статуса');
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Услуги</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Добавить услугу
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Загрузка...</p>
      ) : services.length === 0 ? (
        <p className="text-gray-500">Нет услуг. Добавьте первую услугу.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => (
            <div
              key={service.id}
              className={`bg-white rounded-lg shadow p-6 ${
                !service.is_active ? 'opacity-60' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{service.name}</h3>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    service.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {service.is_active ? 'Активна' : 'Неактивна'}
                </span>
              </div>

              <p className="text-gray-600 text-sm mb-4">{service.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Специалист:</span>
                  <span className="font-medium">{service.employee?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Цена:</span>
                  <span className="font-medium">{parseFloat(service.price).toLocaleString('ru-RU')} ₽</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Длительность:</span>
                  <span className="font-medium">{service.duration} мин</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(service)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Редактировать
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingService ? 'Редактировать услугу' : 'Добавить услугу'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  placeholder="Индивидуальная консультация"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border rounded px-3 py-2"
                  rows={3}
                  placeholder="Краткое описание услуги"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Специалист</label>
                <select
                  value={formData.employee_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employee_id: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="">Текущий пользователь</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Цена (₽) *</label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="0"
                  step="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Длительность (мин) *</label>
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                  className="w-full border rounded px-3 py-2"
                  min="5"
                  step="5"
                />
              </div>

              {/* Toggle Switch для активности */}
              <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                <div className="flex flex-col">
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Статус услуги
                  </label>
                  <span className="text-xs text-gray-500 mt-0.5">
                    {formData.is_active ? 'Услуга доступна для записи' : 'Услуга недоступна для записи'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.is_active ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formData.is_active ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3 mt-6">
              {/* Основные действия */}
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  {editingService ? 'Сохранить' : 'Создать'}
                </button>
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  Отмена
                </button>
              </div>

              {/* Дополнительные действия (только при редактировании) */}
              {editingService && (
                <div className="pt-3 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleCloseModal();
                      handleDelete(editingService.id);
                    }}
                    className="w-full px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 rounded text-sm font-medium"
                  >
                    Удалить услугу
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Services;
