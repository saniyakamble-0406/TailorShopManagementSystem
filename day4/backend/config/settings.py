import os
from pathlib import Path

from dotenv import load_dotenv


# ==========================================
# BASE CONFIGURATION
# ==========================================

BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / ".env")


# ==========================================
# SECURITY SETTINGS
# ==========================================

SECRET_KEY = (
    os.getenv("DJANGO_SECRET_KEY")
    or os.getenv("SECRET_KEY")
)

if not SECRET_KEY:
    raise ValueError(
        "DJANGO_SECRET_KEY or SECRET_KEY must be set in .env"
    )

DEBUG = (
    os.getenv("DJANGO_DEBUG", "True").strip().lower()
    in ("1", "true", "yes", "on")
)

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        "DJANGO_ALLOWED_HOSTS",
        "127.0.0.1,localhost",
    ).split(",")
    if host.strip()
]


# ==========================================
# INSTALLED APPLICATIONS
# ==========================================

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # CORS
    "corsheaders",

    # Django REST Framework
    "rest_framework",
    "rest_framework.authtoken",

    # Project applications
    "accounts",
    "customers",
    "orders",
    "payments",
]


# ==========================================
# MIDDLEWARE
# ==========================================

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",

    # CORS middleware must precede CommonMiddleware
    "corsheaders.middleware.CorsMiddleware",

    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]


# ==========================================
# URL CONFIGURATION
# ==========================================

ROOT_URLCONF = "config.urls"


# ==========================================
# TEMPLATES
# ==========================================

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]


WSGI_APPLICATION = "config.wsgi.application"


# ==========================================
# DATABASE CONFIGURATION - MYSQL
# ==========================================

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.mysql",
        "NAME": os.getenv("DB_NAME", "tailor_shop_db"),
        "USER": os.getenv("DB_USER", "tailor_app"),
        "PASSWORD": os.getenv("DB_PASSWORD", ""),
        "HOST": os.getenv("DB_HOST", "127.0.0.1"),
        "PORT": os.getenv("DB_PORT", "3307"),
        "OPTIONS": {
            "charset": "utf8mb4",
        },
    }
}


# ==========================================
# PASSWORD VALIDATION
# ==========================================

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "UserAttributeSimilarityValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "MinimumLengthValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "CommonPasswordValidator"
        ),
    },
    {
        "NAME": (
            "django.contrib.auth.password_validation."
            "NumericPasswordValidator"
        ),
    },
]


# ==========================================
# LANGUAGE AND TIME ZONE
# ==========================================

LANGUAGE_CODE = "en-us"

TIME_ZONE = "Asia/Kolkata"

USE_I18N = True

USE_TZ = True


# ==========================================
# STATIC FILES
# ==========================================

STATIC_URL = "static/"

STATIC_ROOT = BASE_DIR / "staticfiles"


# ==========================================
# DEFAULT PRIMARY KEY
# ==========================================

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ==========================================
# DJANGO REST FRAMEWORK
# ==========================================

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.TokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
        "rest_framework.authentication.BasicAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
    ],
}


# ==========================================
# CORS SETTINGS - LOCAL DEVELOPMENT
# ==========================================

CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]