-- Add public SELECT policy for redirect_links (needed for public redirect pages)
CREATE POLICY "Public can view redirect links by slug"
  ON public.redirect_links FOR SELECT
  USING (true);

-- Add public SELECT policy for redirect_contacts (needed for rotation)
CREATE POLICY "Public can view redirect contacts"
  ON public.redirect_contacts FOR SELECT
  USING (true);

-- Update redirect_state to allow public updates (needed for rotation)
CREATE POLICY "Public can update redirect state"
  ON public.redirect_state FOR UPDATE
  USING (true);