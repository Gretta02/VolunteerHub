// Volunteer Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in and is a volunteer
    if (!AppState.currentUser) {
        window.location.href = '../index.html';
        return;
    }
    
    if (AppState.currentUser.role !== 'volunteer') {
        window.location.href = 'organizer-dashboard.html';
        return;
    }
    
    initializeVolunteerDashboard();
    updateNotificationBadge();
    
    // Add search event listener
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterEvents);
    }
});

async function initializeVolunteerDashboard() {
    // Load registered events from database
    await loadRegisteredEventsFromDB();
    
    // Ensure events are loaded
    if (!AppState.events || AppState.events.length === 0) {
        const savedEvents = localStorage.getItem('volunteerHubEvents');
        if (savedEvents) {
            AppState.events = JSON.parse(savedEvents);
        }
    }
    
    updateWelcomeMessage();
    loadCategoryFilter();
    updateDashboardStats();
    loadMyEvents();
    loadBrowseEvents();
    loadRecommendedEvents();
    await updateNotificationBadge();
    
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

function updateDashboardStats() {
    const registeredEvents = AppState.currentUser.registeredEvents || [];
    const currentDate = new Date();
    
    let upcomingCount = 0;
    let completedCount = 0;
    
    registeredEvents.forEach(eventId => {
        const event = AppState.events.find(e => e.id === eventId);
        if (event) {
            const eventDate = new Date(event.date);
            if (eventDate >= currentDate) {
                upcomingCount++;
            } else {
                completedCount++;
            }
        }
    });
    
    document.getElementById('registeredCount').textContent = registeredEvents.length;
    document.getElementById('upcomingCount').textContent = upcomingCount;
    document.getElementById('completedCount').textContent = completedCount;
}

function loadMyEvents() {
    const container = document.getElementById('myEventsContainer');
    const registeredEvents = AppState.currentUser.registeredEvents || [];
    
    if (registeredEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Registered Events</h3>
                <p>You haven't registered for any events yet. Browse available events below!</p>
            </div>
        `;
        return;
    }
    
    const events = registeredEvents.map(eventId => 
        AppState.events.find(e => e.id === eventId)
    ).filter(event => event);
    
    container.innerHTML = events.map(event => createVolunteerEventCard(event, true)).join('');
}

async function loadBrowseEvents() {
    const container = document.getElementById('browseEventsContainer');
    if (!container) return;
    
    try {
        const response = await fetch('../api/events.php');
        const events = await response.json();
        AppState.events = events;
        
        const registeredEventIds = AppState.currentUser.registeredEvents || [];
        
        const availableEvents = events.filter(event => 
            !registeredEventIds.includes(event.id)
        );
        
        if (availableEvents.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No Available Events</h3>
                    <p>All events are currently full or you're registered for all available events.</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = availableEvents.map(event => createVolunteerEventCard(event, false)).join('');
    } catch (error) {
        console.error('Error loading events:', error);
        container.innerHTML = '<p>Error loading events.</p>';
    }
}

function loadRecommendedEvents() {
    const container = document.getElementById('recommendedEventsContainer');
    const registeredEventIds = AppState.currentUser.registeredEvents || [];
    
    // Simple recommendation: events in user's location or popular categories
    const recommendedEvents = AppState.events
        .filter(event => 
            !registeredEventIds.includes(event.id) && 
            event.volunteers < event.maxVolunteers &&
            (event.location.toLowerCase().includes(AppState.currentUser.location.toLowerCase()) ||
             ['Community', 'Environment', 'Education'].includes(event.category))
        )
        .slice(0, 3);
    
    if (recommendedEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <h3>No Recommendations</h3>
                <p>We'll show personalized recommendations as more events become available.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = recommendedEvents.map(event => createVolunteerEventCard(event, false)).join('');
}

function createVolunteerEventCard(event, isRegistered) {
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const isUpcoming = eventDate >= currentDate;
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
    
    const maxVol = event.maxVolunteers || event.max_volunteers || 0;
    const volunteers = event.volunteers || 0;
    const progressPercentage = maxVol > 0 ? (volunteers / maxVol) * 100 : 0;
    
    return `
        <div class="dashboard-event-card">
            <div class="event-header">
                <div>
                    <span class="event-category">${event.category}</span>
                    <h3 class="event-title">${event.title}</h3>
                </div>
                <span class="event-status ${isUpcoming ? 'status-upcoming' : 'status-completed'}">
                    ${isUpcoming ? 'Upcoming' : 'Completed'}
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
                    <span class="volunteer-count"><i class="fas fa-users"></i> ${volunteers}/${maxVol}</span>
                    <span>${progressPercentage > 0 ? Math.round(progressPercentage) : 0}%</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                </div>
            </div>
            
            <div class="event-actions">
                <button class="btn-secondary btn-small" onclick="showEventDetails(${event.id})">
                    View Details
                </button>
                ${isRegistered ? 
                    `<button class="btn-danger btn-small" onclick="unregisterFromEvent(${event.id})">
                        Unregister
                    </button>` :
                    `<button class="btn-primary btn-small" onclick="registerForEvent(${event.id})" 
                        ${event.volunteers >= event.maxVolunteers ? 'disabled' : ''}>
                        ${event.volunteers >= event.maxVolunteers ? 'Full' : 'Register'}
                    </button>`
                }
            </div>
        </div>
    `;
}

function filterMyEvents() {
    const filter = document.getElementById('eventFilter').value;
    const registeredEvents = AppState.currentUser.registeredEvents || [];
    const currentDate = new Date();
    
    let filteredEvents = registeredEvents.map(eventId => 
        AppState.events.find(e => e.id === eventId)
    ).filter(event => event);
    
    if (filter === 'upcoming') {
        filteredEvents = filteredEvents.filter(event => new Date(event.date) >= currentDate);
    } else if (filter === 'past') {
        filteredEvents = filteredEvents.filter(event => new Date(event.date) < currentDate);
    }
    
    const container = document.getElementById('myEventsContainer');
    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No Events Found</h3>
                <p>No events match the selected filter.</p>
            </div>
        `;
    } else {
        container.innerHTML = filteredEvents.map(event => createVolunteerEventCard(event, true)).join('');
    }
}

function filterEvents() {
    const categoryFilter = document.getElementById('categoryFilter').value;
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const registeredEventIds = AppState.currentUser.registeredEvents || [];
    
    // Ensure events are loaded
    if (!AppState.events || AppState.events.length === 0) {
        console.log('No events loaded, loading from localStorage');
        const savedEvents = localStorage.getItem('volunteerHubEvents');
        if (savedEvents) {
            AppState.events = JSON.parse(savedEvents);
        } else {
            // Load sample events from main.js
            if (window.sampleEvents) {
                AppState.events = window.sampleEvents;
            }
        }
    }
    
    let filteredEvents = AppState.events.filter(event => 
        !registeredEventIds.includes(event.id)
    );
    
    if (categoryFilter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.category === categoryFilter);
    }
    
    if (searchTerm) {
        filteredEvents = filteredEvents.filter(event => 
            (event.title && event.title.toLowerCase().includes(searchTerm)) ||
            (event.description && event.description.toLowerCase().includes(searchTerm)) ||
            (event.location && event.location.toLowerCase().includes(searchTerm))
        );
    }
    
    const container = document.getElementById('browseEventsContainer');
    if (filteredEvents.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>No Events Found</h3>
                <p>Try adjusting your search criteria.</p>
            </div>
        `;
    } else {
        container.innerHTML = filteredEvents.map(event => createVolunteerEventCard(event, false)).join('');
    }
}

function showEventDetails(eventId) {
    const event = AppState.events.find(e => e.id === eventId);
    if (!event) return;
    
    const isRegistered = AppState.currentUser.registeredEvents?.includes(eventId);
    const eventDate = new Date(event.date);
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
                    ${isRegistered ? 
                        `<button class="btn-danger" onclick="unregisterFromEvent(${event.id}); closeEventModal();">
                            Unregister
                        </button>` :
                        `<button class="btn-primary" onclick="registerForEvent(${event.id}); closeEventModal();" 
                            ${event.volunteers >= event.maxVolunteers ? 'disabled' : ''}>
                            ${event.volunteers >= event.maxVolunteers ? 'Event Full' : 'Register Now'}
                        </button>`
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
                    <span>${event.volunteers}/${event.maxVolunteers} volunteers</span>
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
                    <div class="progress-fill" style="width: ${(event.volunteers / event.maxVolunteers) * 100}%"></div>
                </div>
                <p>${event.volunteers} of ${event.maxVolunteers} spots filled</p>
            </div>
        </div>
    `;
    
    document.getElementById('eventModal').style.display = 'block';
}

function unregisterFromEvent(eventId) {
    if (!confirm('Are you sure you want to unregister from this event?')) {
        return;
    }
    
    const event = AppState.events.find(e => e.id === eventId);
    if (!event) return;
    
    AppState.currentUser.registeredEvents = AppState.currentUser.registeredEvents.filter(id => id !== eventId);
    event.volunteers--;
    
    // Unregister from API
    fetch(`../api/events.php?action=unregister&event_id=${eventId}&volunteer_id=${AppState.currentUser.id}`, {
        method: 'DELETE'
    }).catch(console.error);
    
    saveUser();
    saveEvents();
    
    // Batch DOM updates
    requestAnimationFrame(() => {
        updateDashboardStats();
        loadMyEvents();
        loadBrowseEvents();
        loadRecommendedEvents();
    });
    
    showAlert('Successfully unregistered from the event.', 'info');
}

function closeEventModal() {
    document.getElementById('eventModal').style.display = 'none';
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

async function showNotifications() {
    document.getElementById('notificationsModal').style.display = 'block';
    await loadMessages();
}

async function loadMessages() {
    const messagesList = document.getElementById('messagesList');
    
    try {
        console.log('=== MESSAGE LOADING DEBUG ===');
        console.log('Current user:', AppState.currentUser);
        console.log('User ID:', AppState.currentUser?.id);
        
        if (!AppState.currentUser?.id) {
            throw new Error('No user ID found');
        }
        
        const url = `../api/messages.php?user_id=${AppState.currentUser.id}`;
        console.log('Fetching URL:', url);
        
        const response = await fetch(url);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        let messages;
        try {
            messages = JSON.parse(responseText);
        } catch (parseError) {
            throw new Error(`JSON parse error: ${parseError.message}. Response: ${responseText}`);
        }
        
        console.log('Parsed messages:', messages);
        console.log('Messages count:', messages.length);
        
        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <h3>No Messages</h3>
                    <p>Database returned 0 messages for user ID: ${AppState.currentUser.id}</p>
                </div>
            `;
            return;
        }
        
        messages.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
        
        messagesList.innerHTML = messages.map(message => {
            const messageDate = new Date(message.sent_at);
            const formattedDate = messageDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            return `
                <div class="message-item ${message.is_read ? '' : 'unread'}" data-message-id="${message.id}">
                    <div class="message-header">
                        <div class="message-from">
                            <i class="fas fa-user-circle"></i>
                            <strong>${message.sender_name || 'Unknown Sender'}</strong>
                            ${!message.is_read ? '<span class="unread-badge">New</span>' : ''}
                        </div>
                        <div class="message-date">${formattedDate}</div>
                    </div>
                    <div class="message-content" data-full-text="${message.message.replace(/"/g, '&quot;')}">
                        ${message.message}
                    </div>
                    <button class="message-expand-btn" style="display: none;">Read more</button>
                </div>
            `;
        }).join('');
        
        messagesList.querySelectorAll('.message-item').forEach(item => {
            const content = item.querySelector('.message-content');
            const expandBtn = item.querySelector('.message-expand-btn');
            
            if (content.scrollHeight > content.clientHeight) {
                expandBtn.style.display = 'block';
            }
            
            item.addEventListener('click', function(e) {
                if (e.target.classList.contains('message-expand-btn')) {
                    e.stopPropagation();
                    toggleMessageExpansion(this);
                } else {
                    const messageId = this.getAttribute('data-message-id');
                    if (messageId && this.classList.contains('unread')) {
                        markAsRead(parseInt(messageId));
                    }
                    toggleMessageExpansion(this);
                }
            });
        });
        
        console.log('Messages displayed successfully');
        
    } catch (error) {
        console.error('=== MESSAGE LOADING ERROR ===');
        console.error('Error details:', error);
        messagesList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error Loading Messages</h3>
                <p>Error: ${error.message}</p>
                <p>Check console for details</p>
            </div>
        `;
    }
}

