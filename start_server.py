#!/usr/bin/env python3
"""
SVPCET AI Attendance — HTTPS Local Server
Run: python3 start_server.py
Then open: https://10.23.79.182:8443/login.html
"""
import http.server
import ssl
import os

PORT = 8443
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

server = http.server.HTTPServer(('0.0.0.0', PORT), Handler)

ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
ctx.load_cert_chain(
    certfile=os.path.join(DIRECTORY, 'cert.pem'),
    keyfile=os.path.join(DIRECTORY, 'key.pem')
)
server.socket = ctx.wrap_socket(server.socket, server_side=True)

print("=" * 55)
print("  SVPCET AI Attendance — HTTPS Server")
print("=" * 55)
print(f"  Local:   https://localhost:{PORT}/login.html")
print(f"  Network: https://10.23.79.182:{PORT}/login.html")
print("=" * 55)
print("  Share the Network URL with students/teachers.")
print("  They must click 'Advanced > Proceed' on the")
print("  browser security warning (self-signed cert).")
print("=" * 55)
print("  Press Ctrl+C to stop the server.")
print()

try:
    server.serve_forever()
except KeyboardInterrupt:
    print("\nServer stopped.")
