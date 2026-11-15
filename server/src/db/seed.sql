-- Seed data for development / testing
-- Run after schema.sql

INSERT INTO users (id, email, display_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'alice@example.com', 'Alice'),
  ('00000000-0000-0000-0000-000000000002', 'bob@example.com', 'Bob'),
  ('00000000-0000-0000-0000-000000000003', 'carol@example.com', 'Carol'),
  ('00000000-0000-0000-0000-000000000004', 'dave@example.com', 'Dave'),
  ('00000000-0000-0000-0000-000000000005', 'newuser@example.com', 'NewUser')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (user_id, location, remote_preference, availability_hours_pw, visibility) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Mumbai', 'hybrid', 20, 'public'),
  ('00000000-0000-0000-0000-000000000002', 'Delhi', 'remote', 40, 'public'),
  ('00000000-0000-0000-0000-000000000003', 'Bangalore', 'onsite', 10, 'public'),
  ('00000000-0000-0000-0000-000000000004', 'Mumbai', 'remote', 30, 'public'),
  ('00000000-0000-0000-0000-000000000005', 'Chennai', 'flexible', 15, 'public')
ON CONFLICT DO NOTHING;

INSERT INTO skills (id, name, category, aliases) VALUES
  (1,  'JavaScript',          'Technology',  ARRAY['JS', 'Node.js']),
  (2,  'Python',              'Technology',  ARRAY['py']),
  (3,  'Graphic Design',      'Creative',    ARRAY['design', 'visual design']),
  (4,  'Photography',         'Creative',    ARRAY['photo', 'photographer']),
  (5,  'Tailoring',           'Trade',       ARRAY['sewing', 'stitching']),
  (6,  'Cooking',             'Trade',       ARRAY['baking', 'chef']),
  (7,  'Digital Marketing',   'Business',    ARRAY['SEO', 'social media']),
  (8,  'Teaching',            'Education',   ARRAY['tutoring', 'training']),
  (9,  'Video Editing',       'Creative',    ARRAY['video production', 'editing']),
  (10, 'Translation',         'Language',    ARRAY['interpreter', 'localisation']),
  (11, 'Carpentry',           'Trade',       ARRAY['woodwork', 'furniture']),
  (12, 'React',               'Technology',  ARRAY['ReactJS', 'React.js']),
  (13, 'Content Writing',     'Creative',    ARRAY['copywriting', 'blogging'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_skills (user_id, skill_id, direction, proficiency, weight) VALUES
  ('00000000-0000-0000-0000-000000000001', 1,  'offer', 'expert',       1.0),
  ('00000000-0000-0000-0000-000000000001', 12, 'offer', 'expert',       0.9),
  ('00000000-0000-0000-0000-000000000001', 7,  'need',  'beginner',     0.6),
  ('00000000-0000-0000-0000-000000000002', 3,  'offer', 'intermediate', 0.8),
  ('00000000-0000-0000-0000-000000000002', 9,  'offer', 'expert',       1.0),
  ('00000000-0000-0000-0000-000000000003', 5,  'offer', 'expert',       1.0),
  ('00000000-0000-0000-0000-000000000003', 6,  'offer', 'intermediate', 0.7),
  ('00000000-0000-0000-0000-000000000004', 7,  'offer', 'expert',       1.0),
  ('00000000-0000-0000-0000-000000000004', 13, 'offer', 'expert',       0.9),
  ('00000000-0000-0000-0000-000000000005', 8,  'offer', 'intermediate', 0.7)
ON CONFLICT DO NOTHING;

INSERT INTO user_interests (user_id, interest, weight) VALUES
  ('00000000-0000-0000-0000-000000000001', 'technology', 1.0),
  ('00000000-0000-0000-0000-000000000001', 'startups',   0.8),
  ('00000000-0000-0000-0000-000000000002', 'art',        1.0),
  ('00000000-0000-0000-0000-000000000002', 'media',      0.9),
  ('00000000-0000-0000-0000-000000000003', 'fashion',    1.0),
  ('00000000-0000-0000-0000-000000000003', 'food',       0.7),
  ('00000000-0000-0000-0000-000000000004', 'marketing',  1.0),
  ('00000000-0000-0000-0000-000000000004', 'business',   0.8)
ON CONFLICT DO NOTHING;

INSERT INTO opportunities (id, owner_id, title, description, type, is_paid, amount_min, amount_max, currency, remote_mode, required_hours_pw, status) VALUES
  ('a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'React Developer for NGO Website', 'Build a small React website for a local NGO', 'freelance', true, 5000, 15000, 'INR', 'remote', 10, 'open'),
  ('a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'Poster Designer for Event', 'Design posters for community fair', 'creative', false, NULL, NULL, 'INR', 'hybrid', 5, 'open'),
  ('a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000003', 'Social Media Manager', 'Manage Instagram and Facebook for small business', 'job', true, 10000, 20000, 'INR', 'remote', 20, 'open'),
  ('a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000004', 'Tailoring Volunteer', 'Help stitch uniforms for school children', 'volunteering', false, NULL, NULL, 'INR', 'onsite', 8, 'open'),
  ('a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Python Data Script', 'Write a small Python data processing script', 'freelance', true, 2000, 8000, 'INR', 'remote', 5, 'open')
ON CONFLICT DO NOTHING;

INSERT INTO opportunity_skills (opportunity_id, skill_id, importance, is_mandatory) VALUES
  ('a0000000-0000-0000-0000-000000000001', 1,  0.7, false),
  ('a0000000-0000-0000-0000-000000000001', 12, 1.0, true),
  ('a0000000-0000-0000-0000-000000000002', 3,  1.0, true),
  ('a0000000-0000-0000-0000-000000000002', 9,  0.6, false),
  ('a0000000-0000-0000-0000-000000000003', 7,  1.0, true),
  ('a0000000-0000-0000-0000-000000000003', 13, 0.7, false),
  ('a0000000-0000-0000-0000-000000000004', 5,  1.0, true),
  ('a0000000-0000-0000-0000-000000000005', 2,  1.0, true)
ON CONFLICT DO NOTHING;

INSERT INTO opportunity_interests (opportunity_id, interest, weight) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'technology', 1.0),
  ('a0000000-0000-0000-0000-000000000001', 'startups',   0.6),
  ('a0000000-0000-0000-0000-000000000002', 'art',        1.0),
  ('a0000000-0000-0000-0000-000000000002', 'media',      0.8),
  ('a0000000-0000-0000-0000-000000000003', 'marketing',  1.0),
  ('a0000000-0000-0000-0000-000000000003', 'business',   0.7),
  ('a0000000-0000-0000-0000-000000000004', 'fashion',    0.9),
  ('a0000000-0000-0000-0000-000000000005', 'technology', 1.0)
ON CONFLICT DO NOTHING;
