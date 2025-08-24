// Main application state
const AppState = {
    currentUser: null,
    events: [],
    categories: ['Environment', 'Education', 'Healthcare', 'Community', 'Animals', 'Disaster Relief', 'Elderly Care', 'Youth Programs'],
    csrfToken: null,
    performanceMetrics: {
        pageLoadTime: 0,
        apiResponseTimes: [],
        cacheHitRate: 0
    }
};

// Performance monitoring
const pageStartTime = performance.now();

// Sample events data
const sampleEvents = [
    // Completed Events
    {id: 1, title: "Beach Cleanup Drive", category: "Environment", date: "2025-10-15", time: "09:00", location: "Santa Monica Beach", description: "Join us for a community beach cleanup to protect marine life and keep our beaches beautiful.", organizer: "Green Earth Foundation", volunteers: 0, maxVolunteers: 50, image: "fas fa-leaf"},
    {id: 2, title: "Food Bank Volunteer", category: "Community", date: "2025-09-20", time: "10:00", location: "Downtown Community Center", description: "Help sort and distribute food to families in need in our community.", organizer: "Community Care Network", volunteers: 0, maxVolunteers: 30, image: "fas fa-heart"},
    {id: 3, title: "Reading Program for Kids", category: "Education", date: "2025-09-25", time: "14:00", location: "Central Library", description: "Volunteer to read stories and help children develop their reading skills.", organizer: "Literacy First", volunteers: 0, maxVolunteers: 20, image: "fas fa-book"},
    {id: 4, title: "Senior Care Visit", category: "Elderly Care", date: "2025-09-30", time: "15:00", location: "Sunset Nursing Home", description: "Spend time with elderly residents, play games, and provide companionship.", organizer: "Golden Years Foundation", volunteers: 0, maxVolunteers: 15, image: "fas fa-user-friends"},
    {id: 5, title: "Animal Shelter Help", category: "Animals", date: "2025-10-05", time: "11:00", location: "City Animal Shelter", description: "Help care for rescued animals, clean kennels, and assist with adoptions.", organizer: "Paws & Hearts", volunteers: 0, maxVolunteers: 25, image: "fas fa-paw"},
    {id: 6, title: "Tree Planting Initiative", category: "Environment", date: "2025-10-10", time: "08:00", location: "Central Park", description: "Help plant trees to improve air quality and beautify our city parks.", organizer: "Green Future", volunteers: 0, maxVolunteers: 40, image: "fas fa-tree"},
    {id: 7, title: "Homeless Shelter Meal Prep", category: "Community", date: "2025-10-12", time: "16:00", location: "Hope Shelter", description: "Prepare and serve meals for homeless individuals and families.", organizer: "Helping Hands", volunteers: 0, maxVolunteers: 20, image: "fas fa-utensils"},
    {id: 8, title: "Youth Mentorship Program", category: "Youth Programs", date: "2025-10-14", time: "13:00", location: "Community Youth Center", description: "Mentor young people and help them develop life skills and confidence.", organizer: "Future Leaders", volunteers: 0, maxVolunteers: 12, image: "fas fa-child"},
    // Ongoing Events
    {id: 9, title: "Hospital Volunteer Support", category: "Healthcare", date: "2025-10-20", time: "09:00", location: "General Hospital", description: "Assist hospital staff and provide comfort to patients and families.", organizer: "Healthcare Heroes", volunteers: 0, maxVolunteers: 25, image: "fas fa-heartbeat"},
    {id: 10, title: "Community Garden Project", category: "Environment", date: "2025-10-22", time: "10:00", location: "Riverside Community Garden", description: "Help maintain community gardens and teach sustainable farming practices.", organizer: "Green Thumb Society", volunteers: 0, maxVolunteers: 30, image: "fas fa-seedling"},
    {id: 11, title: "Holiday Food Drive", category: "Community", date: "2025-11-24", time: "12:00", location: "City Hall", description: "Collect and distribute holiday meals to families in need.", organizer: "Holiday Spirit Foundation", volunteers: 0, maxVolunteers: 50, image: "fas fa-gift"},
    {id: 12, title: "Winter Clothing Drive", category: "Community", date: "2025-12-26", time: "11:00", location: "Community Center", description: "Collect and distribute warm clothing for the winter season.", organizer: "Warm Hearts Initiative", volunteers: 0, maxVolunteers: 40, image: "fas fa-tshirt"},
    {id: 13, title: "Pet Adoption Fair", category: "Animals", date: "2026-01-28", time: "14:00", location: "City Park", description: "Help organize pet adoption events and find homes for rescued animals.", organizer: "Animal Rescue Network", volunteers: 0, maxVolunteers: 20, image: "fas fa-dog"},
    {id: 14, title: "Disaster Relief Training", category: "Disaster Relief", date: "2026-02-15", time: "09:00", location: "Emergency Services Center", description: "Learn disaster response skills and help prepare communities for emergencies.", organizer: "Emergency Response Team", volunteers: 0, maxVolunteers: 30, image: "fas fa-hands-helping"},
    {id: 15, title: "Literacy Tutoring", category: "Education", date: "2026-03-02", time: "15:00", location: "Public Library", description: "Tutor adults in reading and writing skills to improve their opportunities.", organizer: "Adult Learning Center", volunteers: 0, maxVolunteers: 25, image: "fas fa-graduation-cap"},
    {id: 16, title: "Environmental Cleanup", category: "Environment", date: "2026-04-05", time: "08:30", location: "River Trail", description: "Clean up natural areas and remove litter to protect wildlife habitats.", organizer: "Nature Conservancy", volunteers: 0, maxVolunteers: 45, image: "fas fa-recycle"},
    // Upcoming Events
    {id: 17, title: "Blood Drive Campaign", category: "Healthcare", date: "2026-05-15", time: "10:00", location: "Medical Center", description: "Help organize blood donation drives to support local hospitals.", organizer: "Red Cross Society", volunteers: 0, maxVolunteers: 20, image: "fas fa-tint"},
    {id: 18, title: "School Supply Drive", category: "Education", date: "2026-06-20", time: "13:00", location: "Elementary School", description: "Collect and distribute school supplies to students in need.", organizer: "Education First", volunteers: 0, maxVolunteers: 30, image: "fas fa-pencil-alt"},
    {id: 19, title: "Senior Technology Help", category: "Elderly Care", date: "2026-07-25", time: "14:00", location: "Senior Center", description: "Teach elderly residents how to use smartphones, tablets, and computers.", organizer: "Tech for Seniors", volunteers: 0, maxVolunteers: 15, image: "fas fa-laptop"},
    {id: 20, title: "Community Art Project", category: "Community", date: "2026-08-01", time: "11:00", location: "Arts Center", description: "Help create community murals and art installations.", organizer: "Creative Community", volunteers: 0, maxVolunteers: 25, image: "fas fa-palette"},
    {id: 21, title: "Wildlife Conservation", category: "Animals", date: "2026-09-10", time: "07:00", location: "Nature Reserve", description: "Assist with wildlife monitoring and habitat restoration projects.", organizer: "Wildlife Protection Society", volunteers: 0, maxVolunteers: 18, image: "fas fa-binoculars"},
    {id: 22, title: "Youth Sports Coaching", category: "Youth Programs", date: "2026-10-15", time: "16:00", location: "Sports Complex", description: "Coach young athletes and promote healthy lifestyle choices.", organizer: "Youth Sports League", volunteers: 0, maxVolunteers: 22, image: "fas fa-futbol"},
    {id: 23, title: "Elderly Meal Delivery", category: "Elderly Care", date: "2026-11-20", time: "12:00", location: "Senior Services", description: "Deliver nutritious meals to homebound elderly residents.", organizer: "Meals on Wheels", volunteers: 0, maxVolunteers: 20, image: "fas fa-truck"},
    {id: 24, title: "Community Health Fair", category: "Healthcare", date: "2026-12-28", time: "09:00", location: "Community Center", description: "Help organize health screenings and wellness education events.", organizer: "Public Health Initiative", volunteers: 0, maxVolunteers: 35, image: "fas fa-stethoscope"}
];

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    // Initialize security and performance
    initializeSecurity();
    initializePerformance();
    
    initializeApp();
    loadFeaturedEvents();
    setupEventListeners();
});

