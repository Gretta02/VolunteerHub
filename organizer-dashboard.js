// Organizer Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is an organizer
    if (!AppState.currentUser) {
        window.location.href = '../index.html';
        return;
    }
    
    if (AppState.currentUser.role !== 'organizer') {
        window.location.href = 'volunteer-dashboard.html';
        return;
    }
    
    initializeOrganizerDashboard();
});

async function initializeOrganizerDashboard() {
    console.log('Current user:', AppState.currentUser);
    
    updateWelcomeMessage();
    loadCategoryOptions();
    
    // Ensure my-events section is visible
    const myEventsSection = document.getElementById('my-events');
    if (myEventsSection) {
        myEventsSection.classList.remove('hidden');
    }
    
    if (AppState.currentUser && AppState.currentUser.id) {
        await loadOrganizerEvents();
        updateOrganizerStats();
    } else {
        console.error('No current user or user ID found');
        document.getElementById('organizerEventsContainer').innerHTML = '<p>User not found. Please log in again.</p>';
    }
    
    // Check if we should show profile or settings
    if (sessionStorage.getItem('showProfile') === 'true') {
        sessionStorage.removeItem('showProfile');
        setTimeout(() => showProfile(), 100);
    } else if (sessionStorage.getItem('showSettings') === 'true') {
        sessionStorage.removeItem('showSettings');
        setTimeout(() => showSettings(), 100);
    }
}

function updateWelcomeMessage() {
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = AppState.currentUser.name;
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    dropdown.classList.toggle('show');
}

function showProfile() {
    const profileSection = document.getElementById('profile');
    const otherSections = document.querySelectorAll('.dashboard-section:not(#profile)');
    
    if (profileSection) {
        otherSections.forEach(section => section.classList.add('hidden'));
        profileSection.classList.remove('hidden');
        loadProfileData();
    }
    
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
}

function showSettings() {
    alert('Settings feature coming soon!');
    toggleUserDropdown();
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown && !dropdown.contains(event.target)) {
        document.getElementById('dropdownMenu').classList.remove('show');
    }
});

function loadCategoryOptions() {
    const categorySelect = document.getElementById('eventCategory');
    if (categorySelect) {
        AppState.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categorySelect.appendChild(option);
        });
    }
}

function updateOrganizerStats() {
    if (!AppState.organizerEvents) return;
    
    const currentDate = new Date();
    const activeEvents = AppState.organizerEvents.filter(event => new Date(event.date) >= currentDate);
    const totalVolunteers = AppState.organizerEvents.reduce((sum, event) => sum + parseInt(event.volunteers || 0), 0);
    
    document.getElementById('totalEvents').textContent = AppState.organizerEvents.length;
    document.getElementById('totalVolunteers').textContent = totalVolunteers;
    document.getElementById('activeEvents').textContent = activeEvents.length;
}

async function loadOrganizerEvents() {
    const container = document.getElementById('organizerEventsContainer');
    
    if (!container) {
        console.error('organizerEventsContainer not found');
        return;
    }
    
    container.innerHTML = '<p>Loading events...</p>';
    
    try {
        console.log('Fetching events for organizer ID:', AppState.currentUser.id);
        const response = await fetch(`../api/events.php?organizer_id=${AppState.currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const text = await response.text();
        console.log('Raw response:', text);
        
        const events = JSON.parse(text);
        AppState.organizerEvents = events;
        
        console.log('Loaded events:', events);
        
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-plus"></i>
                    <h3>No Events Created</h3>
                    <p>Start by creating your first event to connect with volunteers!</p>
                    <button class="btn-primary" onclick="showCreateEventForm()">Create Event</button>
                </div>
            `;
        } else {
            container.innerHTML = events.map(event => createOrganizerEventCard(event)).join('');
        }
    } catch (error) {
        console.error('Error loading events from API:', error);
        // Fallback to sample events for demo purposes
        const sampleOrganizerEvents = [
            {id: 1, title: "Beach Cleanup Drive", category: "Environment", date: "2026-03-15", time: "09:00", location: "Santa Monica Beach", description: "Join us for a community beach cleanup to protect marine life.", volunteers: 15, max_volunteers: 50},
            {id: 2, title: "Food Bank Volunteer", category: "Community", date: "2026-04-20", time: "10:00", location: "Downtown Community Center", description: "Help sort and distribute food to families in need.", volunteers: 8, max_volunteers: 30}
        ];
        AppState.organizerEvents = sampleOrganizerEvents;
        container.innerHTML = sampleOrganizerEvents.map(event => createOrganizerEventCard(event)).join('');
    }
}

