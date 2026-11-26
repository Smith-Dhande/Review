import { z } from 'zod'
import { validatePasswordComplexity } from '../utils/password.js'

export const loginSchema = z.object({
  email: z.string().trim().email('Valid email is required').max(140),
  password: z.string().min(1, 'Password is required').max(128),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128),
    newPassword: z
      .string()
      .min(10, 'New password must be at least 10 characters')
      .max(128)
      .superRefine((val, ctx) => {
        const msg = validatePasswordComplexity(val)
        if (msg) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: msg })
        }
      }),
    confirmPassword: z.string().min(1).max(128).optional(),
  })
  .refine(
    (data) =>
      data.confirmPassword === undefined ||
      data.newPassword === data.confirmPassword,
    {
      message: 'New password and confirmation do not match',
      path: ['confirmPassword'],
    },
  )
