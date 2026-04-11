const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { query } = require('../config/database');

function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

async function storeRefreshToken(userId, token) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30); // 30 days

  await query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  );
}

/**
 * POST /api/auth/register
 */
exports.register = async (req, res, next) => {
  try {
    const { email, password, displayName, role } = req.body;

    // Check existing user
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Validate role
    const validRoles = ['producer', 'client'];
    const userRole = validRoles.includes(role) ? role : 'producer';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await query(
      `INSERT INTO users (email, password_hash, role, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, role, display_name, subscription_tier, created_at`,
      [email, passwordHash, userRole, displayName]
    );

    const user = result.rows[0];

    // Create role-specific profile
    if (userRole === 'producer') {
      await query(
        'INSERT INTO producer_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    } else {
      await query(
        'INSERT INTO client_profiles (user_id) VALUES ($1)',
        [user.id]
      );
    }

    // Auto-join Open Community space
    const openSpace = await query(
      "SELECT id FROM spaces WHERE slug = 'open-community'"
    );
    if (openSpace.rows.length > 0) {
      await query(
        'INSERT INTO space_memberships (user_id, space_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [user.id, openSpace.rows[0].id]
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        subscriptionTier: user.subscription_tier,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/login
 */
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, email, password_hash, role, display_name, avatar_url,
              subscription_tier, account_status
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.account_status !== 'active') {
      return res.status(403).json({ error: 'Account is ' + user.account_status });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        displayName: user.display_name,
        avatarUrl: user.avatar_url,
        subscriptionTier: user.subscription_tier,
      },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/refresh
 */
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    const result = await query(
      `SELECT rt.id, rt.user_id, u.role, u.account_status
       FROM refresh_tokens rt
       JOIN users u ON u.id = rt.user_id
       WHERE rt.token_hash = $1 AND rt.revoked = FALSE AND rt.expires_at > NOW()`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    const { user_id, role, account_status } = result.rows[0];

    if (account_status !== 'active') {
      return res.status(403).json({ error: 'Account is ' + account_status });
    }

    // Revoke old token
    await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);

    // Issue new pair
    const newAccessToken = generateAccessToken(user_id, role);
    const newRefreshToken = generateRefreshToken();
    await storeRefreshToken(user_id, newRefreshToken);

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/logout
 */
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
      await query('UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1', [tokenHash]);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * WordPress SSO token verification
 */
function base64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = (4 - (padded.length % 4)) % 4;
  return Buffer.from(padded + '='.repeat(pad), 'base64');
}

// In-memory nonce store — swap for Redis in production
const usedNonces = new Set();

// Short-lived SSO exchange codes: code → { accessToken, refreshToken }, auto-expire in 60s
const ssoExchangeCodes = new Map();

function verifyWpSsoToken(token) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, sig] = parts;
  const secret = process.env.WP_SSO_SECRET;

  if (!secret) return null;

  // Verify HMAC-SHA256 signature
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
    return null;
  }

  const claims = JSON.parse(base64urlDecode(payload).toString('utf8'));
  const now = Math.floor(Date.now() / 1000);

  if (claims.exp < now) return null;
  if (claims.aud !== 'https://community.podwires.com') return null;
  if (usedNonces.has(claims.jti)) return null;

  usedNonces.add(claims.jti);
  setTimeout(() => usedNonces.delete(claims.jti), 5 * 60 * 1000);

  return claims;
}

/**
 * GET /api/auth/sso?token=...
 * WordPress SSO login — upserts user and issues JWT pair
 */
exports.sso = async (req, res, next) => {
  try {
    const token = req.query.token;
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:3000';

    if (!token) {
      return res.redirect(`${clientUrl}/?sso_error=missing_token`);
    }

    const claims = verifyWpSsoToken(token);
    if (!claims) {
      return res.redirect(`${clientUrl}/?sso_error=invalid_token`);
    }

    // Map WP role to community role
    const validRoles = ['producer', 'client', 'admin'];
    const role = validRoles.includes(claims.community_role)
      ? claims.community_role
      : 'producer';

    // Upsert user
    const result = await query(
      `INSERT INTO users (wp_user_id, email, display_name, avatar_url, role, last_sso_at, account_status)
       VALUES ($1, $2, $3, $4, $5::user_role, NOW(), 'active')
       ON CONFLICT (wp_user_id) DO UPDATE SET
         email = EXCLUDED.email,
         display_name = EXCLUDED.display_name,
         avatar_url = EXCLUDED.avatar_url,
         role = EXCLUDED.role,
         last_sso_at = NOW()
       RETURNING id, email, role, display_name, avatar_url, subscription_tier`,
      [claims.wp_user_id, claims.email, claims.display_name, claims.avatar_url, role]
    );

    const user = result.rows[0];

    // Create profile if first SSO login (INSERT was used, not UPDATE)
    if (result.command === 'INSERT') {
      if (role === 'producer') {
        await query(
          'INSERT INTO producer_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
          [user.id]
        );
      } else if (role === 'client') {
        await query(
          'INSERT INTO client_profiles (user_id) VALUES ($1) ON CONFLICT DO NOTHING',
          [user.id]
        );
      }

      // Auto-join Open Community
      const openSpace = await query("SELECT id FROM spaces WHERE slug = 'open-community'");
      if (openSpace.rows.length > 0) {
        await query(
          'INSERT INTO space_memberships (user_id, space_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, openSpace.rows[0].id]
        );
      }
    }

    // Issue JWT pair
    const accessToken = generateAccessToken(user.id, user.role);
    const refreshToken = generateRefreshToken();
    await storeRefreshToken(user.id, refreshToken);

    // Store a short-lived exchange code (60s TTL) and redirect to frontend callback
    const exchangeCode = crypto.randomBytes(32).toString('hex');
    ssoExchangeCodes.set(exchangeCode, { accessToken, refreshToken });
    setTimeout(() => ssoExchangeCodes.delete(exchangeCode), 60 * 1000);

    res.redirect(`${clientUrl}/auth/sso-callback?code=${exchangeCode}`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/auth/sso-exchange?code=...
 * One-time exchange: frontend hands in the code, gets back JWT pair
 */
exports.ssoExchange = (req, res) => {
  const code = req.query.code;
  if (!code || !ssoExchangeCodes.has(code)) {
    return res.status(400).json({ error: 'Invalid or expired exchange code' });
  }

  const tokens = ssoExchangeCodes.get(code);
  ssoExchangeCodes.delete(code); // one-time use
  res.json(tokens);
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, email, role, display_name, avatar_url, subscription_tier,
              email_verified, profile_setup_completed, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.display_name,
      avatarUrl: user.avatar_url,
      subscriptionTier: user.subscription_tier,
      emailVerified: user.email_verified,
      profileSetupCompleted: user.profile_setup_completed,
      createdAt: user.created_at,
    });
  } catch (err) {
    next(err);
  }
};

