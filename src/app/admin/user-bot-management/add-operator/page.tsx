'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus, Mail, Building, User } from 'lucide-react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { userManagementAlerts } from '@/utils/alerts';

export default function AddOperatorPage() {
  const router = useRouter();
  const [currentUser] = useAuthState(auth);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organization, setOrganization] = useState<{ id: string; name: string } | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  // Fetch organization created by current admin
  useEffect(() => {
    const fetchOrganization = async () => {
      if (!currentUser) return;
      
      try {
        const orgQuery = query(
          collection(db, 'organizations'),
          where('creator_user_id', '==', currentUser.uid)
        );
        const snapshot = await getDocs(orgQuery);
        
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          setOrganization({
            id: doc.id,
            name: doc.data().name
          });
        }
      } catch (error) {
        console.error('Error fetching organization:', error);
      } finally {
        setLoadingOrg(false);
      }
    };

    fetchOrganization();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('You must be logged in to add an operator');
      return;
    }

    setIsSubmitting(true);

    try {
      await addDoc(collection(db, 'users'), {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        organization_id: organization?.id,
        role: 'field_operator', // Auto-set role
        created_by: currentUser.uid,
        created_at: new Date(),
        updated_at: new Date(),
        isActive: true,
        ecoPoints: 0,
        badges: []
      });

      userManagementAlerts.userAdded();
      router.push('/admin/user-bot-management');
    } catch (error) {
      console.error('Error adding operator:', error);
      userManagementAlerts.userAddFailed(error instanceof Error ? error.message : undefined);
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loadingOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-slate-700 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200/30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Management</span>
          </button>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Add New Operator
          </h1>
          <p className="text-slate-600 text-sm mt-1">Create a new field operator account</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="John"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Doe"
                  />
                </div>
              </div>
            </div>

            {/* Contact & Organization Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Contact & Organization
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="john.doe@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization
                  </label>
                  {loadingOrg ? (
                    <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-sm text-gray-500">
                      Loading organization...
                    </div>
                  ) : organization ? (
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-600" />
                      <div className="w-full pl-10 pr-4 py-2.5 border border-blue-200 rounded-lg text-sm bg-blue-50 text-blue-900 font-medium">
                        {organization.name}
                      </div>
                    </div>
                  ) : (
                    <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-sm text-gray-600">
                      No Organization
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Default Role</h4>
              <p className="text-sm text-blue-700">
                This operator will be assigned the <strong>Field Operator</strong> role by default.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-3 px-4 text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              {isSubmitting ? 'Adding Operator...' : 'Add Operator'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
