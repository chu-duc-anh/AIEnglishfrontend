import React from 'react';
import type { User } from '../types';
import { X, User as UserIcon, Mail, Calendar, ShieldCheck, UserCheck, Users as UsersIcon } from 'lucide-react';

interface UserDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

const InfoRow: React.FC<{ icon: React.FC<any>; label: string; value: React.ReactNode; }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start py-3">
        <Icon className="h-5 w-5 mr-4 mt-1 text-gray-400 flex-shrink-0" />
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            <p className="text-base font-medium text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    </div>
);


const UserDetailsModal: React.FC<UserDetailsModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4 animate-fade-in" 
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
        <style>{`.animate-fade-in { animation: fadeIn 0.3s ease-in-out; } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
      <div 
        className="bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-md relative" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        
        <div className="flex items-center mb-6">
            {user.isAdmin ? (
                <ShieldCheck className="h-10 w-10 mr-4 text-green-500" />
            ) : (
                <UserIcon className="h-10 w-10 mr-4 text-indigo-500" />
            )}
            <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{user.fullName}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">@{user.username}</p>
            </div>
        </div>

        <div className="space-y-2 divide-y divide-gray-200 dark:divide-gray-700">
            <InfoRow icon={UserIcon} label="Full Name" value={user.fullName} />
            <InfoRow icon={Mail} label="Email Address" value={<a href={`mailto:${user.email}`} className="text-indigo-600 dark:text-indigo-400 hover:underline">{user.email}</a>} />
            <InfoRow icon={Calendar} label="Date of Birth" value={user.dob} />
            <InfoRow icon={UsersIcon} label="Gender" value={<span className="capitalize">{user.gender}</span>} />
            <InfoRow 
                icon={user.isAdmin ? ShieldCheck : UserCheck} 
                label="Role" 
                value={
                    user.isAdmin ? (
                        <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 dark:text-green-200 dark:bg-green-900/50 rounded-full">Admin</span>
                    ) : (
                        <span className="px-2 py-1 text-xs font-semibold text-blue-800 bg-blue-100 dark:text-blue-200 dark:bg-blue-900/50 rounded-full">User</span>
                    )
                } 
            />
            <InfoRow icon={Calendar} label="Joined On" value={new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })} />
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-6 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailsModal;
