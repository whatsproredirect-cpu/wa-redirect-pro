-- Add campaign and status fields to redirect_links
ALTER TABLE public.redirect_links 
ADD COLUMN IF NOT EXISTS campaign text,
ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'no_contacts'));

-- Add stats columns for tracking
ALTER TABLE public.redirect_links
ADD COLUMN IF NOT EXISTS total_clicks integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_leads integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_lead_at timestamp with time zone;

-- Create function to update link stats
CREATE OR REPLACE FUNCTION public.update_link_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update total_leads and last_lead_at when a new lead is created
  UPDATE public.redirect_links
  SET 
    total_leads = total_leads + 1,
    last_lead_at = NEW.created_at
  WHERE id = NEW.link_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to automatically update stats when leads are created
DROP TRIGGER IF EXISTS update_link_stats_trigger ON public.leads;
CREATE TRIGGER update_link_stats_trigger
  AFTER INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_link_stats();

COMMENT ON COLUMN public.redirect_links.campaign IS 'Campaign or category name for filtering';
COMMENT ON COLUMN public.redirect_links.status IS 'Link status: active, inactive, or no_contacts';
COMMENT ON COLUMN public.redirect_links.total_clicks IS 'Total number of clicks/visits to the redirect page';
COMMENT ON COLUMN public.redirect_links.total_leads IS 'Total number of leads captured';
COMMENT ON COLUMN public.redirect_links.last_lead_at IS 'Timestamp of the most recent lead';