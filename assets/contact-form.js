const contactForm = document.getElementById('contactForm');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const message = document.getElementById('message').value;
        const submitButton = contactForm.querySelector('button[type="submit"]');
        
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Enviando...';
        submitButton.disabled = true;
        
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name, email, message })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Sucesso
                contactForm.innerHTML = `
                    <div class="success-message">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        <h3>Mensagem Enviada!</h3>
                        <p>Obrigado por entrar em contato. Responderei em breve!</p>
                    </div>
                `;
            } else {
                alert('Erro: ' + (data.error || 'Não foi possível enviar a mensagem'));
                submitButton.textContent = originalText;
                submitButton.disabled = false;
            }
        } catch (error) {
            console.error('Erro:', error);
            alert('Erro ao enviar mensagem: ' + error.message);
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    });
}
