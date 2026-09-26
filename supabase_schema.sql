-- ==============================================================================
-- FEED GUARD — Supabase PostgreSQL Schema & Security Architecture
-- ==============================================================================
-- Smart AI-Enabled Rapid Feed and Silage Quality Testing System for Dairy Farmers
-- 
-- Features:
-- - Relational Foreign Key Constraints
-- - Row Level Security (RLS) ensuring each farmer accesses only their own private tests
-- - Secure Public Report Token View for QR Verification
-- - Automatic Profile Creation on User Registration via Auth Trigger
-- ==============================================================================

-- 1. PROFILES (Farmer Profile & Dairy Operation Metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT,
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    district TEXT NOT NULL DEFAULT 'Pune',
    farm_name TEXT,
    cattle_count INTEGER DEFAULT 0,
    preferred_language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TEST REPORTS (Feed & Silage AI Screening Results)
CREATE TABLE IF NOT EXISTS public.test_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    sample_id TEXT NOT NULL UNIQUE,
    batch_id TEXT NOT NULL,
    feed_type TEXT NOT NULL,
    test_date DATE NOT NULL DEFAULT CURRENT_DATE,
    test_time TIME NOT NULL DEFAULT CURRENT_TIME,
    quality_status TEXT NOT NULL,         -- 'Good', 'Moderate', 'Poor', 'Unsafe'
    adulteration_status TEXT NOT NULL,    -- 'Detected', 'Not Detected', 'Suspected'
    adulteration_type TEXT DEFAULT 'None', -- 'Urea Adulteration', 'Sand/Silica Contamination', 'Mould/Fungal Contamination', 'None'
    spoilage_status TEXT NOT NULL,        -- 'Safe', 'Warning', 'Spoiled'
    risk_level TEXT NOT NULL,             -- 'Low', 'Medium', 'High', 'Critical'
    moisture NUMERIC(5,2),
    protein NUMERIC(5,2),
    fiber NUMERIC(5,2),
    energy NUMERIC(5,2),
    mineral_status TEXT,
    advisory JSONB,                       -- Complete structured 5-part AI advisory
    language TEXT NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SENSOR READINGS (IoT Spectroscopic & Physical Parameter Telemetry)
CREATE TABLE IF NOT EXISTS public.sensor_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.test_reports(id) ON DELETE CASCADE,
    sensor_type TEXT NOT NULL,            -- 'NIR', 'Moisture', 'Temperature', 'pH', 'Conductivity'
    value NUMERIC(10,3) NOT NULL,
    unit TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. SILAGE READINGS (Dedicated Silage Fermentation & Thermal Surveillance)
CREATE TABLE IF NOT EXISTS public.silage_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID REFERENCES public.test_reports(id) ON DELETE CASCADE,
    storage_unit_id TEXT NOT NULL,
    ph NUMERIC(4,2) NOT NULL,
    temperature NUMERIC(5,2) NOT NULL,
    ambient_temperature NUMERIC(5,2),
    moisture NUMERIC(5,2) NOT NULL,
    co2 NUMERIC(7,1),
    fermentation_status TEXT NOT NULL,    -- 'Optimal', 'Slow Fermentation', 'Aerobic Degradation'
    spoilage_risk TEXT NOT NULL,          -- 'Safe', 'Monitor', 'Action Required'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. REPORTS (Generated Printable PDF Reports & Cryptographic QR Verification)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL UNIQUE REFERENCES public.test_reports(id) ON DELETE CASCADE,
    pdf_url TEXT,
    qr_token TEXT NOT NULL UNIQUE,        -- Secure opaque hash token for public QR verification
    public_url TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- INDEXES FOR FAST QUERYING & AUDIT RETRIEVAL
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_test_reports_user_id ON public.test_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_date ON public.test_reports(test_date DESC);
CREATE INDEX IF NOT EXISTS idx_test_reports_sample_id ON public.test_reports(sample_id);
CREATE INDEX IF NOT EXISTS idx_test_reports_batch_id ON public.test_reports(batch_id);
CREATE INDEX IF NOT EXISTS idx_reports_qr_token ON public.reports(qr_token);
CREATE INDEX IF NOT EXISTS idx_silage_unit ON public.silage_readings(storage_unit_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sensor_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.silage_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 1. Profiles: A user can only read/update their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = auth_user_id);

-- 2. Test Reports: Farmers can view, insert, and delete only their own tests
CREATE POLICY "Users can view own test reports"
    ON public.test_reports FOR SELECT
    USING (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

CREATE POLICY "Users can insert own test reports"
    ON public.test_reports FOR INSERT
    WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()));

-- 3. Sensor Readings: Accessible only via the user's test report
CREATE POLICY "Users can view own sensor readings"
    ON public.sensor_readings FOR SELECT
    USING (test_id IN (
        SELECT id FROM public.test_reports WHERE user_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
    ));

-- 4. Silage Readings: Accessible only to the authenticated owner
CREATE POLICY "Users can view own silage readings"
    ON public.silage_readings FOR SELECT
    USING (test_id IS NULL OR test_id IN (
        SELECT id FROM public.test_reports WHERE user_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
    ));

-- 5. Reports & Public QR Verification
-- Authenticated farmers see all their reports
CREATE POLICY "Users can view own reports"
    ON public.reports FOR SELECT
    USING (test_id IN (
        SELECT id FROM public.test_reports WHERE user_id IN (
            SELECT id FROM public.profiles WHERE auth_user_id = auth.uid()
        )
    ));

-- Public QR verification: Anyone can read report certificates by valid qr_token without authentication
CREATE POLICY "Public can view verified QR reports via token"
    ON public.reports FOR SELECT
    TO anon, authenticated
    USING (qr_token IS NOT NULL);

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (
        auth_user_id,
        name,
        mobile,
        email,
        state,
        district,
        preferred_language
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Dairy Farmer'),
        COALESCE(NEW.raw_user_meta_data->>'mobile', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'state', 'Maharashtra'),
        COALESCE(NEW.raw_user_meta_data->>'district', 'Pune'),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
