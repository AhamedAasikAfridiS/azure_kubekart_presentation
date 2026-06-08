const ROLE_CLAIM_TYPES = new Set([
  'roles',
  'role',
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role',
]);

const claimValue = (claims, names) => {
  const normalizedNames = names.map((name) => name.toLowerCase());
  const claim = claims.find((item) => {
    const type = String(item.typ || item.type || '').toLowerCase();
    return normalizedNames.some((name) => type === name || type.endsWith(`/${name}`));
  });
  return claim ? claim.val || claim.value : undefined;
};

const parseEasyAuthPrincipal = (req) => {
  const encodedPrincipal = req.get('x-ms-client-principal');
  if (!encodedPrincipal) return null;

  try {
    const principal = JSON.parse(
      Buffer.from(encodedPrincipal, 'base64').toString('utf8')
    );
    const claims = Array.isArray(principal.claims) ? principal.claims : [];
    const roles = new Set(principal.userRoles || []);

    claims.forEach((claim) => {
      const type = String(claim.typ || claim.type || '').toLowerCase();
      if (ROLE_CLAIM_TYPES.has(type)) {
        roles.add(claim.val || claim.value);
      }
    });

    const email = principal.userDetails
      || req.get('x-ms-client-principal-name')
      || claimValue(claims, ['preferred_username', 'email', 'emailaddress', 'upn']);
    const id = principal.userId
      || req.get('x-ms-client-principal-id')
      || claimValue(claims, ['oid', 'nameidentifier', 'sub']);
    const displayName = claimValue(claims, ['name']) || email || '';
    const firstName = claimValue(claims, ['given_name', 'givenname'])
      || displayName.split(' ')[0]
      || '';
    const lastName = claimValue(claims, ['family_name', 'surname'])
      || displayName.split(' ').slice(1).join(' ')
      || '';
    const roleList = [...roles].filter(Boolean);
    const isAdmin = roleList.some((role) => String(role).toLowerCase() === 'admin');

    if (!id || !email) return null;

    return {
      id,
      email,
      firstName,
      lastName,
      name: displayName,
      role: isAdmin ? 'admin' : 'customer',
      roles: roleList,
    };
  } catch {
    return null;
  }
};

const getLocalPrincipal = () => {
  const isAzure = Boolean(process.env.WEBSITE_INSTANCE_ID);
  const bypassEnabled = process.env.DEV_AUTH_BYPASS === 'true' && !isAzure;
  if (!bypassEnabled) return null;

  return {
    id: process.env.DEV_AUTH_ID || 'local-user-001',
    email: process.env.DEV_AUTH_EMAIL || 'developer@example.com',
    firstName: process.env.DEV_AUTH_FIRST_NAME || 'Local',
    lastName: process.env.DEV_AUTH_LAST_NAME || 'Developer',
    name: `${process.env.DEV_AUTH_FIRST_NAME || 'Local'} ${process.env.DEV_AUTH_LAST_NAME || 'Developer'}`,
    role: process.env.DEV_AUTH_ROLE || 'customer',
    roles: [process.env.DEV_AUTH_ROLE || 'customer'],
  };
};

const optionalAuth = (req, res, next) => {
  req.user = parseEasyAuthPrincipal(req) || getLocalPrincipal();
  next();
};

const requireAuth = (req, res, next) => {
  req.user = parseEasyAuthPrincipal(req) || getLocalPrincipal();
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      loginUrl: '/.auth/login/aad',
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role === 'admin') return next();
  return res.status(403).json({
    success: false,
    message: 'The Entra ID Admin app role is required',
  });
};

module.exports = {
  optionalAuth,
  requireAuth,
  requireAdmin,
  parseEasyAuthPrincipal,
};
