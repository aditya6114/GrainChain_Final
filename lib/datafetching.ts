import { createClient } from './supabaseClient';

export async function createDonation(donationData: {
  donor_id: string;
  food_name: string;
  description?: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string; // should be YYYY-MM-DD
  image?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('donations')
    .insert([
      {
        donor_id: donationData.donor_id,
        food_name: donationData.food_name,
        description: donationData.description,
        quantity: donationData.quantity,
        unit: donationData.unit,
        category: donationData.category,
        expiry_date: donationData.expiry_date, // must be YYYY-MM-DD
        image: donationData.image,
        location: donationData.location,
        latitude: donationData.latitude,
        longitude: donationData.longitude,
        // created_at is handled by DB default
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function fetchDonations() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('donations')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function deleteDonation(id: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from('donations')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
