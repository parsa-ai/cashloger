import {create} from 'zustand';

interface DateStore {
  date: Date|undefined;
  setDate: (newDate: Date) => void;
}

const useDateStore = create<DateStore>((set) => ({
  date: new Date(), 
  setDate: (newDate: Date) => set({ date: newDate }), 
}));

export default useDateStore;