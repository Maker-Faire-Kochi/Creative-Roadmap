#!/usr/bin/env python3
"""Serve only the Maker Faire project, regardless of the calling directory."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import argparse
parser = argparse.ArgumentParser()
parser.add_argument('--port', type=int, default=8796)
args = parser.parse_args()
root = Path(__file__).resolve().parent
server = ThreadingHTTPServer(('127.0.0.1', args.port), partial(SimpleHTTPRequestHandler, directory=str(root)))
print(f'Maker Faire Kochi: http://127.0.0.1:{args.port}/', flush=True)
try:
    server.serve_forever()
except KeyboardInterrupt:
    server.server_close()
