import { ReactNode } from 'react';

interface ParentProviderProps {
  children: ReactNode;
}

export function ParentProvider({ children }: ParentProviderProps) {
  // Since we're using Zustand, the store is already global
  // This component is a placeholder for future provider logic if needed
  return <>{children}</>;
}
