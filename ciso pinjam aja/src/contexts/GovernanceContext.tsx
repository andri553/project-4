import React, { createContext, useContext, useState, useEffect } from 'react';

type GovernanceData = {
  businessObjectives: any[];
  risks: any[];
  kpis: any[];
  vulnerabilities: any[];
  executiveDecisions: any[];
  controls: any[];
  complianceRequirements: any[];
  roadmapInitiatives: any[];
  securityMaturity: any;
};

type GovernanceContextType = {
  data: GovernanceData;
  loading: boolean;
  error: string | null;
  refreshGovernanceData: () => Promise<void>;
};

const defaultData: GovernanceData = {
  businessObjectives: [],
  risks: [],
  kpis: [],
  vulnerabilities: [],
  executiveDecisions: [],
  controls: [],
  complianceRequirements: [],
  roadmapInitiatives: [],
  securityMaturity: null
};

const GovernanceContext = createContext<GovernanceContextType>({
  data: defaultData,
  loading: true,
  error: null,
  refreshGovernanceData: async () => {},
});

export const GovernanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<GovernanceData>(defaultData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGovernanceData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/security/governance-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || localStorage.getItem('token') || ''}`
        }
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.message);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGovernanceData();
  }, []);

  return (
    <GovernanceContext.Provider value={{ data, loading, error, refreshGovernanceData: fetchGovernanceData }}>
      {children}
    </GovernanceContext.Provider>
  );
};

export const useGovernance = () => useContext(GovernanceContext);
