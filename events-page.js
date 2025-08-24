// Events Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeEventsPage();
});

async function initializeEventsPage() {
    updateAuthUI();
    loadCategoryFilter();
    await loadAllEvents();
}

function loadCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        AppState.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }
}

async function loadAllEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;
    
    try {
        const response = await fetch('../api/events.php');
        const events = await response.json();
        console.log('Events from API:', events);
        AppState.events = events;
        
        if (events.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Events Available</h3>
                    <p>Check back soon for new volunteer opportunities!</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = events.map(event => createPublicEventCard(event)).join('');
    } catch (error) {
        container.innerHTML = '<p>Error loading events</p>';
    }
}

function createPublicEventCard(event) {
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const isUpcoming = eventDate >= currentDate;
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
    
    const maxVol = parseInt(event.max_volunteers || event.maxVolunteers || 0);
    const volunteers = parseInt(event.volunteers || 0);
    const progressPercentage = maxVol > 0 ? (volunteers / maxVol) * 100 : 0;
    const spotsLeft = Math.max(0, maxVol - volunteers);
    
    return `
        <div class="dashboard-event-card">
            <div class="event-header">
                <div>
                    <span class="event-category">${event.category}</span>
                    <h3 class="event-title">${event.title}</h3>
                </div>
                <span class="event-status ${isUpcoming ? 'status-upcoming' : 'status-completed'}">
                    ${isUpcoming ? (spotsLeft > 0 ? 'Open' : 'Full') : 'Completed'}
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
                    <i class="fas fa-user"></i>
                    <span>${event.organizer}</span>
                </div>
            </div>
            
            <p class="event-description">${event.description}</p>
            
            <div class="volunteer-progress">
                <div class="progress-info">
                    <span>Volunteers: ${volunteers}/${maxVol}</span>
                    <span>${spotsLeft} spots left</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
            
            <div class="event-actions">
                <button class="btn-secondary btn-small" onclick="showEventDetails(${event.id})">
                    View Details
                </button>
                ${AppState.currentUser && AppState.currentUser.role === 'organizer' && parseInt(event.organizer_id) === parseInt(AppState.currentUser.id) ? 
                    `<button class="btn-primary btn-small" onclick="manageEventFromPublic(${event.id})">
                        Manage
                    </button>` :
                    `<button class="btn-primary btn-small" onclick="handleEventRegistration(${event.id})" 
                        ${!isUpcoming || spotsLeft <= 0 ? 'disabled' : ''}>
                        ${!isUpcoming ? 'Event Ended' : (spotsLeft <= 0 ? 'Full' : 'Register')}
                    </button>`
                }
            </div>
        </div>
    `;
}

function filterEvents() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    let filteredEvents = [...AppState.events];
    
    if (categoryFilter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.category === categoryFilter);
    }
    
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            event.title.toLowerCase().includes(searchTerm) ||
            event.description.toLowerCase().includes(searchTerm) ||
            event.location.toLowerCase().includes(searchTerm) ||
            event.organizer.toLowerCase().includes(searchTerm)
        );
    }
    
    const container = document.getElementById('eventsContainer');
    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Events Found</h3>
                <p>Try adjusting your search criteria or browse all events.</p>
            </div>
        `;
    } else {
        container.innerHTML = filteredEvents.map(event => createPublicEventCard(event)).join('');
    }
}

async function handleEventRegistration(eventId) {
    if (!AppState.currentUser) {
        showLogin();
        return;
    }
    
    const event = AppState.events.find(e => e.id === eventId);
    if (!event) return;
    
    if (event.volunteers >= event.maxVolunteers) {
        showAlert('Sorry, this event is full!', 'error');
        return;
    }
    
    if (AppState.currentUser.role !== 'volunteer') {
        showAlert('Only volunteers can register for events. Please create a volunteer account.', 'error');
        return;
    }
    
    // Check if already registered
    if (!AppState.currentUser.registeredEvents) {
        AppState.currentUser.registeredEvents = [];
    }
    
    if (AppState.currentUser.registeredEvents.includes(eventId)) {
        showAlert('You are already registered for this event!', 'info');
        return;
    }
    
    try {
        // Send registration to database
        const response = await fetch('../api/events.php?action=register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: eventId,
                volunteerId: AppState.currentUser.id
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Update local state
            AppState.currentUser.registeredEvents.push(eventId);
            event.volunteers++;
            
            // Save changes
            saveUser();
            
            showAlert('Successfully registered for the event!', 'success');
            await loadAllEvents(); // Refresh the display
        } else {
            showAlert(result.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    }
}

function showEventDetails(eventId) {
    const event = AppState.events.find(e => e.id === eventId);
    if (!event) return;
    
    const isRegistered = AppState.currentUser?.registeredEvents?.includes(eventId);
    const eventDate = new Date(event.date);
    const isUpcoming = eventDate >= new Date();
    const maxVol = parseInt(event.max_volunteers || event.maxVolunteers || 0);
    const volunteers = parseInt(event.volunteers || 0);
    const spotsLeft = Math.max(0, maxVol - volunteers);
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    document.getElementById('eventDetails').innerHTML = `
        <div class="event-detail-content">
            <div class="event-detail-header">
                <div>
                    <span class="event-category">${event.category}</span>
                    <h2>${event.title}</h2>
                    <p class="organizer-info">Organized by ${event.organizer}</p>
                </div>
                <div class="event-actions">
                    ${AppState.currentUser && AppState.currentUser.role === 'organizer' && parseInt(event.organizer_id) === parseInt(AppState.currentUser.id) ? 
                        `<button class="btn-primary" onclick="manageEventFromPublic(${event.id}); closeEventModal();">
                            Manage Event
                        </button>` :
                        (AppState.currentUser && isRegistered ? 
                            `<span style="color: var(--success-color); font-weight: bold;">✓ Registered</span>` :
                            `<button class="btn-primary" onclick="handleEventRegistration(${event.id}); closeEventModal();" 
                                ${!isUpcoming || spotsLeft === 0 ? 'disabled' : ''}>
                                ${!AppState.currentUser ? 'Login to Register' : 
                                  (!isUpcoming ? 'Event Ended' : 
                                   (spotsLeft === 0 ? 'Event Full' : 'Register Now'))}
                            </button>`
                        )
                    }
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
                    <span>${volunteers}/${maxVol} volunteers</span>
                </div>
            </div>
            
            <div class="event-description">
                <h3>About This Event</h3>
                <p>${event.description}</p>
            </div>
            
            ${event.requirements ? `
                <div class="event-requirements">
                    <h3>Requirements</h3>
                    <p>${event.requirements}</p>
                </div>
            ` : ''}
            
            <div class="volunteer-progress">
                <h3>Registration Progress</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${maxVol > 0 ? (volunteers / maxVol) * 100 : 0}%"></div>
                </div>
                <p>${volunteers} of ${maxVol} spots filled • ${spotsLeft} spots remaining</p>
            </div>
        </div>
    `;
    
    document.getElementById('eventModal').style.display = 'block';
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
}

function manageEventFromPublic(eventId) {
    window.location.href = 'organizer-dashboard.html';
}