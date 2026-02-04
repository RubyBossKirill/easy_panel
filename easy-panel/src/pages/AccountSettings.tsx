import React, { useState } from 'react';
import { getCurrentUser } from '../utils/auth';
import { hasPermission } from '../utils/permissions';
import { ALL_PERMISSIONS, DEFAULT_ROLES } from '../utils/permissions';
import { Role, Permission } from '../types';
import { getPermissionLabel, PERMISSION_LABELS } from '../utils/permissions';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';

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

const initialUsers = [
  { id: 1, name: 'Иван Иванов', roleId: 'owner', email: 'ivan@company.com' },
  { id: 2, name: 'Анна Петрова', roleId: 'admin', email: 'anna@company.com' },
  { id: 3, name: 'Михаил Сидоров', roleId: 'employee', email: 'mike@company.com' },
];

const AccountSettings: React.FC = () => {
  const user = getCurrentUser();
  const [projectName, setProjectName] = useState('Easy Panel');
  const [users, setUsers] = useState(initialUsers);
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [newUser, setNewUser] = useState({ name: '', email: '', roleId: 'employee' });
  const [newRole, setNewRole] = useState({ name: '', permissions: [] as Permission[] });
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editingRoleName, setEditingRoleName] = useState('');
  const [activeTab, setActiveTab] = useState('project');
  const [editRoleModal, setEditRoleModal] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [newRoleModal, setNewRoleModal] = useState(false);

  const canManageAccount = hasPermission(user, DEFAULT_ROLES, 'manage_account_settings');
  if (!canManageAccount) {
    return <div className="p-8 text-red-600 font-bold text-center text-xl">Нет доступа к настройкам аккаунта</div>;
  }

  const handleRoleChange = (id: number, roleId: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, roleId } : u));
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;
    setUsers([...users, { ...newUser, id: Date.now() }]);
    setNewUser({ name: '', email: '', roleId: 'employee' });
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
    setUsers(users.map(u => u.roleId === roleId ? { ...u, roleId: 'employee' } : u));
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
          <table className="w-full mb-4 rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Имя</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Email</th>
                <th className="text-left text-xs text-gray-500 uppercase px-4 py-2">Роль</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const isOwner = roles.find(r => r.id === user.roleId)?.isOwner;
                return (
                  <tr key={user.id} className={
                    `${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} ${isOwner ? 'bg-blue-50' : ''}`
                  }>
                    <td className="px-4 py-3 align-middle text-base">{user.name}</td>
                    <td className="px-4 py-3 align-middle text-base">{user.email}</td>
                    <td className="px-4 py-3 align-middle">
                      <div className="relative">
                        <select
                          value={user.roleId}
                          onChange={e => handleRoleChange(user.id, e.target.value)}
                          className={`appearance-none w-full px-4 py-2 pr-8 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all min-w-[140px] bg-white text-base ${isOwner ? 'bg-blue-100 text-blue-700 cursor-not-allowed' : 'hover:border-blue-400'}`}
                          disabled={isOwner}
                          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em' }}
                        >
                          {roles.map(role => (
                            <option key={role.id} value={role.id}>{ROLE_LABELS[role.id] || role.name}</option>
                          ))}
                        </select>
                      </div>
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
            <select
              value={newUser.roleId}
              onChange={e => setNewUser({ ...newUser, roleId: e.target.value })}
              className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-base min-w-[140px] bg-white hover:border-blue-400"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'16\' height=\'16\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M4 6l4 4 4-4\' stroke=\'%236B7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1.25em 1.25em' }}
            >
              {roles.filter(r => !r.isOwner).map(role => (
                <option key={role.id} value={role.id}>{ROLE_LABELS[role.id] || role.name}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-blue-700 transition min-w-[120px] text-base shadow-sm"
            >
              Добавить
            </button>
          </form>
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