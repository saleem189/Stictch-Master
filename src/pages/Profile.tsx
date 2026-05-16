import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useUser } from '../contexts/UserContext';
import { ProfileRequest } from '../types';
import { User, Phone, Mail, Save, Clock, CheckCircle, XCircle, Bell, MessageSquare, Shield, Languages, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { createNotification } from '../lib/notifications';

export default function Profile() {
  const { user, profile, isAdmin, isEmployee } = useUser();
  const { t, i18n } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [adminRequests, setAdminRequests] = useState<ProfileRequest[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    notes: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        notes: ''
      });
      fetchRequests();
    }
  }, [profile]);

  async function fetchRequests() {
    if (!profile) return;
    try {
      if (isAdmin) {
        const q = query(collection(db, 'profileRequests'), orderBy('requestDate', 'desc'));
        const snap = await getDocs(q);
        setAdminRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProfileRequest)));
      } else {
        const q = query(
          collection(db, 'profileRequests'),
          where('userId', '==', profile.uid),
          orderBy('requestDate', 'desc')
        );
        const snap = await getDocs(q);
        setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as ProfileRequest)));
      }
    } catch (e) {
      console.error("Error fetching requests:", e);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);

    try {
      if (isEmployee) {
        // Employees must request changes
        await addDoc(collection(db, 'profileRequests'), {
          userId: profile.uid,
          userName: profile.name || user?.displayName || 'Unknown',
          requestDate: new Date().toISOString(),
          suggestedChanges: {
            name: formData.name,
            phone: formData.phone,
            address: formData.address
          },
          notes: formData.notes,
          status: 'pending'
        });
        toast.success('Change request submitted for admin approval');
        setIsEditing(false);
        fetchRequests();
      } else {
        // Admins and Clients can update directly
        await updateDoc(doc(db, 'users', profile.uid), {
          name: formData.name,
          phone: formData.phone,
          address: formData.address
        });
        toast.success('Profile updated successfully');
        setIsEditing(false);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'users');
    } finally {
      setLoading(false);
    }
  }

  async function handleProcessRequest(request: ProfileRequest, status: 'approved' | 'rejected') {
    setLoading(true);
    try {
      // 1. Update the request status
      await updateDoc(doc(db, 'profileRequests', request.id), {
        status,
        adminResponse: status === 'approved' ? 'Request approved. Changes will reflect shortly.' : 'Request rejected based on policy.'
      });

      // 2. If approved, update the user profile
      if (status === 'approved') {
        await updateDoc(doc(db, 'users', request.userId), {
          ...request.suggestedChanges
        });
      }

      // 3. Create Notification for the employee
      await createNotification(db, {
        userId: request.userId,
        title: `Profile Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: status === 'approved' 
          ? 'Your profile change request has been approved and reflect in 48 hours.' 
          : 'Your profile change request has been rejected.',
        type: status === 'approved' ? 'success' : 'error',
      });

      toast.success(`Request ${status} successfully`);
      fetchRequests();
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, 'profileRequests');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 italic tracking-tight uppercase">{t('My Profile')}</h1>
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Manage your professional identity</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            
            <div className="relative flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white mb-6 shadow-xl shadow-slate-200">
                <User size={40} className="text-indigo-400" />
              </div>
              <h2 className="text-xl font-black text-slate-900 mb-1">{profile?.name || user?.displayName || 'User'}</h2>
              <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                {profile?.role}
              </span>

              <div className="w-full mt-8 space-y-4 text-left">
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Mail size={18} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
                    <p className="text-sm font-bold text-slate-700 truncate">{profile?.email || user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <Phone size={18} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('Phone')}</p>
                    <p className="text-sm font-bold text-slate-700">{profile?.phone || 'Not provided'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <MapPin size={18} className="text-slate-400" />
                  <div className="min-w-0">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{t('Address')}</p>
                    <p className="text-sm font-bold text-slate-700">{profile?.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              {!isEditing && (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full mt-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isEmployee ? 'Request Changes' : 'Update Profile'}
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Languages size={20} className="text-indigo-600" />
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('Language')}</h3>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  i18n.language === 'en' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {t('English')}
              </button>
              <button
                onClick={() => i18n.changeLanguage('ur')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  i18n.language === 'ur' 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                    : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                }`}
              >
                {t('Urdu')}
              </button>
            </div>
            <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest italic text-center">
              * Preferences saved automatically
            </p>
          </div>
        </div>

        {/* Action Center (Form or Requests) */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                key="edit-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm"
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-black text-slate-900 italic">
                    {isEmployee ? 'Submit Change Request' : 'Update Information'}
                  </h3>
                  <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-slate-100 rounded-xl">
                    <XCircle size={20} className="text-slate-400" />
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Name')}</label>
                      <input 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Phone')}</label>
                      <input 
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('Address')}</label>
                      <input 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold"
                        value={formData.address}
                        onChange={e => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                  </div>

                  {isEmployee && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Reason for Change / Notes for Admin</label>
                      <textarea 
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-600 transition-all font-bold h-32 resize-none"
                        placeholder="e.g. Updating contact number for official communication..."
                        value={formData.notes || ''}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="flex gap-4 pt-4">
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"
                    >
                      <Save size={16} />
                      {isEmployee ? 'Submit for Approval' : 'Save Changes'}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="px-8 py-4 bg-slate-50 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : isAdmin ? (
              <motion.div
                key="admin-requests"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-4 mb-8">
                  <Shield size={20} className="text-indigo-600" />
                  <h3 className="text-lg font-black text-slate-900 italic uppercase">Pending Approval Queue</h3>
                </div>

                <div className="grid gap-6">
                  {adminRequests.filter(r => r.status === 'pending').map(request => (
                    <div key={request.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Clock size={24} />
                          </div>
                          <div>
                            <p className="text-base font-black text-slate-900">{request.userName}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Requested on {new Date(request.requestDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleProcessRequest(request, 'approved')}
                            className="p-3 bg-green-50 text-green-600 rounded-2xl hover:bg-green-100 transition-colors"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button 
                            onClick={() => handleProcessRequest(request, 'rejected')}
                            className="p-3 bg-red-50 text-red-600 rounded-2xl hover:bg-red-100 transition-colors"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">New Name</p>
                          <p className="font-bold text-slate-700">{request.suggestedChanges.name}</p>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">New Phone</p>
                          <p className="font-bold text-slate-700">{request.suggestedChanges.phone}</p>
                        </div>
                        {request.suggestedChanges.address && (
                          <div className="p-4 bg-slate-50 rounded-2xl md:col-span-2">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">New Address</p>
                            <p className="font-bold text-slate-700">{request.suggestedChanges.address}</p>
                          </div>
                        )}
                      </div>

                      {request.notes && (
                        <div className="bg-amber-50/50 p-6 rounded-2xl border border-amber-100 flex gap-4">
                          <MessageSquare className="text-amber-500 shrink-0" size={20} />
                          <p className="text-sm font-medium text-amber-900 italic">"{request.notes}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                  {adminRequests.filter(r => r.status === 'pending').length === 0 && (
                    <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                       <CheckCircle size={40} className="mx-auto text-slate-200 mb-4" />
                       <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No pending requests</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="employee-history"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-4 mb-8">
                  <Bell size={20} className="text-indigo-600" />
                  <h3 className="text-lg font-black text-slate-900 italic uppercase">Request History & Notifications</h3>
                </div>

                <div className="space-y-4">
                  {requests.map(request => (
                    <div key={request.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${
                            request.status === 'approved' ? 'bg-green-50 text-green-600' : 
                            request.status === 'rejected' ? 'bg-red-50 text-red-600' : 
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {request.status === 'approved' ? <CheckCircle size={18} /> : 
                             request.status === 'rejected' ? <XCircle size={18} /> : 
                             <Clock size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">Change Request: {new Date(request.requestDate).toLocaleDateString()}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{request.status}</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Response</p>
                          <p className="text-xs font-bold text-slate-600 italic">
                            {request.adminResponse || 'Processing by admin...'}
                          </p>
                       </div>
                    </div>
                  ))}
                  {requests.length ===0 && (
                    <div className="py-12 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic font-serif">No activity to report</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
