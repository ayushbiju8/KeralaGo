import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  fetchCustomerDashboard,
  CustomerDashboardResponse,
  topUpWallet as apiTopUpWallet,
  updateCustomerProfile as apiUpdateProfile,
  fetchCustomerTrips,
  BackendTripItem,
} from '../services';

interface DatabaseContextType {
  data: CustomerDashboardResponse | null;
  trips: BackendTripItem[];
  isLiveDb: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  topUp: (amount: number) => Promise<boolean>;
  updateProfile: (payload: { name?: string; email?: string; quietRide?: boolean; acPreferred?: boolean; cashlessOnly?: boolean }) => Promise<boolean>;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const DatabaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [data, setData] = useState<CustomerDashboardResponse | null>(null);
  const [trips, setTrips] = useState<BackendTripItem[]>([]);
  const [isLiveDb, setIsLiveDb] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const res = await fetchCustomerDashboard();
      if (res.data) {
        setData(res.data);
        setTrips(res.data.trips || []);
        setIsLiveDb(res.isLiveDb);
      }
    } catch {
      // Handled gracefully
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const topUp = async (amount: number): Promise<boolean> => {
    const res = await apiTopUpWallet(amount);
    if (res.fromDb && res.data?.success) {
      await loadData();
      return true;
    }
    return false;
  };

  const updateProfile = async (payload: { name?: string; email?: string; quietRide?: boolean; acPreferred?: boolean; cashlessOnly?: boolean }): Promise<boolean> => {
    const res = await apiUpdateProfile(payload);
    if (res.fromDb) {
      await loadData();
      return true;
    }
    return false;
  };

  return (
    <DatabaseContext.Provider
      value={{
        data,
        trips,
        isLiveDb,
        isLoading,
        refresh: loadData,
        topUp,
        updateProfile,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextType => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
};
