import { CallToolResult } from '@modelcontextprotocol/server';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from 'vitest';
import { ChatworkClient } from './chatworkClient';
import {
  acceptIncomingRequest,
  createRoom,
  createRoomLink,
  createRoomTask,
  deleteOrLeaveRoom,
  deleteRoomLink,
  deleteRoomMessage,
  getMe,
  getMyStatus,
  getRoom,
  getRoomFile,
  getRoomLink,
  getRoomMessage,
  getRoomTask,
  listContacts,
  listIncomingRequests,
  listMyTasks,
  listRoomFiles,
  listRoomMembers,
  listRoomMessages,
  listRoomTasks,
  listRooms,
  postRoomMessage,
  readRoomMessage,
  rejectIncomingRequest,
  unreadRoomMessage,
  updateRoom,
  updateRoomLink,
  updateRoomMembers,
  updateRoomMessage,
  updateRoomTaskStatus,
} from './toolCallbacks';

/** ChatworkClientRequest は export されていないので、メソッドの引数型から取り出す */
type ChatworkClientRequest = Parameters<ChatworkClient['request']>[0];

interface RequestCase {
  name: string;
  call: () => Promise<CallToolResult>;
  expected: ChatworkClientRequest;
}

/** 正常系の CallToolResult。全コールバックがこの形に変換する */
const okResult = (text: string, uri: string): CallToolResult => ({
  content: [
    { type: 'text', text },
    { type: 'resource', resource: { uri, text: 'Chatwork' } },
  ],
});

