-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create redirect_links table
CREATE TABLE public.redirect_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  mode TEXT NOT NULL CHECK (mode IN ('form', 'direct')),
  capture_name BOOLEAN DEFAULT true,
  capture_phone BOOLEAN DEFAULT true,
  pixel_id TEXT,
  pixel_event TEXT DEFAULT 'Contact',
  message_template TEXT DEFAULT 'Olá! Gostaria de mais informações.',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create redirect_contacts table (attendants/WhatsApp numbers)
CREATE TABLE public.redirect_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES public.redirect_links(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(link_id, order_index)
);

-- Create redirect_state table (track current rotation index)
CREATE TABLE public.redirect_state (
  link_id UUID PRIMARY KEY REFERENCES public.redirect_links(id) ON DELETE CASCADE,
  current_index INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id UUID NOT NULL REFERENCES public.redirect_links(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.redirect_contacts(id) ON DELETE SET NULL,
  name TEXT,
  phone TEXT,
  ip_address TEXT,
  user_agent TEXT,
  redirected_to TEXT,
  utm_source TEXT,
  utm_campaign TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create logs table
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL,
  level TEXT NOT NULL,
  payload JSONB,
  status TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirect_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirect_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirect_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view their own workspaces"
  ON public.workspaces FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create their own workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own workspaces"
  ON public.workspaces FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own workspaces"
  ON public.workspaces FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for redirect_links
CREATE POLICY "Users can view links in their workspaces"
  ON public.redirect_links FOR SELECT
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create links in their workspaces"
  ON public.redirect_links FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can update links in their workspaces"
  ON public.redirect_links FOR UPDATE
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete links in their workspaces"
  ON public.redirect_links FOR DELETE
  USING (
    workspace_id IN (
      SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
    )
  );

-- RLS Policies for redirect_contacts
CREATE POLICY "Users can view contacts in their links"
  ON public.redirect_contacts FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.redirect_links 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create contacts in their links"
  ON public.redirect_contacts FOR INSERT
  WITH CHECK (
    link_id IN (
      SELECT id FROM public.redirect_links 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update contacts in their links"
  ON public.redirect_contacts FOR UPDATE
  USING (
    link_id IN (
      SELECT id FROM public.redirect_links 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete contacts in their links"
  ON public.redirect_contacts FOR DELETE
  USING (
    link_id IN (
      SELECT id FROM public.redirect_links 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- RLS Policies for redirect_state
CREATE POLICY "Users can view state of their links"
  ON public.redirect_state FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.redirect_links 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update state of their links"
  ON public.redirect_state FOR UPDATE
  USING (
    link_id IN (
      SELECT id FROM public.redirect_links 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "Public can insert redirect state"
  ON public.redirect_state FOR INSERT
  WITH CHECK (true);

-- RLS Policies for leads (users can view leads from their links)
CREATE POLICY "Users can view leads from their links"
  ON public.leads FOR SELECT
  USING (
    link_id IN (
      SELECT id FROM public.redirect_links 
      WHERE workspace_id IN (
        SELECT id FROM public.workspaces WHERE owner_id = auth.uid()
      )
    )
  );

-- Public can insert leads (for redirect functionality)
CREATE POLICY "Public can create leads"
  ON public.leads FOR INSERT
  WITH CHECK (true);

-- RLS Policies for logs
CREATE POLICY "Users can view their workspace logs"
  ON public.logs FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Public can insert logs"
  ON public.logs FOR INSERT
  WITH CHECK (true);

-- Create function to get next contact in rotation
CREATE OR REPLACE FUNCTION public.get_next_contact(p_link_id UUID)
RETURNS TABLE (
  contact_id UUID,
  phone TEXT,
  order_index INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_index INTEGER;
  v_max_index INTEGER;
  v_next_index INTEGER;
BEGIN
  -- Get current index
  SELECT current_index INTO v_current_index
  FROM redirect_state
  WHERE link_id = p_link_id;
  
  -- If no state exists, create it
  IF v_current_index IS NULL THEN
    INSERT INTO redirect_state (link_id, current_index)
    VALUES (p_link_id, 0)
    ON CONFLICT (link_id) DO NOTHING;
    v_current_index := 0;
  END IF;
  
  -- Get max index
  SELECT MAX(redirect_contacts.order_index) INTO v_max_index
  FROM redirect_contacts
  WHERE redirect_contacts.link_id = p_link_id;
  
  -- If no contacts, return null
  IF v_max_index IS NULL THEN
    RETURN;
  END IF;
  
  -- Calculate next index (circular)
  v_next_index := v_current_index % (v_max_index + 1);
  
  -- Update state
  UPDATE redirect_state
  SET current_index = v_next_index + 1,
      updated_at = NOW()
  WHERE link_id = p_link_id;
  
  -- Return contact
  RETURN QUERY
  SELECT rc.id, rc.phone, rc.order_index
  FROM redirect_contacts rc
  WHERE rc.link_id = p_link_id
    AND rc.order_index = v_next_index
  LIMIT 1;
END;
$$;