// Security initialization
function initializeSecurity() {
    // Initialize secure authentication
    if (window.secureAuth) {
        secureAuth.verifyToken();
    }
    
    // Get CSRF token
    getCSRFToken();
}

// Performance initialization
function initializePerformance() {
    if (window.performanceOptimizer) {
        performanceOptimizer.measurePerformance('Page Load', () => {
            AppState.performanceMetrics.pageLoadTime = performance.now() - pageStartTime;
        });
    }
}

// CSRF token management
async function getCSRFToken() {
    try {
        const apiPath = window.location.pathname.includes('/pages/') ? '../api/csrf.php' : 'api/csrf.php';
        const response = await fetch(apiPath);
        const result = await response.json();
        
        if (result.success) {
            AppState.csrfToken = result.token;
        }
    } catch (error) {
        console.error('CSRF token error:', error);
    }
}

function initializeApp() {
    // Load user from localStorage
    const savedUser = localStorage.getItem('volunteerHubUser');
    if (savedUser) {
        AppState.currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
    
    // Load events from API
    loadEventsFromAPI();
}

function setupEventListeners() {
    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
        });
    }
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });
}

let showingAllEvents = false;

function loadFeaturedEvents() {
    const container = document.getElementById('featuredEvents');
    if (!container) return;
    
    const eventsToShow = showingAllEvents ? AppState.events : AppState.events.slice(0, 6);
    container.innerHTML = eventsToShow.map(event => createEventCard(event)).join('');
    
    // Update load more button
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.textContent = showingAllEvents ? 'Show Less' : 'Load More Events';
    }
}

