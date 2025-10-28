import { supabase } from '../lib/supabase';
import type { FunnelData } from '../types';

export class FunnelService {
  static async getFunnelData(userId: string, year: number): Promise<FunnelData[]> {
    try {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('user_id', userId)
        .eq('year', year)
        .order('month', { ascending: true });

      if (error) {
        console.error('Error fetching funnel data:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching funnel data:', error);
      return [];
    }
  }

  static async saveFunnelData(userId: string, funnelData: FunnelData): Promise<boolean> {
    try {
      console.log('Saving funnel data:', { userId, funnelData });
      
      // First, check if a record exists for this user/year/month combination
      const { data: existingData, error: fetchError } = await supabase
        .from('funnels')
        .select('id')
        .eq('user_id', userId)
        .eq('year', funnelData.year)
        .eq('month', funnelData.month)
        .single();

      const recordId = existingData?.id || undefined;

      const { error } = await supabase
        .from('funnels')
        .upsert({
          id: recordId, // Use existing ID or let database generate new one
          user_id: userId,
          year: funnelData.year,
          month: funnelData.month,
          inquiries: funnelData.inquiries || 0,
          calls_booked: funnelData.callsBooked || 0,
          calls_taken: funnelData.callsTaken || 0,
          closes: funnelData.closes || 0,
          bookings: funnelData.bookings || 0,
          cash: funnelData.cash || 0,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,year,month'
        });

      if (error) {
        console.error('Error saving funnel data:', error);
        return false;
      }

      console.log('Successfully saved funnel data');
      return true;
    } catch (error) {
      console.error('Error saving funnel data:', error);
      return false;
    }
  }

  static async deleteFunnelData(userId: string, funnelId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('funnels')
        .delete()
        .eq('id', funnelId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting funnel data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting funnel data:', error);
      return false;
    }
  }
}
