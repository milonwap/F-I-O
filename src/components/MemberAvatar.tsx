import React from 'react';
import { Member } from '../types/somiti';

interface MemberAvatarProps {
  member: Member;
  className?: string;
  sizeClassName?: string;
}

export const MemberAvatar: React.FC<MemberAvatarProps> = ({ member, className = '', sizeClassName = 'w-10 h-10' }) => {
  if (member.photoUrl && member.photoUrl.trim() !== '') {
    return (
      <div className={`${sizeClassName} rounded-full overflow-hidden shrink-0 border border-neutral-200 shadow-xs ${className}`}>
        <img
          src={member.photoUrl}
          alt={member.nameEn}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClassName} rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center shrink-0 shadow-xs ${className}`}>
      {member.nameEn ? member.nameEn.charAt(0).toUpperCase() : 'M'}
    </div>
  );
};
