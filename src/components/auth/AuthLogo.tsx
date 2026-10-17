/**
 * @file src/components/auth/AuthLogo.tsx
 * @description Official TodoList branding logo with green rounded checkmark.
 */

import React from 'react';
import { TodoListLogo } from './TodoListLogo';

interface AuthLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const AuthLogo: React.FC<AuthLogoProps> = ({ 
  size = 'md',
  showTagline = false 
}) => {
  return (
    <TodoListLogo size={size} showTagline={showTagline} />
  );
};
