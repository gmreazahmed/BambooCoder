-- Create enum for application roles (if not exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table for role-based access control
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and create new one
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update contact_messages RLS policies to require admin role
DROP POLICY IF EXISTS "Authenticated users can read messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Authenticated users can update messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can read all messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.contact_messages;

CREATE POLICY "Admins can read all messages"
ON public.contact_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update messages"
ON public.contact_messages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Update blogs RLS policies to require admin role for management
DROP POLICY IF EXISTS "Authenticated users can create blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can delete their own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can update their own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Authors can view their own blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can create blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can delete blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can update blogs" ON public.blogs;
DROP POLICY IF EXISTS "Admins can view all blogs" ON public.blogs;

CREATE POLICY "Admins can create blogs"
ON public.blogs
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete blogs"
ON public.blogs
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update blogs"
ON public.blogs
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all blogs"
ON public.blogs
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));