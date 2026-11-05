CREATE OR REPLACE FUNCTION public.handle_new_brand()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.brand_kits (brand_id, status, created_at, updated_at)
  VALUES (NEW.id, 'not_started', now(), now());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_brand_created
  AFTER INSERT ON public.brands
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_brand();
