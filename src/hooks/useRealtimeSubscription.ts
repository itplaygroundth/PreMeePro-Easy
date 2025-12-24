import { useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

interface UseRealtimeOptions {
    table: string;
    onInsert?: (payload: any) => void;
    onUpdate?: (payload: any) => void;
    onDelete?: (payload: any) => void;
    filter?: string;
    schema?: string;
}

export function useRealtimeSubscription({
    table,
    onInsert,
    onUpdate,
    onDelete,
    filter,
    schema = 'public',
}: UseRealtimeOptions) {
    useEffect(() => {
        if (!table) return;

        const channel = supabase
            .channel(`public:${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema,
                    table,
                    filter,
                },
                (payload) => {
                    // console.log('Realtime change:', payload);
                    switch (payload.eventType) {
                        case 'INSERT':
                            if (onInsert) onInsert(payload.new);
                            break;
                        case 'UPDATE':
                            if (onUpdate) onUpdate(payload.new);
                            break;
                        case 'DELETE':
                            if (onDelete) onDelete(payload.old);
                            break;
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [table, filter, schema, onInsert, onUpdate, onDelete]);
}
