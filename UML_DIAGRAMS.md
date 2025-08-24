# VolunteerHub UML Diagrams

## 1. System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        A[Web Browser]
        B[Mobile Browser]
        C[PWA App]
    end
    
    subgraph "Presentation Layer"
        D[HTML Pages]
        E[CSS Styles]
        F[JavaScript]
        G[Service Worker]
    end
    
    subgraph "Application Layer"
        H[Authentication API]
        I[Events API]
        J[Users API]
        K[Messages API]
        L[Badges API]
    end
    
    subgraph "Data Layer"
        M[(MySQL Database)]
        N[File Storage]
    end
    
    subgraph "External Services"
        O[Google OAuth]
        P[Tawk.to Chat]
    end
    
    A --> D
    B --> D
    C --> G
    D --> F
    F --> H
    F --> I
    F --> J
    F --> K
    F --> L
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
    H --> O
    D --> P
```

## 2. Database Entity Relationship Diagram

```mermaid
erDiagram
    USERS {
        int id PK
        varchar name
        varchar email UK
        varchar password
        enum role
        varchar phone
        varchar location
        text interests
        timestamp join_date
        varchar avatar
    }
    
    EVENTS {
        int id PK
        varchar title
        varchar category
        date date
        time time
        varchar location
        text description
        text requirements
        int max_volunteers
        int organizer_id FK
        varchar image
        timestamp created_at
    }
    
    EVENT_REGISTRATIONS {
        int id PK
        int event_id FK
        int volunteer_id FK
        timestamp registered_at
    }
    
    VOLUNTEER_HOURS {
        int id PK
        int volunteer_id FK
        int event_id FK
        decimal hours_worked
        date date_worked
        enum status
    }
    
    BADGES {
        int id PK
        varchar name
        text description
        varchar icon
        int hours_required
        varchar color
    }
    
    USER_BADGES {
        int id PK
        int user_id FK
        int badge_id FK
        timestamp earned_at
    }
    
    MESSAGES {
        int id PK
        int from_user_id FK
        int to_user_id FK
        text message
        boolean is_read
        timestamp sent_at
    }
    
    CONTACTS {
        int id PK
        varchar name
        varchar email
        varchar subject
        text message
        timestamp submitted_at
    }
    
    USERS ||--o{ EVENTS : organizes
    USERS ||--o{ EVENT_REGISTRATIONS : registers
    EVENTS ||--o{ EVENT_REGISTRATIONS : has
    USERS ||--o{ VOLUNTEER_HOURS : logs
    EVENTS ||--o{ VOLUNTEER_HOURS : tracks
    USERS ||--o{ USER_BADGES : earns
    BADGES ||--o{ USER_BADGES : awarded
    USERS ||--o{ MESSAGES : sends
    USERS ||--o{ MESSAGES : receives
```

## 3. Class Diagram

```mermaid
classDiagram
    class User {
        +int id
        +string name
        +string email
        +string password
        +string role
        +string phone
        +string location
        +array interests
        +datetime joinDate
        +string avatar
        +login()
        +register()
        +updateProfile()
        +logout()
    }
    
    class Volunteer {
        +array registeredEvents
        +int totalHours
        +array badges
        +registerForEvent()
        +unregisterFromEvent()
        +logHours()
        +viewBadges()
    }
    
    class Organizer {
        +array createdEvents
        +array categories
        +string website
        +string description
        +createEvent()
        +editEvent()
        +deleteEvent()
        +viewVolunteers()
    }
    
    class Event {
        +int id
        +string title
        +string category
        +date date
        +time time
        +string location
        +string description
        +string requirements
        +int maxVolunteers
        +int organizerId
        +string image
        +datetime createdAt
        +create()
        +update()
        +delete()
        +getVolunteers()
    }
    
    class EventRegistration {
        +int id
        +int eventId
        +int volunteerId
        +datetime registeredAt
        +register()
        +unregister()
        +isRegistered()
    }
    
    class Badge {
        +int id
        +string name
        +string description
        +string icon
        +int hoursRequired
        +string color
        +checkEligibility()
        +award()
    }
    
    class Message {
        +int id
        +int fromUserId
        +int toUserId
        +string message
        +boolean isRead
        +datetime sentAt
        +send()
        +markAsRead()
        +getConversation()
    }
    
    class AuthService {
        +generateJWT()
        +verifyJWT()
        +hashPassword()
        +verifyPassword()
        +getCSRFToken()
    }
    
    class DatabaseService {
        +PDO connection
        +connect()
        +query()
        +prepare()
        +execute()
    }
    
    User <|-- Volunteer
    User <|-- Organizer
    Organizer "1" --> "*" Event : creates
    Volunteer "*" --> "*" Event : registers
    Event "1" --> "*" EventRegistration : has
    Volunteer "1" --> "*" EventRegistration : makes
    Volunteer "*" --> "*" Badge : earns
    User "1" --> "*" Message : sends/receives
    AuthService --> User : authenticates
    DatabaseService --> User : persists
    DatabaseService --> Event : persists
    DatabaseService --> EventRegistration : persists
    DatabaseService --> Badge : persists
    DatabaseService --> Message : persists
```

## 4. Use Case Diagram

```mermaid
graph LR
    subgraph "Actors"
        V[Volunteer]
        O[Organizer]
        G[Guest]
        A[Admin]
    end
    
    subgraph "Authentication"
        UC1[Register Account]
        UC2[Login]
        UC3[Logout]
        UC4[Reset Password]
    end
    
    subgraph "Volunteer Use Cases"
        UC5[Browse Events]
        UC6[Register for Event]
        UC7[Unregister from Event]
        UC8[View Dashboard]
        UC9[Log Volunteer Hours]
        UC10[View Badges]
        UC11[Update Profile]
        UC12[Send Messages]
    end
    
    subgraph "Organizer Use Cases"
        UC13[Create Event]
        UC14[Edit Event]
        UC15[Delete Event]
        UC16[View Volunteers]
        UC17[Manage Events]
        UC18[View Analytics]
        UC19[Approve Hours]
    end
    
    subgraph "General Use Cases"
        UC20[Contact Support]
        UC21[View About Page]
        UC22[Search Events]
    end
    
    G --> UC1
    G --> UC2
    G --> UC5
    G --> UC20
    G --> UC21
    G --> UC22
    
    V --> UC2
    V --> UC3
    V --> UC5
    V --> UC6
    V --> UC7
    V --> UC8
    V --> UC9
    V --> UC10
    V --> UC11
    V --> UC12
    V --> UC20
    V --> UC22
    
    O --> UC2
    O --> UC3
    O --> UC11
    O --> UC12
    O --> UC13
    O --> UC14
    O --> UC15
    O --> UC16
    O --> UC17
    O --> UC18
    O --> UC19
    O --> UC20
    
    A --> UC19
```

## 5. Sequence Diagram - User Registration

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant A as Auth API
    participant D as Database
    
    U->>F: Fill registration form
    U->>F: Submit form
    F->>F: Validate input
    F->>A: POST /api/auth.php (register)
    A->>A: Validate data
    A->>A: Hash password
    A->>D: INSERT user record
    D-->>A: User ID
    A->>A: Generate JWT tokens
    A-->>F: Success + tokens + user data
    F->>F: Store user data
    F->>F: Update UI
    F-->>U: Show success message
    F->>F: Redirect to dashboard
```

## 6. Sequence Diagram - Event Registration

```mermaid
sequenceDiagram
    participant V as Volunteer
    participant F as Frontend
    participant E as Events API
    participant D as Database
    
    V->>F: Click "Register" on event
    F->>F: Check authentication
    F->>E: POST /api/events.php?action=register
    E->>D: Check event exists
    D-->>E: Event data
    E->>D: Check user exists
    D-->>E: User data
    E->>D: Check if already registered
    D-->>E: Registration status
    E->>D: INSERT registration record
    D-->>E: Success
    E-->>F: Registration successful
    F->>F: Update event display
    F->>F: Update user's registered events
    F-->>V: Show success message
```

## 7. Activity Diagram - Event Creation Process

```mermaid
graph TD
    A[Start] --> B[Organizer logs in]
    B --> C[Navigate to dashboard]
    C --> D[Click 'Create Event']
    D --> E[Fill event form]
    E --> F{Form valid?}
    F -->|No| G[Show validation errors]
    G --> E
    F -->|Yes| H[Submit form]
    H --> I[Validate on server]
    I --> J{Server validation?}
    J -->|No| K[Return error message]
    K --> G
    J -->|Yes| L[Save to database]
    L --> M[Generate event ID]
    M --> N[Return success response]
    N --> O[Update dashboard]
    O --> P[Show success message]
    P --> Q[End]
```

## 8. State Diagram - Event Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft : Create Event
    Draft --> Published : Publish Event
    Published --> Registration_Open : Open Registration
    Registration_Open --> Registration_Closed : Close Registration
    Registration_Open --> Cancelled : Cancel Event
    Registration_Closed --> In_Progress : Event Starts
    In_Progress --> Completed : Event Ends
    Completed --> Archived : Archive Event
    Cancelled --> Archived : Archive Cancelled
    Archived --> [*]
    
    Registration_Open --> Registration_Open : Volunteer Registers
    Registration_Open --> Registration_Open : Volunteer Unregisters
    In_Progress --> In_Progress : Log Hours
    Completed --> Completed : Approve Hours
```

## 9. Component Diagram

```mermaid
graph TB
    subgraph "Frontend Components"
        A[Main App]
        B[Authentication Module]
        C[Event Management]
        D[User Dashboard]
        E[Profile Management]
        F[Messaging System]
    end
    
    subgraph "Backend Components"
        G[Auth Controller]
        H[Event Controller]
        I[User Controller]
        J[Message Controller]
        K[Badge Controller]
    end
    
    subgraph "Data Components"
        L[Database Layer]
        M[File Storage]
        N[Cache Layer]
    end
    
    subgraph "External Components"
        O[Google OAuth]
        P[Email Service]
        Q[Chat Widget]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    
    B --> G
    C --> H
    D --> I
    E --> I
    F --> J
    D --> K
    
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    G --> O
    J --> P
    A --> Q
    
    L --> M
    L --> N
```

## 10. Deployment Diagram

```mermaid
graph TB
    subgraph "Client Devices"
        A[Desktop Browser]
        B[Mobile Browser]
        C[Tablet Browser]
    end
    
    subgraph "Web Server (Apache)"
        D[Static Files]
        E[PHP Runtime]
        F[SSL Certificate]
    end
    
    subgraph "Application Server"
        G[VolunteerHub App]
        H[API Endpoints]
        I[Authentication Service]
    end
    
    subgraph "Database Server"
        J[(MySQL Database)]
        K[Backup Storage]
    end
    
    subgraph "External Services"
        L[Google OAuth API]
        M[Email SMTP Server]
        N[Tawk.to Chat Service]
    end
    
    A --> F
    B --> F
    C --> F
    F --> D
    F --> E
    E --> G
    G --> H
    G --> I
    H --> J
    I --> J
    J --> K
    I --> L
    G --> M
    D --> N
```

## Diagram Descriptions

### 1. System Architecture
Shows the overall system structure with client, presentation, application, and data layers, including external service integrations.

### 2. Database ERD
Illustrates the database schema with all tables, relationships, and key constraints for the VolunteerHub system.

### 3. Class Diagram
Represents the object-oriented structure of the system with main classes, their attributes, methods, and relationships.

### 4. Use Case Diagram
Depicts the functional requirements showing what different types of users can do in the system.

### 5. Registration Sequence
Shows the step-by-step process of user registration including validation, database operations, and response handling.

### 6. Event Registration Sequence
Illustrates the volunteer event registration process with authentication checks and database updates.

### 7. Event Creation Activity
Demonstrates the workflow for organizers creating new events with validation and error handling.

### 8. Event State Diagram
Shows the different states an event can be in throughout its lifecycle from creation to archival.

### 9. Component Diagram
Displays the system's modular structure showing how different components interact with each other.

### 10. Deployment Diagram
Illustrates the physical deployment of the system components across different servers and services.

## Usage Notes

These UML diagrams provide a comprehensive view of the VolunteerHub system architecture, data model, and user interactions. They can be used for:

- **System Documentation**: Understanding the overall system structure
- **Development Planning**: Guiding implementation decisions
- **Maintenance**: Helping with system updates and modifications
- **Training**: Onboarding new developers to the project
- **Communication**: Explaining the system to stakeholders

The diagrams are created using Mermaid syntax and can be rendered in most modern documentation platforms, including GitHub, GitLab, and various wiki systems.