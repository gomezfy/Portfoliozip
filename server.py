from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

if __name__ == '__main__':
    port = 5000
    server = HTTPServer(('0.0.0.0', port), NoCacheHandler)
    print(f'Serving on port {port}...')
    server.serve_forever()
