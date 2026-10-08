-- ==============================================================================
-- MINDCHAT COMPLETE PRODUCTION DATABASE SCHEMA
-- Platform: Supabase / PostgreSQL 15+
-- Features: 22 Tables, UUID PKs, Row Level Security, Triggers & Cascade Handlers
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    about TEXT DEFAULT 'Chatting with MindChat',
    online_status TEXT DEFAULT 'online' CHECK (online_status IN ('online', 'offline', 'dnd', 'away')),
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    preferred_language TEXT DEFAULT 'en',
    ai_analysis_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILE_TAGS (Capsule tags e.g. [AI/ML], [Student], [Developer])
CREATE TABLE IF NOT EXISTS public.profile_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    color TEXT DEFAULT 'indigo',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, tag)
);

-- 3. CONTACTS
CREATE TABLE IF NOT EXISTS public.contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    contact_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    nickname TEXT,
    is_favorite BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, contact_user_id)
);

-- 4. CONTACT_BLOCKS
CREATE TABLE IF NOT EXISTS public.contact_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- 5. CHATS (One-to-one or Group)
CREATE TABLE IF NOT EXISTS public.chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL CHECK (type IN ('direct', 'group')),
    name TEXT,
    description TEXT,
    avatar_url TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    default_timer_seconds INTEGER DEFAULT 0, -- 0 means off
    ai_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CHAT_MEMBERS
CREATE TABLE IF NOT EXISTS public.chat_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    is_archived BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    muted_until TIMESTAMPTZ,
    last_read_message_id UUID,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- 7. MESSAGES
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document', 'voice', 'video', 'system')),
    reply_to_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_starred BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    delete_after_read BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. MESSAGE_REACTIONS
CREATE TABLE IF NOT EXISTS public.message_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, emoji)
);

-- 9. MESSAGE_RECEIPTS (Delivery & Read status)
CREATE TABLE IF NOT EXISTS public.message_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'read')),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id, user_id, status)
);

-- 10. MESSAGE_TIMERS (Disappearing messages tracking)
CREATE TABLE IF NOT EXISTS public.message_timers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    duration_seconds INTEGER NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    triggered_at TIMESTAMPTZ,
    is_expired BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ATTACHMENTS
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. STATUSES (Temporary status stories)
CREATE TABLE IF NOT EXISTS public.statuses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT,
    media_url TEXT,
    media_type TEXT CHECK (media_type IN ('text', 'image', 'video')),
    audience TEXT DEFAULT 'contacts' CHECK (audience IN ('contacts', 'everyone', 'close_friends')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. STATUS_VIEWS
CREATE TABLE IF NOT EXISTS public.status_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    status_id UUID NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_id, viewer_id)
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('message', 'mention', 'ai_insight', 'task', 'deadline', 'memory_suggestion')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source_chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. CHAT_STREAKS
CREATE TABLE IF NOT EXISTS public.chat_streaks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    streak_count INTEGER DEFAULT 1,
    last_interaction_date DATE DEFAULT CURRENT_DATE,
    milestone_hit INTEGER DEFAULT 0, -- e.g. 7, 30, 100
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id)
);

-- 16. AI_CLASSIFICATIONS (Message AI intelligence tag)
CREATE TABLE IF NOT EXISTS public.ai_classifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
    classification TEXT NOT NULL CHECK (classification IN ('casual', 'important', 'task', 'reminder', 'deadline', 'event', 'decision', 'useful')),
    confidence FLOAT DEFAULT 0.9,
    extracted_data JSONB, -- { "title": "Project Review", "date": "Tomorrow", "time": "10:00 AM" }
    status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(message_id)
);

