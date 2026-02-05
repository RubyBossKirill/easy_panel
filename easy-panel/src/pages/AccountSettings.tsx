import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../utils/auth';
import { hasPermission } from '../utils/permissions';
import { ALL_PERMISSIONS, DEFAULT_ROLES } from '../utils/permissions';
import { Role, Permission } from '../types';
import { getPermissionLabel } from '../utils/permissions';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { usersService } from '../services/usersService';
import { User } from '../types';

const ROLE_LABELS: Record<string, string> = {
  owner: 'Владелец',
  admin: 'Администратор',
  employee: 'Сотрудник',
};

const TABS = [
  { id: 'project', label: 'Название проекта' },
  { id: 'users', label: 'Пользователи и роли' },
  { id: 'roles', label: 'Роли и права' },
];

const AccountSettings: React.FC = () => {
  const user = getCurrentUser();
  const [projectName, setProjectName] = useState('Easy Panel');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '12345678', password_confirmation: '12345678', role_id: 12, phone: '', telegram: '' });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as Permission[] });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [editingRoleName, setEditingRoleName] = useState('');
  const [activeTab, setActiveTab] = useState('project');
  const [editRoleModal, setEditRoleModal] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [newRoleModal, setNewRoleModal] = useState(false);

  // Загрузка пользователей
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await usersService.getUsers();
      setUsers(response.data.users);

      // Собрать уникальные роли из загруженных пользователей
      const uniqueRoles = response.data.users
        .map(u => u.role)
        .filter((role, index, self) =>
          role && self.findIndex(r => r?.id === role.id) === index
        ) as Role[];

      if (uniqueRoles.length > 0) {
        setRoles(uniqueRoles);

        // Установить дефолтную роль для нового пользователя (первая не-owner роль)
        const defaultRole = uniqueRoles.find(r => !r.isOwner && !r.is_owner);
        if (defaultRole) {
          setNewUser(prev => ({ ...prev, role_id: Number(defaultRole.id) }));
        }
      }
    } catch (err: any) {
      console.error('Failed to load users:', err);
      setError(err.response?.data?.error || 'Не удалось загрузить пользователей');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const canManageAccount = hasPermission(user, DEFAULT_ROLES, 'manage_account_settings');
  if (!canManageAccount) {
    return <div className="p-8 text-red-600 font-bold text-center text-xl">Нет доступа к настройкам аккаунта</div>;
  }

  const handleRoleChange = async (id: number, newRoleId: number) => {
    try {
      await usersService.updateUser(id, { role_id: newRoleId });
      loadUsers(); // Перезагрузить список
    } catch (err: any) {
      alert(err.response?.data?.error || 'Не удалось изменить роль');
    }
  };

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) {
      alert('Заполните имя и email');
      return;
    }
    try {
      await usersService.createUser(newUser);
      alert('Пользователь успешно создан');
      setNewUser({ name: '', email: '', password: '12345678', password_confirmation: '12345678', role_id: 3, phone: '', telegram: '' });
      loadUsers(); // Перезагрузить список
    } catch (err: any) {
      alert(err.response?.data?.error || 'Не удалось создать пользователя');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    try {
      await usersService.deleteUser(id);
      alert('Пользователь успешно удалён');
      loadUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Не удалось удалить пользователя');
    }
  };

  const handleAddRole = () => {
    if (!newRole.name.trim()) return;
    setRoles([...roles, {
      id: Date.now().toString(),
      name: newRole.name,
      permissions: newRole.permissions,
    }]);
    setNewRole({ name: '', permissions: [] });
  };

  const handlePermissionToggle = (roleId: string, perm: Permission) => {
    setRoles(roles.map(role =>
      role.id === roleId
        ? { ...role, permissions: role.permissions.includes(perm)
            ? role.permissions.filter(p => p !== perm)
            : [...role.permissions, perm] }
        : role
    ));
  };

  const handleDeleteRole = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
    // Заглушка: backend для управления ролями пока не реализован
  };

  const handleEditRoleName = (roleId: string, name: string) => {
    setRoles(roles.map(r => r.id === roleId ? { ...r, name } : r));
    setEditingRoleId(null);
    setEditingRoleName('');
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Настройки аккаунта</h1>
      {/* Tabs */}
      <div className="flex border-b mb-8">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 -mb-px font-medium border-b-2 transition-colors duration-200 focus:outline-none ${
              activeTab === tab.id
                ? 'border-primary text-primary bg-white'
                : 'border-transparent text-gray-500 hover:text-primary hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab content */}
      {activeTab === 'project' && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">Название проекта</label>
          <input
            type="text"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
          />
        </div>
      )}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Пользователи и роли</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-gray-500">Загрузка пользователей...</div>
            </div>
          ) : (
            <>
              <table className="w-full mb-4 rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Имя</th>
                    <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Email</th>
                    <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Телефон</th>
                    <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Роль</th>
                    <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u, idx) => {
                    if (!u.role) return null; // Skip if role is undefined
                    // Проверяем is_owner только из API (u.role.is_owner), игнорируя state roles
                    const isOwner = u.role?.is_owner === true;
                    return (
                      <tr key={u.id} className={
                        `${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${isOwner ? 'bg-blue-50' : ''}`
                      }>
                        <td className="px-4 py-3 align-middle text-base">{u.name}</td>
                        <td className="px-4 py-3 align-middle text-base">{u.email}</td>
                        <td className="px-4 py-3 align-middle text-base">{u.phone || '—'}</td>
                        <td className="px-4 py-3 align-middle">
                          <div className="relative">
                            <select
                              value={u.role!.id}
                              onChange={e => handleRoleChange(u.id, Number(e.target.value))}
                              className={`appearance-none w-full px-4 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-w-[140px] bg-white text-base ${isOwner ? 'bg-blue-100 text-blue-700 cursor-not-allowed' : 'hover:border-blue-400'}`}
                              disabled={isOwner}
                              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em' }}
                            >
                              {isOwner ? (
                                <option key={u.role!.id} value={u.role!.id}>{u.role!.name}</option>
                              ) : (
                                roles.filter(r => !r.isOwner && !r.is_owner).map(role => (
                                  <option key={role.id} value={role.id}>{role.name}</option>
                                ))
                              )}
                            </select>
                          </div>
                        </td>
                        <td className="px-4 py-3 align-middle">
                          {!isOwner && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Удалить пользователя"
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <form className="flex flex-wrap gap-2 items-center mt-4" onSubmit={e => { e.preventDefault(); handleAddUser(); }}>
                <input
                  type="text"
                  placeholder="Имя"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base flex-1 min-w-[120px]"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base flex-1 min-w-[160px]"
                />
                <input
                  type="tel"
                  placeholder="Телефон"
                  value={newUser.phone}
                  onChange={e => setNewUser({ ...newUser, phone: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base flex-1 min-w-[120px]"
                />
                <select
                  value={newUser.role_id}
                  onChange={e => setNewUser({ ...newUser, role_id: Number(e.target.value) })}
                  className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base min-w-[140px] bg-white hover:border-blue-400"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em' }}
                >
                  {roles.filter(r => !r.isOwner && !r.is_owner).map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition min-w-[120px] text-base shadow-sm"
                >
                  Добавить
                </button>
              </form>
            </>
          )}
        </div>
      )}
      {activeTab === 'roles' && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-xl p-8 mb-8 transition-all">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Роли и права</h2>
            <button
              className="px-5 py-2 bg-primary text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition text-base"
              onClick={() => setNewRoleModal(true)}
            >
              + Добавить роль
            </button>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {roles.map(role => (
              <div key={role.id} className={`rounded-xl p-5 shadow border-2 flex flex-col gap-2 transition-all ${role.isOwner ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-primary'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-bold text-lg ${role.isOwner ? 'text-blue-700' : ''}`}>{ROLE_LABELS[role.id] || role.name}</span>
                  {role.isOwner && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Владелец</span>}
                </div>
                <div className="text-gray-700 text-sm mb-2">
                  {role.isOwner
                    ? 'Все права включены'
                    : `${role.permissions.length} из ${ALL_PERMISSIONS.length} прав включено`}
                </div>
                {!role.isOwner && (
                  <button
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition w-fit text-sm"
                    onClick={() => setEditRoleModal({ open: true, role })}
                  >
                    Редактировать
                  </button>
                )}
              </div>
            ))}
          </div>
          {/* Модалка создания новой роли */}
          <Transition.Root show={!!newRoleModal} as={Fragment}>
            <Dialog as="div" className="fixed z-50 inset-0 overflow-y-auto" onClose={() => setNewRoleModal(false)}>
              <div className="flex items-center justify-center min-h-screen px-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                  leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
                </Transition.Child>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                >
                  <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto p-8 z-10">
                    <Dialog.Title className="text-xl font-bold mb-4">Создать новую роль</Dialog.Title>
                    <input
                      type="text"
                      placeholder="Название роли"
                      value={newRole.name}
                      onChange={e => setNewRole({ ...newRole, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                    />
                    <div className="mb-6">
                      <div className="font-medium mb-2">Права:</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {ALL_PERMISSIONS.map(perm => (
                          <label key={perm} className="flex items-center gap-2 text-base">
                            <input
                              type="checkbox"
                              checked={newRole.permissions.includes(perm)}
                              onChange={() => {
                                setNewRole({
                                  ...newRole,
                                  permissions: newRole.permissions.includes(perm)
                                    ? newRole.permissions.filter(p => p !== perm)
                                    : [...newRole.permissions, perm],
                                });
                              }}
                            />
                            {getPermissionLabel(perm)}
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setNewRoleModal(false)}
                      >
                        Отмена
                      </button>
                      <button
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
                        onClick={() => {
                          if (!newRole.name.trim()) return;
                          setRoles([...roles, {
                            id: Date.now().toString(),
                            name: newRole.name,
                            permissions: newRole.permissions,
                          }]);
                          setNewRole({ name: '', permissions: [] });
                          setNewRoleModal(false);
                        }}
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition.Root>
          {/* Модалка редактирования прав роли */}
          <Transition.Root show={editRoleModal.open} as={Fragment}>
            <Dialog as="div" className="fixed z-50 inset-0 overflow-y-auto" onClose={() => setEditRoleModal({ open: false, role: null })}>
              <div className="flex items-center justify-center min-h-screen px-4">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100"
                  leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0"
                >
                  <div className="fixed inset-0 bg-black bg-opacity-30 transition-opacity" />
                </Transition.Child>
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100"
                  leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95"
                >
                  <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full mx-auto p-8 z-10">
                    <Dialog.Title className="text-xl font-bold mb-4">Права для роли: {editRoleModal.role?.name}</Dialog.Title>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                      {ALL_PERMISSIONS.map(perm => (
                        <label key={perm} className="flex items-center gap-2 text-base">
                          <input
                            type="checkbox"
                            checked={editRoleModal.role?.permissions.includes(perm) || false}
                            onChange={() => {
                              if (!editRoleModal.role) return;
                              const updated = editRoleModal.role.permissions.includes(perm)
                                ? editRoleModal.role.permissions.filter(p => p !== perm)
                                : [...editRoleModal.role.permissions, perm];
                              setEditRoleModal({
                                open: true,
                                role: { ...editRoleModal.role, permissions: updated },
                              });
                            }}
                          />
                          {getPermissionLabel(perm)}
                        </label>
                      ))}
                    </div>
                    <div className="flex justify-end gap-3">
                      <button
                        className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setEditRoleModal({ open: false, role: null })}
                      >
                        Отмена
                      </button>
                      <button
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition"
                        onClick={() => {
                          if (!editRoleModal.role) return;
                          setRoles(roles.map(r => r.id === editRoleModal.role!.id ? { ...r, permissions: editRoleModal.role!.permissions } : r));
                          setEditRoleModal({ open: false, role: null });
                        }}
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>
                </Transition.Child>
              </div>
            </Dialog>
          </Transition.Root>
        </div>
      )}
    </div>
  );
};

export default AccountSettings; 