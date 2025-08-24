// Contact Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});

async function handleContactForm(event) {
    event.preventDefault();
    
    const formData = {
        name: document.getElementById('contactName').value,
        email: document.getElementById('contactEmail').value,
        subject: document.getElementById('contactSubject').value,
        message: document.getElementById('contactMessage').value
    };
    
    console.log('Form data:', formData);
    
    try {
        const response = await fetch('/volunteerHub/api/contact.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response result:', result);
        
        if (result.success) {
            document.getElementById('contactName').value = '';
            document.getElementById('contactEmail').value = '';
            document.getElementById('contactSubject').value = '';
            document.getElementById('contactMessage').value = '';
            
            showAlert('Thank you for your message! We\'ll get back to you within 24 hours.', 'success');
        } else {
            showAlert(result.message || 'Failed to send message. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error sending message. Please try again.', 'error');
    }
}