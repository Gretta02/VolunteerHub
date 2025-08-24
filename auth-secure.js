// Secure Authentication with OAuth2 and JWT

class SecureAuth {
    constructor() {
        this.baseURL = '/volunteerHub/api';
        this.tokenRefreshInterval = null;
        this.initTokenRefresh();
    }

    // Enhanced login with security features
    async login(email, password, rememberMe = false) {
        try {
            // Client-side validation
            if (!this.validateEmail(email) || !this.validatePassword(password)) {
                throw new Error('Invalid email or password format');
            }

            const response = await fetch(`${this.baseURL}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'login',
                    email: email.toLowerCase().trim(),
                    password: password
                })
            });

            const result = await response.json();

            if (result.success) {
                this.setUserSession(result.user, result.access_token);
                this.startTokenRefresh();
                return result;
            } else {
                throw new Error(result.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    // Enhanced registration with validation
    async register(userData) {
        try {
            // Comprehensive validation
            if (!this.validateRegistrationData(userData)) {
                throw new Error('Invalid registration data');
            }

            const response = await fetch(`${this.baseURL}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'register',
                    ...userData,
                    email: userData.email.toLowerCase().trim()
                })
            });

            const result = await response.json();

            if (result.success) {
                this.setUserSession(result.user, result.access_token);
                this.startTokenRefresh();
                return result;
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    // Google OAuth2 integration
    async loginWithGoogle() {
        return new Promise((resolve, reject) => {
            // Load Google Sign-In API
            if (!window.google) {
                this.loadGoogleAPI().then(() => {
                    this.initGoogleSignIn(resolve, reject);
                });
            } else {
                this.initGoogleSignIn(resolve, reject);
            }
        });
    }

    loadGoogleAPI() {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    initGoogleSignIn(resolve, reject) {
        google.accounts.id.initialize({
            client_id: 'your-google-client-id.googleusercontent.com',
            callback: async (response) => {
                try {
                    const result = await this.handleGoogleCallback(response.credential);
                    resolve(result);
                } catch (error) {
                    reject(error);
                }
            }
        });

        google.accounts.id.prompt();
    }

    async handleGoogleCallback(idToken) {
        try {
            const response = await fetch(`${this.baseURL}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({
                    action: 'oauth_google',
                    id_token: idToken
                })
            });

            const result = await response.json();

            if (result.success) {
                this.setUserSession(result.user, result.access_token);
                this.startTokenRefresh();
                return result;
            } else {
                throw new Error(result.message || 'Google authentication failed');
            }
        } catch (error) {
            console.error('Google OAuth error:', error);
            throw error;
        }
    }

    // Secure logout
    async logout() {
        try {
            await fetch(`${this.baseURL}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({ action: 'logout' })
            });

            this.clearUserSession();
            this.stopTokenRefresh();
            
            // Redirect to login
            window.location.href = '/volunteerHub/index.html';
        } catch (error) {
            console.error('Logout error:', error);
            // Clear session anyway
            this.clearUserSession();
            window.location.href = '/volunteerHub/index.html';
        }
    }

    // Token refresh mechanism
    initTokenRefresh() {
        // Check token validity on page load
        this.verifyToken();
    }

    startTokenRefresh() {
        // Refresh token every 10 minutes (tokens expire in 15 minutes)
        this.tokenRefreshInterval = setInterval(() => {
            this.refreshAccessToken();
        }, 10 * 60 * 1000);
    }

    stopTokenRefresh() {
        if (this.tokenRefreshInterval) {
            clearInterval(this.tokenRefreshInterval);
            this.tokenRefreshInterval = null;
        }
    }

    async refreshAccessToken() {
        try {
            const response = await fetch(`${this.baseURL}/auth.php`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'include',
                body: JSON.stringify({ action: 'refresh' })
            });

            const result = await response.json();

            if (!result.success) {
                // Refresh failed, redirect to login
                this.logout();
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            this.logout();
        }
    }

    async verifyToken() {
        try {
            const response = await fetch(`${this.baseURL}/auth.php?verify_token=1`, {
                credentials: 'include'
            });

            const result = await response.json();

            if (result.valid) {
                // Token is valid, start refresh cycle
                this.startTokenRefresh();
                return true;
            } else {
                // Token invalid, clear session
                this.clearUserSession();
                return false;
            }
        } catch (error) {
            console.error('Token verification error:', error);
            return false;
        }
    }

    // Session management
    setUserSession(user, accessToken) {
        // Store user data securely
        const userData = {
            id: user.id,
            name: this.sanitizeHTML(user.name),
            email: this.sanitizeHTML(user.email),
            role: user.role,
            loginTime: Date.now()
        };

        sessionStorage.setItem('currentUser', JSON.stringify(userData));
        
        // Update global state
        if (window.AppState) {
            AppState.currentUser = userData;
        }
    }

    clearUserSession() {
        sessionStorage.removeItem('currentUser');
        
        if (window.AppState) {
            AppState.currentUser = null;
        }
    }

    getCurrentUser() {
        try {
            const userData = sessionStorage.getItem('currentUser');
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    // Validation functions
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 100;
    }

    validatePassword(password) {
        // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    }

    validateRegistrationData(data) {
        return (
            data.name && data.name.trim().length >= 2 && data.name.length <= 50 &&
            this.validateEmail(data.email) &&
            this.validatePassword(data.password) &&
            ['volunteer', 'organizer'].includes(data.role) &&
            (!data.phone || /^[\d\s\-\+\(\)]{10,15}$/.test(data.phone))
        );
    }

    // Security utilities
    sanitizeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // CSRF protection
    async getCSRFToken() {
        try {
            const response = await fetch(`${this.baseURL}/csrf.php`);
            const result = await response.json();
            return result.token;
        } catch (error) {
            console.error('CSRF token error:', error);
            return null;
        }
    }

    // Secure API request wrapper
    async secureRequest(url, options = {}) {
        const csrfToken = await this.getCSRFToken();
        
        const defaultOptions = {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-Token': csrfToken,
                ...options.headers
            }
        };

        return fetch(url, { ...defaultOptions, ...options });
    }
}

// Initialize secure authentication
const secureAuth = new SecureAuth();

// Export for global use
window.SecureAuth = SecureAuth;
window.secureAuth = secureAuth;