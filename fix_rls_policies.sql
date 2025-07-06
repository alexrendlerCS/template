-- Fix RLS policies for contracts bucket
-- This script will drop all existing policies and create a super permissive one for debugging

-- First, let's see what policies currently exist
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Drop all existing policies on storage.objects for the contracts bucket
DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;
DROP POLICY IF EXISTS "Enable all access for service role" ON storage.objects;
DROP POLICY IF EXISTS "Allow service role full access" ON storage.objects;
DROP POLICY IF EXISTS "Super permissive policy" ON storage.objects;

-- Create a super permissive policy for debugging
CREATE POLICY "Super permissive policy" ON storage.objects
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'; 