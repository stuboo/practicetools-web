/**
 * Toast adapter hook that wraps react-hot-toast with the ToastContext API.
 * Provides the same interface as the source ToastContext for migration compatibility.
 */

import toast from 'react-hot-toast';

export type ToastVariant = 'success' | 'error' | 'info';

/**
 * Hook providing toast notifications with the ToastContext API.
 * Uses react-hot-toast under the hood.
 */
export function useToast() {
  const addToast = (message: string, variant: ToastVariant = 'info') => {
    switch (variant) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
      default:
        toast(message);
        break;
    }
  };

  return { addToast };
}
