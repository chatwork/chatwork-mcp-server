import { z } from 'zod';

/**
 * Zod schema for ChatWork Room object
 * @see https://developer.chatwork.com/reference/get-rooms
 */
export const roomSchema = z.object({
  room_id: z.number().int().positive().describe('ルームID'),

  name: z.string().min(1).describe('ルーム名'),

  type: z
    .enum(['my', 'direct', 'group'])
    .describe(
      'ルームタイプ (my: マイチャット, direct: ダイレクトチャット, group: グループチャット)',
    ),

  role: z
    .enum(['admin', 'member', 'readonly'])
    .describe(
      'ルールでの自分の権限 (admin: 管理者, member: メンバー, readonly: 閲覧のみ)',
    ),

  sticky: z.boolean().describe('スティッキー (お気に入り) 設定'),

  unread_num: z.number().int().min(0).describe('未読メッセージ数'),

  mention_num: z.number().int().min(0).describe('自分宛てのメンション数'),

  mytask_num: z.number().int().min(0).describe('自分が担当者のタスク数'),

  message_num: z.number().int().min(0).describe('総メッセージ数'),

  file_num: z.number().int().min(0).describe('ファイル数'),

  task_num: z.number().int().min(0).describe('タスク数'),

  icon_path: z.string().url().describe('ルームアイコンのURL'),

  last_update_time: z
    .number()
    .int()
    .positive()
    .describe('最終更新日時 (UNIX timestamp)'),
});

/**
 * TypeScript type inferred from Zod schema
 */
export type Room = z.infer<typeof roomSchema>;

/**
 * Array of rooms schema
 */
export const roomsArraySchema = z.array(roomSchema);

/**
 * Validation helper functions
 */
export const validateRoom = (data: unknown): Room => {
  return roomSchema.parse(data);
};

export const validateRoomsArray = (data: unknown): Room[] => {
  return roomsArraySchema.parse(data);
};

/**
 * Safe validation that returns null on failure
 */
export const safeValidateRoom = (data: unknown): Room | null => {
  const result = roomSchema.safeParse(data);
  return result.success ? result.data : null;
};

export const safeValidateRoomsArray = (data: unknown): Room[] | null => {
  const result = roomsArraySchema.safeParse(data);
  return result.success ? result.data : null;
};