function toggleLoadMore() {
    showingAllEvents = !showingAllEvents;
    loadFeaturedEvents();
}

function createEventCard(event) {
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    const isCompleted = eventDate < currentDate;
    const formattedDate = eventDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
    });
    
    return `
        <article class="event-card">
            <div class="event-image">
                <i class="${event.image}"></i>
            </div>
            <div class="event-content">
                <span class="event-category">${event.category}</span>
                <h3 class="event-title">${event.title}</h3>
                <div class="event-meta">
                    <span><i class="fas fa-calendar"></i>${formattedDate}</span>
                    <span><i class="fas fa-clock"></i>${event.time}</span>
                    <span><i class="fas fa-map-marker-alt"></i>${event.location}</span>
                </div>
                <p class="event-description">${event.description}</p>
                <div class="event-footer">
                    <span class="volunteers-count">${event.volunteers}/${event.maxVolunteers} volunteers</span>
                    ${isCompleted ? 
                        '<span class="event-status">Completed</span>' :
                        `<button class="btn-primary" onclick="handleEventAction(${event.id})">
                            ${AppState.currentUser ? 'Register' : 'Login to Register'}
                        </button>`
                    }
                </div>
            </div>
        </article>
    `;
}

function handleEventAction(eventId) {
    if (!AppState.currentUser) {
        showLogin();
        return;
    }
    
    if (AppState.currentUser.role === 'volunteer') {
        registerForEvent(eventId);
    } else {
        window.location.href = 'pages/organizer-dashboard.html';
    }
}

