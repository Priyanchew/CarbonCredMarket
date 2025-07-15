import { useAuthStore } from '../stores/authStore';
import { useToast } from './useToast';

export const useVerification = () => {
  const { user } = useAuthStore();
  const { addToast } = useToast();

  const isVerified = () => {
    if (!user) {
      return false;
    }
    if (user.type !== 'seller') {
      return true; // Non-sellers don't need verification
    }
    
    if (!user.seller_verification) {
      return false;
    }
    
    return user.seller_verification.status === 'approved';
  };

  const requireVerification = (action?: string) => {
    if (!user) {
      addToast('You must be logged in to perform this action.', 'error');
      return false;
    }
    
    if (user.type !== 'seller') return true; // Non-sellers don't need verification
    
    const status = user.seller_verification?.status || 'pending';
    const actionText = action || 'perform this action';
    
    if (status === 'approved') {
      return true;
    }
    
    if (status === 'pending') {
      addToast(
        `Please submit your verification documents before you can ${actionText}.`,
        'error'
      );
      return false;
    }
    
    if (status === 'under_review') {
      addToast(
        `Your verification is under review. You'll be able to ${actionText} once approved.`,
        'error'
      );
      return false;
    }
    
    if (status === 'rejected') {
      addToast(
        `Your verification was rejected. Please contact support to ${actionText}.`,
        'error'
      );
      return false;
    }
    
    return false;
  };

  const getVerificationStatus = () => {
    if (!user || user.type !== 'seller') return null;
    return user.seller_verification?.status || 'pending';
  };

  return {
    isVerified: isVerified(),
    requireVerification,
    getVerificationStatus,
    verificationStatus: getVerificationStatus()
  };
};
