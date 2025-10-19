-- Create enum for blog status
CREATE TYPE blog_status AS ENUM ('draft', 'published', 'archived');

-- Create blogs table
CREATE TABLE public.blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT NOT NULL,
  thumbnail_url TEXT,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status blog_status DEFAULT 'draft' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blogs
-- Anyone can read published blogs
CREATE POLICY "Published blogs are viewable by everyone"
  ON public.blogs
  FOR SELECT
  USING (status = 'published');

-- Authenticated users can view all their own blogs
CREATE POLICY "Authors can view their own blogs"
  ON public.blogs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = author_id);

-- Authenticated users can create blogs
CREATE POLICY "Authenticated users can create blogs"
  ON public.blogs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

-- Authors can update their own blogs
CREATE POLICY "Authors can update their own blogs"
  ON public.blogs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

-- Authors can delete their own blogs
CREATE POLICY "Authors can delete their own blogs"
  ON public.blogs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create contact messages table
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  read BOOLEAN DEFAULT false NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contact messages
-- Anyone can insert messages
CREATE POLICY "Anyone can create contact messages"
  ON public.contact_messages
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can read messages (admin functionality)
CREATE POLICY "Authenticated users can read messages"
  ON public.contact_messages
  FOR SELECT
  TO authenticated
  USING (true);

-- Only authenticated users can update messages
CREATE POLICY "Authenticated users can update messages"
  ON public.contact_messages
  FOR UPDATE
  TO authenticated
  USING (true);

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON public.blogs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_blogs_status ON public.blogs(status);
CREATE INDEX idx_blogs_author_id ON public.blogs(author_id);
CREATE INDEX idx_blogs_slug ON public.blogs(slug);
CREATE INDEX idx_blogs_created_at ON public.blogs(created_at DESC);
CREATE INDEX idx_contact_messages_created_at ON public.contact_messages(created_at DESC);