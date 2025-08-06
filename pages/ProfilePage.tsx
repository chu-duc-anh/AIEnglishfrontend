import React, { useState, useEffect } from 'react';
import type { User } from '../types';
import { updateProfile, changePassword } from '../services/authService';
import { User as UserIcon, Calendar, Key, Edit3, Save, X, Shield, Users } from 'lucide-react';

interface ProfilePageProps {
  currentUser: User;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ currentUser }) => {
  // State for personal info form
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: currentUser.fullName,
    dob: currentUser.dob,
    gender: currentUser.gender,
  });

  // State for password change form
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // General state
  const [loading, setLoading] = useState<'profile' | 'password' | null>(null);
  const [error, setError] = useState<{ field: 'profile' | 'password'; message: string } | null>(null);
  const [success, setSuccess] = useState<{ field: 'profile' | 'password'; message: string } | null>(null);

  // Update form if currentUser changes (e.g., after successful update)
  useEffect(() => {
    setFormData({
      fullName: currentUser.fullName,
      dob: currentUser.dob,
      gender: currentUser.gender,
    });
  }, [currentUser]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // If canceling, revert to original data
      setFormData({
        fullName: currentUser.fullName,
        dob: currentUser.dob,
        gender: currentUser.gender,
      });
      setError(null);
    }
    setIsEditing(!isEditing);
  };
  
  const handleProfileSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading('profile');
      setError(null);
      setSuccess(null);
      try {
          await updateProfile(formData);
          setSuccess({ field: 'profile', message: 'Profile updated successfully!' });
          setIsEditing(false);
      } catch (err) {
          setError({ field: 'profile', message: err instanceof Error ? err.message : 'Failed to update profile.' });
      } finally {
          setLoading(null);
      }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError({ field: 'password', message: 'New passwords do not match.' });
      return;
    }
    setLoading('password');
    setError(null);
    setSuccess(null);
    try {
        await changePassword(passwordData.currentPassword, passwordData.newPassword);
        setSuccess({ field: 'password', message: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); // Clear fields
    } catch (err) {
        setError({ field: 'password', message: err instanceof Error ? err.message : 'Failed to change password.' });
    } finally {
        setLoading(null);
    }
  };
  
  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="py-3">
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <p className="text-gray-900 dark:text-gray-100 mt-1">{value}</p>
    </div>
  );


  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">My Profile</h1>
      
        {/* Personal Information Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Personal Information</h2>
                <button
                    onClick={handleEditToggle}
                    className="flex items-center text-sm font-semibold py-2 px-4 rounded-lg transition-colors bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200"
                >
                    {isEditing ? <X className="w-4 h-4 mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
            </div>
            
            <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Always visible info */}
                <div className="md:col-span-1"><InfoRow label="Username" value={currentUser.username} /></div>
                <div className="md:col-span-1"><InfoRow label="Email Address" value={currentUser.email} /></div>
                
                {/* Editable fields */}
                <div>
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                    {isEditing ? (
                        <input id="fullName" name="fullName" type="text" value={formData.fullName} onChange={handleInputChange} className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500" />
                    ) : <p className="text-gray-900 dark:text-gray-100 mt-1">{formData.fullName}</p>}
                </div>
                 <div>
                    <label htmlFor="dob" className="text-sm font-medium text-gray-500 dark:text-gray-400">Date of Birth</label>
                    {isEditing ? (
                        <input id="dob" name="dob" type="date" value={formData.dob} onChange={handleInputChange} className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500" />
                    ) : <p className="text-gray-900 dark:text-gray-100 mt-1">{formData.dob}</p>}
                </div>
                 <div>
                    <label htmlFor="gender" className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                     {isEditing ? (
                        <select id="gender" name="gender" value={formData.gender} onChange={handleInputChange} className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="female">Female</option>
                            <option value="male">Male</option>
                        </select>
                    ) : <p className="text-gray-900 dark:text-gray-100 mt-1 capitalize">{formData.gender}</p>}
                </div>
                
                {isEditing && (
                    <div className="md:col-span-2 flex justify-end mt-4">
                        <button type="submit" disabled={loading === 'profile'} className="flex items-center text-sm font-semibold py-2 px-6 rounded-lg transition-colors bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-gray-400">
                            <Save className="w-4 h-4 mr-2" />
                            {loading === 'profile' ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                )}
                 {error?.field === 'profile' && <div className="md:col-span-2"><p className="mt-2 text-red-600 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded-md">{error.message}</p></div>}
                 {success?.field === 'profile' && <div className="md:col-span-2"><p className="mt-2 text-green-600 dark:text-green-400 text-sm text-center bg-green-100 dark:bg-green-900/30 p-2 rounded-md">{success.message}</p></div>}
            </form>
        </div>

        {/* Security / Change Password Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
             <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Security</h2>
             <form onSubmit={handlePasswordSubmit} className="space-y-4">
                 <div>
                    <label htmlFor="currentPassword" className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Password</label>
                    <input id="currentPassword" name="currentPassword" type="password" value={passwordData.currentPassword} onChange={handlePasswordChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500" />
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="newPassword" className="text-sm font-medium text-gray-600 dark:text-gray-400">New Password</label>
                        <input id="newPassword" name="newPassword" type="password" value={passwordData.newPassword} onChange={handlePasswordChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                    <div>
                        <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-600 dark:text-gray-400">Confirm New Password</label>
                        <input id="confirmPassword" name="confirmPassword" type="password" value={passwordData.confirmPassword} onChange={handlePasswordChange} required className="mt-1 w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 text-gray-900 dark:text-gray-100 focus:ring-indigo-500 focus:border-indigo-500" />
                    </div>
                 </div>
                 <div className="flex justify-end mt-4">
                    <button type="submit" disabled={loading === 'password'} className="flex items-center text-sm font-semibold py-2 px-5 rounded-lg transition-colors bg-gray-800 hover:bg-black text-white dark:bg-gray-600 dark:hover:bg-gray-500 disabled:bg-gray-400">
                        <Shield className="w-4 h-4 mr-2" />
                        {loading === 'password' ? 'Updating...' : 'Update Password'}
                    </button>
                 </div>
                  {error?.field === 'password' && <p className="text-red-600 dark:text-red-400 text-sm text-center bg-red-100 dark:bg-red-900/30 p-2 rounded-md">{error.message}</p>}
                  {success?.field === 'password' && <p className="text-green-600 dark:text-green-400 text-sm text-center bg-green-100 dark:bg-green-900/30 p-2 rounded-md">{success.message}</p>}
             </form>
        </div>

    </div>
  );
};

export default ProfilePage;
