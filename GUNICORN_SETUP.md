# Running LAKANA ANALYSIS with Gunicorn

## Database Configuration Fix

The database connection issue has been resolved. The Flask app now properly uses the DATABASE_URL environment variable to connect to the PostgreSQL database.

## Running with Gunicorn

To run the Flask app with Gunicorn, you need to set the PYTHONPATH to include the server directory:

```bash
# From the project root directory
cd /home/runner/workspace
PYTHONPATH=/home/runner/workspace/server gunicorn server.simple_flask_app:app --bind 0.0.0.0:8000
```

## Important Notes

1. **PYTHONPATH**: The Flask app imports modules from the `server` directory, so PYTHONPATH must be set.

2. **Database Connection**: The app now automatically uses the DATABASE_URL environment variable if available, otherwise falls back to individual PostgreSQL environment variables.

3. **Port**: Make sure to use a port that's not already in use. The development server uses port 5000 and 8000, so you might want to use a different port for Gunicorn.

## Gunicorn Configuration Options

For production, you might want to use additional options:

```bash
PYTHONPATH=/home/runner/workspace/server gunicorn server.simple_flask_app:app \
  --bind 0.0.0.0:8000 \
  --workers 4 \
  --timeout 300 \
  --log-level info
```

## Troubleshooting

If you encounter any database connection issues:
1. Ensure the DATABASE_URL environment variable is set
2. Check that the database is accessible from your environment
3. Verify that SSL is enabled (the connection uses sslmode=require)