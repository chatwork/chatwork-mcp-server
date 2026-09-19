import { McpServer } from '@modelcontextprotocol/server';
import {
  acceptIncomingRequestParamsSchema,
  createRoomLinkParamsSchema,
  createRoomParamsSchema,
  createRoomTaskParamsSchema,
  deleteOrLeaveRoomParamsSchema,
  deleteRoomLinkParamsSchema,
  deleteRoomMessageParamsSchema,
  getRoomFileParamsSchema,
  getRoomLinkParamsSchema,
  getRoomMessageParamsSchema,
  getRoomParamsSchema,
  getRoomTaskParamsSchema,
  listMyTasksParamsSchema,
  listRoomFilesParamsSchema,
  listRoomMembersParamsSchema,
  listRoomMessagesParamsSchema,
  listRoomTasksParamsSchema,
  postRoomMessageParamsSchema,
  readRoomMessagesParamsSchema,
  rejectIncomingRequestParamsSchema,
  unreadRoomMessageParamsSchema,
  updateRoomLinkParamsSchema,
  updateRoomMembersParamsSchema,
  updateRoomMessageParamsSchema,
  updateRoomParamsSchema,
  updateRoomTasksStatusParamsSchema,
} from './schema';
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
  listRooms,
  listRoomTasks,
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

