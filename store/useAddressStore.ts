import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SavedAddress } from '../types';

interface AddressState {
  addresses: SavedAddress[];
  selectedAddressId: string | null;
  addAddress: (address: Omit<SavedAddress, 'id'>) => string;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  setSelectedAddress: (id: string) => void;
  updateAddress: (id: string, updates: Partial<SavedAddress>) => void;
  getActiveAddress: () => SavedAddress | null;
}

const DEFAULT_ADDRESSES: SavedAddress[] = [
  {
    id: 'addr-1',
    label: 'Home',
    fullName: 'David Adeleke',
    phoneNumber: '+234 802 345 6789',
    street: 'Plot 14, Admiralty Way, Lekki Phase 1',
    city: 'Lagos',
    state: 'Lagos State',
    isDefault: true,
  },
  {
    id: 'addr-2',
    label: 'Work / Office',
    fullName: 'EagleTech Engineering Hub',
    phoneNumber: '+234 706 777 4818',
    street: '18 Karimu Kotun St, Victoria Island',
    city: 'Lagos',
    state: 'Lagos State',
    isDefault: false,
  },
];

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: DEFAULT_ADDRESSES,
      selectedAddressId: 'addr-1',

      addAddress: (newAddr) => {
        const id = 'addr-' + Date.now();
        const { addresses } = get();
        const isFirst = addresses.length === 0;
        const entry: SavedAddress = {
          ...newAddr,
          id,
          isDefault: isFirst || newAddr.isDefault,
        };

        const updated = addresses.map((a) =>
          entry.isDefault ? { ...a, isDefault: false } : a
        );

        set({
          addresses: [...updated, entry],
          selectedAddressId: id,
        });
        return id;
      },

      removeAddress: (id) => {
        const { addresses, selectedAddressId } = get();
        const filtered = addresses.filter((a) => a.id !== id);
        let nextSelected = selectedAddressId === id ? (filtered[0]?.id || null) : selectedAddressId;
        set({ addresses: filtered, selectedAddressId: nextSelected });
      },

      setDefaultAddress: (id) => {
        const { addresses } = get();
        set({
          addresses: addresses.map((a) => ({
            ...a,
            isDefault: a.id === id,
          })),
          selectedAddressId: id,
        });
      },

      setSelectedAddress: (id) => {
        set({ selectedAddressId: id });
      },

      updateAddress: (id, updates) => {
        const { addresses } = get();
        set({
          addresses: addresses.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        });
      },

      getActiveAddress: () => {
        const { addresses, selectedAddressId } = get();
        if (!selectedAddressId) {
          return addresses.find((a) => a.isDefault) || addresses[0] || null;
        }
        return addresses.find((a) => a.id === selectedAddressId) || addresses[0] || null;
      },
    }),
    {
      name: 'eagletech-address-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
