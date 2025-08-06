import React, { useState, useEffect, useMemo } from 'react';
import { getAllUsers, deleteUser, createUser, updateUserRole, getProfile } from '../services/authService';
import type { User } from '../types';
import { Trash2, User as UserIcon, Users as UsersIcon, BarChart3, ShieldCheck, Mail, Calendar, Loader, PlusCircle, ShieldPlus, Search, ShieldMinus } from 'lucide-react';
import UserFormModal from '../components/UserFormModal';
import ConfirmationModal from '../components/ConfirmationModal';
import StatisticsDashboard from '../components/StatisticsDashboard';
import UserDetailsModal from '../components/UserDetailsModal';

const AdminPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  
  // State for modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isConfirmPromoteOpen, setIsConfirmPromoteOpen] = useState(false);
  const [isConfirmDemoteOpen, setIsConfirmDemoteOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  
  const [userToAction, setUserToAction] = useState<User | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'admins' | 'stats'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
        try {
            const profile = await getProfile();
            setCurrentUser(profile);
        } catch (err) {
            console.error("Failed to fetch admin profile", err);
            setError('Could not load your profile data. Some actions might be disabled.');
        }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'admins') {
        fetchUsers();
    }
  }, [activeTab]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000); // Hide after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [success]);

  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
        return users;
    }
    const lowercasedTerm = searchTerm.toLowerCase();
    return users.filter(user =>
        user.username.toLowerCase().includes(lowercasedTerm) ||
        user.email.toLowerCase().includes(lowercasedTerm) ||
        user.fullName.toLowerCase().includes(lowercasedTerm)
    );
  }, [users, searchTerm]);

  const nonAdminUsers = useMemo(() => filteredUsers.filter(u => !u.isAdmin), [filteredUsers]);
  const adminUsers = useMemo(() => filteredUsers.filter(u => u.isAdmin), [filteredUsers]);

  const handleViewUser = (user: User) => {
    setSelectedUser(user);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setUserToAction(user);
    setIsConfirmDeleteOpen(true);
  };

  const handlePromoteClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setUserToAction(user);
    setIsConfirmPromoteOpen(true);
  };

  const handleDemoteClick = (e: React.MouseEvent, user: User) => {
    e.stopPropagation();
    setUserToAction(user);
    setIsConfirmDemoteOpen(true);
  };
  
  const handleConfirmDelete = async () => {
    if (!userToAction) return;
    try {
      await deleteUser(userToAction.id);
      setUsers(users.filter(user => user.id !== userToAction.id));
      setSuccess(`User "${userToAction.username}" has been deleted.`);
      setError('');
    } catch (err) {
      setSuccess('');
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsConfirmDeleteOpen(false);
      setUserToAction(null);
    }
  };
  
  const handleConfirmPromote = async () => {
    if (!userToAction) return;
    try {
      await updateUserRole(userToAction.id, true);
      setSuccess(`User "${userToAction.username}" has been promoted to Admin.`);
      setError('');
      await fetchUsers(); // Refresh list to show new role
    } catch (err) {
        setSuccess('');
        setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
        setIsConfirmPromoteOpen(false);
        setUserToAction(null);
    }
  };

  const handleConfirmDemote = async () => {
    if (!userToAction) return;
    try {
      await updateUserRole(userToAction.id, false); // Demote to User
      setSuccess(`User "${userToAction.username}" has been demoted to User.`);
      setError('');
      await fetchUsers(); // Refresh list to update roles
    } catch (err) {
      setSuccess('');
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsConfirmDemoteOpen(false);
      setUserToAction(null);
    }
  };

  const handleCreateUser = async (userData: Omit<User, 'id' | 'createdAt'> & { password?: string }) => {
    try {
      await createUser(userData);
      setSuccess(`User "${userData.username}" created successfully.`);
      setError('');
      setIsCreateModalOpen(false);
      await fetchUsers(); // Refresh the user list
    } catch (err) {
      console.error("Failed to create user from Admin Page:", err);
      // Re-throw the error so the modal can display it
      throw err;
    }
  };

  const renderTable = (userList: User[], isAdmins: boolean) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-auto border border-gray-200 dark:border-gray-700" style={{maxHeight: '60vh'}}>
      <table className="w-full text-left min-w-max">
        <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
          <tr>
            <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">User</th>
            <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Email</th>
            <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Date of Birth</th>
            <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Gender</th>
            <th className="p-4 font-semibold text-gray-600 dark:text-gray-400">Role</th>
            <th className="p-4 font-semibold text-gray-600 dark:text-gray-400 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {isLoading ? (
            <tr>
              <td colSpan={6} className="text-center p-8">
                <div className="flex justify-center items-center text-gray-600 dark:text-gray-400">
                  <Loader className="animate-spin mr-2" /> Loading...
                </div>
              </td>
            </tr>
          ) : userList.map(user => (
            <tr key={user.id} onClick={() => handleViewUser(user)} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
              <td className="p-4 text-gray-900 dark:text-gray-100">
                  <div className="flex items-center">
                      {user.isAdmin ? <ShieldCheck className="h-5 w-5 mr-3 text-green-500 flex-shrink-0" /> : <UserIcon className="h-5 w-5 mr-3 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />}
                      <div>
                          <div className="font-semibold">{user.fullName}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</div>
                      </div>
                  </div>
              </td>
              <td className="p-4 text-gray-900 dark:text-gray-100">
                  <div className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                  </div>
              </td>
              <td className="p-4 text-gray-900 dark:text-gray-100">
                  <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {user.dob}
                  </div>
              </td>
                <td className="p-4 capitalize text-gray-900 dark:text-gray-100">
                {user.gender}
              </td>
              <td className="p-4">
                {user.isAdmin ? (
                  <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50 rounded-full">Admin</span>
                ) : (
                  <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 rounded-full">User</span>
                )}
              </td>
              <td className="p-4 text-right">
                {isAdmins ? (
                    currentUser && user.id !== currentUser.id && (
                      <div className="flex items-center justify-end space-x-2">
                        <button onClick={(e) => handleDemoteClick(e, user)} className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300 transition-colors p-2 rounded-full hover:bg-orange-100 dark:hover:bg-orange-500/20" aria-label={`Demote user ${user.username}`}>
                            <ShieldMinus size={20} />
                        </button>
                      </div>
                    )
                ) : (
                    <div className="flex items-center justify-end space-x-2">
                        <button onClick={(e) => handlePromoteClick(e, user)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors p-2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20" aria-label={`Promote user ${user.username}`}>
                            <ShieldPlus size={20} />
                        </button>
                        <button onClick={(e) => handleDeleteClick(e, user)} className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-500/20" aria-label={`Delete user ${user.username}`}>
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <>
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Admin Panel</h1>
            {(activeTab === 'users' || activeTab === 'admins') && (
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
                >
                    <PlusCircle className="w-5 h-5 mr-2" />
                    Create User
                </button>
            )}
        </div>
        
        {/* Tab Navigation */}
        <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('users')} className={`${ activeTab === 'users' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center transition-colors focus:outline-none`}>
                      <UsersIcon className="w-5 h-5 mr-2" />
                    User Management
                </button>
                 <button onClick={() => setActiveTab('admins')} className={`${ activeTab === 'admins' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center transition-colors focus:outline-none`}>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                    Admin Management
                </button>
                <button onClick={() => setActiveTab('stats')} className={`${ activeTab === 'stats' ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center transition-colors focus:outline-none`}>
                      <BarChart3 className="w-5 h-5 mr-2" />
                    Statistics
                </button>
            </nav>
        </div>

        {/* Tab Content */}
        <div>
            {(activeTab === 'users' || activeTab === 'admins') && (
                <div className="space-y-4">
                    {error && <p className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 p-3 rounded-md">{error}</p>}
                    {success && <p className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 p-3 rounded-md cursor-pointer" onClick={() => setSuccess('')}>{success}</p>}

                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by username, email, or full name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>
            )}
            
            <div className="mt-4">
                {activeTab === 'users' && renderTable(nonAdminUsers, false)}
                {activeTab === 'admins' && renderTable(adminUsers, true)}
                {activeTab === 'stats' && <StatisticsDashboard />}
            </div>
        </div>
      </div>
      
      {/* Modals */}
      <UserDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} user={selectedUser} />
      <UserFormModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateUser} />
      <ConfirmationModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => setIsConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Deletion"
        message={`Are you sure you want to delete the user "${userToAction?.username}"? This action cannot be undone.`}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
      />
      <ConfirmationModal
        isOpen={isConfirmPromoteOpen}
        onClose={() => setIsConfirmPromoteOpen(false)}
        onConfirm={handleConfirmPromote}
        title="Confirm Promotion"
        message={`Are you sure you want to promote the user "${userToAction?.username}" to an Administrator?`}
        confirmButtonText="Promote to Admin"
        confirmButtonVariant="primary"
      />
      <ConfirmationModal
        isOpen={isConfirmDemoteOpen}
        onClose={() => setIsConfirmDemoteOpen(false)}
        onConfirm={handleConfirmDemote}
        title="Confirm Demotion"
        message={`Are you sure you want to demote the admin "${userToAction?.username}" to a regular User? They will lose all administrator privileges.`}
        confirmButtonText="Demote"
        confirmButtonVariant="danger"
      />
    </>
  );
};

export default AdminPage;