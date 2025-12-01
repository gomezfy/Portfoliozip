from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import parse_qs
import json
import os
import sys

class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def do_POST(self):
        if self.path == '/api/contact':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            try:
                data = json.loads(body.decode('utf-8'))
                name = data.get('name', '').strip()
                email = data.get('email', '').strip()
                message = data.get('message', '').strip()
                
                if not name or not email or not message:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Campos obrigatórios faltando'}).encode())
                    return
                
                # Importar e usar Resend
                from resend import Resend
                
                # Obter credenciais do Resend
                api_key = os.environ.get('RESEND_API_KEY')
                from_email = os.environ.get('RESEND_FROM_EMAIL')
                
                if not api_key or not from_email:
                    print("Erro: Credenciais do Resend não configuradas", file=sys.stderr)
                    self.send_response(500)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Erro no servidor ao processar contato'}).encode())
                    return
                
                client = Resend(api_key)
                
                # Email para você (notificação)
                try:
                    client.emails.send({
                        "from": from_email,
                        "to": "farleyalves83@icloud.com",
                        "subject": f"Novo Contato: {name}",
                        "html": f"""
                        <h2>Novo Contato no Portfolio</h2>
                        <p><strong>Nome:</strong> {name}</p>
                        <p><strong>Email:</strong> {email}</p>
                        <p><strong>Mensagem:</strong></p>
                        <p>{message.replace(chr(10), '<br>')}</p>
                        """
                    })
                except Exception as e:
                    print(f"Erro ao enviar email de notificação: {e}", file=sys.stderr)
                
                # Email de confirmação para o visitante
                try:
                    client.emails.send({
                        "from": from_email,
                        "to": email,
                        "subject": "Obrigado por entrar em contato!",
                        "html": f"""
                        <h2>Obrigado, {name}!</h2>
                        <p>Recebi sua mensagem e responderei assim que possível.</p>
                        <p><strong>Sua Mensagem:</strong></p>
                        <p>{message.replace(chr(10), '<br>')}</p>
                        <p>Abraços,<br>Farley</p>
                        """
                    })
                except Exception as e:
                    print(f"Erro ao enviar email de confirmação: {e}", file=sys.stderr)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Contato enviado com sucesso!'}).encode())
                
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'JSON inválido'}).encode())
            except Exception as e:
                print(f"Erro: {e}", file=sys.stderr)
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Erro ao processar contato'}).encode())
        else:
            super().do_POST()

if __name__ == '__main__':
    port = 5000
    server = HTTPServer(('0.0.0.0', port), NoCacheHandler)
    print(f'Serving on port {port}...')
    server.serve_forever()