-- 17. AI_MEMORIES (Approved intelligence saved by user)
CREATE TABLE IF NOT EXISTS public.ai_memories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('tasks', 'deadlines', 'events', 'decisions', 'projects', 'notes', 'reminders')),
    content TEXT,
    event_timestamp TIMESTAMPTZ,
    source_chat_id UUID REFERENCES public.chats(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. CHAT_SUMMARIES
CREATE TABLE IF NOT EXISTS public.chat_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    requested_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    period_type TEXT NOT NULL CHECK (period_type IN ('today', '7_days', 'custom', 'entire')),
    summary_content JSONB NOT NULL, -- { "topics": [...], "decisions": [...], "tasks": [...], "action_items": [...] }
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 19. TASKS (Extracted action items)
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    due_date TIMESTAMPTZ,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 20. REMINDERS
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    remind_at TIMESTAMPTZ NOT NULL,
    is_sent BOOLEAN DEFAULT FALSE,
    source_message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 21. PRIVACY_SETTINGS
CREATE TABLE IF NOT EXISTS public.privacy_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    see_profile_photo TEXT DEFAULT 'everyone' CHECK (see_profile_photo IN ('everyone', 'contacts', 'nobody')),
    see_online_status TEXT DEFAULT 'everyone' CHECK (see_online_status IN ('everyone', 'contacts', 'nobody')),
    see_last_seen TEXT DEFAULT 'contacts' CHECK (see_last_seen IN ('everyone', 'contacts', 'nobody')),
    see_about TEXT DEFAULT 'everyone' CHECK (see_about IN ('everyone', 'contacts', 'nobody')),
    see_status TEXT DEFAULT 'contacts' CHECK (see_status IN ('everyone', 'contacts', 'nobody')),
    read_receipts_enabled BOOLEAN DEFAULT TRUE,
    streaks_enabled BOOLEAN DEFAULT TRUE,
    default_timer_seconds INTEGER DEFAULT 0,
    ai_chat_analysis_enabled BOOLEAN DEFAULT TRUE,
    ai_memory_suggestions_enabled BOOLEAN DEFAULT TRUE,
    ai_summaries_enabled BOOLEAN DEFAULT TRUE,
    ai_search_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 22. CALL_RECORDS (Calling architecture & history)
CREATE TABLE IF NOT EXISTS public.call_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    caller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    call_type TEXT NOT NULL CHECK (call_type IN ('voice', 'video')),
    status TEXT NOT NULL CHECK (status IN ('completed', 'missed', 'rejected', 'busy')),
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_members_user_id ON public.chat_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_members_chat_id ON public.chat_members(chat_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user_id ON public.ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_category ON public.ai_memories(category);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_timers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_records ENABLE ROW LEVEL SECURITY;

-- Profiles: Public read, User update/insert own
CREATE POLICY "Profiles are viewable by authenticated users" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Profile Tags
CREATE POLICY "Profile tags viewable by all" ON public.profile_tags FOR SELECT USING (true);
CREATE POLICY "Users manage own tags" ON public.profile_tags FOR ALL USING (auth.uid() = user_id);

-- Contacts
CREATE POLICY "Users can view contacts" ON public.contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert contacts" ON public.contacts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete contacts" ON public.contacts FOR DELETE USING (auth.uid() = user_id);

-- Chats
CREATE POLICY "Members can view their chats" ON public.chats FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = chats.id AND chat_members.user_id = auth.uid())
);
CREATE POLICY "Authenticated users can create chats" ON public.chats FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Members can update their chats" ON public.chats FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = chats.id AND chat_members.user_id = auth.uid())
);

-- Chat Members: Members can view members of chats they belong to
CREATE POLICY "Members can view members of their chats" ON public.chat_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_members cm WHERE cm.chat_id = chat_members.chat_id AND cm.user_id = auth.uid())
);
CREATE POLICY "Users can insert membership" ON public.chat_members FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Messages: Only chat members can read/send messages
CREATE POLICY "Members can read chat messages" ON public.messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = messages.chat_id AND chat_members.user_id = auth.uid())
);
CREATE POLICY "Members can send messages" ON public.messages FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (SELECT 1 FROM public.chat_members WHERE chat_members.chat_id = messages.chat_id AND chat_members.user_id = auth.uid())
);
CREATE POLICY "Senders can edit their messages" ON public.messages FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Senders can delete their messages" ON public.messages FOR DELETE USING (auth.uid() = sender_id);

-- AI Memories: Strictly private to user
CREATE POLICY "Users can only view their own AI memories" ON public.ai_memories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own AI memories" ON public.ai_memories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own AI memories" ON public.ai_memories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own AI memories" ON public.ai_memories FOR DELETE USING (auth.uid() = user_id);

-- Privacy Settings: Strictly private to user
CREATE POLICY "Users can only access their privacy settings" ON public.privacy_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their privacy settings" ON public.privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their privacy settings" ON public.privacy_settings FOR UPDATE USING (auth.uid() = user_id);

-- Notifications: Strictly private to user
CREATE POLICY "Users can only access their notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER FOR AUTH USERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    about,
    online_status,
    preferred_language,
    ai_analysis_enabled
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1) || '_' || substr(NEW.id::text, 1, 4)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'),
    COALESCE(NEW.raw_user_meta_data->>'about', 'Chatting with MindChat'),
    'online',
    'en',
    TRUE
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    username = EXCLUDED.username;

  -- Default privacy settings
  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- ENABLE SUPABASE REALTIME REPLICATION FOR MESSAGES & CHATS
-- ==============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'chat_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
  END IF;
END $$;
