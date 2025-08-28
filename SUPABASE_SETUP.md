# Supabase Setup for ProofPay

## Database Policies Issue Fix

The app is currently getting this error when creating users:
```
"new row violates row-level security policy for table \"users\""
```

## How to Fix

### 1. **Go to your Supabase Dashboard**
- Visit: https://app.supabase.com
- Select your ProofPay project

### 2. **Update RLS Policies for Users Table**

Go to **Authentication > Policies** and add/update these policies:

#### **Policy 1: Allow user creation**
```sql
-- Policy Name: "Users can create their own profile"
-- Table: users
-- Operation: INSERT
-- Target roles: authenticated, anon

CREATE POLICY "Users can create their own profile" 
ON users 
FOR INSERT 
WITH CHECK (true);
```

#### **Policy 2: Allow users to read their own data**
```sql
-- Policy Name: "Users can read their own profile"
-- Table: users  
-- Operation: SELECT
-- Target roles: authenticated

CREATE POLICY "Users can read their own profile"
ON users
FOR SELECT
USING (auth.uid() = id OR true);
```

#### **Policy 3: Allow users to update their own data**
```sql
-- Policy Name: "Users can update their own profile" 
-- Table: users
-- Operation: UPDATE
-- Target roles: authenticated

CREATE POLICY "Users can update their own profile"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

### 3. **Alternative: Temporarily Disable RLS (for development only)**

If you want to disable RLS temporarily for development:

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**⚠️ Warning**: Only use this for development. Re-enable RLS for production:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 4. **Check Your Users Table Schema**

Make sure your `users` table has the correct structure:

```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  wallet_address TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### 5. **Test the Fix**

After updating the policies:
1. Restart your app: `npm start`
2. Try creating a user again
3. The RLS error should be resolved

## Next Steps

Once the RLS policies are fixed, the user creation should work properly and you'll see successful user sign-in logs instead of the RLS violation errors.