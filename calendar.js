// Calendar functionality
let currentCalendarDate = new Date();

function initializeCalendar() {
    generateCalendar();
}

function generateCalendar() {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    
    let calendarHTML = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
        calendarHTML += `<div class="calendar-day other-month">
            <div class="calendar-day-number">${prevMonth - i}</div>
        </div>`;
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const isToday = currentDate.toDateString() === today.toDateString();
        const dayEvents = getEventsForDate(currentDate);
        
        calendarHTML += `<div class="calendar-day ${isToday ? 'today' : ''}">
            <div class="calendar-day-number">${day}</div>`;
        
        dayEvents.forEach(event => {
            calendarHTML += `<div class="calendar-event" onclick="showEventDetails(${event.id})">
                ${event.title}
            </div>`;
        });
        
        calendarHTML += '</div>';
    }
    
    // Next month days
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remainingCells = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        calendarHTML += `<div class="calendar-day other-month">
            <div class="calendar-day-number">${day}</div>
        </div>`;
    }
    
    const calendarGrid = document.getElementById('calendarGrid');
    // Remove all children
    while (calendarGrid.firstChild) {
        calendarGrid.removeChild(calendarGrid.firstChild);
    }

    // Create a temporary container to parse the HTML string safely
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = calendarHTML;

    // Append each child node to the calendarGrid
    Array.from(tempDiv.childNodes).forEach(node => {
        calendarGrid.appendChild(node);
    });
}

function getEventsForDate(date) {
    const dateString = date.toISOString().split('T')[0];
    
    if (!AppState.events || !AppState.currentUser) return [];
    
    return AppState.events.filter(event => {
        if (event.date !== dateString) return false;
        
        if (AppState.currentUser.role === 'organizer') {
            return event.organizer_id === AppState.currentUser.id;
        } else {
            return AppState.currentUser.registeredEvents?.includes(event.id) || false;
        }
    });
}

function previousMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
    generateCalendar();
}

function nextMonth() {
    currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
    generateCalendar();
}

function toggleCalendarSidebar() {
    const sidebar = document.getElementById('calendarSidebar');
    const main = document.getElementById('dashboardMain');
    
    sidebar.classList.toggle('open');
    main.classList.toggle('sidebar-open');
    
    // Initialize calendar when opening
    if (sidebar.classList.contains('open')) {
        setTimeout(() => {
            initializeCalendar();
        }, 300);
    }
}