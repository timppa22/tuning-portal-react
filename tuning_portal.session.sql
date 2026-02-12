INSERT INTO users (
    id,
    username,
    email,
    password,
    full_name,
    role,
    email_verified,
    registration_date
  )
VALUES (
    id:int,
    'username:varchar',
    'email:varchar',
    'password:varchar',
    'full_name:varchar',
    'role:enum',
    'email_verified:tinyint',
    'registration_date:datetime'
  );INSERT INTO users (
    id,
    username,
    email,
    password,
    full_name,
    role,
    email_verified,
    registration_date
  )
VALUES (
    id:int,
    'username:timppa22',
    'email:dimitriflorin_5@hotmail.com',
    'password:220178119y',
    'full_name:Dimitri Florin',
    'role:enum',
    'email_verified:tinyint',
    'registration_date:datetime'
  );

-- Admin User
INSERT INTO users (
  email,
  password_hash,
  first_name,
  last_name,
  role,
  is_verified,
  created_at,
  updated_at
) VALUES (
  'admin@tuningportal.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'Admin',
  'User',
  'admin',
  TRUE,
  NOW(),
  NOW()
);