describe('toolCallbacks.ts', () => {
  let request: MockInstance<ChatworkClient['request']>;

  beforeEach(() => {
    // .env.test の実トークンに依存しないよう、ここで固定する
    vi.stubEnv('CHATWORK_API_TOKEN', 'token-for-test');
    request = vi.spyOn(ChatworkClient.prototype, 'request');
    request.mockResolvedValue({
      uri: 'https://api.chatwork.com/v2/me',
      ok: true,
      status: 200,
      response: '{"account_id":1}',
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe('Chatwork API へのリクエスト組み立て', () => {
    const cases: RequestCase[] = [
      {
        name: 'getMe',
        call: () => getMe(),
        expected: { path: '/me', method: 'GET', query: {}, body: {} },
      },
      {
        name: 'getMyStatus',
        call: () => getMyStatus(),
        expected: { path: '/my/status', method: 'GET', query: {}, body: {} },
      },
      {
        name: 'listMyTasks',
        call: () => listMyTasks({ query: { status: 'open' } }),
        expected: {
          path: '/my/tasks',
          method: 'GET',
          query: { status: 'open' },
          body: {},
        },
      },
      {
        name: 'listContacts',
        call: () => listContacts(),
        expected: { path: '/contacts', method: 'GET', query: {}, body: {} },
      },
      {
        name: 'listRooms',
        call: () => listRooms(),
        expected: { path: '/rooms', method: 'GET', query: {}, body: {} },
      },
      {
        name: 'createRoom',
        call: () =>
          createRoom({
            body: {
              name: '新しいグループチャット',
              link: 0,
              link_need_acceptance: 1,
              members_admin_ids: '101,102',
            },
          }),
        expected: {
          path: '/rooms',
          method: 'POST',
          query: {},
          body: {
            name: '新しいグループチャット',
            link: 0,
            link_need_acceptance: 1,
            members_admin_ids: '101,102',
          },
        },
      },
      {
        name: 'getRoom',
        call: () => getRoom({ path: { room_id: 1 } }),
        expected: { path: '/rooms/1', method: 'GET', query: {}, body: {} },
      },
      {
        name: 'updateRoom',
        call: () =>
          updateRoom({ path: { room_id: 1 }, body: { name: '改名後' } }),
        expected: {
          path: '/rooms/1',
          method: 'PUT',
          query: {},
          body: { name: '改名後' },
        },
      },
      {
        name: 'deleteOrLeaveRoom',
        call: () =>
          deleteOrLeaveRoom({
            path: { room_id: 1 },
            body: { action_type: 'leave' },
          }),
        expected: {
          path: '/rooms/1',
          method: 'DELETE',
          query: {},
          body: { action_type: 'leave' },
        },
      },
      {
        name: 'listRoomMembers',
        call: () => listRoomMembers({ path: { room_id: 1 } }),
        expected: {
          path: '/rooms/1/members',
          method: 'GET',
          query: {},
          body: {},
        },
      },
      {
        name: 'updateRoomMembers',
        call: () =>
          updateRoomMembers({
            path: { room_id: 1 },
            body: { members_admin_ids: '101' },
          }),
        expected: {
          path: '/rooms/1/members',
          method: 'PUT',
          query: {},
          body: { members_admin_ids: '101' },
        },
      },
      {
        name: 'listRoomMessages',
        call: () =>
          listRoomMessages({ path: { room_id: 1 }, query: { force: 1 } }),
        expected: {
          path: '/rooms/1/messages',
          method: 'GET',
          query: { force: 1 },
          body: {},
        },
      },
      {
        name: 'postRoomMessage',
        call: () =>
          postRoomMessage({
            path: { room_id: 1 },
            body: { body: 'こんにちは', self_unread: 0 },
          }),
        expected: {
          path: '/rooms/1/messages',
          method: 'POST',
          query: {},
          body: { body: 'こんにちは', self_unread: 0 },
        },
      },
      {
        name: 'readRoomMessage',
        call: () =>
          readRoomMessage({
            path: { room_id: 1 },
            body: { message_id: '1000' },
          }),
        expected: {
          path: '/rooms/1/messages/read',
          method: 'PUT',
          query: {},
          body: { message_id: '1000' },
        },
      },
      {
        name: 'unreadRoomMessage',
        call: () =>
          unreadRoomMessage({
            path: { room_id: 1 },
            body: { message_id: '1000' },
          }),
        expected: {
          path: '/rooms/1/messages/unread',
          method: 'PUT',
          query: {},
          body: { message_id: '1000' },
        },
      },
      {
        name: 'getRoomMessage',
        call: () =>
          getRoomMessage({ path: { room_id: 1, message_id: '1000' } }),
        expected: {
          path: '/rooms/1/messages/1000',
          method: 'GET',
          query: {},
          body: {},
        },
      },
      {
        name: 'updateRoomMessage',
        call: () =>
          updateRoomMessage({
            path: { room_id: 1, message_id: '1000' },
            body: { body: '編集後' },
          }),
        expected: {
          path: '/rooms/1/messages/1000',
          method: 'PUT',
          query: {},
          body: { body: '編集後' },
        },
      },
      {
        name: 'deleteRoomMessage',
        call: () =>
          deleteRoomMessage({ path: { room_id: 1, message_id: '1000' } }),
        expected: {
          path: '/rooms/1/messages/1000',
          method: 'DELETE',
          query: {},
          body: {},
        },
      },
      {
        name: 'listRoomTasks',
        call: () =>
          listRoomTasks({ path: { room_id: 1 }, query: { status: 'open' } }),
        expected: {
          path: '/rooms/1/tasks',
          method: 'GET',
          query: { status: 'open' },
          body: {},
        },
      },
      {
        name: 'createRoomTask',
        call: () =>
          createRoomTask({
            path: { room_id: 1 },
            body: { body: 'タスクの内容', to_ids: '101', limit_type: 'time' },
          }),
        expected: {
          path: '/rooms/1/tasks',
          method: 'POST',
          query: {},
          body: { body: 'タスクの内容', to_ids: '101', limit_type: 'time' },
        },
      },
      {
        name: 'getRoomTask',
        call: () => getRoomTask({ path: { room_id: 1, task_id: 2 } }),
        expected: {
          path: '/rooms/1/tasks/2',
          method: 'GET',
          query: {},
          body: {},
        },
      },
      {
        name: 'updateRoomTaskStatus',
        call: () =>
          updateRoomTaskStatus({
            path: { room_id: 1, task_id: 2 },
            body: { body: 'done' },
          }),
        expected: {
          path: '/rooms/1/tasks/2/status',
          method: 'PUT',
          query: {},
          body: { body: 'done' },
        },
      },
      {
        name: 'listRoomFiles',
        // コールバックは account_id を転送しないので query は空になる
        call: () =>
          listRoomFiles({ path: { room_id: 1 }, query: { account_id: 101 } }),
        expected: {
          path: '/rooms/1/files',
          method: 'GET',
          query: {},
          body: {},
        },
      },
      {
        name: 'getRoomFile',
        call: () =>
          getRoomFile({
            path: { room_id: 1, file_id: 3 },
            query: { create_download_url: 1 },
          }),
        expected: {
          path: '/rooms/1/files/3',
          method: 'GET',
          query: { create_download_url: 1 },
          body: {},
        },
      },
      {
        name: 'getRoomLink',
        call: () => getRoomLink({ path: { room_id: 1 } }),
        expected: {
          path: '/rooms/1/link',
          method: 'GET',
          query: {},
          body: {},
        },
      },
      {
        name: 'createRoomLink',
        call: () =>
          createRoomLink({
            path: { room_id: 1 },
            body: { need_acceptance: 1, description: 'リンクの説明' },
          }),
        expected: {
          path: '/rooms/1/link',
          method: 'POST',
          query: {},
          body: { need_acceptance: 1, description: 'リンクの説明' },
        },
      },
      {
        name: 'updateRoomLink',
        call: () =>
          updateRoomLink({
            path: { room_id: 1 },
            body: { need_acceptance: 0 },
          }),
        expected: {
          path: '/rooms/1/link',
          method: 'PUT',
          query: {},
          body: { need_acceptance: 0 },
        },
      },
      {
        name: 'deleteRoomLink',
        call: () => deleteRoomLink({ path: { room_id: 1 } }),
        expected: {
          path: '/rooms/1/link',
          method: 'DELETE',
          query: {},
          body: {},
        },
      },
      {
        name: 'listIncomingRequests',
        call: () => listIncomingRequests(),
        expected: {
          path: '/incoming_requests',
          method: 'GET',
          query: {},
          body: {},
        },
      },
      {
        name: 'acceptIncomingRequest',
        call: () => acceptIncomingRequest({ path: { request_id: 9 } }),
        expected: {
          path: '/incoming_requests/9/accept',
          method: 'PUT',
          query: {},
          body: {},
        },
      },
      {
        name: 'rejectIncomingRequest',
        call: () => rejectIncomingRequest({ path: { request_id: 9 } }),
        expected: {
          path: '/incoming_requests/9/reject',
          method: 'DELETE',
          query: {},
          body: {},
        },
      },
    ];

    test.each(cases)('$name', async ({ call, expected }) => {
      await call();

      expect(request).toHaveBeenCalledTimes(1);
      expect(request).toHaveBeenCalledWith(expected);
    });
  });

  describe('CallToolResult への変換', () => {
    test('成功時はレスポンス本文と参照先 URI を返す', async () => {
      request.mockResolvedValue({
        uri: 'https://api.chatwork.com/v2/me',
        ok: true,
        status: 200,
        response: '{"account_id":1,"name":"テスト太郎"}',
      });

      await expect(getMe()).resolves.toEqual(
        okResult(
          '{"account_id":1,"name":"テスト太郎"}',
          'https://api.chatwork.com/v2/me',
        ),
      );
    });

    test('失敗時は isError とステータスコード、本文は resource 側に入る', async () => {
      request.mockResolvedValue({
        uri: 'https://api.chatwork.com/v2/me',
        ok: false,
        status: 401,
        response: '{"errors":["Invalid API token"]}',
      });

      await expect(getMe()).resolves.toEqual({
        isError: true,
        content: [
          { type: 'text', text: 'Error: status code 401' },
          {
            type: 'resource',
            resource: {
              uri: 'https://api.chatwork.com/v2/me',
              text: '{"errors":["Invalid API token"]}',
            },
          },
        ],
      });
    });
  });

  describe('#listRooms', () => {
    const uri = 'https://api.chatwork.com/v2/rooms';

    /** room_id / name / type 以外のプロパティも持つ、長さ調整可能なレスポンス */
    const roomsResponse = (count: number) =>
      JSON.stringify(
        Array.from({ length: count }, (_, index) => ({
          room_id: index + 1,
          name: `チャット${index + 1}`,
          type: 'group',
          role: 'admin',
          sticky: false,
          unread_num: 0,
          icon_path: 'https://example.com/icon.png',
          last_update_time: 1700000000,
        })),
      );

    test('2500文字未満ならレスポンスをそのまま返す', async () => {
      const response = roomsResponse(1);
      expect(response.length).toBeLessThan(2500);
      request.mockResolvedValue({ uri, ok: true, status: 200, response });

      await expect(listRooms()).resolves.toEqual(okResult(response, uri));
    });

    test('2500文字以上なら room_id / name / type だけに絞る', async () => {
      const response = roomsResponse(30);
      expect(response.length).toBeGreaterThanOrEqual(2500);
      request.mockResolvedValue({ uri, ok: true, status: 200, response });

      const minified = JSON.stringify(
        Array.from({ length: 30 }, (_, index) => ({
          room_id: index + 1,
          name: `チャット${index + 1}`,
          type: 'group',
        })),
      );
      await expect(listRooms()).resolves.toEqual(okResult(minified, uri));
    });

    test('エラーレスポンスは長くても絞らない', async () => {
      // JSON.parse できない本文が来ても壊れないこと
      const response = 'x'.repeat(3000);
      request.mockResolvedValue({ uri, ok: false, status: 500, response });

      await expect(listRooms()).resolves.toEqual({
        isError: true,
        content: [
          { type: 'text', text: 'Error: status code 500' },
          { type: 'resource', resource: { uri, text: response } },
        ],
      });
    });
  });
});
