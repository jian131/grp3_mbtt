from flask import Flask
from flask_appbuilder.security.manager import AUTH_DB

# Enable embedding in iframes
HTTP_HEADERS = {'X-Frame-Options': 'ALLOWALL'}

# Enable public access for dashboards
PUBLIC_ROLE_LIKE = "Gamma"

# Enable CORS
ENABLE_CORS = True
CORS_OPTIONS = {
    'supports_credentials': True,
    'allow_headers': ['*'],
    'resources': ['*'],
    'origins': ['http://localhost:3000', 'http://127.0.0.1:3000']
}

# Dashboard embedding
GUEST_ROLE_NAME = "Public"
GUEST_TOKEN_JWT_SECRET = "supersecretkey123"
GUEST_TOKEN_JWT_ALGO = "HS256"
GUEST_TOKEN_HEADER_NAME = "X-GuestToken"
GUEST_TOKEN_JWT_EXP_SECONDS = 300  # 5 minutes

# Enable standalone mode for embedding
EMBEDDED_SUPERSET = True

# Disable CSRF for embedded dashboards
WTF_CSRF_ENABLED = False

# Public role permissions
PUBLIC_ROLE_LIKE_GAMMA = True
