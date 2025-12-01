from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import sys
import requests
import html
from datetime import datetime

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
                
                # Validar email simples
                if '@' not in email or '.' not in email:
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Email inválido'}).encode())
                    return
                
                # Salvar contato em arquivo JSON
                save_contact(name, email, message)
                
                # Tentar enviar email via Resend também (pode falhar, mas tenta)
                try:
                    send_via_resend(name, email, message)
                except Exception as e:
                    print(f"Resend falhou (não é problema): {e}", file=sys.stderr)
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True, 'message': 'Contato recebido com sucesso!'}).encode())
                
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

def save_contact(name, email, message):
    """Salva contato em arquivo JSON"""
    contacts_file = 'contacts.json'
    contacts = []
    
    if os.path.exists(contacts_file):
        try:
            with open(contacts_file, 'r') as f:
                contacts = json.load(f)
        except:
            contacts = []
    
    contact = {
        'timestamp': datetime.now().isoformat(),
        'name': name,
        'email': email,
        'message': message
    }
    
    contacts.append(contact)
    
    with open(contacts_file, 'w') as f:
        json.dump(contacts, f, indent=2, ensure_ascii=False)
    
    print(f"✓ Contato salvo: {name} ({email})", file=sys.stderr)

def send_via_resend(name, email, message):
    """Tenta enviar email via Resend (pode falhar)"""
    
    # Obter credenciais do Resend via integração Replit
    hostname = os.environ.get('REPLIT_CONNECTORS_HOSTNAME')
    repl_token = os.environ.get('REPL_IDENTITY') or os.environ.get('WEB_REPL_RENEWAL')
    
    if not (hostname and repl_token):
        raise Exception("Credenciais Resend não disponíveis")
    
    try:
        headers = {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': ('repl ' if os.environ.get('REPL_IDENTITY') else 'depl ') + repl_token
        }
        response = requests.get(
            f'https://{hostname}/api/v2/connection?include_secrets=true&connector_names=resend',
            headers=headers,
            timeout=5
        )
        connection_data = response.json()
        
        if connection_data.get('items'):
            settings = connection_data['items'][0].get('settings', {})
            api_key = settings.get('api_key')
            from_email = settings.get('from_email')
            
            if api_key and from_email:
                safe_message = html.escape(message).replace('\n', '<br>')
                
                # Email de confirmação para o visitante
                resend_api_call(
                    api_key,
                    from_email,
                    email,
                    "Obrigado por entrar em contato!",
                    f"""
                    <h2>Obrigado, {html.escape(name)}!</h2>
                    <p>Recebi sua mensagem e responderei assim que possível.</p>
                    <p><strong>Sua Mensagem:</strong></p>
                    <p>{safe_message}</p>
                    <p>Abraços,<br>Farley</p>
                    """
                )
    except Exception as e:
        raise Exception(f"Resend error: {e}")

def resend_api_call(api_key, from_email, to_email, subject, html_body):
    """Faz chamada à API Resend"""
    headers = {
        'Authorization': f'Bearer {api_key}',
        'Content-Type': 'application/json'
    }
    
    data = {
        'from': from_email,
        'to': to_email,
        'subject': subject,
        'html': html_body
    }
    
    response = requests.post(
        'https://api.resend.com/emails',
        json=data,
        headers=headers,
        timeout=10
    )
    
    if response.status_code not in [200, 201]:
        raise Exception(f"Resend API error: {response.text}")

if __name__ == '__main__':
    port = 5000
    server = HTTPServer(('0.0.0.0', port), NoCacheHandler)
    print(f'Serving on port {port}...')
    server.serve_forever()
