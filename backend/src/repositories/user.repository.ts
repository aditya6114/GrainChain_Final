import { supabaseAdmin } from '../lib/supabase'
import { ApiError } from '../utils/api-error'

export const userRepository = {

  async create(user: {
    id: string
    email: string
    name: string
    role: 'donor' | 'recipient' | 'volunteer'
  }) {
    const { data, error } = await supabaseAdmin
      .from('users')
      .insert(user)
      .select()
      .single()

    if (error) throw new ApiError(500, 'DB_ERROR', error.message)
    return data
  },
}
