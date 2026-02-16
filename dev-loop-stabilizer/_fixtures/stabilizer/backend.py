import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer

HOST = os.getenv("BACKEND_HOST", "127.0.0.1")
PORT = int(os.getenv("BACKEND_PORT", "8080"))


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/v1/health":
            payload = json.dumps({"status": "ok", "fixture": "stabilizer"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return
        self.send_response(404)
        self.end_headers()


if __name__ == "__main__":
    HTTPServer((HOST, PORT), Handler).serve_forever()
