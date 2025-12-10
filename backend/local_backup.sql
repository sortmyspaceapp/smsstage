--
-- PostgreSQL database dump
--

-- Dumped from database version 14.18 (Homebrew)
-- Dumped by pg_dump version 14.18 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."ActivityType" AS ENUM (
    'SIGNUP',
    'LOGIN',
    'LOGOUT',
    'PROFILE_UPDATE',
    'PASSWORD_CHANGE',
    'SPACE_VIEW',
    'SPACE_INTEREST',
    'SPACE_INQUIRY',
    'PREFERENCE_UPDATE',
    'ACCOUNT_DEACTIVATED',
    'ACCOUNT_ACTIVATED'
);


ALTER TYPE public."ActivityType" OWNER TO apple;

--
-- Name: AmenityType; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."AmenityType" AS ENUM (
    'PARKING',
    'SECURITY',
    'ELEVATOR',
    'ESCALATOR',
    'WASHROOM',
    'FOOD_COURT',
    'ATM',
    'WIFI',
    'POWER_BACKUP',
    'FIRE_SAFETY',
    'ACCESSIBILITY',
    'OTHER'
);


ALTER TYPE public."AmenityType" OWNER TO apple;

--
-- Name: InquiryStatus; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."InquiryStatus" AS ENUM (
    'PENDING',
    'CONTACTED',
    'INTERESTED',
    'NOT_INTERESTED',
    'CLOSED'
);


ALTER TYPE public."InquiryStatus" OWNER TO apple;

--
-- Name: InterestLevel; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."InterestLevel" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."InterestLevel" OWNER TO apple;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."NotificationType" AS ENUM (
    'SPACE_AVAILABLE',
    'SPACE_UPDATED',
    'INQUIRY_RESPONSE',
    'SYSTEM_UPDATE',
    'PROMOTION',
    'SPACE_INTEREST',
    'USER_ACTIVITY',
    'ACCOUNT_CREATED',
    'LOGIN_SUCCESS',
    'LOGIN_FAILED'
);


ALTER TYPE public."NotificationType" OWNER TO apple;

--
-- Name: SpaceStatus; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."SpaceStatus" AS ENUM (
    'PREMIUM',
    'AVAILABLE',
    'OCCUPIED',
    'MAINTENANCE',
    'RESERVED'
);


ALTER TYPE public."SpaceStatus" OWNER TO apple;

--
-- Name: SpaceType; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."SpaceType" AS ENUM (
    'RETAIL',
    'FOOD_COURT',
    'OFFICE',
    'ENTERTAINMENT',
    'SERVICES',
    'PARKING',
    'OTHER'
);


ALTER TYPE public."SpaceType" OWNER TO apple;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: apple
--

CREATE TYPE public."UserRole" AS ENUM (
    'ADMIN',
    'MALL_MANAGER',
    'CUSTOMER'
);


