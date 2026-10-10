#!/bin/sh
set -e

if [ "$POSTGRES_DB" ]; then
    echo "Waiting for PostgreSQL database at $POSTGRES_HOST:$POSTGRES_PORT..."
    while ! nc -z $POSTGRES_HOST $POSTGRES_PORT; do
      sleep 0.5
    done
    echo "PostgreSQL is ready!"
fi

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Seeding demo SaaS accounts and project data..."
python manage.py seed_demo_data || true

exec "$@"
