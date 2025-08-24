// Authentication functions

function showLogin() {
    const authContent = document.getElementById('authContent');
    authContent.innerHTML = `
        <form class="auth-form" onsubmit="handleLogin(event)">
            <h2>Login to VolunteerHub</h2>
            <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" autocomplete="email" required>
            </div>
            <div class="form-group">
                <label for="loginPassword">Password</label>
                <input type="password" id="loginPassword" autocomplete="current-password" required>
            </div>
            <div class="form-group">
                <label>Login as:</label>
                <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                    <label for="loginRoleVolunteer" style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal;">
                        <input type="radio" id="loginRoleVolunteer" name="loginRole" value="volunteer" checked>
                        Volunteer
                    </label>
                    <label for="loginRoleOrganizer" style="display: flex; align-items: center; gap: 0.5rem; font-weight: normal;">
                        <input type="radio" id="loginRoleOrganizer" name="loginRole" value="organizer">
                        Organizer
                    </label>
                </div>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">Login</button>
            <div class="form-toggle">
                <p>Don't have an account? <a onclick="showSignup()">Sign up here</a></p>
            </div>
        </form>
    `;
    showModal();
}

function showSignup(defaultRole = 'volunteer') {
    const authContent = document.getElementById('authContent');
    authContent.innerHTML = `
        <form class="auth-form" onsubmit="handleSignup(event)">
            <h2>Join VolunteerHub</h2>
            <div class="form-group">
                <label for="signupName">Full Name</label>
                <input type="text" id="signupName" autocomplete="name" required>
            </div>
            <div class="form-group">
                <label for="signupEmail">Email</label>
                <input type="email" id="signupEmail" autocomplete="email" required>
            </div>
            <div class="form-group">
                <label for="signupPassword">Password</label>
                <input type="password" id="signupPassword" autocomplete="new-password" required minlength="6">
            </div>
            <div class="form-group">
                <label for="signupRole">I want to</label>
                <select id="signupRole" required>
                    <option value="volunteer" ${defaultRole === 'volunteer' ? 'selected' : ''}>Volunteer for events</option>
                    <option value="organizer" ${defaultRole === 'organizer' ? 'selected' : ''}>Organize events</option>
                </select>
            </div>
            <div class="form-group">
                <label for="signupPhone">Phone Number</label>
                <input type="tel" id="signupPhone" autocomplete="tel" required>
            </div>
            <div class="form-group">
                <label for="signupLocation">Location</label>
                <input type="text" id="signupLocation" placeholder="City, State" required>
            </div>
            <button type="submit" class="btn-primary" style="width: 100%;">Create Account</button>
            <div class="form-toggle">
                <p>Already have an account? <a onclick="showLogin()">Login here</a></p>
            </div>
        </form>
    `;
    showModal();
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const selectedRole = document.querySelector('input[name="loginRole"]:checked').value;
    
    try {
        const apiPath = window.location.pathname.includes('/pages/') ? '../api/users.php?action=login' : 'api/users.php?action=login';
        const response = await fetch(apiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, role: selectedRole })
        });
        
        let result;
        try {
            result = await response.json();
        } catch (jsonError) {
            showAlert('Invalid server response. Please try again.', 'error');
            return;
        }
        
        if (result.success) {
            AppState.currentUser = result.user;
            saveUser();
            updateAuthUI();
            closeModal();
            
            // Redirect to appropriate dashboard
            setTimeout(() => {
                const currentPath = window.location.pathname;
                if (currentPath.includes('/pages/')) {
                    if (result.user.role === 'volunteer') {
                        window.location.href = 'volunteer-dashboard.html';
                    } else {
                        window.location.href = 'organizer-dashboard.html';
                    }
                } else {
                    if (result.user.role === 'volunteer') {
                        window.location.href = 'pages/volunteer-dashboard.html';
                    } else {
                        window.location.href = 'pages/organizer-dashboard.html';
                    }
                }
            }, 1000);
            
            showAlert('Login successful!', 'success');
        } else {
            showAlert(result.message || 'Invalid credentials', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}

async function handleSignup(event) {
    event.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const role = document.getElementById('signupRole').value;
    const phone = document.getElementById('signupPhone').value.trim();
    const location = document.getElementById('signupLocation').value.trim();

    // Basic client-side validation
    if (!name || !email || !password || !role || !phone || !location) {
        showAlert('Please fill in all required fields.', 'error');
        return;
    }
    if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.', 'error');
        return;
    }
    // Simple email format check
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
        showAlert('Please enter a valid email address.', 'error');
        return;
    }

    try {
        const apiPath = window.location.pathname.includes('/pages/') ? '../api/users.php?action=register' : 'api/users.php?action=register';
        const response = await fetch(apiPath, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role, phone, location })
        });

        if (!response.ok) {
            showAlert('Server error. Please try again later.', 'error');
            return;
        }

        const result = await response.json();

        if (result.success) {
            AppState.currentUser = result.user;
            saveUser();
            updateAuthUI();
            closeModal();

            // Redirect to appropriate dashboard
            setTimeout(() => {
                const currentPath = window.location.pathname;
                if (currentPath.includes('/pages/')) {
                    if (role === 'volunteer') {
                        window.location.href = 'volunteer-dashboard.html';
                    } else {
                        window.location.href = 'organizer-dashboard.html';
                    }
                } else {
                    if (role === 'volunteer') {
                        window.location.href = 'pages/volunteer-dashboard.html';
                    } else {
                        window.location.href = 'pages/organizer-dashboard.html';
                    }
                }
            }, 1000);

            showAlert('Account created successfully! Welcome to VolunteerHub!', 'success');
        } else {
            showAlert(result.message || 'Registration failed', 'error');
        }
    } catch (error) {
        showAlert('Network error. Please try again.', 'error');
    }
}