async function registerForEvent(eventId) {
    const event = AppState.events.find(e => e.id === eventId);
    if (!event) return;
    
    // Check if event is completed
    const eventDate = new Date(event.date);
    const currentDate = new Date();
    if (eventDate < currentDate) {
        showAlert('Cannot register for completed events.', 'error');
        return;
    }
    
    if (event.volunteers >= event.maxVolunteers) {
        showAlert('Sorry, this event is full!', 'error');
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
        const apiPath = window.location.pathname.includes('/pages/') ? '../api/events.php?action=register' : 'api/events.php?action=register';
        const response = await fetch(apiPath, {
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
            saveEvents();
            
            showAlert('Successfully registered for the event!', 'success');
            loadFeaturedEvents(); // Refresh the display
        } else {
            showAlert(result.message || 'Registration failed. Please try again.', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showAlert('Network error. Please check your connection and try again.', 'error');
    }
}

function showAllEvents() {
    if (AppState.currentUser) {
        if (AppState.currentUser.role === 'volunteer') {
            window.location.href = 'pages/volunteer-dashboard.html';
        } else {
            window.location.href = 'pages/organizer-dashboard.html';
        }
    } else {
        showLogin();
    }
}

function updateAuthUI() {
    const navAuth = document.querySelector('.nav-auth');
    if (!navAuth) return;
    
    if (AppState.currentUser) {
        const userAvatar = AppState.currentUser.avatar || '👤';
        const avatarDisplay = userAvatar.startsWith('data:image/') ? 
            `<img src="${userAvatar}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : 
            userAvatar;
            
        navAuth.innerHTML = `
            <div class="user-dropdown" id="userDropdown">
                <div class="user-avatar" onclick="toggleUserDropdown()">
                    <div class="avatar-circle">${avatarDisplay}</div>
                    <span>${AppState.currentUser.name}</span>
                    <i class="fas fa-chevron-down"></i>
                </div>
                <div class="dropdown-menu" id="dropdownMenu">
                    <a href="#" onclick="goToDashboard()"><i class="fas fa-tachometer-alt"></i> Dashboard</a>
                    <a href="#" onclick="showProfile()"><i class="fas fa-user"></i> Profile</a>
                    <a href="#" onclick="showSettings()"><i class="fas fa-cog"></i> Settings</a>
                    <a href="#" onclick="logout()"><i class="fas fa-sign-out-alt"></i> Logout</a>
                </div>
            </div>
        `;
    } else {
        navAuth.innerHTML = `
            <div class="auth-dropdown" id="authDropdown">
                <button class="btn-primary" onclick="toggleAuthDropdown()">Get Started <i class="fas fa-chevron-down"></i></button>
                <div class="dropdown-menu" id="authDropdownMenu">
                    <a href="#" onclick="showLogin()"><i class="fas fa-sign-in-alt"></i> Login</a>
                    <a href="#" onclick="showSignup()"><i class="fas fa-user-plus"></i> Sign Up</a>
                </div>
            </div>
        `;
    }
}

function toggleUserDropdown() {
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) dropdown.classList.toggle('show');
}

function toggleAuthDropdown() {
    const dropdown = document.getElementById('authDropdownMenu');
    if (dropdown) dropdown.classList.toggle('show');
}

function showProfile() {
    const profileSection = document.getElementById('profile');
    
    if (profileSection) {
        // We're on a dashboard page
        const otherSections = document.querySelectorAll('.dashboard-section:not(#profile)');
        otherSections.forEach(section => section.classList.add('hidden'));
        profileSection.classList.remove('hidden');
        loadProfileData();
    } else {
        // We're on a non-dashboard page, redirect to dashboard with profile flag
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const basePath = isInPagesFolder ? '' : 'pages/';
        const dashboardUrl = AppState.currentUser.role === 'volunteer' ? 
            basePath + 'volunteer-dashboard.html' : basePath + 'organizer-dashboard.html';
        
        // Store flag to show profile after redirect
        sessionStorage.setItem('showProfile', 'true');
        window.location.href = dashboardUrl;
    }
    
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
}

function hideProfile() {
    const profileSection = document.getElementById('profile');
    const otherSections = document.querySelectorAll('.dashboard-section:not(#profile)');
    
    if (profileSection) {
        profileSection.classList.add('hidden');
        otherSections.forEach(section => section.classList.remove('hidden'));
    }
}

function loadProfileData() {
    if (!AppState.currentUser) return;
    
    const user = AppState.currentUser;
    
    // Update profile display
    const profileName = document.getElementById('profileName');
    const profileEmail = document.getElementById('profileEmail');
    const avatarElement = document.getElementById(user.role === 'volunteer' ? 'volunteerAvatar' : 'organizerAvatar');
    
    if (profileName) profileName.textContent = user.name;
    if (profileEmail) profileEmail.textContent = user.email;
    if (avatarElement) {
        const avatar = user.avatar || (user.role === 'volunteer' ? '👤' : '🏢');
        if (avatar.startsWith('data:image/')) {
            avatarElement.innerHTML = `<img src="${avatar}" alt="Profile">`;
        } else {
            avatarElement.textContent = avatar;
        }
    }
    
    // Update form fields
    if (user.role === 'volunteer') {
        const profileFullName = document.getElementById('profileFullName');
        const profilePhone = document.getElementById('profilePhone');
        const profileLocation = document.getElementById('profileLocation');
        const profileBio = document.getElementById('profileBio');
        
        if (profileFullName) profileFullName.value = user.name || '';
        if (profilePhone) profilePhone.value = user.phone || '';
        if (profileLocation) profileLocation.value = user.location || '';
        if (profileBio) profileBio.value = user.bio || '';
        
        // Load interests
        loadInterests();
    } else {
        const profileOrgName = document.getElementById('profileOrgName');
        const profilePhone = document.getElementById('profilePhone');
        const profileLocation = document.getElementById('profileLocation');
        const profileWebsite = document.getElementById('profileWebsite');
        const profileDescription = document.getElementById('profileDescription');
        
        if (profileOrgName) profileOrgName.value = user.name || '';
        if (profilePhone) profilePhone.value = user.phone || '';
        if (profileLocation) profileLocation.value = user.location || '';
        if (profileWebsite) profileWebsite.value = user.website || '';
        if (profileDescription) profileDescription.value = user.description || '';
        
        // Load categories
        loadCategories();
    }
}

function loadInterests() {
    const interestsGrid = document.getElementById('interestsGrid');
    if (!interestsGrid) return;
    
    const interests = AppState.categories;
    const userInterests = AppState.currentUser.interests || [];
    
    interestsGrid.innerHTML = interests.map(interest => `
        <div class="interest-item">
            <input type="checkbox" id="interest-${interest}" value="${interest}" 
                   ${userInterests.includes(interest) ? 'checked' : ''}>
            <label for="interest-${interest}">${interest}</label>
        </div>
    `).join('');
}

function loadCategories() {
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (!categoriesGrid) return;
    
    const categories = AppState.categories;
    const userCategories = AppState.currentUser.categories || [];
    
    categoriesGrid.innerHTML = categories.map(category => `
        <div class="interest-item">
            <input type="checkbox" id="category-${category}" value="${category}" 
                   ${userCategories.includes(category) ? 'checked' : ''}>
            <label for="category-${category}">${category}</label>
        </div>
    `).join('');
}

function updateProfile(event) {
    event.preventDefault();
    
    if (!AppState.currentUser) return;
    
    const formData = new FormData(event.target);
    
    if (AppState.currentUser.role === 'volunteer') {
        AppState.currentUser.name = document.getElementById('profileFullName').value;
        AppState.currentUser.phone = document.getElementById('profilePhone').value;
        AppState.currentUser.location = document.getElementById('profileLocation').value;
        AppState.currentUser.bio = document.getElementById('profileBio').value;
        
        // Update interests
        const checkedInterests = Array.from(document.querySelectorAll('#interestsGrid input:checked'))
            .map(input => input.value);
        AppState.currentUser.interests = checkedInterests;
    } else {
        AppState.currentUser.name = document.getElementById('profileOrgName').value;
        AppState.currentUser.phone = document.getElementById('profilePhone').value;
        AppState.currentUser.location = document.getElementById('profileLocation').value;
        AppState.currentUser.website = document.getElementById('profileWebsite').value;
        AppState.currentUser.description = document.getElementById('profileDescription').value;
        
        // Update categories
        const checkedCategories = Array.from(document.querySelectorAll('#categoriesGrid input:checked'))
            .map(input => input.value);
        AppState.currentUser.categories = checkedCategories;
    }
    
    // Save to localStorage
    saveUser();
    
    // Update users list
    const users = JSON.parse(localStorage.getItem('volunteerHubUsers') || '[]');
    const userIndex = users.findIndex(u => u.id === AppState.currentUser.id);
    if (userIndex !== -1) {
        users[userIndex] = AppState.currentUser;
        localStorage.setItem('volunteerHubUsers', JSON.stringify(users));
    }
    
    // Update UI
    updateAuthUI();
    loadProfileData();
    
    showAlert('Profile updated successfully!', 'success');
}

let selectedAvatar = null;
const avatarOptions = ['👤', '👨', '👩', '🧑', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓', '👨‍⚕️', '👩‍⚕️', '👨‍🏫', '👩‍🏫', '🏢', '🏛️', '🏥', '🏫', '🌱', '🌍', '❤️', '🤝', '🎯', '⭐', '🔥', '💡'];

function showAvatarSelector() {
    const avatarGrid = document.getElementById('avatarGrid');
    const currentAvatar = AppState.currentUser.avatar || (AppState.currentUser.role === 'volunteer' ? '👤' : '🏢');
    
    avatarGrid.innerHTML = avatarOptions.map(avatar => `
        <div class="avatar-option ${avatar === currentAvatar ? 'selected' : ''}" 
             onclick="selectAvatar('${avatar}')">${avatar}</div>
    `).join('');
    
    selectedAvatar = currentAvatar;
    document.getElementById('avatarModal').style.display = 'block';
}

function selectAvatar(avatar) {
    document.querySelectorAll('.avatar-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.target.classList.add('selected');
    selectedAvatar = avatar;
    
    // Hide upload section and clear file input
    document.querySelector('.option-section:first-child').style.display = 'none';
    document.getElementById('avatarUpload').value = '';
}

function saveSelectedAvatar() {
    if (selectedAvatar) {
        AppState.currentUser.avatar = selectedAvatar;
        saveUser();
        
        // Update users list
        const users = JSON.parse(localStorage.getItem('volunteerHubUsers') || '[]');
        const userIndex = users.findIndex(u => u.id === AppState.currentUser.id);
        if (userIndex !== -1) {
            users[userIndex] = AppState.currentUser;
            localStorage.setItem('volunteerHubUsers', JSON.stringify(users));
        }
        
        // Update avatar displays
        const avatarElement = document.getElementById(AppState.currentUser.role === 'volunteer' ? 'volunteerAvatar' : 'organizerAvatar');
        if (avatarElement) {
            if (selectedAvatar.startsWith('data:image/')) {
                avatarElement.innerHTML = `<img src="${selectedAvatar}" alt="Profile">`;
            } else {
                avatarElement.textContent = selectedAvatar;
            }
        }
        
        // Update dropdown avatar
        const dropdownAvatar = document.querySelector('.user-avatar .avatar-circle');
        if (dropdownAvatar) {
            if (selectedAvatar.startsWith('data:image/')) {
                dropdownAvatar.innerHTML = `<img src="${selectedAvatar}" alt="Profile" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                dropdownAvatar.textContent = selectedAvatar;
            }
        }
        
        updateAuthUI();
        closeAvatarModal();
        showAlert('Avatar updated successfully!', 'success');
    }
}

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.size > 2 * 1024 * 1024) {
        showAlert('Image size must be less than 2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        selectedAvatar = e.target.result;
        
        // Show preview and hide emoji section
        const preview = document.getElementById('uploadPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
        preview.classList.add('show');
        
        document.querySelector('.option-section:last-child').style.display = 'none';
        
        showAlert('Image preview ready! Click Save Avatar to confirm.', 'info');
    };
    reader.readAsDataURL(file);
}

function closeAvatarModal() {
    document.getElementById('avatarModal').style.display = 'none';
    selectedAvatar = null;
    
    // Reset sections visibility
    document.querySelectorAll('.option-section').forEach(section => {
        section.style.display = 'block';
    });
    document.getElementById('uploadPreview').classList.remove('show');
    document.getElementById('avatarUpload').value = '';
}

function showSettings() {
    const settingsSection = document.getElementById('settings');
    
    if (settingsSection) {
        // We're on a dashboard page
        const otherSections = document.querySelectorAll('.dashboard-section:not(#settings)');
        otherSections.forEach(section => section.classList.add('hidden'));
        settingsSection.classList.remove('hidden');
    } else {
        // We're on a non-dashboard page, redirect to dashboard with settings flag
        const isInPagesFolder = window.location.pathname.includes('/pages/');
        const basePath = isInPagesFolder ? '' : 'pages/';
        const dashboardUrl = AppState.currentUser.role === 'volunteer' ? 
            basePath + 'volunteer-dashboard.html' : basePath + 'organizer-dashboard.html';
        
        // Store flag to show settings after redirect
        sessionStorage.setItem('showSettings', 'true');
        window.location.href = dashboardUrl;
    }
    
    const dropdown = document.getElementById('dropdownMenu');
    if (dropdown) dropdown.classList.remove('show');
}

function goToDashboard() {
    const isInPagesFolder = window.location.pathname.includes('/pages/');
    const basePath = isInPagesFolder ? '' : 'pages/';
    
    if (AppState.currentUser.role === 'volunteer') {
        window.location.href = basePath + 'volunteer-dashboard.html';
    } else {
        window.location.href = basePath + 'organizer-dashboard.html';
    }
}

function logout() {
    AppState.currentUser = null;
    localStorage.removeItem('volunteerHubUser');
    updateAuthUI();
    showAlert('Logged out successfully!', 'info');
}

function saveUser() {
    localStorage.setItem('volunteerHubUser', JSON.stringify(AppState.currentUser));
}

async function loadEventsFromAPI() {
    try {
        const apiPath = window.location.pathname.includes('/pages/') ? '../api/events.php' : 'api/events.php';
        const response = await fetch(apiPath);
        const events = await response.json();
        AppState.events = events.length > 0 ? events : sampleEvents;
    } catch (error) {
        console.error('Error loading events:', error);
        AppState.events = sampleEvents;
    }
    loadFeaturedEvents();
}

function saveEvents() {
    localStorage.setItem('volunteerHubEvents', JSON.stringify(AppState.events));
}

// Alert system
function showAlert(message, type = 'info') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 4000);
}

// Modal functions
function showModal() {
    document.getElementById('authModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('authModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('authModal');
    if (event.target === modal) {
        closeModal();
    }
}