function createOrganizerEventCard(event) {
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const isUpcoming = eventDate >= currentDate;
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
    
    const maxVol = event.max_volunteers || event.maxVolunteers || 0;
    const volunteers = event.volunteers || 0;
    const progressPercentage = maxVol > 0 ? (volunteers / maxVol) * 100 : 0;
    
    let status = 'completed';
    let statusText = 'Completed';
    
    if (isUpcoming) {
        const daysDiff = Math.ceil((eventDate - currentDate) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 7) {
            status = 'ongoing';
            statusText = 'Starting Soon';
        } else {
            status = 'upcoming';
            statusText = 'Upcoming';
        }
    }
    
    return `
        <div class="dashboard-event-card">
            <div class="event-header">
                <div>
                    <span class="event-category">${event.category}</span>
                    <h3 class="event-title">${event.title}</h3>
                </div>
                <span class="event-status status-${status}">
                    ${statusText}
                </span>
            </div>
            
            <div class="event-meta-grid">
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${event.time}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.location}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${volunteers}/${maxVol} volunteers</span>
                </div>
            </div>
            
            <p class="event-description">${event.description}</p>
            
            <div class="volunteer-progress">
                <div class="progress-info">
                    <span>Registration: ${volunteers}/${maxVol}</span>
                    <span>${Math.round(progressPercentage)}% Full</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
            
            <div class="event-actions">
                <button class="btn-secondary btn-small" onclick="manageEvent(${event.id})">
                    Manage
                </button>
                <button class="btn-primary btn-small" onclick="viewVolunteers(${event.id})">
                    View Volunteers (${event.volunteers})
                </button>
                ${isUpcoming ? `
                    <button class="btn-danger btn-small" onclick="deleteEvent(${event.id})">
                        Delete
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function showCreateEventForm() {
    document.getElementById('create-event').classList.remove('hidden');
    document.getElementById('create-event').scrollIntoView({ behavior: 'smooth' });
}

function hideCreateEventForm() {
    document.getElementById('create-event').classList.add('hidden');
    document.getElementById('createEventForm').reset();
}

async function handleCreateEvent(event) {
    event.preventDefault();
    
    const formData = {
        title: document.getElementById('eventTitle').value,
        category: document.getElementById('eventCategory').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        location: document.getElementById('eventLocation').value,
        maxVolunteers: parseInt(document.getElementById('maxVolunteers').value),
        description: document.getElementById('eventDescription').value,
        requirements: document.getElementById('eventRequirements').value,
        organizerId: AppState.currentUser.id
    };
    
    // Validate date is in the future
    const eventDate = new Date(formData.date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    if (eventDate < currentDate) {
        showAlert('Event date must be in the future.', 'error');
        return;
    }
    
    try {
        const response = await fetch('../api/events.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const text = await response.text();
        console.log('Response:', text);
        
        const result = JSON.parse(text);
        
        if (result.success) {
            await loadOrganizerEvents();
            updateOrganizerStats();
            hideCreateEventForm();
            showAlert('Event created successfully!', 'success');
        } else {
            showAlert('Failed to create event', 'error');
        }
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

function getRandomEventIcon(category) {
    const icons = {
        'Environment': 'fas fa-leaf',
        'Education': 'fas fa-book',
        'Healthcare': 'fas fa-heartbeat',
        'Community': 'fas fa-heart',
        'Animals': 'fas fa-paw',
        'Disaster Relief': 'fas fa-hands-helping',
        'Elderly Care': 'fas fa-user-friends',
        'Youth Programs': 'fas fa-child'
    };
    
    return icons[category] || 'fas fa-calendar';
}

function manageEvent(eventId) {
    const event = AppState.organizerEvents.find(e => e.id === eventId);
    if (!event) return;
    
    const eventDate = new Date(event.date);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('eventManageContent').innerHTML = `
        <div class="event-detail-content">
            <div class="event-detail-header">
                <div>
                    <span class="event-category">${event.category}</span>
                    <h2>${event.title}</h2>
                    <p class="organizer-info">Created by you</p>
                </div>
            </div>
            
            <div class="event-meta-grid">
                <div class="meta-item">
                    <i class="fas fa-calendar"></i>
                    <span>${formattedDate}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-clock"></i>
                    <span>${event.time}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${event.location}</span>
                </div>
                <div class="meta-item">
                    <i class="fas fa-users"></i>
                    <span>${event.volunteers}/${event.maxVolunteers} volunteers</span>
                </div>
            </div>
            
            <div class="event-description">
                <h3>Description</h3>
                <p>${event.description}</p>
            </div>
            
            ${event.requirements ? `
                <div class="event-requirements">
                    <h3>Requirements</h3>
                    <p>${event.requirements}</p>
                </div>
            ` : ''}
            
            <div class="volunteer-progress">
                <h3>Registration Status</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(event.volunteers / (event.max_volunteers || event.maxVolunteers)) * 100}%"></div>
                </div>
                <p>${event.volunteers} of ${event.max_volunteers || event.maxVolunteers} spots filled (${Math.round((event.volunteers / (event.max_volunteers || event.maxVolunteers)) * 100)}%)</p>
            </div>
            
            <div class="event-actions" style="margin-top: 2rem;">
                <button class="btn-primary" onclick="viewVolunteers(${event.id}); closeEventManageModal();">
                    View Volunteers
                </button>
                <button class="btn-secondary" onclick="closeEventManageModal()">
                    Close
                </button>
            </div>
        </div>
    `;
    
    document.getElementById('eventManageModal').style.display = 'block';
}

async function viewVolunteers(eventId) {
    const event = AppState.organizerEvents.find(e => e.id === eventId);
    if (!event) return;
    
    try {
        // Get volunteers from event_registrations table
        const response = await fetch(`../api/events.php?event_id=${eventId}&action=volunteers`);
        const volunteers = await response.json();
        
        let volunteerListHTML = `
            <div style="padding: 2rem;">
                <h2>Volunteers for "${event.title}"</h2>
                <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                    ${volunteers.length} of ${event.max_volunteers || event.maxVolunteers} volunteers registered
                </p>
        `;
        
        if (volunteers.length === 0) {
            volunteerListHTML += `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Volunteers Yet</h3>
                    <p>No volunteers have registered for this event yet.</p>
                </div>
            `;
        } else {
            volunteerListHTML += '<div class="volunteer-list">';
            volunteers.forEach(volunteer => {
                volunteerListHTML += `
                    <div class="volunteer-item">
                        <div class="volunteer-info">
                            <h4>${volunteer.name}</h4>
                            <p><i class="fas fa-envelope"></i> ${volunteer.email}</p>
                            <p><i class="fas fa-phone"></i> ${volunteer.phone || 'N/A'}</p>
                            <p><i class="fas fa-map-marker-alt"></i> ${volunteer.location || 'N/A'}</p>
                        </div>
                        <div class="volunteer-actions">
                            <button class="btn-secondary btn-small" onclick="callVolunteer('${volunteer.phone}')">
                                <i class="fas fa-phone"></i> Call
                            </button>
                            <button class="btn-primary btn-small" onclick="emailVolunteer('${volunteer.email}', '${volunteer.name}')">
                                <i class="fas fa-envelope"></i> Email
                            </button>
                            <button class="btn-info btn-small" onclick="messageVolunteer(${volunteer.id}, '${volunteer.name}')">
                                <i class="fas fa-comment"></i> Message
                            </button>
                            <button class="btn-danger btn-small" onclick="removeVolunteer(${event.id}, ${volunteer.id})">
                                <i class="fas fa-user-times"></i> Remove
                            </button>
                        </div>
                    </div>
                `;
            });
            volunteerListHTML += '</div>';
        }
        
        volunteerListHTML += '</div>';
        
        document.getElementById('volunteerList').innerHTML = volunteerListHTML;
        document.getElementById('volunteerModal').style.display = 'block';
    } catch (error) {
        console.error('Error loading volunteers:', error);
        showAlert('Error loading volunteers', 'error');
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
        return;
    }
    
    try {
        const response = await fetch(`../api/events.php?id=${eventId}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            await loadOrganizerEvents();
            updateOrganizerStats();
            showAlert('Event deleted successfully.', 'info');
        } else {
            showAlert('Failed to delete event', 'error');
        }
    } catch (error) {
        showAlert('Error deleting event', 'error');
    }
}

function filterOrganizerEvents() {
    const filter = document.getElementById('eventStatusFilter').value;
    const currentDate = new Date();
    
    if (!AppState.organizerEvents) return;
    
    let userEvents = [...AppState.organizerEvents];
    
    if (filter === 'upcoming') {
        userEvents = userEvents.filter(event => new Date(event.date) >= currentDate);
    } else if (filter === 'completed') {
        userEvents = userEvents.filter(event => new Date(event.date) < currentDate);
    } else if (filter === 'ongoing') {
        userEvents = userEvents.filter(event => {
            const eventDate = new Date(event.date);
            const daysDiff = Math.ceil((eventDate - currentDate) / (1000 * 60 * 60 * 24));
            return daysDiff <= 7 && daysDiff >= 0;
        });
    }
    
    const container = document.getElementById('organizerEventsContainer');
    if (userEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Events Found</h3>
                <p>No events match the selected filter.</p>
            </div>
        `;
    } else {
        container.innerHTML = userEvents.map(event => createOrganizerEventCard(event)).join('');
    }
}

function closeEventManageModal() {
    document.getElementById('eventManageModal').style.display = 'none';
}

async function removeVolunteer(eventId, volunteerId) {
    if (!confirm('Are you sure you want to remove this volunteer from the event?')) {
        return;
    }
    
    try {
        const response = await fetch(`../api/events.php?action=unregister`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ event_id: eventId, volunteer_id: volunteerId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadOrganizerEvents();
            updateOrganizerStats();
            viewVolunteers(eventId);
            showAlert('Volunteer removed successfully.', 'info');
        } else {
            showAlert('Failed to remove volunteer', 'error');
        }
    } catch (error) {
        showAlert('Error removing volunteer', 'error');
    }
}

function closeVolunteerModal() {
    document.getElementById('volunteerModal').style.display = 'none';
}

function hideProfile() {
    const profileSection = document.getElementById('profile');
    const otherSections = document.querySelectorAll('.dashboard-section:not(#profile)');
    
    if (profileSection) {
        profileSection.classList.add('hidden');
        otherSections.forEach(section => section.classList.remove('hidden'));
    }
}

function showSettings() {
    const settingsSection = document.getElementById('settings');
    const otherSections = document.querySelectorAll('.dashboard-section:not(#settings)');
    
    if (settingsSection) {
        otherSections.forEach(section => section.classList.add('hidden'));
        settingsSection.classList.remove('hidden');
    }
    
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
}

function hideSettings() {
    const settingsSection = document.getElementById('settings');
    const otherSections = document.querySelectorAll('.dashboard-section:not(#settings)');
    
    if (settingsSection) {
        settingsSection.classList.add('hidden');
        otherSections.forEach(section => section.classList.remove('hidden'));
    }
}

function deleteAccount() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        localStorage.removeItem('volunteerHubUser');
        const users = JSON.parse(localStorage.getItem('volunteerHubUsers') || '[]');
        const updatedUsers = users.filter(u => u.id !== AppState.currentUser.id);
        localStorage.setItem('volunteerHubUsers', JSON.stringify(updatedUsers));
        window.location.href = '../index.html';
    }
}

function goToDashboard() {
    window.location.reload();
}

function showMessages() {
    document.getElementById('messagesModal').style.display = 'block';
    loadVolunteersForMessaging();
}

async function loadVolunteersForMessaging() {
    let volunteers = [];
    
    try {
        const response = await fetch(`../api/registrations.php?organizer_id=${AppState.currentUser.id}`);
        volunteers = await response.json();
        console.log('Volunteers loaded:', volunteers);
    } catch (error) {
        console.error('Error loading volunteers:', error);
        volunteers = [];
    }
    
    const selectContainer = document.getElementById('volunteerSelect');
    
    if (volunteers.length === 0) {
        selectContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users"></i>
                <h3>No Volunteers to Message</h3>
                <p>No volunteers have registered for your events yet.</p>
            </div>
        `;
        return;
    }
    
    selectContainer.innerHTML = `
        <div class="volunteer-list-container">
            <h3>Select a Volunteer to Message:</h3>
            <div class="volunteer-cards">
                ${volunteers.map(volunteer => `
                    <div class="volunteer-card" onclick="selectVolunteerForMessage(${volunteer.id})">
                        <div class="volunteer-info">
                            <h4>${volunteer.name}</h4>
                            <p><i class="fas fa-envelope"></i> ${volunteer.email}</p>
                            <p><i class="fas fa-calendar"></i> Events: ${volunteer.events}</p>
                        </div>
                        <button class="btn-primary btn-small">Select</button>
                    </div>
                `).join('')}
            </div>
        </div>
        <div id="selectedVolunteerInfo" style="display: none;"></div>
    `;
    
    window.selectVolunteerForMessage = function(volunteerId) {
        const selectedVolunteer = volunteers.find(v => v.id == volunteerId);
        
        document.querySelector('.volunteer-list-container').style.display = 'none';
        document.getElementById('selectedVolunteerInfo').style.display = 'block';
        document.getElementById('selectedVolunteerInfo').innerHTML = `
            <div class="volunteer-info-card">
                <h4>Messaging: ${selectedVolunteer.name}</h4>
                <p><i class="fas fa-envelope"></i> ${selectedVolunteer.email}</p>
                <p><i class="fas fa-calendar"></i> Events: ${selectedVolunteer.events}</p>
                <div class="message-form">
                    <textarea id="dynamicMessageText" placeholder="Type your message here..." rows="4"></textarea>
                    <div class="form-actions">
                        <button class="btn-secondary" onclick="showVolunteerList()">Back to List</button>
                        <button class="btn-primary" onclick="sendMessage()">Send Message</button>
                    </div>
                </div>
            </div>
        `;
        
        window.selectedVolunteerId = volunteerId;
    };
    
    window.showVolunteerList = function() {
        document.querySelector('.volunteer-list-container').style.display = 'block';
        document.getElementById('selectedVolunteerInfo').style.display = 'none';
        window.selectedVolunteerId = null;
    };
}

function callVolunteer(phone) {
    if (phone && phone !== 'N/A') {
        window.open(`tel:${phone}`);
    } else {
        showAlert('Phone number not available', 'error');
    }
}

function emailVolunteer(email, name) {
    const subject = encodeURIComponent(`Regarding VolunteerHub Event`);
    const body = encodeURIComponent(`Dear ${name},\n\nThank you for registering for our event.\n\nBest regards,\n${AppState.currentUser.name}`);
    window.open(`mailto:${email}?subject=${subject}&body=${body}`);
}

async function messageVolunteer(volunteerId, volunteerName) {
    const messageText = prompt(`Send message to ${volunteerName}:`);
    
    if (!messageText || !messageText.trim()) {
        return;
    }
    
    try {
        console.log('Sending message:', {
            fromUserId: AppState.currentUser.id,
            toUserId: parseInt(volunteerId),
            message: messageText.trim()
        });
        
        const response = await fetch('../api/messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromUserId: AppState.currentUser.id,
                toUserId: parseInt(volunteerId),
                message: messageText.trim()
            })
        });
        
        const result = await response.json();
        console.log('Message API response:', result);
        
        if (result.success) {
            showAlert(`Message sent to ${volunteerName}!`, 'success');
        } else {
            showAlert('Failed to send message: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showAlert('Error sending message: ' + error.message, 'error');
    }
}

async function sendMessage() {
    const selectedVolunteerId = window.selectedVolunteerId;
    const messageText = document.getElementById('dynamicMessageText').value.trim();
    
    if (!selectedVolunteerId) {
        showAlert('Please select a volunteer first.', 'error');
        return;
    }
    
    if (!messageText) {
        showAlert('Please enter a message.', 'error');
        return;
    }
    
    try {
        console.log('Sending message:', {
            fromUserId: AppState.currentUser.id,
            toUserId: parseInt(selectedVolunteerId),
            message: messageText
        });
        
        const response = await fetch('../api/messages.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fromUserId: AppState.currentUser.id,
                toUserId: parseInt(selectedVolunteerId),
                message: messageText
            })
        });
        
        const result = await response.json();
        console.log('Message API response:', result);
        
        if (result.success) {
            showAlert('Message sent successfully!', 'success');
            document.getElementById('dynamicMessageText').value = '';
            showVolunteerList();
        } else {
            showAlert('Failed to send message: ' + (result.message || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showAlert('Error sending message: ' + error.message, 'error');
    }
}

function closeMessagesModal() {
    document.getElementById('messagesModal').style.display = 'none';
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('volunteerHubUser');
    window.location.href = '../index.html';
}