export function createServer() {
  const server = new McpServer({
    name: 'Chatwork',
    version: __PACKAGE_VERSION__,
  });

  server.registerTool(
    'get_me',
    { description: '自分自身の情報を取得します。' },
    getMe,
  );
  server.registerTool(
    'get_my_status',
    {
      description:
        '自分の未読数、自分宛ての未読の数、未完了タスク数を取得します。',
    },
    getMyStatus,
  );
  server.registerTool(
    'list_my_tasks',
    {
      description: '自分のタスク一覧を最大100件まで取得します。',
      inputSchema: listMyTasksParamsSchema,
    },
    listMyTasks,
  );
  server.registerTool(
    'list_contacts',
    { description: '自分のコンタクト一覧を取得します。' },
    listContacts,
  );
  server.registerTool(
    'list_rooms',
    { description: 'チャット一覧を取得します。' },
    listRooms,
  );
  server.registerTool(
    'create_room',
    {
      description: '新しいグループチャットを作成します。',
      inputSchema: createRoomParamsSchema,
    },
    createRoom,
  );
  server.registerTool(
    'get_room',
    {
      description: 'チャットの情報（名前、アイコン、種類など）を取得します。',
      inputSchema: getRoomParamsSchema,
    },
    getRoom,
  );
  server.registerTool(
    'update_room',
    {
      description: 'チャットの情報（名前、アイコンなど）を変更します。',
      inputSchema: updateRoomParamsSchema,
    },
    updateRoom,
  );
  server.registerTool(
    'delete_or_leave_room',
    {
      description:
        'グループチャットを退席、または削除します。グループチャットを退席すると、このグループチャットにある自分が担当者のタスク、および自分が送信したファイルがすべて削除されます。グループチャットを削除すると、このグループチャットにあるメッセージ、タスク、ファイルがすべて削除されます。（一度削除すると元に戻せません。）',
      inputSchema: deleteOrLeaveRoomParamsSchema,
    },
    deleteOrLeaveRoom,
  );
  server.registerTool(
    'list_room_members',
    {
      description: 'チャットのメンバー一覧を取得します。',
      inputSchema: listRoomMembersParamsSchema,
    },
    listRoomMembers,
  );
  server.registerTool(
    'update_room_members',
    {
      description: 'チャットのメンバーを一括で変更します。',
      inputSchema: updateRoomMembersParamsSchema,
    },
    updateRoomMembers,
  );
  server.registerTool(
    'list_room_messages',
    {
      description: 'チャットのメッセージ一覧を最大100件まで取得します。',
      inputSchema: listRoomMessagesParamsSchema,
    },
    listRoomMessages,
  );
  server.registerTool(
    'post_room_message',
    {
      description: 'チャットに新しいメッセージを投稿します。',
      inputSchema: postRoomMessageParamsSchema,
    },
    postRoomMessage,
  );
  server.registerTool(
    'read_room_messages',
    {
      description: 'チャットのメッセージを既読にします。',
      inputSchema: readRoomMessagesParamsSchema,
    },
    readRoomMessage,
  );
  server.registerTool(
    'unread_room_message',
    {
      description: 'チャットのメッセージを未読にします。',
      inputSchema: unreadRoomMessageParamsSchema,
    },
    unreadRoomMessage,
  );
  server.registerTool(
    'get_room_message',
    {
      description: 'チャットのメッセージを取得します。',
      inputSchema: getRoomMessageParamsSchema,
    },
    getRoomMessage,
  );
  server.registerTool(
    'update_room_message',
    {
      description: 'チャットのメッセージを更新します。',
      inputSchema: updateRoomMessageParamsSchema,
    },
    updateRoomMessage,
  );
  server.registerTool(
    'delete_room_message',
    {
      description: 'チャットのメッセージを削除します。',
      inputSchema: deleteRoomMessageParamsSchema,
    },
    deleteRoomMessage,
  );
  server.registerTool(
    'list_room_tasks',
    {
      description: 'チャットのタスク一覧を最大100件まで取得します。',
      inputSchema: listRoomTasksParamsSchema,
    },
    listRoomTasks,
  );
  server.registerTool(
    'create_room_task',
    {
      description: 'チャットに新しいタスクを追加します。',
      inputSchema: createRoomTaskParamsSchema,
    },
    createRoomTask,
  );
  server.registerTool(
    'get_room_task',
    {
      description: 'チャットのタスクの情報を取得します。',
      inputSchema: getRoomTaskParamsSchema,
    },
    getRoomTask,
  );
  server.registerTool(
    'update_room_task_status',
    {
      description: 'チャットのタスクの完了状態を変更します。',
      inputSchema: updateRoomTasksStatusParamsSchema,
    },
    updateRoomTaskStatus,
  );
  server.registerTool(
    'list_room_files',
    {
      description: 'チャットのファイル一覧を最大100件まで取得します。',
      inputSchema: listRoomFilesParamsSchema,
    },
    listRoomFiles,
  );
  server.registerTool(
    'get_room_file',
    {
      description: 'チャットのファイルの情報を取得します。',
      inputSchema: getRoomFileParamsSchema,
    },
    getRoomFile,
  );
  server.registerTool(
    'get_room_link',
    {
      description: 'チャットへの招待リンクを取得します。',
      inputSchema: getRoomLinkParamsSchema,
    },
    getRoomLink,
  );
  server.registerTool(
    'create_room_link',
    {
      description:
        'チャットへの招待リンクを作成します。すでに招待リンクが作成されている場合は400エラーを返します。',
      inputSchema: createRoomLinkParamsSchema,
    },
    createRoomLink,
  );
  server.registerTool(
    'update_room_link',
    {
      description:
        'チャットへの招待リンクを変更します。招待リンクが無効になっている場合は400エラーを返します。',
      inputSchema: updateRoomLinkParamsSchema,
    },
    updateRoomLink,
  );
  server.registerTool(
    'delete_room_link',
    {
      description:
        'チャットへの招待リンクを削除します。招待リンクが無効になっている場合は400エラーを返します。',
      inputSchema: deleteRoomLinkParamsSchema,
    },
    deleteRoomLink,
  );
  server.registerTool(
    'list_incoming_requests',
    {
      description: '自分へのコンタクト承認依頼一覧を最大100件まで取得します。',
    },
    listIncomingRequests,
  );
  server.registerTool(
    'accept_incoming_request',
    {
      description: '自分へのコンタクト承認依頼を承認します。',
      inputSchema: acceptIncomingRequestParamsSchema,
    },
    acceptIncomingRequest,
  );
  server.registerTool(
    'reject_incoming_request',
    {
      description: '自分へのコンタクト承認依頼を拒否します。',
      inputSchema: rejectIncomingRequestParamsSchema,
    },
    rejectIncomingRequest,
  );

  return server;
}
