-- ==============================================================================
-- MINDCHAT V2 ENHANCEMENTS MIGRATION
-- Features:
-- 1. Starred Messages (user-isolated starring with full RLS)
-- 2. Call Records (comprehensive calling architecture & logs with RLS)
-- 3. Scheduled Messages (server-side scheduled delivery & pg_cron job)
-- ==============================================================================

-- 1. STARRED_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.starred_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_starred_messages_user_id ON public.starred_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_starred_messages_chat_id ON public.starred_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_starred_messages_message_id ON public.starred_messages(message_id);

ALTER TABLE public.starred_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own starred messages" ON public.starred_messages;
CREATE POLICY "Users can view their own starred messages" 
    ON public.starred_messages FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can star messages" ON public.starred_messages;
CREATE POLICY "Users can star messages" 
    ON public.starred_messages FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can unstar messages" ON public.starred_messages;
CREATE POLICY "Users can unstar messages" 
    ON public.starred_messages FOR DELETE 
    USING (auth.uid() = user_id);


-- 2. CALL_RECORDS RLS POLICIES & ENHANCEMENTS
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own call records" ON public.call_records;
CREATE POLICY "Users can view their own call records" 
    ON public.call_records FOR SELECT 
    USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Users can insert call records as caller" ON public.call_records;
CREATE POLICY "Users can insert call records as caller" 
    ON public.call_records FOR INSERT 
    WITH CHECK (auth.uid() = caller_id);

DROP POLICY IF EXISTS "Participants can update call records" ON public.call_records;
CREATE POLICY "Participants can update call records" 
    ON public.call_records FOR UPDATE 
    USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Participants can delete call records" ON public.call_records;
CREATE POLICY "Participants can delete call records" 
    ON public.call_records FOR DELETE 
    USING (auth.uid() = caller_id OR auth.uid() = receiver_id);


-- 3. SCHEDULED_MESSAGES TABLE
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'voice', 'video', 'system')),
    scheduled_for TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    delivered_at TIMESTAMPTZ,
    delivery_error TEXT
);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_due 
    ON public.scheduled_messages(scheduled_for) 
    WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_sender 
    ON public.scheduled_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_chat 
    ON public.scheduled_messages(chat_id);

ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Senders can view their scheduled messages" ON public.scheduled_messages;
CREATE POLICY "Senders can view their scheduled messages" 
    ON public.scheduled_messages FOR SELECT 
    USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Senders can insert scheduled messages" ON public.scheduled_messages;
CREATE POLICY "Senders can insert scheduled messages" 
    ON public.scheduled_messages FOR INSERT 
    WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.chat_members 
            WHERE chat_members.chat_id = scheduled_messages.chat_id 
              AND chat_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Senders can update scheduled messages" ON public.scheduled_messages;
CREATE POLICY "Senders can update scheduled messages" 
    ON public.scheduled_messages FOR UPDATE 
    USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Senders can delete scheduled messages" ON public.scheduled_messages;
CREATE POLICY "Senders can delete scheduled messages" 
    ON public.scheduled_messages FOR DELETE 
    USING (auth.uid() = sender_id);


-- 4. SERVER-SIDE AUTOMATED DELIVERY FUNCTION
-- This function runs server-side to deliver any scheduled message that is due.
-- It can be executed via pg_cron, via Edge Functions, or invoked via RPC.
CREATE OR REPLACE FUNCTION public.process_due_scheduled_messages()
RETURNS INTEGER AS $$
DECLARE
    r RECORD;
    processed_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT * FROM public.scheduled_messages 
        WHERE status = 'pending' AND scheduled_for <= NOW()
        ORDER BY scheduled_for ASC
        FOR UPDATE SKIP LOCKED
    LOOP
        -- Insert message directly into chat messages table
        INSERT INTO public.messages (
            chat_id, 
            sender_id, 
            content, 
            message_type, 
            created_at,
            updated_at
        )
        VALUES (
            r.chat_id, 
            r.sender_id, 
            r.content, 
            r.message_type, 
            r.scheduled_for,
            NOW()
        );

        -- Mark the scheduled message record as delivered
        UPDATE public.scheduled_messages
        SET 
            status = 'delivered', 
            delivered_at = NOW(), 
            updated_at = NOW()
        WHERE id = r.id;

        processed_count := processed_count + 1;
    END LOOP;

    RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users so client or edge function can trigger
GRANT EXECUTE ON FUNCTION public.process_due_scheduled_messages() TO authenticated, anon;


-- 5. PG_CRON SCHEDULE (Optional extension for automatic 1-minute database daemon)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        PERFORM cron.unschedule('process-due-scheduled-messages');
        PERFORM cron.schedule(
            'process-due-scheduled-messages',
            '* * * * *',
            'SELECT public.process_due_scheduled_messages();'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If pg_cron is not enabled or permission restricted, continue gracefully
        NULL;
END $$;

-- 6. ENABLE SUPABASE REALTIME REPLICATION FOR NEW TABLES
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'starred_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.starred_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'scheduled_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.scheduled_messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'call_records'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.call_records;
    END IF;
END $$;