ALTER TYPE public."UserRole" OWNER TO apple;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: cities; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.cities (
    id text NOT NULL,
    name text NOT NULL,
    state text NOT NULL,
    country text DEFAULT 'India'::text NOT NULL,
    coordinates jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.cities OWNER TO apple;

--
-- Name: floors; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.floors (
    id text NOT NULL,
    mall_id text NOT NULL,
    floor_number integer NOT NULL,
    name text NOT NULL,
    svg_file_url text,
    svg_version integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.floors OWNER TO apple;

--
-- Name: interested_spaces; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.interested_spaces (
    id text NOT NULL,
    user_id text NOT NULL,
    space_id text NOT NULL,
    interest_level public."InterestLevel" DEFAULT 'MEDIUM'::public."InterestLevel" NOT NULL,
    notes text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.interested_spaces OWNER TO apple;

--
-- Name: mall_analytics; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.mall_analytics (
    id text NOT NULL,
    mall_id text NOT NULL,
    total_views integer DEFAULT 0 NOT NULL,
    total_inquiries integer DEFAULT 0 NOT NULL,
    conversion_rate double precision DEFAULT 0 NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.mall_analytics OWNER TO apple;

--
-- Name: mall_managers; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.mall_managers (
    id text NOT NULL,
    user_id text NOT NULL,
    assigned_malls text[],
    permissions jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.mall_managers OWNER TO apple;

--
-- Name: malls; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.malls (
    id text NOT NULL,
    name text NOT NULL,
    city_id text NOT NULL,
    sector_id text NOT NULL,
    address text NOT NULL,
    coordinates jsonb,
    rating double precision DEFAULT 0 NOT NULL,
    images text[],
    manager_id text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.malls OWNER TO apple;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.notifications (
    id text NOT NULL,
    user_id text NOT NULL,
    type public."NotificationType" NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data jsonb,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.notifications OWNER TO apple;

--
-- Name: recent_views; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.recent_views (
    id text NOT NULL,
    user_id text NOT NULL,
    space_id text NOT NULL,
    view_duration integer DEFAULT 0 NOT NULL,
    viewed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.recent_views OWNER TO apple;

--
-- Name: sectors; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.sectors (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sectors OWNER TO apple;

--
-- Name: space_amenities; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.space_amenities (
    id text NOT NULL,
    space_id text NOT NULL,
    type public."AmenityType" NOT NULL,
    value text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.space_amenities OWNER TO apple;

--
-- Name: space_availability_logs; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.space_availability_logs (
    id text NOT NULL,
    space_id text NOT NULL,
    old_status public."SpaceStatus" NOT NULL,
    new_status public."SpaceStatus" NOT NULL,
    changed_by text NOT NULL,
    changed_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.space_availability_logs OWNER TO apple;

--
-- Name: space_images; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.space_images (
    id text NOT NULL,
    space_id text NOT NULL,
    image_url text NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    order_index integer DEFAULT 0 NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.space_images OWNER TO apple;

--
-- Name: space_inquiries; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.space_inquiries (
    id text NOT NULL,
    user_id text NOT NULL,
    space_id text NOT NULL,
    message text NOT NULL,
    contact_preference text NOT NULL,
    status public."InquiryStatus" DEFAULT 'PENDING'::public."InquiryStatus" NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.space_inquiries OWNER TO apple;

--
-- Name: space_interest_notifications; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.space_interest_notifications (
    id text NOT NULL,
    space_id text NOT NULL,
    interested_user_id text NOT NULL,
    mall_manager_id text,
    is_read boolean DEFAULT false NOT NULL,
    notification_sent boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.space_interest_notifications OWNER TO apple;

--
-- Name: spaces; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.spaces (
    id text NOT NULL,
    floor_id text NOT NULL,
    svg_element_id text NOT NULL,
    name text NOT NULL,
    type public."SpaceType" NOT NULL,
    size_sqft double precision NOT NULL,
    price_monthly double precision NOT NULL,
    availability_status public."SpaceStatus" DEFAULT 'AVAILABLE'::public."SpaceStatus" NOT NULL,
    description text,
    frontage text,
    adjacent_brands text[],
    contact_details jsonb,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.spaces OWNER TO apple;

--
-- Name: user_activities; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.user_activities (
    id text NOT NULL,
    user_id text NOT NULL,
    "activityType" public."ActivityType" NOT NULL,
    description text NOT NULL,
    metadata jsonb,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_activities OWNER TO apple;

--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.user_profiles (
    id text NOT NULL,
    user_id text NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    phone text,
    avatar_url text,
    preferences jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.user_profiles OWNER TO apple;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.user_sessions (
    id text NOT NULL,
    user_id text NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_sessions OWNER TO apple;

--
-- Name: users; Type: TABLE; Schema: public; Owner: apple
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    role public."UserRole" DEFAULT 'CUSTOMER'::public."UserRole" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    username text
);


ALTER TABLE public.users OWNER TO apple;

--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.cities (id, name, state, country, coordinates, is_active, created_at, updated_at) FROM stdin;
cmfnl7jjl0000pow99dyybvj4	Bengaluru	Karnataka	India	{"lat": 12.9716, "lng": 77.5946}	t	2025-09-17 06:14:51.057	2025-09-17 06:14:51.057
cmfnl7jjw0001pow9t93hujij	Mumbai	Maharashtra	India	{"lat": 19.076, "lng": 72.8777}	t	2025-09-17 06:14:51.057	2025-09-17 06:14:51.057
cmfnl7jjx0002pow9p73tuhpu	Delhi-NCR	Delhi	India	{"lat": 28.7041, "lng": 77.1025}	t	2025-09-17 06:14:51.057	2025-09-17 06:14:51.057
\.


--
-- Data for Name: floors; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.floors (id, mall_id, floor_number, name, svg_file_url, svg_version, is_active, created_at, updated_at) FROM stdin;
cmfnl7k77000epow96svlkvd0	mall-1	0	Ground Floor	/uploads/svg/svg-1758106951214-874042188.svg	9	t	2025-09-17 06:14:51.907	2025-09-17 11:02:31.235
cmfnl7k77000dpow9esnyq1vq	mall-1	1	First Floor	/uploads/svg/svg-1758120624106-110167904.svg	10	t	2025-09-17 06:14:51.907	2025-09-17 14:50:24.169
cmfo52lkv0001mredn41pwnpg	mall-2	1	Ground Floor	/uploads/svg/svg-1758123840208-986334581.svg	2	t	2025-09-17 15:30:52.732	2025-09-17 15:44:00.257
\.


--
-- Data for Name: interested_spaces; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.interested_spaces (id, user_id, space_id, interest_level, notes, created_at, updated_at) FROM stdin;
cmfnl7k7r000qpow944o8gf9k	cmfnl7k690009pow9cdk6m78v	space-1	HIGH	Great location and size. Perfect for our retail store.	2025-09-17 06:14:51.927	2025-09-17 06:14:51.927
cmfozjon9001fmztrmznd1qgs	cmfnl7k690009pow9cdk6m78v	cmfnugunr000h7gsoj2gdteri	MEDIUM	Added from space details	2025-09-18 05:43:58.341	2025-09-18 05:43:58.341
cmfozwz5t0005rmnpv1fm51dw	cmfnl7k690009pow9cdk6m78v	cmfnugunr000i7gsoc7wfg2qh	MEDIUM	Added from space details	2025-09-18 05:54:18.498	2025-09-18 05:54:18.498
cmfp05go5000hrmnp7dkf75en	cmfnl7k690009pow9cdk6m78v	cmfnugunr000k7gso9ubxb80e	MEDIUM	Added from space details	2025-09-18 06:00:54.437	2025-09-18 06:00:54.437
cmfp05zrt000trmnpeep6egq8	cmfnl7k690009pow9cdk6m78v	cmfnugunr000m7gsogo6ohndz	MEDIUM	Added from space details	2025-09-18 06:01:19.194	2025-09-18 06:01:19.194
cmfp0fqne000fbyjujj5c4gwp	cmfnl7k690009pow9cdk6m78v	cmfnugup3000r7gso2d5hq3y9	MEDIUM	Added from space details	2025-09-18 06:08:53.93	2025-09-18 06:08:53.93
cmfp0s66500051ypu6znwg5at	cmfnl7k690009pow9cdk6m78v	cmfnugunw000p7gsojulg1sew	MEDIUM	Added from space details	2025-09-18 06:18:33.918	2025-09-18 06:18:33.918
cmfp46x75000z430on8t4jw7y	cmfnl7k690009pow9cdk6m78v	cmfnugunr000n7gso32qiqqnt	LOW	Added from space details	2025-09-18 07:54:00.978	2025-09-19 07:24:50.922
cmfqy4g5t000d9o4f8csb52iw	cmfnl7k690009pow9cdk6m78v	space-2	MEDIUM	Added from space details	2025-09-19 14:39:40.241	2025-09-19 14:39:40.241
\.


--
-- Data for Name: mall_analytics; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.mall_analytics (id, mall_id, total_views, total_inquiries, conversion_rate, date, created_at) FROM stdin;
\.


--
-- Data for Name: mall_managers; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.mall_managers (id, user_id, assigned_malls, permissions, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: malls; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.malls (id, name, city_id, sector_id, address, coordinates, rating, images, manager_id, is_active, created_at, updated_at) FROM stdin;
mall-1	Garuda Mall	cmfnl7jjl0000pow99dyybvj4	cmfnl7jk50003pow9adl8kvp0	Magrath Road, Bengaluru	{"lat": 12.9716, "lng": 77.5946}	4	{https://via.placeholder.com/300x200?text=Garuda+Mall}	cmfnl7jvs0007pow9vixc0lga	t	2025-09-17 06:14:51.878	2025-09-17 06:14:51.878
mall-2	Phoenix MarketCity	cmfnl7jjl0000pow99dyybvj4	cmfnl7jk50003pow9adl8kvp0	Whitefield, Bengaluru	{"lat": 12.9716, "lng": 77.5946}	4.5	{https://via.placeholder.com/300x200?text=Phoenix+MarketCity}	cmfnl7jvs0007pow9vixc0lga	t	2025-09-17 06:14:51.878	2025-09-17 06:14:51.878
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, created_at) FROM stdin;
cmfoygz2l0005yqajx7ly5yyl	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:13:52.246Z"}	f	2025-09-18 05:13:52.269
cmfoyl8st0005z1js2gbbf2vu	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:17:11.494Z"}	f	2025-09-18 05:17:11.501
cmfoyspwl000bgc97fv0w4sxu	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:23:00.256Z"}	f	2025-09-18 05:23:00.258
cmfoyvav60005mztr9twqa0e4	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::1", "loginTime": "2025-09-18T05:25:00.714Z"}	f	2025-09-18 05:25:00.739
cmfoz66ei000hmztrpn01xz7x	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::1", "loginTime": "2025-09-18T05:33:28.162Z"}	f	2025-09-18 05:33:28.163
cmfoz8kdc000nmztr50a40slm	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:35:19.582Z"}	f	2025-09-18 05:35:19.584
cmfoz9op7000tmztr4a9f2q2z	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:36:11.848Z"}	f	2025-09-18 05:36:11.849
cmfozcngk000zmztrojjwvywy	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:38:30.184Z"}	f	2025-09-18 05:38:30.187
cmfozfnzp0015mztr48ocswfn	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:40:50.866Z"}	f	2025-09-18 05:40:50.867
cmfoziu29001bmztr368bqqae	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:43:18.704Z"}	f	2025-09-18 05:43:18.705
cmfozjoq4001nmztrkwyugbp8	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Space map_club_america" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000h7gsoj2gdteri", "mallName": "Garuda Mall", "spaceName": "Space map_club_america"}	f	2025-09-18 05:43:58.445
cmfozwz7b000drmnp1ub67huq	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Space map_color_bar" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000i7gsoc7wfg2qh", "mallName": "Garuda Mall", "spaceName": "Space map_color_bar"}	f	2025-09-18 05:54:18.551
cmfp05gpq000prmnpqfx1l4bs	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Space map_zimson" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000k7gso9ubxb80e", "mallName": "Garuda Mall", "spaceName": "Space map_zimson"}	f	2025-09-18 06:00:54.494
cmfp05zsm0011rmnpkiz8r4k2	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Space map_jack_shake" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000m7gsogo6ohndz", "mallName": "Garuda Mall", "spaceName": "Space map_jack_shake"}	f	2025-09-18 06:01:19.222
cmfp0f1b70005byju0nlz2o3p	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T06:08:21.079Z"}	f	2025-09-18 06:08:21.091
cmfoys0ek0005gc97dv2h2e03	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:22:27.205Z"}	t	2025-09-18 05:22:27.212
cmfoyyd96000bmztrgovy0qia	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T05:27:23.798Z"}	t	2025-09-18 05:27:23.799
cmfozjoq2001lmztr653nrlop	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Space map_club_america" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000h7gsoj2gdteri", "mallName": "Garuda Mall", "spaceName": "Space map_club_america", "spaceSize": 100, "spaceFloor": 0, "spacePrice": 10000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	t	2025-09-18 05:43:58.442
cmfozq2e6001tmztrrjzbfs1p	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::1", "loginTime": "2025-09-18T05:48:56.085Z"}	t	2025-09-18 05:48:56.086
cmfozwz79000brmnpgq51wot0	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Space map_color_bar" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000i7gsoc7wfg2qh", "mallName": "Garuda Mall", "spaceName": "Space map_color_bar", "spaceSize": 100, "spaceFloor": 0, "spacePrice": 10000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	t	2025-09-18 05:54:18.55
cmfp05gpo000nrmnpav50is28	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Space map_zimson" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000k7gso9ubxb80e", "mallName": "Garuda Mall", "spaceName": "Space map_zimson", "spaceSize": 100, "spaceFloor": 0, "spacePrice": 10000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	t	2025-09-18 06:00:54.492
cmfp05zsk000zrmnpi5fmturs	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Space map_jack_shake" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000m7gsogo6ohndz", "mallName": "Garuda Mall", "spaceName": "Space map_jack_shake", "spaceSize": 100, "spaceFloor": 0, "spacePrice": 10000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	t	2025-09-18 06:01:19.221
cmfp0fbbs000bbyjuei1wj707	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-18T06:08:34.071Z"}	t	2025-09-18 06:08:34.072
cmfp0fqoh000nbyjujqs8td4d	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Space map_gelato" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugup3000r7gso2d5hq3y9", "mallName": "Garuda Mall", "spaceName": "Space map_gelato"}	f	2025-09-18 06:08:53.969
cmfp0fqny000lbyjulukgfpfy	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Space map_gelato" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugup3000r7gso2d5hq3y9", "mallName": "Garuda Mall", "spaceName": "Space map_gelato", "spaceSize": 100, "spaceFloor": 0, "spacePrice": 10000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	t	2025-09-18 06:08:53.95
cmfp0s67x000d1ypukbylpwhm	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Space map_forever_new" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunw000p7gsojulg1sew", "mallName": "Garuda Mall", "spaceName": "Space map_forever_new"}	f	2025-09-18 06:18:33.981
cmfp0yv0y000f1ypuwyw3ip6e	cmfnl7k690009pow9cdk6m78v	LOGIN_FAILED	Failed Login Attempt	There was a failed login attempt for your account with email customer@spacefinder.com. If this wasn't you, please secure your account.	{"email": "customer@spacefinder.com", "ipAddress": "::ffff:10.106.42.164", "attemptTime": "2025-09-18T06:23:46.062Z"}	f	2025-09-18 06:23:46.066
cmfp0zdna000l1ypu6sqz49qz	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:10.106.42.164", "loginTime": "2025-09-18T06:24:10.198Z"}	f	2025-09-18 06:24:10.198
cmfp0s67s000b1ypusjiqd9gq	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Space map_forever_new" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunw000p7gsojulg1sew", "mallName": "Garuda Mall", "spaceName": "Space map_forever_new", "spaceSize": 100, "spaceFloor": 0, "spacePrice": 10000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	t	2025-09-18 06:18:33.976
cmfp45mak000p430osx0jhvyg	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:10.106.42.164", "loginTime": "2025-09-18T07:53:00.187Z"}	f	2025-09-18 07:53:00.188
cmfp46x7s0017430opjhf82ma	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Space map_mango" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000n7gso32qiqqnt", "mallName": "Garuda Mall", "spaceName": "Space map_mango"}	f	2025-09-18 07:54:01
cmfp46x7q0015430odqatm8th	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Space map_mango" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "cmfnugunr000n7gso32qiqqnt", "mallName": "Garuda Mall", "spaceName": "Space map_mango", "spaceSize": 100, "spaceFloor": 0, "spacePrice": 10000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	t	2025-09-18 07:54:00.998
cmfqh6d730005xoiaqdthin3v	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-19T06:45:16.218Z"}	t	2025-09-19 06:45:16.24
cmfqhkely00059bc23i36zvet	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-19T06:56:11.249Z"}	t	2025-09-19 06:56:11.254
cmfqttwou000ru0a92icjqsqv	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T12:39:29.978Z"}	f	2025-09-19 12:39:29.981
cmfqub1z5000xu0a9mfzlqxmu	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T12:52:49.967Z"}	f	2025-09-19 12:52:49.969
cmfquq36s0013u0a96zqf2b05	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T13:04:31.395Z"}	f	2025-09-19 13:04:31.396
cmfquyr6u0019u0a91ydddt1p	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T13:11:15.750Z"}	f	2025-09-19 13:11:15.751
cmfqvlycg001fu0a9jto5bgdx	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T13:29:18.111Z"}	f	2025-09-19 13:29:18.112
cmfqvmt92001lu0a9brswwg8h	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-19T13:29:58.165Z"}	f	2025-09-19 13:29:58.166
cmfqvunhn001ru0a9qi4q13au	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T13:36:03.947Z"}	f	2025-09-19 13:36:03.947
cmfqvyr79001xu0a9trcbtst1	cmfnl7jvs0007pow9vixc0lga	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:127.0.0.1", "loginTime": "2025-09-19T13:39:15.380Z"}	f	2025-09-19 13:39:15.381
cmfqy4g7g000j9o4fpwvtogcv	cmfnl7jvs0007pow9vixc0lga	SPACE_INTEREST	New Space Interest	John Doe is interested in space "Apple Store" in Garuda Mall	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "space-2", "mallName": "Garuda Mall", "spaceName": "Apple Store", "spaceSize": 800, "spaceFloor": 0, "spacePrice": 95000, "interestedUserId": "cmfnl7k690009pow9cdk6m78v", "interestedUserName": "John Doe", "interestedUserEmail": "customer@spacefinder.com"}	f	2025-09-19 14:39:40.3
cmfqy4g7l000l9o4f8t1ctuni	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	Interest Recorded	Your interest in space "Apple Store" has been recorded. The mall manager will contact you soon.	{"city": "Bengaluru", "sector": "Mall Space", "spaceId": "space-2", "mallName": "Garuda Mall", "spaceName": "Apple Store"}	f	2025-09-19 14:39:40.306
cmfr1n02i0005tsb73emx1v4t	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T16:18:04.697Z"}	f	2025-09-19 16:18:04.698
cmfr1u0yf000dtsb78uuhskeu	cmfnl7k690009pow9cdk6m78v	LOGIN_SUCCESS	Login Successful	You have successfully logged in to your SpaceFinder account.	{"ipAddress": "::ffff:192.168.0.105", "loginTime": "2025-09-19T16:23:32.439Z"}	f	2025-09-19 16:23:32.439
\.


--
-- Data for Name: recent_views; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.recent_views (id, user_id, space_id, view_duration, viewed_at) FROM stdin;
cmfp0fov8000dbyjur7futdn2	cmfnl7k690009pow9cdk6m78v	cmfnugup3000r7gso2d5hq3y9	30	2025-09-18 06:08:51.621
cmfp0s4ly00031ypud30dyf0e	cmfnl7k690009pow9cdk6m78v	cmfnugunw000p7gsojulg1sew	30	2025-09-18 06:18:31.895
cmfp3y0bm0005430ofx2w2j9b	cmfnl7k690009pow9cdk6m78v	cmfnugup6000v7gso2tgv87h9	30	2025-09-18 07:47:05.122
cmfp40i6h000h430o1fagrfqx	cmfnl7k690009pow9cdk6m78v	space-3	30	2025-09-18 07:49:01.577
cmfp46w82000x430oai2817os	cmfnl7k690009pow9cdk6m78v	cmfnugunr000n7gso32qiqqnt	30	2025-09-18 07:53:59.715
cmfp7joju001f430obzvcubb5	cmfnl7k690009pow9cdk6m78v	cmfnugunr000g7gsocr8b10yq	30	2025-09-18 09:27:55.146
cmfqikfqw0009u0a902jn1bde	cmfnl7k690009pow9cdk6m78v	cmfnugunr000c7gsoc1zzeg9g	30	2025-09-19 07:24:12.344
cmfqimh0w000hu0a9klr804mr	cmfnl7k690009pow9cdk6m78v	cmfnugunr000e7gso5wmtzc1c	30	2025-09-19 07:25:47.312
cmfp05ycn000rrmnp05ycfdpe	cmfnl7k690009pow9cdk6m78v	cmfnugunr000m7gsogo6ohndz	30	2025-09-19 07:25:58.631
cmfqxtvob00019o4frgcmgj63	cmfnl7k690009pow9cdk6m78v	cmfnugunr000j7gsog8uoerch	30	2025-09-19 14:31:27.131
cmfp05emi000frmnpimaf65tj	cmfnl7k690009pow9cdk6m78v	cmfnugunr000k7gso9ubxb80e	30	2025-09-19 14:38:13.155
cmfnl7k7q000opow9u9ekmymc	cmfnl7k690009pow9cdk6m78v	space-2	30	2025-09-19 14:39:38.826
cmfqy4jy3000n9o4fdhphlqwh	cmfnl7k690009pow9cdk6m78v	cmfnugunr000l7gsokk9cj49d	30	2025-09-19 14:39:45.147
cmfp3xxs20003430onk16gd8c	cmfnl7k690009pow9cdk6m78v	cmfnugunr000d7gsoq8h0aj6d	30	2025-09-19 14:43:57.691
cmfozj942001dmztrykmz331p	cmfnl7k690009pow9cdk6m78v	cmfnugunr000h7gsoj2gdteri	30	2025-09-19 14:44:00.446
cmfqya48k000x9o4fgpp6li6k	cmfnl7k690009pow9cdk6m78v	cmfnugup5000t7gso8tda5rnl	30	2025-09-19 14:44:04.724
cmfozwxou0003rmnp6y9ywiz3	cmfnl7k690009pow9cdk6m78v	cmfnugunr000i7gsoc7wfg2qh	30	2025-09-19 15:04:52.995
cmfnl7k7n000mpow9bi7r370y	cmfnl7k690009pow9cdk6m78v	space-1	30	2025-09-19 15:05:16.029
\.


--
-- Data for Name: sectors; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.sectors (id, name, description, icon, color, is_active, created_at, updated_at) FROM stdin;
cmfnl7jk50003pow9adl8kvp0	Mall Space	Shopping malls and retail spaces	store	#3B82F6	t	2025-09-17 06:14:51.078	2025-09-17 06:14:51.078
cmfnl7jk50004pow9rbmwl5h9	Events Space	Event venues and spaces	event	#10B981	t	2025-09-17 06:14:51.078	2025-09-17 06:14:51.078
cmfnl7jk50005pow9ykducn0i	Public Space	Public venues and community spaces	public	#F59E0B	t	2025-09-17 06:14:51.078	2025-09-17 06:14:51.078
cmfnl7jkz0006pow96lieu5qd	Apartment	Residential and apartment spaces	apartment	#8B5CF6	t	2025-09-17 06:14:51.078	2025-09-17 06:14:51.078
\.


--
-- Data for Name: space_amenities; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.space_amenities (id, space_id, type, value, created_at) FROM stdin;
cmfnl7k7k000kpow9534l0rca	space-1	ELEVATOR	Direct Elevator Access	2025-09-17 06:14:51.921
cmfnl7k7k000jpow9pwczbfi7	space-1	PARKING	Valet Parking Available	2025-09-17 06:14:51.921
cmfnl7k7k000ipow9x05rif2a	space-1	SECURITY	24/7 Security	2025-09-17 06:14:51.921
\.


--
-- Data for Name: space_availability_logs; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.space_availability_logs (id, space_id, old_status, new_status, changed_by, changed_at) FROM stdin;
\.


--
-- Data for Name: space_images; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.space_images (id, space_id, image_url, is_primary, order_index, created_at) FROM stdin;
\.


--
-- Data for Name: space_inquiries; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.space_inquiries (id, user_id, space_id, message, contact_preference, status, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: space_interest_notifications; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.space_interest_notifications (id, space_id, interested_user_id, mall_manager_id, is_read, notification_sent, created_at, updated_at) FROM stdin;
cmfozjopi001jmztrvthjyx6w	cmfnugunr000h7gsoj2gdteri	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	t	t	2025-09-18 05:43:58.422	2025-09-18 05:49:52.911
cmfozwz750009rmnphs3a8dsb	cmfnugunr000i7gsoc7wfg2qh	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	t	t	2025-09-18 05:54:18.545	2025-09-18 06:02:15.101
cmfp05gpi000lrmnpnmfip33n	cmfnugunr000k7gso9ubxb80e	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	t	t	2025-09-18 06:00:54.487	2025-09-18 06:02:15.101
cmfp05zs2000xrmnpcim5csqi	cmfnugunr000m7gsogo6ohndz	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	t	t	2025-09-18 06:01:19.202	2025-09-18 06:02:15.101
cmfp0s67h00091ypu1dl17k0s	cmfnugunw000p7gsojulg1sew	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	t	t	2025-09-18 06:18:33.965	2025-09-18 07:50:57.205
cmfp0fqnu000jbyjuy5intnsj	cmfnugup3000r7gso2d5hq3y9	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	t	t	2025-09-18 06:08:53.946	2025-09-18 07:50:59.032
cmfp46x7n0013430ov5gwwb2a	cmfnugunr000n7gso32qiqqnt	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	t	t	2025-09-18 07:54:00.994	2025-09-19 06:56:32.445
cmfqy4g78000h9o4fhqra3pg6	space-2	cmfnl7k690009pow9cdk6m78v	cmfnl7jvs0007pow9vixc0lga	f	t	2025-09-19 14:39:40.293	2025-09-19 14:39:40.293
\.


--
-- Data for Name: spaces; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.spaces (id, floor_id, svg_element_id, name, type, size_sqft, price_monthly, availability_status, description, frontage, adjacent_brands, contact_details, is_active, created_at, updated_at) FROM stdin;
space-3	cmfnl7k77000epow96svlkvd0	map_star_bucks	Starbucks	FOOD_COURT	600	55000	OCCUPIED	Coffee shop and café space	Food Court	{Apple,"Lulu Premium"}	\N	t	2025-09-17 06:14:51.914	2025-09-17 06:14:51.914
space-2	cmfnl7k77000epow96svlkvd0	map_apple	Apple Store	RETAIL	800	95000	OCCUPIED	Premium electronics retail space	Main Corridor	{"Lulu Premium",Starbucks}	\N	t	2025-09-17 06:14:51.914	2025-09-17 06:14:51.914
cmfnohqh2000hlxzeljhnc69e	cmfnl7k77000dpow9esnyq1vq	map_cookie_man	Space map_cookie_man	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_cookie_man	Standard	{}	\N	t	2025-09-17 07:46:45.443	2025-09-17 07:46:45.443
cmfnohqh1000elxzeleukhyf4	cmfnl7k77000dpow9esnyq1vq	map_jack_shake	Space map_jack_shake	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_jack_shake	Standard	{}	\N	t	2025-09-17 07:46:45.434	2025-09-17 07:46:45.434
cmfnohqh3000jlxzebvukari1	cmfnl7k77000dpow9esnyq1vq	map_mango	Space map_mango	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_mango	Standard	{}	\N	t	2025-09-17 07:46:45.443	2025-09-17 07:46:45.443
cmfnohqh1000flxzentsw3zq7	cmfnl7k77000dpow9esnyq1vq	outline	Space outline	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element outline	Standard	{}	\N	t	2025-09-17 07:46:45.435	2025-09-17 07:46:45.435
cmfnohqgy0006lxzeyhk3tvia	cmfnl7k77000dpow9esnyq1vq	map_seating_area	Space map_seating_area	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_seating_area	Standard	{}	\N	t	2025-09-17 07:46:45.431	2025-09-17 07:46:45.431
cmfnohqgy0008lxzeqgx7js99	cmfnl7k77000dpow9esnyq1vq	map_m_s	Space map_m_s	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_m_s	Standard	{}	\N	t	2025-09-17 07:46:45.432	2025-09-17 07:46:45.432
cmfnohqgz000blxzegmtnzegg	cmfnl7k77000dpow9esnyq1vq	map_gelato	Space map_gelato	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_gelato	Standard	{}	\N	t	2025-09-17 07:46:45.433	2025-09-17 07:46:45.433
cmfnohqgy0009lxzel5vcwkh9	cmfnl7k77000dpow9esnyq1vq	map_forever_new	Space map_forever_new	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_forever_new	Standard	{}	\N	t	2025-09-17 07:46:45.43	2025-09-17 07:46:45.43
cmfnohqh6000llxzefw8fiwce	cmfnl7k77000dpow9esnyq1vq	map_club_america	Space map_club_america	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_club_america	Standard	{}	\N	t	2025-09-17 07:46:45.443	2025-09-17 07:46:45.443
cmfnohqh6000nlxze82qwf7kw	cmfnl7k77000dpow9esnyq1vq	map_sunglass_hut	Space map_sunglass_hut	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_sunglass_hut	Standard	{}	\N	t	2025-09-17 07:46:45.443	2025-09-17 07:46:45.443
cmfnohqh7000plxzeufum6n7y	cmfnl7k77000dpow9esnyq1vq	map_star_bucks	Space map_star_bucks	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_star_bucks	Standard	{}	\N	t	2025-09-17 07:46:45.444	2025-09-17 07:46:45.444
cmfnohqh9000tlxzedome78xb	cmfnl7k77000dpow9esnyq1vq	map_lulu_premium	Space map_lulu_premium	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_lulu_premium	Standard	{}	\N	t	2025-09-17 07:46:45.445	2025-09-17 07:46:45.445
cmfnohqh90010lxzenj1cn1kl	cmfnl7k77000dpow9esnyq1vq	map_woman_secret	Space map_woman_secret	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_woman_secret	Standard	{}	\N	t	2025-09-17 07:46:45.448	2025-09-17 07:46:45.448
cmfnohqha0012lxzep05yiaev	cmfnl7k77000dpow9esnyq1vq	map_dyson	Space map_dyson	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_dyson	Standard	{}	\N	t	2025-09-17 07:46:45.451	2025-09-17 07:46:45.451
cmfnohqha0011lxzetkoetmam	cmfnl7k77000dpow9esnyq1vq	map_color_bar	Space map_color_bar	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_color_bar	Standard	{}	\N	t	2025-09-17 07:46:45.45	2025-09-17 07:46:45.45
cmfnohqh9000ylxzetnvp09j8	cmfnl7k77000dpow9esnyq1vq	map_ocd	Space map_ocd	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_ocd	Standard	{}	\N	t	2025-09-17 07:46:45.447	2025-09-17 07:46:45.447
cmfnohqha0013lxze29c8snpz	cmfnl7k77000dpow9esnyq1vq	map_bath_body	Space map_bath_body	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_bath_body	Standard	{}	\N	t	2025-09-17 07:46:45.45	2025-09-17 07:46:45.45
cmfnugunr000g7gsocr8b10yq	cmfnl7k77000epow96svlkvd0	map_sunglass_hut	Space map_sunglass_hut	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_sunglass_hut	Standard	{}	\N	t	2025-09-17 10:34:01.909	2025-09-17 10:34:01.909
cmfnugunr000l7gsokk9cj49d	cmfnl7k77000epow96svlkvd0	map_cookie_man	Space map_cookie_man	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_cookie_man	Standard	{}	\N	t	2025-09-17 10:34:01.908	2025-09-17 10:34:01.908
cmfnugunr000i7gsoc7wfg2qh	cmfnl7k77000epow96svlkvd0	map_color_bar	Space map_color_bar	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_color_bar	Standard	{}	\N	t	2025-09-17 10:34:01.909	2025-09-17 10:34:01.909
cmfnugunr000h7gsoj2gdteri	cmfnl7k77000epow96svlkvd0	map_club_america	Space map_club_america	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_club_america	Standard	{}	\N	t	2025-09-17 10:34:01.909	2025-09-17 10:34:01.909
cmfnugunr000k7gso9ubxb80e	cmfnl7k77000epow96svlkvd0	map_zimson	Space map_zimson	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_zimson	Standard	{}	\N	t	2025-09-17 10:34:01.909	2025-09-17 10:34:01.909
cmfnugunr000f7gsoztxu4kad	cmfnl7k77000epow96svlkvd0	map_ocd	Space map_ocd	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_ocd	Standard	{}	\N	t	2025-09-17 10:34:01.908	2025-09-17 10:34:01.908
cmfnugunw000p7gsojulg1sew	cmfnl7k77000epow96svlkvd0	map_forever_new	Space map_forever_new	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_forever_new	Standard	{}	\N	t	2025-09-17 10:34:01.916	2025-09-17 10:34:01.916
cmfnohqh7000rlxzelyczu6no	cmfnl7k77000dpow9esnyq1vq	map_zimson	Space map_zimson	RETAIL	100	10000	OCCUPIED	Auto-generated space for SVG element map_zimson	Standard	{}	\N	t	2025-09-17 07:46:45.445	2025-09-17 11:15:09.587
cmfnugunr000d7gsoq8h0aj6d	cmfnl7k77000epow96svlkvd0	map_shoppers_stop	Space map_shoppers_stop	RETAIL	100	5000	AVAILABLE	Auto-generated space for SVG element map_shoppers_stop	Standard	{}	\N	t	2025-09-17 10:34:01.908	2025-09-19 07:28:16.771
cmfnohqgy0007lxzeh0ool3d5	cmfnl7k77000dpow9esnyq1vq	map_shoppers_stop	Space map_shoppers_stop	RETAIL	100	10000	OCCUPIED	Auto-generated space for SVG element map_shoppers_stop	Standard	{}	\N	t	2025-09-17 07:46:45.432	2025-09-17 13:11:43.693
cmfnugunr000e7gso5wmtzc1c	cmfnl7k77000epow96svlkvd0	map_woman_secret	Space map_woman_secret	RETAIL	100	10000	RESERVED	Auto-generated space for SVG element map_woman_secret	Standard	{}	\N	t	2025-09-17 10:34:01.908	2025-09-19 07:28:34.179
cmfnugunr000m7gsogo6ohndz	cmfnl7k77000epow96svlkvd0	map_jack_shake	Space map_jack_shake	RETAIL	100	10000	OCCUPIED	Auto-generated space for SVG element map_jack_shake	Standard	{}	\N	t	2025-09-17 10:34:01.909	2025-09-18 07:55:03.496
space-1	cmfnl7k77000epow96svlkvd0	map_lulu_premium	Lulu Premium Store	RETAIL	1200	85000	AVAILABLE	Premium retail space with high visibility	Main Entrance	{Apple,Starbucks}	\N	t	2025-09-17 06:14:51.914	2025-09-18 07:55:18.151
cmfnugunr000j7gsog8uoerch	cmfnl7k77000epow96svlkvd0	map_seating_area	Space map_seating_area	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_seating_area	Standard	{}	\N	t	2025-09-17 10:34:01.908	2025-09-17 10:34:01.908
cmfnugunr000n7gso32qiqqnt	cmfnl7k77000epow96svlkvd0	map_mango	Space map_mango	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_mango	Standard	{}	\N	t	2025-09-17 10:34:01.908	2025-09-17 10:34:01.908
cmfnugup3000r7gso2d5hq3y9	cmfnl7k77000epow96svlkvd0	map_gelato	Space map_gelato	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_gelato	Standard	{}	\N	t	2025-09-17 10:34:01.916	2025-09-17 10:34:01.916
cmfnugunr000c7gsoc1zzeg9g	cmfnl7k77000epow96svlkvd0	map_m_s	Space map_m_s	RETAIL	100	10000	MAINTENANCE	Auto-generated space for SVG element map_m_s	Standard	{}	\N	t	2025-09-17 10:34:01.908	2025-09-17 18:15:24.697
cmfnugup6000v7gso2tgv87h9	cmfnl7k77000epow96svlkvd0	map_bath_body	Space map_bath_body	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_bath_body	Standard	{}	\N	t	2025-09-17 10:34:01.916	2025-09-17 10:34:01.916
cmfnv8x8o000z7gsoi9i8pg4n	cmfnl7k77000epow96svlkvd0	map_bath___body	Space map_bath___body	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_bath___body	Standard	{}	\N	t	2025-09-17 10:55:51.624	2025-09-17 10:55:51.624
cmfnv8x8p00117gso7l5ccb61	cmfnl7k77000epow96svlkvd0	outline	Space outline	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element outline	Standard	{}	\N	t	2025-09-17 10:55:51.625	2025-09-17 10:55:51.625
cmfnv8x8o000y7gsoern5qi2p	cmfnl7k77000epow96svlkvd0	map_jack___shake	Space map_jack___shake	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_jack___shake	Standard	{}	\N	t	2025-09-17 10:55:51.624	2025-09-17 10:55:51.624
cmfnohqgt0001lxzegpqnyz4c	cmfnl7k77000dpow9esnyq1vq	map_apple	Space map_apple	RETAIL	100	10000	OCCUPIED	Auto-generated space for SVG element map_apple	Standard	{}	\N	t	2025-09-17 07:46:45.43	2025-09-17 11:14:53.429
cmfnugup5000t7gso8tda5rnl	cmfnl7k77000epow96svlkvd0	map_dyson	Space map_dyson	RETAIL	100	10000	AVAILABLE	Auto-generated space for SVG element map_dyson	Standard	{}	\N	t	2025-09-17 10:34:01.916	2025-09-17 10:34:01.916
\.


--
-- Data for Name: user_activities; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.user_activities (id, user_id, "activityType", description, metadata, ip_address, user_agent, created_at) FROM stdin;
cmfoygz1o0003yqajjdaslnd0	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:13:52.236
cmfoyl8sh0003z1js5r4vjfvk	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:17:11.49
cmfoys0e60003gc97qmnbfqzy	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:22:27.199
cmfoyspwb0009gc97srlwyh2q	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:23:00.252
cmfoyvaub0003mztrol662biy	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::1	curl/8.7.1	2025-09-18 05:25:00.707
cmfoyyd8y0009mztrjf04piao	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:27:23.789
cmfoz66dn000fmztra1m18nty	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::1	curl/8.7.1	2025-09-18 05:33:28.131
cmfoz8kd4000lmztrbghroggk	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:35:19.574
cmfoz9op2000rmztrecsqwmh9	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:36:11.846
cmfozcnfh000xmztr8xfy6w7w	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:38:30.165
cmfozfnzk0013mztr7qed4xtz	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:40:50.863
cmfoziu240019mztrwbsta8lw	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:43:18.699
cmfozjonj001hmztrxf26kpb9	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: cmfnugunr000h7gsoj2gdteri	{"spaceId": "cmfnugunr000h7gsoj2gdteri", "interestLevel": "MEDIUM"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:43:58.344
cmfozq2du001rmztrs3wzc81q	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::1	curl/8.7.1	2025-09-18 05:48:56.081
cmfozwz6l0007rmnp6atsrh3v	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: cmfnugunr000i7gsoc7wfg2qh	{"spaceId": "cmfnugunr000i7gsoc7wfg2qh", "interestLevel": "MEDIUM"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 05:54:18.525
cmfp05gog000jrmnpnek0uest	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: cmfnugunr000k7gso9ubxb80e	{"spaceId": "cmfnugunr000k7gso9ubxb80e", "interestLevel": "MEDIUM"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 06:00:54.44
cmfp05zrv000vrmnpbz56oc0j	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: cmfnugunr000m7gsogo6ohndz	{"spaceId": "cmfnugunr000m7gsogo6ohndz", "interestLevel": "MEDIUM"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 06:01:19.195
cmfp0f1a10003byju1k2s4gbf	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 06:08:21.049
cmfp0fbbo0009byjurscliem1	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 06:08:34.068
cmfp0fqnh000hbyju5gr9efdf	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: cmfnugup3000r7gso2d5hq3y9	{"spaceId": "cmfnugup3000r7gso2d5hq3y9", "interestLevel": "MEDIUM"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 06:08:53.933
cmfp0s66f00071ypuycc555vm	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: cmfnugunw000p7gsojulg1sew	{"spaceId": "cmfnugunw000p7gsojulg1sew", "interestLevel": "MEDIUM"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-18 06:18:33.927
cmfp0zdn1000j1ypugm7y9yi5	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:10.106.42.164	Dart/3.8 (dart:io)	2025-09-18 06:24:10.093
cmfp45mac000n430omlbwl2sh	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:10.106.42.164	Dart/3.8 (dart:io)	2025-09-18 07:53:00.181
cmfp45v4l000r430o6i512gwf	cmfnl7k690009pow9cdk6m78v	PREFERENCE_UPDATE	User updated preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings preferences	{"preferenceType": "preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings"}	::ffff:10.106.42.164	Dart/3.8 (dart:io)	2025-09-18 07:53:11.637
cmfp46x780011430o5w9rgm2e	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: cmfnugunr000n7gso32qiqqnt	{"spaceId": "cmfnugunr000n7gso32qiqqnt", "interestLevel": "MEDIUM"}	::ffff:10.106.42.164	Dart/3.8 (dart:io)	2025-09-18 07:54:00.98
cmfqh6d690003xoia4vek0rfm	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-19 06:45:16.21
cmfqhkeln00039bc21mo4o6fj	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-19 06:56:11.244
cmfqillyz000bu0a9luvc60zx	cmfnl7k690009pow9cdk6m78v	PREFERENCE_UPDATE	User updated preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings preferences	{"preferenceType": "preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 07:25:07.067
cmfqilskg000du0a9vru6bttc	cmfnl7k690009pow9cdk6m78v	PREFERENCE_UPDATE	User updated preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings preferences	{"preferenceType": "preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 07:25:15.616
cmfqilwqx000fu0a9rd39wkfk	cmfnl7k690009pow9cdk6m78v	PREFERENCE_UPDATE	User updated preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings preferences	{"preferenceType": "preferredCities, preferredSectors, budgetRange, sizeRange, preferredFloors, preferredAmenities, adjacentBrandPreferences, notificationSettings"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 07:25:21.033
cmfqttwoh000pu0a96aubfo8d	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 12:39:29.946
cmfqub1yg000vu0a9puc3sein	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 12:52:49.953
cmfquq36l0011u0a9mbj7gdos	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 13:04:31.366
cmfquyr6m0017u0a99t118atp	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 13:11:15.735
cmfqvlyca001du0a9ah4v37p7	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 13:29:18.084
cmfqvmt90001ju0a95xqaxkht	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-19 13:29:58.164
cmfqvunhg001pu0a9vudg1ypp	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 13:36:03.933
cmfqvyr76001vu0a94jcbe0in	cmfnl7jvs0007pow9vixc0lga	LOGIN	User logged in with email: admin@spacefinder.com	{"email": "admin@spacefinder.com"}	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	2025-09-19 13:39:15.378
cmfqy4g66000f9o4fubqjsmie	cmfnl7k690009pow9cdk6m78v	SPACE_INTEREST	User expressed interest in space: space-2	{"spaceId": "space-2", "interestLevel": "MEDIUM"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 14:39:40.254
cmfr1n02b0003tsb7a1zse0yd	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 16:18:04.692
cmfr1ne850007tsb7asvsg5q1	cmfnl7k690009pow9cdk6m78v	LOGOUT	User logged out with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 16:18:23.045
cmfr1u0yb000btsb770d08x3p	cmfnl7k690009pow9cdk6m78v	LOGIN	User logged in with email: customer@spacefinder.com	{"email": "customer@spacefinder.com"}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 16:23:32.431
cmfr1usvm000ftsb76lpieyub	cmfnl7k690009pow9cdk6m78v	PROFILE_UPDATE	User updated profile fields: firstName, lastName	{"updatedFields": ["firstName", "lastName"]}	::ffff:192.168.0.105	Dart/3.8 (dart:io)	2025-09-19 16:24:08.627
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.user_profiles (id, user_id, first_name, last_name, phone, avatar_url, preferences, created_at, updated_at) FROM stdin;
cmfnl7jvs0008pow9rn3oq9wm	cmfnl7jvs0007pow9vixc0lga	Admin	User	+91-9876543210	\N	\N	2025-09-17 06:14:51.496	2025-09-17 06:14:51.496
cmfnl7k69000apow91qa6qnm9	cmfnl7k690009pow9cdk6m78v	customer 	1	+91-9876543211	\N	{"sizeRange": {"max": 5000, "min": 0}, "budgetRange": {"max": 100000, "min": 0}, "preferredCities": ["Bengaluru"], "preferredFloors": ["Ground Floor", "First Floor"], "preferredSectors": ["Mall Space", "Shopping Center", "Commercial Complex", "Metro Station"], "preferredAmenities": ["Parking", "Security", "Elevator"], "notificationSettings": {"sms": false, "push": true, "email": true}, "adjacentBrandPreferences": ["Apple", "Starbucks"]}	2025-09-17 06:14:51.874	2025-09-19 16:24:08.621
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.user_sessions (id, user_id, token, expires_at, created_at) FROM stdin;
cmfnlqk3a0001k1wxf547x6sg	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgwOTA1NzgsImV4cCI6MTc2MDY4MjU3OH0.7N3YDPABai8wKPCcqycdywS8fhiJPhtq3FpEymbfWFg	2025-10-17 06:29:38.227	2025-09-17 06:29:38.228
cmfnmp0ev000194rqiy5ljetv	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgwOTIxODUsImV4cCI6MTc2MDY4NDE4NX0.PyveYAeyhZDafcnvHemPBJeqLCzfwmzAty8wGeFHbTE	2025-10-17 06:56:25.684	2025-09-17 06:56:25.685
cmfnn5a850001o9znz5lnty7c	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgwOTI5NDQsImV4cCI6MTc2MDY4NDk0NH0.qOLWryvrXHcA_B3utY-tLXyVx4T6FpSgPhXD0cHPD6c	2025-10-17 07:09:04.898	2025-09-17 07:09:04.899
cmfnnjzst000113v50w5iq9mf	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgwOTM2MzEsImV4cCI6MTc2MDY4NTYzMX0.61_LY_F2qfVFEpz077pOto5dOHCLEaiiWNG3RwHvmpw	2025-10-17 07:20:31.227	2025-09-17 07:20:31.229
cmfnrgbqt0001wyovc0s02hlo	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgxMDAxNzgsImV4cCI6MTc2MDY5MjE3OH0.Hk0Tuq1TImFegDsRBs8ollq0sRQefB2Eqng4eFqmcJQ	2025-10-17 09:09:38.544	2025-09-17 09:09:38.546
cmfnw443e00137gsopau0ha7p	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgxMDgwMDYsImV4cCI6MTc2MDcwMDAwNn0.hxSHXDmcO9OZEkRIbMkvtpL5PN-IJSSP2BB8wEQcfcg	2025-10-17 11:20:06.839	2025-09-17 11:20:06.843
cmfoygz0h0001yqajh77jcf2h	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzI0MzIsImV4cCI6MTc2MDc2NDQzMn0._STvfa8uXBH5IgjmWVICJPieY_RHOefVmKxfyzLxM_Q	2025-10-18 05:13:52.191	2025-09-18 05:13:52.193
cmfoyl8ro0001z1js9oav87as	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzI2MzEsImV4cCI6MTc2MDc2NDYzMX0.tXFOReAqP5zlZdfa6kFxn7xPaFiF-BI_9F7BF2toJWw	2025-10-18 05:17:11.459	2025-09-18 05:17:11.46
cmfoys0ds0001gc97buh4o856	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgxNzI5NDcsImV4cCI6MTc2MDc2NDk0N30.mR7YiQfFb2z0uyNHX4-54f7wdszGzSFjAKuBgq6MuTw	2025-10-18 05:22:27.184	2025-09-18 05:22:27.185
cmfoyspwa0007gc97cqf4igj6	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzI5ODAsImV4cCI6MTc2MDc2NDk4MH0.MiDV1jj3GdfUB7Q1cbP3wkprgNZqO0eyFG5mxZ4dxuA	2025-10-18 05:23:00.249	2025-09-18 05:23:00.25
cmfoyvatz0001mztrry8he7hi	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzMxMDAsImV4cCI6MTc2MDc2NTEwMH0.sM3jLUpB_y2OYVBLuGiFqTmne7DLtlq3hpsgGrfpCO0	2025-10-18 05:25:00.693	2025-09-18 05:25:00.694
cmfoyyd8a0007mztrld2jg7kz	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgxNzMyNDMsImV4cCI6MTc2MDc2NTI0M30.cqQ4sEgvrSQ_7PcYfbTwuAB3Dp7o2X8eA5_9Q1ZT9dc	2025-10-18 05:27:23.769	2025-09-18 05:27:23.77
cmfoz66d9000dmztrpc125rus	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzM2MDgsImV4cCI6MTc2MDc2NTYwOH0.IVF-yIL-MX7VM25geNQ_hnCpdwJLdRth8Bth5MKi0d4	2025-10-18 05:33:28.124	2025-09-18 05:33:28.125
cmfoz8kcq000jmztryk0z62cm	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzM3MTksImV4cCI6MTc2MDc2NTcxOX0.5jG7-Zs1iK51Qz7jaeXiNQ8Pq-wpOGxikTTIYC_Q7Nk	2025-10-18 05:35:19.561	2025-09-18 05:35:19.562
cmfoz9ooz000pmztrjtiga0ue	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzM3NzEsImV4cCI6MTc2MDc2NTc3MX0.2Wcs1ZvagxCx-__o_LwYwoJIt7WbSBW7s_QKD9sDVkQ	2025-10-18 05:36:11.842	2025-09-18 05:36:11.843
cmfozcnf5000vmztr5lz4paw0	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzM5MTAsImV4cCI6MTc2MDc2NTkxMH0._WK5Jldn79ja13Td_pYXK838b0DNWCwpe0ylhNPJW-M	2025-10-18 05:38:30.16	2025-09-18 05:38:30.161
cmfozfnzg0011mztrqhyw48l2	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzQwNTAsImV4cCI6MTc2MDc2NjA1MH0.156OB96p6dm9dyn9-6J-3RAFuFtciy_Nj0jXAlisZbk	2025-10-18 05:40:50.86	2025-09-18 05:40:50.861
cmfoziu200017mztryob21mr6	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzQxOTgsImV4cCI6MTc2MDc2NjE5OH0.jY3v7P_-x4uu56uEL1-8oEZboUOrRSeiM498-gH7rjQ	2025-10-18 05:43:18.695	2025-09-18 05:43:18.696
cmfozq2dq001pmztrtrm2cxt3	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgxNzQ1MzYsImV4cCI6MTc2MDc2NjUzNn0.fxRPGhf90fq46L_mb8La3vgAQnBxl2RDj6J5moLzezs	2025-10-18 05:48:56.077	2025-09-18 05:48:56.078
cmfp0f19k0001byju78kkyfvk	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzU3MDEsImV4cCI6MTc2MDc2NzcwMX0.cbD74TKVAoqpVVYgdlN8Owel-6K1yvH2pcpBx8CoGLQ	2025-10-18 06:08:21.032	2025-09-18 06:08:21.033
cmfp0fbbm0007byju60lpkav2	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgxNzU3MTQsImV4cCI6MTc2MDc2NzcxNH0.1IcFVIaFbqd52aTSh-DiaOkCYsJnF2aA-ReP4SJb1N8	2025-10-18 06:08:34.066	2025-09-18 06:08:34.066
cmfp0zdjr000h1ypu0d4n1qz2	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxNzY2NTAsImV4cCI6MTc2MDc2ODY1MH0.MSOu9y9hy53dsq1PUs7o5dH9GJne2dV4QIWB7Xe6N0E	2025-10-18 06:24:10.07	2025-09-18 06:24:10.071
cmfp45m9z000l430oos21tzkj	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgxODQ4MDEsImV4cCI6MTc2MDc3NjgwMX0.eunJmIbJ_chVM9uAziQQ6ZHaIMuijs1SDECkTUtafjI	2025-10-18 08:40:01.871	2025-09-18 07:53:00.168
cmfqh6d5t0001xoia6xeyy45u	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgyNjQzMTYsImV4cCI6MTc2MDg1NjMxNn0.rKoZ7SVNQ42qZ0SOKrszAWewzM-j_fCrPW0kZIYXkc0	2025-10-19 06:45:16.193	2025-09-19 06:45:16.194
cmfqhkelg00019bc2z21ggozp	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgyNjQ5NzEsImV4cCI6MTc2MDg1Njk3MX0.ysYXKJbyFi4B4JmPqZdnyBc5DTS0xc9MtCy5ErSKUWM	2025-10-19 06:56:11.236	2025-09-19 06:56:11.236
cmfqttwn7000nu0a9nksanil7	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgyODU1NjksImV4cCI6MTc2MDg3NzU2OX0.gWZW84f4cl5a1sI64Wyfe9v0bmnNfeuETsC-lrqVztI	2025-10-19 12:39:29.92	2025-09-19 12:39:29.921
cmfqub1y5000tu0a9qdn6d0k9	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgyODYzNjksImV4cCI6MTc2MDg3ODM2OX0.t83Tsuu0JVnzR8CNT1LBNhoWe0TKV1z9V1ZBY-VfLac	2025-10-19 12:52:49.948	2025-09-19 12:52:49.949
cmfquq35s000zu0a9wk1p9n0u	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgyODcwNzEsImV4cCI6MTc2MDg3OTA3MX0.sfT8IkiM2VimWkOpqYAptHZFG_g0TGhNA8I-dTRaLHA	2025-10-19 13:04:31.359	2025-09-19 13:04:31.36
cmfquyr670015u0a9ph2dqksz	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgyODc0NzUsImV4cCI6MTc2MDg3OTQ3NX0.VHoJokT97V4o0OURovH-ElfHxCixKjimK_q_gzAufrc	2025-10-19 13:11:15.727	2025-09-19 13:11:15.728
cmfqvlybj001bu0a9ppjurr45	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgyODg1NTgsImV4cCI6MTc2MDg4MDU1OH0.piYBcQXhYQiZ-vaZxSyxjraWE5ZyiYea6whZTzvhHBc	2025-10-19 13:29:18.079	2025-09-19 13:29:18.079
cmfqvmt8y001hu0a9odnc4qes	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgyODg1OTgsImV4cCI6MTc2MDg4MDU5OH0._m2lIchrCEGOTO1q7Kyaawf8JR9WR8Iiz9-NyeLi8-Q	2025-10-19 13:29:58.162	2025-09-19 13:29:58.162
cmfqvungw001nu0a9ojhik442	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgyODg5NjMsImV4cCI6MTc2MDg4MDk2M30.d-Syyc2epMgdl0GqrRlPAnrpNCx1Uc_QSJ8W0o_YhkI	2025-10-19 13:36:03.919	2025-09-19 13:36:03.92
cmfqvyr73001tu0a9vhq8diwd	cmfnl7jvs0007pow9vixc0lga	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2p2czAwMDdwb3c5dml4YzBsZ2EiLCJpYXQiOjE3NTgyODkxNTUsImV4cCI6MTc2MDg4MTE1NX0.oe55mLeN58ZfaYJuWavkubMK2b28LVDfZkms9R9siqs	2025-10-19 13:39:15.375	2025-09-19 13:39:15.376
cmfr1u0y40009tsb7rzmhts5r	cmfnl7k690009pow9cdk6m78v	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNtZm5sN2s2OTAwMDlwb3c5Y2RrNm03OHYiLCJpYXQiOjE3NTgyOTkwMTIsImV4cCI6MTc2MDg5MTAxMn0.ODCLEubXiyrPftc5r6Y96lilU9SHiPbF0Y_r_EMId9g	2025-10-19 16:23:32.428	2025-09-19 16:23:32.428
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: apple
--

COPY public.users (id, email, password_hash, role, is_active, email_verified, created_at, updated_at, username) FROM stdin;
cmfnl7jvs0007pow9vixc0lga	admin@spacefinder.com	$2a$12$3FgMF6XclB560LbfilyQ3uJkjVBJdoQqFmimrMbEpOTXD/6JQWPKK	ADMIN	t	f	2025-09-17 06:14:51.496	2025-09-19 16:16:12.273	admin
cmfnl7k690009pow9cdk6m78v	customer@spacefinder.com	$2a$12$/VrT58eu0y7Pw5KBSpquT.4suXt8h/.2hyectJy/T7roFoStJ0Deu	CUSTOMER	t	f	2025-09-17 06:14:51.874	2025-09-19 16:16:19.059	customer
\.


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: floors floors_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_pkey PRIMARY KEY (id);


--
-- Name: interested_spaces interested_spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.interested_spaces
    ADD CONSTRAINT interested_spaces_pkey PRIMARY KEY (id);


--
-- Name: mall_analytics mall_analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.mall_analytics
    ADD CONSTRAINT mall_analytics_pkey PRIMARY KEY (id);


--
-- Name: mall_managers mall_managers_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.mall_managers
    ADD CONSTRAINT mall_managers_pkey PRIMARY KEY (id);


--
-- Name: malls malls_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.malls
    ADD CONSTRAINT malls_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: recent_views recent_views_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.recent_views
    ADD CONSTRAINT recent_views_pkey PRIMARY KEY (id);


--
-- Name: sectors sectors_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.sectors
    ADD CONSTRAINT sectors_pkey PRIMARY KEY (id);


--
-- Name: space_amenities space_amenities_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_amenities
    ADD CONSTRAINT space_amenities_pkey PRIMARY KEY (id);


--
-- Name: space_availability_logs space_availability_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_availability_logs
    ADD CONSTRAINT space_availability_logs_pkey PRIMARY KEY (id);


--
-- Name: space_images space_images_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_images
    ADD CONSTRAINT space_images_pkey PRIMARY KEY (id);


--
-- Name: space_inquiries space_inquiries_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_inquiries
    ADD CONSTRAINT space_inquiries_pkey PRIMARY KEY (id);


--
-- Name: space_interest_notifications space_interest_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_interest_notifications
    ADD CONSTRAINT space_interest_notifications_pkey PRIMARY KEY (id);


--
-- Name: spaces spaces_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_pkey PRIMARY KEY (id);


--
-- Name: user_activities user_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cities_name_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX cities_name_key ON public.cities USING btree (name);


--
-- Name: floors_mall_id_floor_number_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX floors_mall_id_floor_number_key ON public.floors USING btree (mall_id, floor_number);


--
-- Name: interested_spaces_user_id_space_id_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX interested_spaces_user_id_space_id_key ON public.interested_spaces USING btree (user_id, space_id);


--
-- Name: mall_managers_user_id_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX mall_managers_user_id_key ON public.mall_managers USING btree (user_id);


--
-- Name: recent_views_user_id_space_id_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX recent_views_user_id_space_id_key ON public.recent_views USING btree (user_id, space_id);


--
-- Name: sectors_name_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX sectors_name_key ON public.sectors USING btree (name);


--
-- Name: space_interest_notifications_space_id_interested_user_id_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX space_interest_notifications_space_id_interested_user_id_key ON public.space_interest_notifications USING btree (space_id, interested_user_id);


--
-- Name: user_profiles_user_id_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX user_profiles_user_id_key ON public.user_profiles USING btree (user_id);


--
-- Name: user_sessions_token_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX user_sessions_token_key ON public.user_sessions USING btree (token);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: apple
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: floors floors_mall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.floors
    ADD CONSTRAINT floors_mall_id_fkey FOREIGN KEY (mall_id) REFERENCES public.malls(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interested_spaces interested_spaces_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.interested_spaces
    ADD CONSTRAINT interested_spaces_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: interested_spaces interested_spaces_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.interested_spaces
    ADD CONSTRAINT interested_spaces_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mall_analytics mall_analytics_mall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.mall_analytics
    ADD CONSTRAINT mall_analytics_mall_id_fkey FOREIGN KEY (mall_id) REFERENCES public.malls(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: mall_managers mall_managers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.mall_managers
    ADD CONSTRAINT mall_managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: malls malls_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.malls
    ADD CONSTRAINT malls_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: malls malls_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.malls
    ADD CONSTRAINT malls_manager_id_fkey FOREIGN KEY (manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: malls malls_sector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.malls
    ADD CONSTRAINT malls_sector_id_fkey FOREIGN KEY (sector_id) REFERENCES public.sectors(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recent_views recent_views_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.recent_views
    ADD CONSTRAINT recent_views_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: recent_views recent_views_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.recent_views
    ADD CONSTRAINT recent_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_amenities space_amenities_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_amenities
    ADD CONSTRAINT space_amenities_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_availability_logs space_availability_logs_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_availability_logs
    ADD CONSTRAINT space_availability_logs_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_images space_images_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_images
    ADD CONSTRAINT space_images_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_inquiries space_inquiries_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_inquiries
    ADD CONSTRAINT space_inquiries_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_inquiries space_inquiries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_inquiries
    ADD CONSTRAINT space_inquiries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_interest_notifications space_interest_notifications_interested_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_interest_notifications
    ADD CONSTRAINT space_interest_notifications_interested_user_id_fkey FOREIGN KEY (interested_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_interest_notifications space_interest_notifications_mall_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_interest_notifications
    ADD CONSTRAINT space_interest_notifications_mall_manager_id_fkey FOREIGN KEY (mall_manager_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: space_interest_notifications space_interest_notifications_space_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.space_interest_notifications
    ADD CONSTRAINT space_interest_notifications_space_id_fkey FOREIGN KEY (space_id) REFERENCES public.spaces(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: spaces spaces_floor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.spaces
    ADD CONSTRAINT spaces_floor_id_fkey FOREIGN KEY (floor_id) REFERENCES public.floors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_activities user_activities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.user_activities
    ADD CONSTRAINT user_activities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: apple
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

