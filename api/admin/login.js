const { passwordMatches, setSessionCookie } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const password = req.body && req.body.password;
  if (!passwordMatches(password)) {
    // Small delay to make brute-forcing a little less pleasant; not a substitute for a strong password.
    await new Promise((r) => setTimeout(r, 400));
    res.status(401).json({ error: 'Incorrect password' });
    return;
  }

  setSessionCookie(res);
  res.status(200).json({ ok: true });
};
