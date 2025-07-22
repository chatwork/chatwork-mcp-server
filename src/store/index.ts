import { configureStore } from '@reduxjs/toolkit';
import roomsReducer from './roomsSlice';

export const store = configureStore({
  reducer: {
    rooms: roomsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializability check for Date objects in TTL
      serializableCheck: {
        ignoredPaths: ['rooms.rooms.timestamp'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Re-export actions and selectors for convenience
export {
  setRooms,
  clearRooms,
  cleanExpiredData,
  selectRooms,
  selectPaginatedRooms,
} from './roomsSlice';
export type { Room } from '../types/room';
