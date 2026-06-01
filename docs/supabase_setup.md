# Supabase Setup Guide - Beginners 🚀

Follow these step-by-step instructions to create, secure, and connect your database for the AI Calorie Tracker.

---

## 🛠️ Step 1: Create a Free Supabase Project

1. Visit [Supabase.com](https://supabase.com) and click **Sign Up** or **Sign In**.
2. Connect with your GitHub account or signup with your email.
3. Click on the **New Project** button on your dashboard.
4. Fill in the following project parameters:
   - **Organization**: Select your default org.
   - **Name**: `AI-Calorie-Tracker`
   - **Database Password**: Set a secure password and save it somewhere safe.
   - **Region**: Choose a location closest to your users.
   - **Pricing Plan**: Choose the **Free Plan**.
5. Click **Create new project**. Wait 1–2 minutes for the database instance to provision.

---

## 💾 Step 2: Initialize the Database Schema

1. Once your project is ready, click on the **SQL Editor** tab from the left sidebar navigation (represented by the `SQL` terminal icon).
2. Click **New Query** to open an empty SQL query panel.
3. Open the file [schema.sql](file:///c:/Users/ShreyaSomi/Desktop/contri/AI-Calorie-Tracker/supabase/schema.sql) in your project code editor and copy its entire contents.
4. Paste the SQL code into the Supabase SQL editor panel.
5. Click the **Run** button at the bottom right.
6. You should see a success message indicating queries completed successfully. If you check the **Table Editor** tab, you will now see four tables created: `users`, `goals`, `streaks`, and `meals`.

---

## 📷 Step 3: Configure Storage Bucket (For Food Photos)

To upload food photos taken from device cameras:

1. Click on the **Storage** tab on the left sidebar (represented by the folder/bucket icon).
2. Click **New Bucket**.
3. Name the bucket `food-photos`.
4. Toggle **Public Bucket** to **ON** (so food photos can be rendered on dashboards).
5. Click **Save**.
6. Set RLS Policies for Storage:
   - Click **Policies** under the new bucket.
   - Click **New Policy** and select **For full customization**.
   - Set the policy name to `Allow users to upload and view photos`.
   - Check the **Select** and **Insert** checkboxes.
   - Set the policy search check to `auth.uid() = owner` or simply select **public/anonymous access** (select checkbox only) for easy logging. Click **Save**.

---

## 🔑 Step 4: Extract Credentials for Next.js

1. Click on the **Project Settings** (gear icon) in the bottom-left sidebar.
2. Select **API** under settings.
3. Locate the credentials:
   - **Project API keys**: Copy the `anon` `public` key. (Saves to `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **Project URL**: Copy the API URL under **Project Configuration**. (Saves to `NEXT_PUBLIC_SUPABASE_URL`)
4. Paste these values into your local `.env.local` file at the root of the project.
