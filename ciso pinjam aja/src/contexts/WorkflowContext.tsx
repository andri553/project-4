import React, { createContext, useContext, useState } from 'react';
import type { ChainNodeType } from '@/utils/chainResolver';

interface WorkflowContextType {
  isOpen: boolean;
  activeType: ChainNodeType | null;
  activeId: string | null;
  openWorkflow: (type: ChainNodeType, id: string) => void;
  closeWorkflow: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export function WorkflowProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState<ChainNodeType | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const openWorkflow = (type: ChainNodeType, id: string) => {
    setActiveType(type);
    setActiveId(id);
    setIsOpen(true);
  };

  const closeWorkflow = () => {
    setIsOpen(false);
    setActiveType(null);
    setActiveId(null);
  };

  return (
    <WorkflowContext.Provider value={{ isOpen, activeType, activeId, openWorkflow, closeWorkflow }}>
      {children}
    </WorkflowContext.Provider>
  );
}

export function useWorkflow() {
  const context = useContext(WorkflowContext);
  if (!context) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
}
