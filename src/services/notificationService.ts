interface NotificationOptions {
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

class NotificationService {
  private notificationContainer: HTMLElement | null = null;

  constructor() {
    this.initContainer();
  }

  private initContainer() {
    if (typeof window === 'undefined') return;
    
    this.notificationContainer = document.getElementById('notification-container');
    if (!this.notificationContainer) {
      this.notificationContainer = document.createElement('div');
      this.notificationContainer.id = 'notification-container';
      this.notificationContainer.className = 'fixed top-4 right-4 z-[9999] space-y-3 max-w-sm pointer-events-none';
      this.notificationContainer.style.cssText = `
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 9999;
        max-width: 24rem;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      `;
      document.body.appendChild(this.notificationContainer);
    }
  }

  show(options: NotificationOptions) {
    if (!this.notificationContainer) return;

    const notification = this.createNotificationElement(options);
    this.notificationContainer.appendChild(notification);

    // Auto remove after duration
    const duration = options.duration || 5000;
    setTimeout(() => {
      this.removeNotification(notification);
    }, duration);

    return notification;
  }

  private createNotificationElement(options: NotificationOptions): HTMLElement {
    const notification = document.createElement('div');
    notification.className = this.getNotificationClasses(options.type);
    notification.style.cssText = `
      pointer-events: auto;
      transform: translateX(100%);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      border-radius: 0.5rem;
      overflow: hidden;
      background: white;
      border: 1px solid rgba(229, 231, 235, 0.8);
      backdrop-filter: blur(8px);
      max-width: 100%;
      width: 384px;
    `;
    
    notification.innerHTML = `
      <div class="p-4">
        <div class="flex items-start">
          <div class="flex-shrink-0">
            ${this.getIcon(options.type)}
          </div>
          <div class="ml-3 w-0 flex-1 min-w-0">
            <p class="text-sm font-semibold text-gray-900 leading-tight">
              ${options.title}
            </p>
            ${options.message ? `<p class="mt-1 text-sm text-gray-600 leading-relaxed">${options.message}</p>` : ''}
          </div>
          <div class="ml-4 flex-shrink-0">
            <button type="button" class="inline-flex rounded-md bg-white text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200" aria-label="Close notification">
              <span class="sr-only">Close</span>
              <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    // Add click handler for close button
    const closeButton = notification.querySelector('button');
    closeButton?.addEventListener('click', () => {
      this.removeNotification(notification);
    });

    // Add progress bar for timed notifications
    if (options.duration && options.duration > 0) {
      const progressBar = document.createElement('div');
      progressBar.className = 'h-1 bg-gradient-to-r opacity-20';
      progressBar.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: ${this.getProgressBarColor(options.type)};
        transform-origin: left;
        animation: shrink ${options.duration}ms linear forwards;
      `;
      
      // Add keyframe animation
      if (!document.getElementById('notification-keyframes')) {
        const style = document.createElement('style');
        style.id = 'notification-keyframes';
        style.textContent = `
          @keyframes shrink {
            from { transform: scaleX(1); }
            to { transform: scaleX(0); }
          }
        `;
        document.head.appendChild(style);
      }
      
      notification.appendChild(progressBar);
    }
    
    // Trigger animation
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);

    return notification;
  }

  private getNotificationClasses(type: string): string {
    const baseClasses = 'relative bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden';
    
    const typeClasses = {
      success: 'ring-green-200 border-l-4 border-green-400',
      error: 'ring-red-200 border-l-4 border-red-400',
      info: 'ring-blue-200 border-l-4 border-blue-400',
      warning: 'ring-yellow-200 border-l-4 border-yellow-400'
    };

    return `${baseClasses} ${typeClasses[type as keyof typeof typeClasses] || typeClasses.info}`;
  }

  private getProgressBarColor(type: string): string {
    const colors = {
      success: 'linear-gradient(90deg, #10B981, #059669)',
      error: 'linear-gradient(90deg, #EF4444, #DC2626)',
      info: 'linear-gradient(90deg, #3B82F6, #2563EB)',
      warning: 'linear-gradient(90deg, #F59E0B, #D97706)'
    };
    return colors[type as keyof typeof colors] || colors.info;
  }

  private getIcon(type: string): string {
    const icons = {
      success: `
        <div class="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
          <svg class="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
      `,
      error: `
        <div class="flex h-6 w-6 items-center justify-center rounded-full bg-red-100">
          <svg class="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      `,
      info: `
        <div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
          <svg class="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
        </div>
      `,
      warning: `
        <div class="flex h-6 w-6 items-center justify-center rounded-full bg-yellow-100">
          <svg class="h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
      `
    };

    return icons[type as keyof typeof icons] || icons.info;
  }

  private removeNotification(notification: HTMLElement) {
    // Add exit animation
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    notification.style.maxHeight = '0';
    notification.style.marginBottom = '0';
    notification.style.paddingTop = '0';
    notification.style.paddingBottom = '0';
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }

  success(title: string, message?: string, duration?: number) {
    return this.show({ title, message, type: 'success', duration });
  }

  error(title: string, message?: string, duration?: number) {
    return this.show({ title, message, type: 'error', duration });
  }

  info(title: string, message?: string, duration?: number) {
    return this.show({ title, message, type: 'info', duration });
  }

  warning(title: string, message?: string, duration?: number) {
    return this.show({ title, message, type: 'warning', duration });
  }
}

export const notificationService = new NotificationService();
