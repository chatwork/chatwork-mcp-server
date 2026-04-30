import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { type Room } from '../types/room';

interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface RoomsState {
  rooms: CachedData<Room[]> | null;
}

const initialState: RoomsState = {
  rooms: null,
};

const roomsSlice = createSlice({
  name: 'rooms',
  initialState,
  reducers: {
    setRooms: (state, action: PayloadAction<{ data: Room[]; ttl: number }>) => {
      state.rooms = {
        data: action.payload.data,
        timestamp: Date.now(),
        ttl: action.payload.ttl,
      };
    },
    clearRooms: (state) => {
      state.rooms = null;
    },
    cleanExpiredData: (state) => {
      if (state.rooms) {
        const now = Date.now();
        if (now - state.rooms.timestamp > state.rooms.ttl) {
          state.rooms = null;
        }
      }
    },
  },
});

export const { setRooms, clearRooms, cleanExpiredData } = roomsSlice.actions;

// Selectors
export const selectRooms = (state: { rooms: RoomsState }): Room[] | null => {
  if (!state.rooms.rooms) return null;

  const now = Date.now();
  const cachedData = state.rooms.rooms;

  if (now - cachedData.timestamp > cachedData.ttl) {
    return null;
  }

  return cachedData.data;
};

export const selectPaginatedRooms = (
  state: { rooms: RoomsState },
  offset: number = 0,
  limit: number = 100,
): Room[] | null => {
  const rooms = selectRooms(state);
  if (!rooms) return null;

  return rooms.slice(offset, offset + limit);
};

export default roomsSlice.reducer;
