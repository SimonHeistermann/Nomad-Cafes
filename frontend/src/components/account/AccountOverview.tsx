import React from 'react';
import { FiUser, FiMail, FiCalendar } from 'react-icons/fi';
import { Button } from '@/components/ui/Button';
import '@/styles/pages/account.css';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  memberSince?: string;
  bio?: string;
}

export interface AccountOverviewProps {
  user: User;
  onEdit?: () => void;
  onChangePassword?: () => void;
  stats?: {
    reviewsCount: number;
    favoritesCount: number;
    visitedCount: number;
  };
}

export const AccountOverview: React.FC<AccountOverviewProps> = ({
  user,
  onEdit,
  onChangePassword,
  stats,
}) => {
  const initials = (user.name || '')
    .split(' ')
    .filter((part) => part.length > 0)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || 'U';

  const memberSinceDate = user.memberSince
    ? new Date(user.memberSince).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : null;

  return (
    <div className="account-overview">
      <div className="account-overview-header">
        <div className="account-avatar-section">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="account-avatar"
            />
          ) : (
            <div className="account-avatar account-avatar--placeholder">
              {initials}
            </div>
          )}
        </div>

        <div className="account-info">
          <h1 className="account-name">{user.name}</h1>
          {user.bio && <p className="account-bio">{user.bio}</p>}

          <div className="account-details">
            <div className="account-detail">
              <FiMail size={16} />
              <span>{user.email}</span>
            </div>
            {memberSinceDate && (
              <div className="account-detail">
                <FiCalendar size={16} />
                <span>Member since {memberSinceDate}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats && (
        <div className="account-stats">
          <div className="account-stat">
            <span className="account-stat-value">{stats.reviewsCount}</span>
            <span className="account-stat-label">Reviews</span>
          </div>
          <div className="account-stat">
            <span className="account-stat-value">{stats.favoritesCount}</span>
            <span className="account-stat-label">Favorites</span>
          </div>
          <div className="account-stat">
            <span className="account-stat-value">{stats.visitedCount}</span>
            <span className="account-stat-label">Visited</span>
          </div>
        </div>
      )}

      <div className="account-actions">
        {onEdit && (
          <Button variant="outline" onClick={onEdit}>
            <FiUser size={18} />
            Edit Profile
          </Button>
        )}
        {onChangePassword && (
          <Button variant="outline" onClick={onChangePassword}>
            Change Password
          </Button>
        )}
      </div>
    </div>
  );
};
