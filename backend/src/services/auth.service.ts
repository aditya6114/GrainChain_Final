import { supabaseAdmin, supabaseAuth } from '../lib/supabase'
import { userRepository } from '../repositories/user.repository'
import { RegisterInput, LoginInput } from '../types/auth.schema'
import { ApiError } from '../utils/api-error'

export const authService = {

  async register(input: RegisterInput) {
    // Step 1: Create the user in Supabase Auth
    // We pass `role` in user_metadata so it gets embedded in the JWT.
    // This is what auth.jwt() -> 'user_metadata' ->> 'role' reads in RLS policies.
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,  // auto-confirm — no verification email in dev
      user_metadata: { role: input.role },
    })

    if (authError) {
      // Supabase returns this message when email is taken
      if (authError.message.includes('already been registered')) {
        throw new ApiError(409, 'EMAIL_EXISTS', 'This email is already registered')
      }
      throw new ApiError(500, 'AUTH_ERROR', authError.message)
    }

    // Step 2: Insert into public.users via repository (keeps DB access in one place)
    try {
      await userRepository.create({
        id: authData.user.id,
        email: input.email,
        name: input.name,
        role: input.role,
      })
    } catch {
      // Rollback: delete the auth user if public.users insert fails
      // Otherwise you'd have an orphaned auth user with no app data
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw new ApiError(500, 'DB_ERROR', 'Failed to create user profile')
    }

    // Step 3: Sign them in immediately so they get a JWT back
    // Alternative: return nothing and make them call /login separately.
    // Signing in here is better UX — register and start using the app immediately.
    const { data: session, error: loginError } = await supabaseAuth.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (loginError) {
      throw new ApiError(500, 'AUTH_ERROR', 'Account created but login failed')
    }

    return {
      user: {
        id: authData.user.id,
        email: input.email,
        name: input.name,
        role: input.role,
      },
      access_token: session.session!.access_token,
      refresh_token: session.session!.refresh_token,
    }
  },

  async login(input: LoginInput) {
    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    })

    if (error) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
    }

    // Read role from the JWT's user_metadata (set during registration)
    const role = data.user.user_metadata?.role

    return {
      user: {
        id: data.user.id,
        email: data.user.email!,
        role,
      },
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
    }
  },
}
