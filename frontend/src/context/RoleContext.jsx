import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const ROLES = [
  { id: 'creator', label: 'Creator', desc: 'Drafts, submits, accepts/dismisses findings, requests review' },
  { id: 'reviewer', label: 'Reviewer', desc: 'Reviews content, adds comments, requests changes, approves' },
  { id: 'manager', label: 'Manager', desc: 'Full review & editorial workflow control' },
  { id: 'admin', label: 'Admin', desc: 'Can manage guideline library, clauses, approved facts & all workflows' },
];

export function RoleProvider({ children }) {
  const [role, setRoleState] = useState(() => {
    return localStorage.getItem('bw_role') || 'creator';
  });

  const setRole = (newRole) => {
    localStorage.setItem('bw_role', newRole);
    setRoleState(newRole);
  };

  return (
    <RoleContext.Provider value={{ role, setRole, ROLES }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
}
