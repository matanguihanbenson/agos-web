'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Cpu, AlertCircle, CheckCircle, Building, FileText } from 'lucide-react';
import { doc, getDoc, setDoc, updateDoc, Timestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';

interface BotRegistry {
  id: string;
  bot_id: string;
  is_registered: boolean;
  created_at: Timestamp;
}

export default function AddBotPage() {
  const router = useRouter();
  const [currentUser] = useAuthState(auth);
  const [step, setStep] = useState(1);
  const [botId, setBotId] = useState('');
  const [validationStatus, setValidationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'registered'>('idle');
  const [validatedBotId, setValidatedBotId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    notes: ''
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

  const validateBotId = async (inputBotId: string) => {
    setValidationStatus('checking');
    
    try {
      // Check if document with this ID exists in bot_registry
      const registryDocRef = doc(db, 'bot_registry', inputBotId);
      const registryDoc = await getDoc(registryDocRef);
      
      if (!registryDoc.exists()) {
        setValidationStatus('invalid');
        return;
      }
      
      const botRegistry = registryDoc.data() as BotRegistry;
      
      if (botRegistry.is_registered) {
        setValidationStatus('registered');
        return;
      }
      
      setValidationStatus('valid');
      setValidatedBotId(inputBotId);
    } catch (error) {
      console.error('Error validating bot ID:', error);
      setValidationStatus('invalid');
    }
  };

  const handleBotIdBlur = () => {
    const trimmedId = botId.trim();
    if (trimmedId) {
      validateBotId(trimmedId);
    }
  };

  const handleNextStep = () => {
    if (validationStatus === 'valid') {
      setStep(2);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loadingOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent mx-auto mb-2"></div>
          <p className="text-slate-700 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser || !validatedBotId) return;

    setIsSubmitting(true);

    try {
      // Add bot to bots collection using bot_id as document ID
      await setDoc(doc(db, 'bots', validatedBotId), {
        bot_id: validatedBotId,
        name: formData.name,
        organization: organization?.name,
        organization_id: organization?.id,
        owner_admin_id: currentUser.uid,
        created_at: new Date(),
        updated_at: new Date(),
        notes: formData.notes || ''
      });

      // Update registry to mark as registered
      await updateDoc(doc(db, 'bot_registry', validatedBotId), {
        is_registered: true,
        registered_at: new Date()
      });

      alert(`Bot ${validatedBotId} registered successfully!`);
      router.push('/admin/user-bot-management');
    } catch (error) {
      console.error('Error adding bot:', error);
      alert(`Failed to register bot: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsSubmitting(false);
    }
  };

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
            Register New Bot
          </h1>
          <p className="text-slate-600 text-sm mt-1">Step {step} of 2 - {step === 1 ? 'Validate Bot ID' : 'Bot Details'}</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {step === 1 ? (
            // Step 1: Bot ID Validation
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-emerald-600" />
                  Validate Bot ID
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the Bot ID from your bot registry to verify it's available for registration.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={botId}
                  onChange={(e) => {
                    setBotId(e.target.value);
                    setValidationStatus('idle');
                  }}
                  onBlur={handleBotIdBlur}
                  placeholder="Enter Bot ID (e.g., AGOS-001)"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors font-mono"
                />

                {/* Validation Status Messages */}
                {validationStatus === 'checking' && (
                  <div className="mt-3 flex items-center gap-2 text-blue-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span className="text-sm">Validating bot ID...</span>
                  </div>
                )}

                {validationStatus === 'invalid' && (
                  <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Bot ID not found in registry</p>
                      <p className="text-xs mt-1">Please check the ID and try again.</p>
                    </div>
                  </div>
                )}

                {validationStatus === 'registered' && (
                  <div className="mt-3 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Bot already registered</p>
                      <p className="text-xs mt-1">This bot is already registered and cannot be added again.</p>
                    </div>
                  </div>
                )}

                {validationStatus === 'valid' && (
                  <div className="mt-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3 flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">✓ Bot ID is valid and available</p>
                      <p className="text-xs mt-1">You can proceed to register this bot.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={validationStatus !== 'valid'}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-3 px-4 text-sm font-medium transition-colors shadow-sm"
                >
                  Next: Bot Details
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // Step 2: Bot Details Form
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bot className="h-5 w-5 text-emerald-600" />
                  Bot Details
                </h3>
              </div>

              {/* Validated Bot ID Display */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Validated Bot ID:</span>
                  <code className="font-mono font-semibold">{validatedBotId}</code>
                </div>
              </div>

              {/* Bot Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                  placeholder="e.g., River Cleaner Alpha"
                />
              </div>

              {/* Organization */}
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
                    <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-emerald-600" />
                    <div className="w-full pl-10 pr-4 py-2.5 border border-emerald-200 rounded-lg text-sm bg-emerald-50 text-emerald-900 font-medium">
                      {organization.name}
                    </div>
                  </div>
                ) : (
                  <div className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50 text-sm text-gray-600">
                    No Organization
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
                    placeholder="Add any additional notes about this bot..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg py-3 px-4 text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2"
                >
                  <Bot className="h-4 w-4" />
                  {isSubmitting ? 'Registering Bot...' : 'Register Bot'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Back
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
