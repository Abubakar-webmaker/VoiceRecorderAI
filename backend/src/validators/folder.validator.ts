import { z } from 'zod';
import { FolderColor, FolderIcon } from '@models/Folder.model';

const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

export const createFolderSchema = z.object({
  name: z
    .string({ required_error: 'Folder name is required' })
    .min(1,  'Folder name cannot be empty')
    .max(50, 'Folder name cannot exceed 50 characters')
    .trim(),
  description: z
    .string()
    .max(200)
    .trim()
    .optional()
    .default(''),
  parentId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid parent folder ID')
    .nullable()
    .optional(),
  color: z
    .string()
    .regex(hexColorRegex, 'Invalid color. Use hex format e.g. #6C63FF')
    .optional()
    .default(FolderColor.DEFAULT),
  icon: z
    .nativeEnum(FolderIcon)
    .optional()
    .default(FolderIcon.FOLDER),
  isPinned: z.boolean().optional().default(false),
});

export const updateFolderSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(50)
    .trim()
    .optional(),
  description: z
    .string()
    .max(200)
    .trim()
    .optional(),
  color: z
    .string()
    .regex(hexColorRegex)
    .optional(),
  icon: z
    .nativeEnum(FolderIcon)
    .optional(),
  isPinned: z.boolean().optional(),
});

export const moveFolderSchema = z.object({
  parentId: z
    .string()
    .regex(/^[a-fA-F0-9]{24}$/, 'Invalid parent folder ID')
    .nullable(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type MoveFolderInput   = z.infer<typeof moveFolderSchema>;