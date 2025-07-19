import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import roomsReducer, {
  setRooms,
  clearRooms,
  cleanExpiredData,
  selectRooms,
  selectPaginatedRooms,
} from './roomsSlice';
import { Room } from '../types/room';

describe('roomsSlice', () => {
  const mockRooms: Room[] = [
    {
      room_id: 1,
      name: 'Room 1',
      type: 'group',
      role: 'admin',
      sticky: false,
      unread_num: 0,
      mention_num: 0,
      mytask_num: 0,
      message_num: 10,
      file_num: 2,
      task_num: 1,
      icon_path: 'https://example.com/icon1.png',
      last_update_time: 1719487723,
    },
    {
      room_id: 2,
      name: 'Room 2',
      type: 'direct',
      role: 'member',
      sticky: true,
      unread_num: 5,
      mention_num: 2,
      mytask_num: 1,
      message_num: 20,
      file_num: 0,
      task_num: 3,
      icon_path: 'https://example.com/icon2.png',
      last_update_time: 1719487724,
    },
    {
      room_id: 3,
      name: 'Room 3',
      type: 'group',
      role: 'readonly',
      sticky: false,
      unread_num: 3,
      mention_num: 0,
      mytask_num: 2,
      message_num: 15,
      file_num: 5,
      task_num: 0,
      icon_path: 'https://example.com/icon3.png',
      last_update_time: 1719487725,
    },
    {
      room_id: 4,
      name: 'Room 4',
      type: 'direct',
      role: 'member',
      sticky: false,
      unread_num: 0,
      mention_num: 1,
      mytask_num: 0,
      message_num: 8,
      file_num: 1,
      task_num: 2,
      icon_path: 'https://example.com/icon4.png',
      last_update_time: 1719487726,
    },
    {
      room_id: 5,
      name: 'Room 5',
      type: 'group',
      role: 'admin',
      sticky: true,
      unread_num: 12,
      mention_num: 3,
      mytask_num: 4,
      message_num: 50,
      file_num: 8,
      task_num: 6,
      icon_path: 'https://example.com/icon5.png',
      last_update_time: 1719487727,
    },
  ];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(roomsReducer(undefined, { type: 'unknown' })).toEqual({
        rooms: null,
      });
    });

    it('should handle setRooms', () => {
      const ttl = 300000; // 5 minutes
      const now = Date.now();
      vi.setSystemTime(now);

      const action = setRooms({ data: mockRooms, ttl });
      const result = roomsReducer(undefined, action);

      expect(result.rooms).toEqual({
        data: mockRooms,
        timestamp: now,
        ttl,
      });
    });

    it('should handle clearRooms', () => {
      const initialState = {
        rooms: {
          data: mockRooms,
          timestamp: Date.now(),
          ttl: 300000,
        },
      };

      const result = roomsReducer(initialState, clearRooms());

      expect(result.rooms).toBeNull();
    });

    it('should handle cleanExpiredData - removes expired data', () => {
      const ttl = 300000; // 5 minutes
      const pastTime = Date.now() - ttl - 1000; // 1 second after expiry
      
      const initialState = {
        rooms: {
          data: mockRooms,
          timestamp: pastTime,
          ttl,
        },
      };

      const result = roomsReducer(initialState, cleanExpiredData());

      expect(result.rooms).toBeNull();
    });

    it('should handle cleanExpiredData - keeps valid data', () => {
      const ttl = 300000; // 5 minutes
      const recentTime = Date.now() - 60000; // 1 minute ago
      
      const initialState = {
        rooms: {
          data: mockRooms,
          timestamp: recentTime,
          ttl,
        },
      };

      const result = roomsReducer(initialState, cleanExpiredData());

      expect(result.rooms).toEqual(initialState.rooms);
    });

    it('should handle cleanExpiredData - does nothing when rooms is null', () => {
      const initialState = { rooms: null };

      const result = roomsReducer(initialState, cleanExpiredData());

      expect(result.rooms).toBeNull();
    });
  });

  describe('selectors', () => {
    describe('selectRooms', () => {
      it('should return null when rooms is null', () => {
        const state = { rooms: { rooms: null } };

        const result = selectRooms(state);

        expect(result).toBeNull();
      });

      it('should return rooms data when not expired', () => {
        const ttl = 300000; // 5 minutes
        const recentTime = Date.now() - 60000; // 1 minute ago
        
        const state = {
          rooms: {
            rooms: {
              data: mockRooms,
              timestamp: recentTime,
              ttl,
            },
          },
        };

        const result = selectRooms(state);

        expect(result).toEqual(mockRooms);
      });

      it('should return null when data is expired', () => {
        const ttl = 300000; // 5 minutes
        const pastTime = Date.now() - ttl - 1000; // 1 second after expiry
        
        const state = {
          rooms: {
            rooms: {
              data: mockRooms,
              timestamp: pastTime,
              ttl,
            },
          },
        };

        const result = selectRooms(state);

        expect(result).toBeNull();
      });
    });

    describe('selectPaginatedRooms', () => {
      const validState = {
        rooms: {
          rooms: {
            data: mockRooms,
            timestamp: Date.now() - 60000, // 1 minute ago
            ttl: 300000, // 5 minutes
          },
        },
      };

      it('should return null when selectRooms returns null', () => {
        const state = { rooms: { rooms: null } };

        const result = selectPaginatedRooms(state, 0, 10);

        expect(result).toBeNull();
      });

      it('should return paginated rooms with default offset and limit', () => {
        const result = selectPaginatedRooms(validState);

        expect(result).toEqual(mockRooms); // All rooms (default limit 100)
      });

      it('should return paginated rooms with custom offset and limit', () => {
        const result = selectPaginatedRooms(validState, 1, 2);

        expect(result).toEqual([
          {
            room_id: 2,
            name: 'Room 2',
            type: 'direct',
            role: 'member',
            sticky: true,
            unread_num: 5,
            mention_num: 2,
            mytask_num: 1,
            message_num: 20,
            file_num: 0,
            task_num: 3,
            icon_path: 'https://example.com/icon2.png',
            last_update_time: 1719487724,
          },
          {
            room_id: 3,
            name: 'Room 3',
            type: 'group',
            role: 'readonly',
            sticky: false,
            unread_num: 3,
            mention_num: 0,
            mytask_num: 2,
            message_num: 15,
            file_num: 5,
            task_num: 0,
            icon_path: 'https://example.com/icon3.png',
            last_update_time: 1719487725,
          },
        ]);
      });

      it('should handle offset beyond array length', () => {
        const result = selectPaginatedRooms(validState, 10, 2);

        expect(result).toEqual([]);
      });

      it('should handle limit beyond remaining items', () => {
        const result = selectPaginatedRooms(validState, 3, 10);

        expect(result).toEqual([
          {
            room_id: 4,
            name: 'Room 4',
            type: 'direct',
            role: 'member',
            sticky: false,
            unread_num: 0,
            mention_num: 1,
            mytask_num: 0,
            message_num: 8,
            file_num: 1,
            task_num: 2,
            icon_path: 'https://example.com/icon4.png',
            last_update_time: 1719487726,
          },
          {
            room_id: 5,
            name: 'Room 5',
            type: 'group',
            role: 'admin',
            sticky: true,
            unread_num: 12,
            mention_num: 3,
            mytask_num: 4,
            message_num: 50,
            file_num: 8,
            task_num: 6,
            icon_path: 'https://example.com/icon5.png',
            last_update_time: 1719487727,
          },
        ]);
      });

      it('should handle zero limit', () => {
        const result = selectPaginatedRooms(validState, 0, 0);

        expect(result).toEqual([]);
      });
    });
  });
});