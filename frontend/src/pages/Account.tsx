import React, { useState } from 'react';
import { useAuth } from '@/contexts';
import { AccountOverview } from '@/components/account/AccountOverview';
import { EditProfileModal } from '@/components/account/EditProfileModal';
import { ChangePasswordModal } from '@/components/account/ChangePasswordModal';

const Account: React.FC = () => {
  // ProtectedRoute ensures user is authenticated before rendering this component
  const { user, refreshUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // User is guaranteed to exist due to ProtectedRoute
  if (!user) {
    return null;
  }

  const handleProfileUpdated = async () => {
    // Refresh user data from server
    await refreshUser();
  };

  return (
    <main style={{ padding: '120px 0 80px', minHeight: '100vh' }}>
      <AccountOverview
        user={{
          ...user,
          memberSince: '2024-01-01',
          bio: user.bio || '',
        }}
        stats={{
          reviewsCount: 12,
          favoritesCount: 8,
          visitedCount: 24,
        }}
        onEdit={() => setIsEditModalOpen(true)}
        onChangePassword={() => setIsPasswordModalOpen(true)}
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentName={user.name}
        currentBio={user.bio || ''}
        onProfileUpdated={handleProfileUpdated}
      />

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </main>
  );
};

export default Account;
