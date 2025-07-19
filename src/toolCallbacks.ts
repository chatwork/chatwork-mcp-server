import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { chatworkClient, ChatworkClientResponse } from './chatworkClient';
import { Cache, Room } from './cache';
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
  listRoomsParamsSchema,
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
import { z } from 'zod';

function chatworkClientResponseToCallToolResult(
  res: ChatworkClientResponse,
): CallToolResult {
  if (!res.ok) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: `Error: status code ${res.status}`,
        },
        {
          type: 'resource',
          resource: {
            uri: res.uri,
            text: res.response,
          },
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: res.response,
      },
      {
        type: 'resource',
        resource: {
          uri: res.uri,
          text: 'Chatwork',
        },
      },
    ],
  };
}

export const getMe = () =>
  chatworkClient()
    .request({
      path: '/me',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const getMyStatus = () =>
  chatworkClient()
    .request({
      path: '/my/status',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listMyTasks = (req: z.infer<typeof listMyTasksParamsSchema>) =>
  chatworkClient()
    .request({
      path: '/my/tasks',
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listContacts = () =>
  chatworkClient()
    .request({
      path: '/contacts',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

const roomsCache = new Cache<Room[]>();
export const listRooms = async (args: z.infer<typeof listRoomsParamsSchema>): Promise<CallToolResult> => {
  const { offset = 0, limit = 100 } = args;

  const CACHE_KEY = 'all_rooms';
  const CACHE_TTL = 5 * 60 * 1000; // 5分

  let allRooms = roomsCache.get(CACHE_KEY);

  if (!allRooms) {
    const response = await chatworkClient().request({
      path: '/rooms',
      method: 'GET',
      query: {},
      body: {},
    });

    if (!response.ok) {
      return chatworkClientResponseToCallToolResult(response);
    }

    allRooms = JSON.parse(response.response) as Room[];
    roomsCache.set(CACHE_KEY, allRooms, CACHE_TTL);
  }

  const paginatedRooms = allRooms.slice(offset, offset + limit);

  const paginatedResponse: ChatworkClientResponse = {
    ok: true,
    status: 200,
    response: JSON.stringify(paginatedRooms),
    uri: '/rooms',
  };

  return chatworkClientResponseToCallToolResult(
    paginatedResponse
  );
};

export const createRoom = (req: z.infer<typeof createRoomParamsSchema>) =>
  chatworkClient()
    .request({
      path: '/rooms',
      method: 'POST',
      body: req.body,
      query: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoom = (req: z.infer<typeof getRoomParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoom = (req: z.infer<typeof updateRoomParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const deleteOrLeaveRoom = (
  req: z.infer<typeof deleteOrLeaveRoomParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}`,
      method: 'DELETE',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomMembers = (
  req: z.infer<typeof listRoomMembersParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/members`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomMembers = (
  req: z.infer<typeof updateRoomMembersParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/members`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomMessages = (
  req: z.infer<typeof listRoomMessagesParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages`,
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const postRoomMessage = (
  req: z.infer<typeof postRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages`,
      method: 'POST',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const readRoomMessage = (
  req: z.infer<typeof readRoomMessagesParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/read`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const unreadRoomMessage = (
  req: z.infer<typeof unreadRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/unread`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoomMessage = (
  req: z.infer<typeof getRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/${req.path.message_id}`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomMessage = (
  req: z.infer<typeof updateRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/${req.path.message_id}`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const deleteRoomMessage = (
  req: z.infer<typeof deleteRoomMessageParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/messages/${req.path.message_id}`,
      method: 'DELETE',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomTasks = (req: z.infer<typeof listRoomTasksParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks`,
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const createRoomTask = (
  req: z.infer<typeof createRoomTaskParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks`,
      method: 'POST',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoomTask = (req: z.infer<typeof getRoomTaskParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks/${req.path.task_id}`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomTaskStatus = (
  req: z.infer<typeof updateRoomTasksStatusParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/tasks/${req.path.task_id}/status`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const listRoomFiles = (req: z.infer<typeof listRoomFilesParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/files`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoomFile = (req: z.infer<typeof getRoomFileParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/files/${req.path.file_id}`,
      method: 'GET',
      query: req.query,
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const getRoomLink = (req: z.infer<typeof getRoomLinkParamsSchema>) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const createRoomLink = (
  req: z.infer<typeof createRoomLinkParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'POST',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const updateRoomLink = (
  req: z.infer<typeof updateRoomLinkParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'PUT',
      query: {},
      body: req.body,
    })
    .then(chatworkClientResponseToCallToolResult);

export const deleteRoomLink = (
  req: z.infer<typeof deleteRoomLinkParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/rooms/${req.path.room_id}/link`,
      method: 'DELETE',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const listIncomingRequests = () =>
  chatworkClient()
    .request({
      path: '/incoming_requests',
      method: 'GET',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const acceptIncomingRequest = (
  req: z.infer<typeof acceptIncomingRequestParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/incoming_requests/${req.path.request_id}/accept`,
      method: 'PUT',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);

export const rejectIncomingRequest = (
  req: z.infer<typeof rejectIncomingRequestParamsSchema>,
) =>
  chatworkClient()
    .request({
      path: `/incoming_requests/${req.path.request_id}/reject`,
      method: 'DELETE',
      query: {},
      body: {},
    })
    .then(chatworkClientResponseToCallToolResult);
