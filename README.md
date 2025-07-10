# YWAM DAR Management System

A comprehensive management system for Youth With A Mission (YWAM) Dar es Salaam community, built with React, TypeScript, and Supabase.

## Features

### 🔐 Authentication & User Management
- Role-based access control (Admin, Staff, Missionary, Chef, WorkDutyManager, DTS, PraiseTeam, Friend)
- User registration and profile management
- Secure login with username/email support

### 📅 Schedule Management
- **Meditation Schedules**: Weekly meditation session planning with Bible verse assignments
- **Kitchen Duties**: Automated meal planning with cook and washer assignments
- **Work Duties**: Task management with light/heavy duty classifications
- **Lecture Schedules**: Monthly academic timetables

### 🍽️ Kitchen Management
- Automated user assignment based on configurable rules
- Role-based restrictions (e.g., Missionaries excluded, DTS restrictions)
- Sunday meal restrictions (dinner only)
- Schedule publication system (Friday 17:45)
- User exchange functionality for chefs

### 📱 Communication System
- SMS integration with Beem Africa and Africa's Talking
- Notification templates for different message types
- Automated reminders for duties and meetings
- Welcome messages for new users

### 📊 Analytics & Reporting
- User activity tracking
- System performance monitoring
- PDF report generation
- Data export capabilities

### 🔧 System Administration
- Configurable kitchen rules
- System settings management
- Backup and restore functionality
- Advanced user search and filtering

## Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **State Management**: Redux Toolkit
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **PDF Generation**: jsPDF
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (optional for demo mode)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ywam-dar-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure Supabase (optional):
   - Create a new Supabase project
   - Copy your project URL and anon key to `.env`
   - Run the migration files in `supabase/migrations/`

5. Start the development server:
```bash
npm run dev
```

## Demo Mode

The application includes a demo mode with realistic test data that works without Supabase configuration. Simply start the development server and you can explore all features with pre-populated data.

### Demo Users
- **Admin**: yefta@ywamdar.org / sutanto
- **Chef**: john@ywamdar.org / mbasha  
- **Staff**: grace@ywamdar.org / makoko
- **DTS**: david / malinga

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components organized by role
├── services/           # API and business logic
├── store/              # Redux store and slices
├── types/              # TypeScript type definitions
├── utils/              # Helper functions and utilities
└── lib/                # Third-party library configurations
```

## Key Features Implementation

### Kitchen Rules Engine
- Configurable role exclusions
- Day-specific restrictions
- Meal-type limitations
- Automatic user assignment algorithm

### Schedule Publication System
- Schedules become read-only after Friday 17:45
- Automatic publication triggers
- Admin override capabilities

### SMS Integration
- Multi-provider support (Beem Africa, Africa's Talking)
- Template-based messaging
- Automated reminders
- Delivery tracking

### Role-Based Access Control
- Granular permissions per feature
- Dashboard routing based on user roles
- Protected routes and components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the YWAM DAR technical team.