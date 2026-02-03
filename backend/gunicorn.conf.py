"""
Gunicorn configuration for production deployment.

Usage:
    gunicorn config.wsgi:application -c gunicorn.conf.py

Environment variables:
    GUNICORN_WORKERS: Number of worker processes (default: CPU count * 2 + 1)
    GUNICORN_THREADS: Threads per worker (default: 2)
    GUNICORN_BIND: Address to bind (default: 0.0.0.0:8000)
    GUNICORN_TIMEOUT: Request timeout in seconds (default: 30)
    GUNICORN_GRACEFUL_TIMEOUT: Graceful shutdown timeout (default: 30)
"""

import logging
import multiprocessing
import os

# -----------------------------------------------------------------------------
# Server Socket
# -----------------------------------------------------------------------------
bind = os.getenv("GUNICORN_BIND", "0.0.0.0:8000")
backlog = 2048

# -----------------------------------------------------------------------------
# Worker Processes
# -----------------------------------------------------------------------------
# Number of workers: (2 * CPU cores) + 1 is a good starting point
_default_workers = multiprocessing.cpu_count() * 2 + 1
workers = int(os.getenv("GUNICORN_WORKERS", _default_workers))

# Worker class: sync is most compatible, but gevent/uvicorn for async
worker_class = os.getenv("GUNICORN_WORKER_CLASS", "sync")

# Threads per worker (for sync workers)
threads = int(os.getenv("GUNICORN_THREADS", "2"))

# Maximum requests per worker before recycling (prevents memory leaks)
max_requests = int(os.getenv("GUNICORN_MAX_REQUESTS", "1000"))
max_requests_jitter = int(os.getenv("GUNICORN_MAX_REQUESTS_JITTER", "50"))

# -----------------------------------------------------------------------------
# Timeouts
# -----------------------------------------------------------------------------
# Request timeout - worker killed if request takes longer
timeout = int(os.getenv("GUNICORN_TIMEOUT", "30"))

# Keep-alive timeout for persistent connections
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", "5"))

# Graceful timeout - time to finish requests after SIGTERM
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", "30"))

# -----------------------------------------------------------------------------
# Process Naming
# -----------------------------------------------------------------------------
proc_name = "nomad-cafe"

# -----------------------------------------------------------------------------
# Logging
# -----------------------------------------------------------------------------
# Log to stdout for container-friendly logging
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOG_LEVEL", "info")

# Access log format (combined format with response time)
access_log_format = (
    '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'
)

# Capture stdout/stderr from workers
capture_output = True

# -----------------------------------------------------------------------------
# Security
# -----------------------------------------------------------------------------
# Limit request line size (URL + headers)
limit_request_line = 4094

# Limit request fields (headers)
limit_request_fields = 100
limit_request_field_size = 8190

# -----------------------------------------------------------------------------
# Server Mechanics
# -----------------------------------------------------------------------------
# Daemonize the process (set False for containers)
daemon = False

# User/group to run as (if started as root)
# user = "www-data"
# group = "www-data"

# Working directory
chdir = os.path.dirname(os.path.abspath(__file__))

# Temp file directory
tmp_upload_dir = None

# -----------------------------------------------------------------------------
# SSL (if terminating SSL at Gunicorn level)
# -----------------------------------------------------------------------------
# keyfile = "/path/to/key.pem"
# certfile = "/path/to/cert.pem"
# ssl_version = "TLSv1_2"

# -----------------------------------------------------------------------------
# Server Hooks
# -----------------------------------------------------------------------------

def on_starting(server):
    """Called just before the master process is initialized."""
    logging.info("Gunicorn master process starting...")


def on_reload(server):
    """Called before reloading the configuration."""
    logging.info("Gunicorn reloading configuration...")


def when_ready(server):
    """Called just after the server is started."""
    logging.info(f"Gunicorn server ready. Listening on {bind}")
    logging.info(f"Workers: {workers}, Threads: {threads}")


def pre_fork(server, worker):
    """Called just before a worker is forked."""
    pass


def post_fork(server, worker):
    """Called just after a worker has been forked."""
    logging.debug(f"Worker {worker.pid} spawned")


def pre_exec(server):
    """Called just before a new master process is forked."""
    logging.info("Gunicorn master process forking...")


def worker_int(worker):
    """Called when a worker receives SIGINT or SIGQUIT."""
    logging.info(f"Worker {worker.pid} received interrupt signal")


def worker_abort(worker):
    """Called when a worker receives SIGABRT (usually from timeout)."""
    logging.warning(f"Worker {worker.pid} aborted (timeout?)")


def pre_request(worker, req):
    """Called just before a worker processes a request."""
    pass


def post_request(worker, req, environ, resp):
    """Called after a worker processes a request."""
    pass


def child_exit(server, worker):
    """Called when a worker process exits."""
    logging.info(f"Worker {worker.pid} exited")


def worker_exit(server, worker):
    """Called just after a worker has been exited, in the master process."""
    logging.debug(f"Worker {worker.pid} exit handled by master")


def nworkers_changed(server, new_value, old_value):
    """Called when the number of workers changes."""
    logging.info(f"Worker count changed: {old_value} -> {new_value}")


def on_exit(server):
    """Called just before exiting Gunicorn."""
    logging.info("Gunicorn shutting down...")
