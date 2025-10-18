import Swal from 'sweetalert2';

// Modern, compact alert configuration matching system design
const alertConfig = {
  success: {
    icon: 'success' as const,
    confirmButtonColor: '#10b981',
    timer: 2500,
    timerProgressBar: true,
    showConfirmButton: false,
    position: 'center' as const,
    zIndex: 99999,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(236,254,255,0.95) 100%)',
    backdrop: 'rgba(0,0,0,0.3)',
    customClass: {
      popup: 'modern-alert-popup',
      title: 'modern-alert-title',
      htmlContainer: 'modern-alert-content',
      timerProgressBar: 'modern-progress-bar'
    },
    width: '320px',
    padding: '0.75rem',
  },
  error: {
    icon: 'error' as const,
    confirmButtonColor: '#ef4444',
    showConfirmButton: true,
    position: 'center' as const,
    zIndex: 99999,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(254,242,242,0.95) 100%)',
    backdrop: 'rgba(0,0,0,0.3)',
    customClass: {
      popup: 'modern-alert-popup',
      title: 'modern-alert-title',
      htmlContainer: 'modern-alert-content',
      confirmButton: 'modern-alert-button error-button'
    },
    width: '320px',
    padding: '0.75rem',
  },
  warning: {
    icon: 'warning' as const,
    confirmButtonColor: '#f59e0b',
    showCancelButton: true,
    confirmButtonText: 'Yes, proceed',
    cancelButtonText: 'Cancel',
    position: 'center' as const,
    zIndex: 99999,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,251,235,0.95) 100%)',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'modern-alert-popup',
      title: 'modern-alert-title',
      htmlContainer: 'modern-alert-content',
      confirmButton: 'modern-alert-button warning-button',
      cancelButton: 'modern-alert-button cancel-button'
    },
    width: '360px',
    padding: '0.75rem',
  },
  info: {
    icon: 'info' as const,
    confirmButtonColor: '#3b82f6',
    showConfirmButton: true,
    position: 'center' as const,
    zIndex: 99999,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(239,246,255,0.95) 100%)',
    backdrop: 'rgba(0,0,0,0.3)',
    customClass: {
      popup: 'modern-alert-popup',
      title: 'modern-alert-title',
      htmlContainer: 'modern-alert-content',
      confirmButton: 'modern-alert-button info-button'
    },
    width: '320px',
    padding: '0.75rem',
  },
  loading: {
    icon: 'info' as const,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    position: 'center' as const,
    zIndex: 99999,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
    backdrop: 'rgba(0,0,0,0.4)',
    customClass: {
      popup: 'modern-alert-popup loading-popup',
      title: 'modern-alert-title',
      htmlContainer: 'modern-alert-content'
    },
    width: '280px',
    padding: '0.75rem',
    didOpen: () => {
      Swal.showLoading();
    },
  },
};

