-- Create storage bucket for generated images
INSERT INTO storage.buckets (id, name, public) VALUES ('generated-images', 'generated-images', true);

-- Create RLS policies for the generated-images bucket
CREATE POLICY "Anyone can view generated images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'generated-images');

CREATE POLICY "Anyone can upload generated images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'generated-images');

CREATE POLICY "Anyone can update generated images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'generated-images');

CREATE POLICY "Anyone can delete generated images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'generated-images');