const { sendVerificationEmail } = require('../config/email');

/**
 * POST /api/auth/send-verification
 * Generates + emails a 6-digit code (rate: 1 per minute enforced in route)
 */
exports.sendVerification = async (req, res, next) => {
  try {
    const user = req.user; // authenticated

    if (user.email_verified) {
      return res.json({ message: 'Email already verified' });
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

    await query(
      'UPDATE users SET email_verification_code_hash = $1, email_verification_expires_at = $2 WHERE id = $3',
      [codeHash, expiresAt, user.id]
    );

    await sendVerificationEmail(user.email, user.display_name, code);

    res.json({ message: 'Verification code sent' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/verify-email
 * Body: { code: "123456" }
 */
exports.verifyEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const userId = req.user.id;

    if (!code) {
      return res.status(400).json({ error: 'Verification code required' });
    }

    const result = await query(
      'SELECT email_verification_code_hash, email_verification_expires_at, email_verified FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.email_verified) {
      return res.json({ message: 'Email already verified' });
    }

    if (!user.email_verification_code_hash || !user.email_verification_expires_at) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    if (new Date(user.email_verification_expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new one.' });
    }

    const submittedHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    if (submittedHash !== user.email_verification_code_hash) {
      return res.status(400).json({ error: 'Invalid verification code.' });
    }

    // Mark verified, clear code
    await query(
      `UPDATE users SET
         email_verified = TRUE,
         email_verified_at = NOW(),
         email_verification_code_hash = NULL,
         email_verification_expires_at = NULL
       WHERE id = $1`,
      [userId]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/auth/profile-setup
 * Saves initial profile data; marks profile_setup_completed = true
 */
exports.profileSetup = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const {
      displayName,
      timezone,
      headline,
      bio,
      location,
      websiteUrl,
      twitterUrl,
      facebookUrl,
      instagramUrl,
      linkedinUrl,
      youtubeUrl,
      podcastUrl,
      preventMessaging = false,
      showInDirectory = true,
    } = req.body;

    // Update users table
    const updates = [];
    const vals = [];
    let idx = 1;

    if (displayName) { updates.push(`display_name = $${idx++}`); vals.push(displayName); }
    updates.push(`profile_setup_completed = TRUE`);

    if (updates.length > 0) {
      vals.push(userId);
      await query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${idx}`, vals);
    }

    // Update role-specific profile
    const profileUpdates = {};
    if (headline)     profileUpdates.headline = headline;
    if (bio)          profileUpdates.bio = bio;
    if (location)     profileUpdates.location = location;
    if (timezone)     profileUpdates.timezone = timezone;
    if (websiteUrl)   profileUpdates.website_url = websiteUrl;
    if (linkedinUrl)  profileUpdates.linkedin_url = linkedinUrl;
    if (twitterUrl)   profileUpdates.twitter_handle = twitterUrl;
    if (facebookUrl)  profileUpdates.facebook_url = facebookUrl;
    if (instagramUrl) profileUpdates.instagram_url = instagramUrl;
    if (youtubeUrl)   profileUpdates.youtube_url = youtubeUrl;
    if (podcastUrl)   profileUpdates.podcast_url = podcastUrl;

    if (Object.keys(profileUpdates).length > 0) {
      const table = userRole === 'producer' ? 'producer_profiles' : 'client_profiles';
      const setClauses = Object.keys(profileUpdates).map((k, i) => `${k} = $${i + 2}`).join(', ');
      const profileVals = [userId, ...Object.values(profileUpdates)];
      await query(`UPDATE ${table} SET ${setClauses} WHERE user_id = $1`, profileVals);
    }

    res.json({ message: 'Profile saved', profileSetupCompleted: true });
  } catch (err) {
    next(err);
  }
};
