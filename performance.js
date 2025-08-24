// Performance Optimization Module

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.lazyLoadObserver = null;
        this.initPerformanceOptimizations();
    }

    initPerformanceOptimizations() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupCaching();
        this.setupVirtualScrolling();
        this.preloadCriticalResources();
    }

    // Debounce function for search and input events
    debounce(func, delay, key) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }

        const timer = setTimeout(() => {
            func();
            this.debounceTimers.delete(key);
        }, delay);

        this.debounceTimers.set(key, timer);
    }

    // Throttle function for scroll events
    throttle(func, delay) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, delay);
            }
        };
    }

    // Lazy loading for images and content
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyLoadObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.classList.remove('lazy');
                            this.lazyLoadObserver.unobserve(img);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            // Observe all lazy images
            document.querySelectorAll('img[data-src]').forEach(img => {
                this.lazyLoadObserver.observe(img);
            });
        }
    }

    // Image optimization
    setupImageOptimization() {
        // Convert images to WebP if supported
        const supportsWebP = this.checkWebPSupport();
        
        if (supportsWebP) {
            document.querySelectorAll('img').forEach(img => {
                if (img.src && !img.src.includes('.webp')) {
                    const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                    // Check if WebP version exists
                    this.checkImageExists(webpSrc).then(exists => {
                        if (exists) img.src = webpSrc;
                    });
                }
            });
        }
    }

    checkWebPSupport() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }

    async checkImageExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }

    // Advanced caching system
    setupCaching() {
        // Service Worker for caching
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/volunteerHub/sw.js')
                .then(registration => {
                    console.log('Service Worker registered:', registration);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }

        // Memory cache for API responses
        this.setupAPICache();
    }

    setupAPICache() {
        const originalFetch = window.fetch;
        const cache = this.cache;

        window.fetch = async function(url, options = {}) {
            // Only cache GET requests
            if (options.method && options.method !== 'GET') {
                return originalFetch(url, options);
            }

            const cacheKey = url + JSON.stringify(options);
            const cached = cache.get(cacheKey);

            // Return cached response if valid
            if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
                return Promise.resolve(new Response(JSON.stringify(cached.data), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }));
            }

            // Fetch and cache
            try {
                const response = await originalFetch(url, options);
                const clonedResponse = response.clone();
                
                if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
                    const data = await clonedResponse.json();
                    cache.set(cacheKey, {
                        data: data,
                        timestamp: Date.now()
                    });
                }

                return response;
            } catch (error) {
                // Return cached data if network fails
                if (cached) {
                    return Promise.resolve(new Response(JSON.stringify(cached.data), {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' }
                    }));
                }
                throw error;
            }
        };
    }

    // Virtual scrolling for large lists
    setupVirtualScrolling() {
        this.virtualScrollContainers = document.querySelectorAll('[data-virtual-scroll]');
        
        this.virtualScrollContainers.forEach(container => {
            this.initVirtualScroll(container);
        });
    }

    initVirtualScroll(container) {
        const itemHeight = parseInt(container.dataset.itemHeight) || 100;
        const bufferSize = parseInt(container.dataset.bufferSize) || 5;
        
        let allItems = [];
        let visibleItems = [];
        let scrollTop = 0;
        let containerHeight = container.clientHeight;

        const updateVisibleItems = this.throttle(() => {
            const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
            const endIndex = Math.min(allItems.length, Math.ceil((scrollTop + containerHeight) / itemHeight) + bufferSize);
            
            visibleItems = allItems.slice(startIndex, endIndex);
            this.renderVirtualItems(container, visibleItems, startIndex, itemHeight);
        }, 16);

        container.addEventListener('scroll', (e) => {
            scrollTop = e.target.scrollTop;
            updateVisibleItems();
        });

        // Store reference for external updates
        container.virtualScroll = {
            setItems: (items) => {
                allItems = items;
                container.style.height = `${items.length * itemHeight}px`;
                updateVisibleItems();
            }
        };
    }

    renderVirtualItems(container, items, startIndex, itemHeight) {
        const fragment = document.createDocumentFragment();
        
        items.forEach((item, index) => {
            const element = this.createItemElement(item);
            element.style.position = 'absolute';
            element.style.top = `${(startIndex + index) * itemHeight}px`;
            element.style.height = `${itemHeight}px`;
            fragment.appendChild(element);
        });

        container.innerHTML = '';
        container.appendChild(fragment);
    }

    createItemElement(item) {
        const div = document.createElement('div');
        div.className = 'virtual-item';
        div.innerHTML = `
            <h3>${this.escapeHTML(item.title)}</h3>
            <p>${this.escapeHTML(item.description)}</p>
        `;
        return div;
    }

    // Preload critical resources
    preloadCriticalResources() {
        const criticalResources = [
            '/volunteerHub/api/events.php',
            '/volunteerHub/styles/main.css',
            '/volunteerHub/styles/dashboard.css'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'fetch';
            document.head.appendChild(link);
        });
    }

    // Optimize DOM operations
    batchDOMUpdates(updates) {
        requestAnimationFrame(() => {
            const fragment = document.createDocumentFragment();
            updates.forEach(update => update(fragment));
            document.body.appendChild(fragment);
        });
    }

    // Memory management
    clearCache() {
        this.cache.clear();
    }

    // Performance monitoring
    measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`${name} took ${end - start} milliseconds`);
        
        // Send to analytics if available
        if (window.gtag) {
            gtag('event', 'timing_complete', {
                name: name,
                value: Math.round(end - start)
            });
        }
        
        return result;
    }

    // Utility functions
    escapeHTML(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Optimize event search with debouncing
    optimizedSearch(searchTerm, events, callback) {
        this.debounce(() => {
            const results = this.measurePerformance('Event Search', () => {
                return events.filter(event => {
                    const searchLower = searchTerm.toLowerCase();
                    return (
                        event.title?.toLowerCase().includes(searchLower) ||
                        event.description?.toLowerCase().includes(searchLower) ||
                        event.location?.toLowerCase().includes(searchLower) ||
                        event.category?.toLowerCase().includes(searchLower)
                    );
                });
            });
            callback(results);
        }, 300, 'search');
    }

    // Optimize API calls with request batching
    batchAPIRequests(requests, batchSize = 5) {
        const batches = [];
        for (let i = 0; i < requests.length; i += batchSize) {
            batches.push(requests.slice(i, i + batchSize));
        }

        return batches.reduce((promise, batch) => {
            return promise.then(results => {
                return Promise.all(batch).then(batchResults => {
                    return results.concat(batchResults);
                });
            });
        }, Promise.resolve([]));
    }
}

// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Export for global use
window.PerformanceOptimizer = PerformanceOptimizer;
window.performanceOptimizer = performanceOptimizer;