// User Management Alerts
export const userManagementAlerts = {
  // Success messages
  userAdded: () => Swal.fire({
    ...alertConfig.success,
    title: 'User Added!',
    html: `
      <div>
        <div class="text-sm text-gray-600">New operator account created successfully.</div>
      </div>
    `,
  }),

  userUpdated: () => Swal.fire({
    ...alertConfig.success,
    title: 'Profile Updated!',
    html: `
      <div>
        <div class="text-sm text-gray-600">User information saved successfully.</div>
      </div>
    `,
  }),

  userActivated: () => Swal.fire({
    ...alertConfig.success,
    title: 'User Activated!',
    html: `
      <div>
        <div class="text-sm text-gray-600">Account is now active.</div>
      </div>
    `,
  }),

  userDeactivated: () => Swal.fire({
    ...alertConfig.success,
    title: 'User Deactivated!',
    html: `
      <div>
        <div class="text-sm text-gray-600">Account access has been revoked.</div>
      </div>
    `,
  }),

  botUnlinked: () => Swal.fire({
    ...alertConfig.success,
    title: 'Bot Unlinked!',
    html: `
      <div>
        <div class="text-sm text-gray-600">Bot successfully unlinked from user.</div>
      </div>
    `,
  }),

  // Error messages
  userAddFailed: (error?: string) => Swal.fire({
    ...alertConfig.error,
    title: 'Failed to Add User',
    html: `
      <div>
        <div class="text-sm text-gray-600">${error || 'Unable to create user account. Please try again.'}</div>
      </div>
    `,
  }),

  userUpdateFailed: (error?: string) => Swal.fire({
    ...alertConfig.error,
    title: 'Update Failed',
    html: `
      <div>
        <div class="text-sm text-gray-600">${error || 'Unable to update user profile.'}</div>
      </div>
    `,
  }),

  userStatusUpdateFailed: (error?: string) => Swal.fire({
    ...alertConfig.error,
    title: 'Status Update Failed',
    html: `
      <div>
        <div class="text-sm text-gray-600">${error || 'Unable to change user status.'}</div>
      </div>
    `,
  }),

  botUnlinkFailed: (error?: string) => Swal.fire({
    ...alertConfig.error,
    title: 'Unlink Failed',
    html: `
      <div>
        <div class="text-sm text-gray-600">${error || 'Unable to unlink bot from user.'}</div>
      </div>
    `,
  }),

  // Warning/Confirmation messages
  confirmUserDeactivation: (userName: string) => Swal.fire({
    ...alertConfig.warning,
    title: 'Deactivate User?',
    html: `
      <div class="space-y-2">
        <p class="text-gray-700 text-sm">Are you sure you want to deactivate <strong class="text-gray-900">${userName}</strong>?</p>
        <div class="bg-orange-50 border border-orange-200 rounded-md p-2">
          <div class="flex items-start space-x-1.5">
            <div class="text-orange-500 text-xs mt-0.5">⚠️</div>
            <div class="text-xs text-orange-800">
              <div class="font-medium mb-1">This will:</div>
              <div class="space-y-0.5">
                <div class="flex items-center space-x-1.5">
                  <div class="w-1 h-1 bg-orange-500 rounded-full"></div>
                  <span>Revoke system access</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <div class="w-1 h-1 bg-orange-500 rounded-full"></div>
                  <span>Unassign all bots</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <div class="w-1 h-1 bg-orange-500 rounded-full"></div>
                  <span>Disable notifications</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    width: '300px',
    customClass: {
      popup: 'confirmation-popup',
      title: 'confirmation-title',
      htmlContainer: 'confirmation-content',
      confirmButton: 'confirmation-button confirm-destructive',
      cancelButton: 'confirmation-button confirm-cancel',
    },
    buttonsStyling: false,
  }),

  confirmBotUnlink: (botName: string) => Swal.fire({
    ...alertConfig.warning,
    title: 'Unlink Bot?',
    html: `
      <div class="space-y-2">
        <p class="text-gray-700 text-sm">Are you sure you want to unlink <strong class="text-gray-900">${botName}</strong>?</p>
        <div class="bg-blue-50 border border-blue-200 rounded-md p-2">
          <div class="text-xs text-blue-800">
            Bot will be available for reassignment
          </div>
        </div>
      </div>
    `,
    width: '280px',
    customClass: {
      popup: 'confirmation-popup',
      title: 'confirmation-title',
      htmlContainer: 'confirmation-content',
      confirmButton: 'confirmation-button confirm-warning',
      cancelButton: 'confirmation-button confirm-cancel',
    },
    buttonsStyling: false,
  }),
};

// Bot Management Alerts
export const botManagementAlerts = {
  // Success messages
  botAdded: (botId: string) => Swal.fire({
    ...alertConfig.success,
    title: 'Bot Registered!',
    html: `
      <div>
        <div class="text-sm text-gray-600">${botId} added to your fleet.</div>
      </div>
    `,
  }),

  botAssigned: (botId: string, operatorName: string) => Swal.fire({
    ...alertConfig.success,
    title: 'Bot Assigned!',
    html: `
      <div>
        <div class="text-sm text-gray-600">${botId} assigned to ${operatorName}.</div>
      </div>
    `,
  }),

  botUnregistered: (botId: string) => Swal.fire({
    ...alertConfig.success,
    title: 'Bot Unregistered!',
    html: `
      <div>
        <div class="text-sm text-gray-600">${botId} removed from your fleet.</div>
      </div>
    `,
  }),

  // Error messages with compact styling
  botValidationFailed: () => Swal.fire({
    ...alertConfig.error,
    title: 'Invalid Bot ID',
    html: `
      <div>
        <div class="text-sm text-gray-600">Bot ID not found in registry.</div>
      </div>
    `,
  }),

  botAlreadyRegistered: () => Swal.fire({
    ...alertConfig.error,
    title: 'Bot Already Registered',
    html: `
      <div>
        <div class="text-sm text-gray-600">This bot is already registered.</div>
      </div>
    `,
  }),

  botRegistrationFailed: (error?: string) => Swal.fire({
    ...alertConfig.error,
    title: 'Registration Failed',
    html: `
      <div>
        <div class="text-sm text-gray-600">${error || 'Unable to register the bot.'}</div>
      </div>
    `,
  }),

  botAssignmentFailed: (error?: string) => Swal.fire({
    ...alertConfig.error,
    title: 'Assignment Failed',
    html: `
      <div>
        <div class="text-sm text-gray-600">${error || 'Unable to assign bot.'}</div>
      </div>
    `,
  }),

  botUnregistrationFailed: (error?: string) => Swal.fire({
    ...alertConfig.error,
    title: 'Unregistration Failed',
    html: `
      <div>
        <div class="text-sm text-gray-600">${error || 'Unable to unregister bot.'}</div>
      </div>
    `,
  }),

  // Warning/Confirmation messages
  confirmBotUnregistration: (botId: string, botName: string) => Swal.fire({
    ...alertConfig.warning,
    title: 'Unregister Bot?',
    html: `
      <div class="space-y-2">
        <p class="text-gray-700 text-sm">Are you sure you want to unregister <strong class="text-gray-900">${botName}</strong>?</p>
        <p class="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded text-center">${botId}</p>
        
        <div class="bg-red-50 border border-red-200 rounded-md p-2">
          <div class="flex items-start space-x-1.5">
            <div class="text-red-500 text-xs mt-0.5">⚠️</div>
            <div class="text-xs text-red-800">
              <div class="font-medium text-red-700 mb-1">Cannot be undone!</div>
              <div class="space-y-0.5">
                <div class="flex items-center space-x-1.5">
                  <div class="w-1 h-1 bg-red-500 rounded-full"></div>
                  <span>Remove from fleet</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <div class="w-1 h-1 bg-red-500 rounded-full"></div>
                  <span>Unassign operator</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <div class="w-1 h-1 bg-red-500 rounded-full"></div>
                  <span>Stop monitoring</span>
                </div>
                <div class="flex items-center space-x-1.5">
                  <div class="w-1 h-1 bg-red-500 rounded-full"></div>
                  <span>Available to others</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `,
    confirmButtonText: 'Unregister',
    confirmButtonColor: '#ef4444',
    width: '320px',
    customClass: {
      popup: 'confirmation-popup',
      title: 'confirmation-title',
      htmlContainer: 'confirmation-content',
      confirmButton: 'confirmation-button confirm-destructive',
      cancelButton: 'confirmation-button confirm-cancel',
    },
    buttonsStyling: false,
  }),
};

// Loading states with compact design
export const loadingAlerts = {
  validatingBot: () => Swal.fire({
    ...alertConfig.loading,
    title: 'Validating Bot...',
    html: `
      <div>
        <div class="text-sm text-gray-600">Checking registry...</div>
      </div>
    `,
  }),

  savingUser: () => Swal.fire({
    ...alertConfig.loading,
    title: 'Saving User...',
    html: `
      <div>
        <div class="text-sm text-gray-600">Updating information...</div>
      </div>
    `,
  }),

  assigningBot: () => Swal.fire({
    ...alertConfig.loading,
    title: 'Assigning Bot...',
    html: `
      <div>
        <div class="text-sm text-gray-600">Processing assignment...</div>
      </div>
    `,
  }),
};

// Generic utility functions
export const showSuccess = (title: string, text?: string) => {
  return Swal.fire({
    ...alertConfig.success,
    title,
    text,
  });
};

export const showError = (title: string, text?: string) => {
  return Swal.fire({
    ...alertConfig.error,
    title,
    text,
  });
};

export const showConfirmation = (title: string, text: string, confirmText = 'Yes, proceed') => {
  return Swal.fire({
    ...alertConfig.warning,
    title,
    text,
    confirmButtonText: confirmText,
  });
};

export const closeAlert = () => {
  Swal.close();
};