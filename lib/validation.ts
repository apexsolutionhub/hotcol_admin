import { z } from 'zod'
export const credentialForm = z.object({
    HotelName: z.string().min(2, 'Hotel Name is required'),
    UserName: z.string().min(2, 'UserName is required'),
    Password: z.string().min(6, 'Password must be at least 6 characters long'),
    LogoUrl: z.string().min(2, 'Logo URL is required'),
    Role: z.string().min(1, 'Role is required'),
})

export const loginSchema = z.object({
    username: z.string().min(2, "Please Enter valid username"),
    password: z.string().min(6, "Please Enter valid password")
})

export type login = z.infer<typeof loginSchema>
export type credential = z.infer<typeof credentialForm>