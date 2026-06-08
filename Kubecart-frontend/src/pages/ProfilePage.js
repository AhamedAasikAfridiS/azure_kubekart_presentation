import React, { useEffect, useState, useCallback } from 'react';
import { profileApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '', gender: '' });
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [newAddr, setNewAddr] = useState({ street: '', city: '', state: '', postalCode: '', country: 'India', label: 'Home' });

  const fetchProfile = useCallback(async () => {
    try {
      const { data } = await profileApi.get('/api/profiles/me');
      setProfile(data.data.profile);
      setForm({ firstName: data.data.profile.firstName || '', lastName: data.data.profile.lastName || '', phone: data.data.profile.phone || '', gender: data.data.profile.gender || '' });
    } catch { toast.error('Failed to load profile'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await profileApi.put('/api/profiles/me', form);
      toast.success('Profile updated!');
      fetchProfile();
    } catch { toast.error('Failed to update profile'); }
    finally { setSaving(false); }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      await profileApi.post('/api/profiles/me/addresses', newAddr);
      toast.success('Address added!');
      setShowAddAddr(false);
      setNewAddr({ street: '', city: '', state: '', postalCode: '', country: 'India', label: 'Home' });
      fetchProfile();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add address'); }
  };

  const handleDeleteAddress = async (addrId) => {
    if (!window.confirm('Delete this address?')) return;
    try {
      await profileApi.delete(`/api/profiles/me/addresses/${addrId}`);
      toast.success('Address deleted');
      fetchProfile();
    } catch { toast.error('Failed to delete address'); }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="spinner w-10 h-10 border-4"></div></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="page-title">My Profile</h1>
      <div className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">{form.firstName?.[0]?.toUpperCase() || 'U'}</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{form.firstName} {form.lastName}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge-blue mt-1">{user?.role}</span>
          </div>
        </div>
        <form onSubmit={handleSave} id="profile-form" className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input className="input-field" placeholder="+91 XXXXXXXXXX" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
            <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
              <option value="">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div className="col-span-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><span className="spinner"></span> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Saved Addresses</h2>
          <button onClick={() => setShowAddAddr(!showAddAddr)} className="btn-secondary text-sm py-1.5 px-3">
            {showAddAddr ? 'Cancel' : '+ Add Address'}
          </button>
        </div>
        {showAddAddr && (
          <form onSubmit={handleAddAddress} className="bg-blue-50 rounded-xl p-4 mb-4 space-y-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Street" className="input-field" value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} />
              <input required placeholder="City" className="input-field" value={newAddr.city} onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} />
              <input required placeholder="State" className="input-field" value={newAddr.state} onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })} />
              <input required placeholder="PIN Code" className="input-field" value={newAddr.postalCode} onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })} />
              <input placeholder="Country" className="input-field" value={newAddr.country} onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })} />
              <select className="input-field" value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}>
                <option>Home</option><option>Work</option><option>Other</option>
              </select>
            </div>
            <button type="submit" className="btn-primary text-sm">Save Address</button>
          </form>
        )}
        {!profile?.addresses?.length ? (
          <p className="text-gray-400 text-sm">No addresses saved yet.</p>
        ) : (
          <div className="space-y-3">
            {profile.addresses.map((addr) => (
              <div key={addr._id} className="flex items-start justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="badge-blue text-xs">{addr.label}</span>
                  <p className="text-sm text-gray-700 mt-1">{addr.street}, {addr.city}, {addr.state} - {addr.postalCode}</p>
                  <p className="text-xs text-gray-400">{addr.country}</p>
                </div>
                <button onClick={() => handleDeleteAddress(addr._id)} className="text-red-400 hover:text-red-600 ml-3">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
