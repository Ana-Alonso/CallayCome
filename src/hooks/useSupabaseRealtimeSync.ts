import { useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { get_supabase_client } from '../services/supabase_client';
import { App as CapApp } from '@capacitor/app';

interface RealtimeSyncParams {
  supabase_connected: boolean;
  user: User | null;
  profile: Profile | null;
  trigger_push: (title: string, body: string) => void;
  suggestions_handler_ref: React.RefObject<any>;
  planner_ref: React.RefObject<any>;
  pantry_ref: React.RefObject<any>;
  shopping_ref: React.RefObject<any>;
  load_family_data_ref: React.RefObject<any>;
}

export const useSupabaseRealtimeSync = ({
  supabase_connected,
  user,
  profile,
  trigger_push,
  suggestions_handler_ref,
  planner_ref,
  pantry_ref,
  shopping_ref,
  load_family_data_ref
}: RealtimeSyncParams) => {
  useEffect(() => {
    if (!supabase_connected || !user) {
      return;
    }

    const supabase = get_supabase_client();
    if (!supabase) return;

    const sync_unread_notifications = async () => {
      const supabase = get_supabase_client();
      if (!supabase) return;
      try {
        const { data: unread, error } = await supabase
          .from('family_notifications')
          .select('*')
          .eq('recipient_user_id', user.id)
          .is('read_at', null);

        if (error) {
          console.error('[sync] Error fetching unread notifications:', error);
          return;
        }

        if (unread && unread.length > 0) {
          for (const notif of unread) {
            trigger_push(notif.title, notif.body);
            // Mark as read in database
            await supabase
              .from('family_notifications')
              .update({ read_at: new Date().toISOString() })
              .eq('id', notif.id);
          }
        }
      } catch (err) {
        console.error('[sync] Catch error fetching unread notifications:', err);
      }
    };

    const mark_notification_as_read = async (notifId: number) => {
      const supabase = get_supabase_client();
      if (!supabase) return;
      try {
        await supabase
          .from('family_notifications')
          .update({ read_at: new Date().toISOString() })
          .eq('id', notifId);
      } catch (err) {
        console.error('Error marking notification as read:', err);
      }
    };

    // 1. Real-time notifications channel for current user
    const notifications_channel = supabase
      .channel(`notif_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'family_notifications'
        },
        (payload: any) => {
          const new_notif = payload.new;
          if (new_notif && new_notif.recipient_user_id === user.id) {
            trigger_push(new_notif.title, new_notif.body);
            mark_notification_as_read(new_notif.id);
          }
        }
      )
      .subscribe();

    // Sync unread notifications on mount/login
    sync_unread_notifications();

    // Listen for app coming to foreground
    let appStateListener: any = null;
    try {
      CapApp.addListener('appStateChange', (state: any) => {
        if (state.isActive) {
          sync_unread_notifications();
        }
      }).then(handle => {
        appStateListener = handle;
      }).catch(e => {
        console.warn("CapApp listener not supported:", e);
      });
    } catch (e) {
      console.warn("CapApp listener error:", e);
    }

    // 2. Real-time data reload channel for active family or individual planner
    let data_channel: any = null;

    if (profile?.active_family_id) {
      data_channel = supabase
        .channel(`family_${profile.active_family_id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meal_plans',
            filter: `family_id=eq.${profile.active_family_id}`
          },
          () => {
            planner_ref.current.load_planner_data(profile.active_family_id!, user.id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'recipe_suggestions',
            filter: `family_id=eq.${profile.active_family_id}`
          },
          () => {
            suggestions_handler_ref.current.load_suggestions_data(profile.active_family_id!, user?.id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'recipe_suggestion_votes'
          },
          () => {
            suggestions_handler_ref.current.load_suggestions_data(profile.active_family_id!, user?.id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'family_units',
            filter: `id=eq.${profile.active_family_id}`
          },
          () => {
            load_family_data_ref.current(profile.active_family_id!);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pantry',
            filter: `family_id=eq.${profile.active_family_id}`
          },
          () => {
            pantry_ref.current.load_pantry_data(profile.active_family_id!);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopping_list',
            filter: `family_id=eq.${profile.active_family_id}`
          },
          () => {
            shopping_ref.current.load_shopping_data(profile.active_family_id!);
          }
        )
        .subscribe();
    } else {
      data_channel = supabase
        .channel(`user_plan_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'meal_plans',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            planner_ref.current.load_planner_data(null, user.id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'pantry',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            pantry_ref.current.load_pantry_data(null, user.id);
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'shopping_list',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            shopping_ref.current.load_shopping_data(null, user.id);
          }
        )
        .subscribe();
    }

    return () => {
      supabase.removeChannel(notifications_channel);
      if (data_channel) {
        supabase.removeChannel(data_channel);
      }
      if (appStateListener && typeof appStateListener.remove === 'function') {
        appStateListener.remove();
      }
    };
  }, [supabase_connected, user?.id, profile?.active_family_id]);
};