async function markAsRead(messageId) {
    try {
        console.log('Marking message as read:', messageId);
        const response = await fetch('../api/messages.php', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messageId: messageId })
        });
        
        if (response.ok) {
            console.log('Message marked as read successfully');
            updateNotificationBadge();
            loadMessages();
        } else {
            console.error('Failed to mark message as read:', response.status);
        }
    } catch (error) {
        console.error('Error marking message as read:', error);
    }
}

async function updateNotificationBadge() {
    try {
        console.log('Updating notification badge for user:', AppState.currentUser.id);
        const response = await fetch(`../api/messages.php?user_id=${AppState.currentUser.id}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const messages = await response.json();
        console.log('Badge update - messages received:', messages);
        
        if (!Array.isArray(messages)) {
            throw new Error('API did not return an array for badge update');
        }
        
        const unreadCount = messages.filter(msg => !msg.is_read).length;
        console.log('Unread messages count:', unreadCount);
        
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'inline';
                console.log('Badge shown with count:', unreadCount);
            } else {
                badge.style.display = 'none';
                console.log('Badge hidden - no unread messages');
            }
        } else {
            console.error('Notification badge element not found');
        }
    } catch (error) {
        console.error('Error updating notification badge:', error);
    }
}



function closeNotificationsModal() {
    document.getElementById('notificationsModal').style.display = 'none';
}

function toggleMessageExpansion(messageItem) {
    const content = messageItem.querySelector('.message-content');
    const expandBtn = messageItem.querySelector('.message-expand-btn');
    
    if (content.classList.contains('expanded')) {
        content.classList.remove('expanded');
        messageItem.classList.remove('expanded');
        expandBtn.textContent = 'Read more';
    } else {
        content.classList.add('expanded');
        messageItem.classList.add('expanded');
        expandBtn.textContent = 'Show less';
    }
}

async function loadRegisteredEventsFromDB() {
    try {
        const response = await fetch(`../api/events.php?volunteer_id=${AppState.currentUser.id}&action=registered`);
        const registeredEvents = await response.json();
        
        // Update user's registered events with database data
        AppState.currentUser.registeredEvents = registeredEvents.map(event => event.id);
        saveUser();
    } catch (error) {
        console.error('Error loading registered events:', error);
    }
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('volunteerHubUser');
    window.location.href = '../index.html';
}

// Override the registerForEvent function for dashboard context
function registerForEvent(eventId) {
    const event = AppState.events.find(e => e.id === eventId);
    if (!event) return;
    
    if (event.volunteers >= event.maxVolunteers) {
        showAlert('Sorry, this event is full!', 'error');
        return;
    }
    
    if (!AppState.currentUser.registeredEvents) {
        AppState.currentUser.registeredEvents = [];
    }
    
    if (AppState.currentUser.registeredEvents.includes(eventId)) {
        showAlert('You are already registered for this event!', 'info');
        return;
    }
    
    AppState.currentUser.registeredEvents.push(eventId);
    event.volunteers++;
    
    // Register with API
    fetch('../api/events.php?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: eventId, volunteerId: AppState.currentUser.id })
    }).catch(console.error);
    
    saveUser();
    saveEvents();
    
    // Batch DOM updates
    requestAnimationFrame(() => {
        updateDashboardStats();
        loadMyEvents();
        loadBrowseEvents();
        loadRecommendedEvents();
    });
    
    showAlert('Successfully registered for the event!', 'success');
}