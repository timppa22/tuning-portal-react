# Tuning Portal

A modern web application for ECU tuning file management, built with Next.js and React.

## 🚀 Features

- **User Authentication**: Secure login, registration, and email verification system
- **Dashboard**: User-friendly interface to manage tuning files and credits
- **ECU File Upload**: Upload vehicle ECU files for tuning with detailed vehicle information
- **Tuning Options**: Select from various tuning options with different credit costs
- **Credit System**: Purchase and manage credits for tuning services
- **Real-time Chat**: Communicate with support staff and administrators
- **Notifications**: Get updates on file status changes and system announcements
- **Admin Panel**: Manage users, process tuning files, and monitor system activity
- **Opening Hours**: Display business hours with real-time status indicators
- **Responsive Design**: Optimized for both desktop and mobile devices

## 💻 Technology Stack

- **Frontend**: React 19, Next.js 15, Tailwind CSS 4
- **Backend**: Next.js API Routes
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Email**: Nodemailer for verification and notifications
- **Payment Processing**: Stripe integration
- **UI Components**: Headless UI, Heroicons, Framer Motion
- **File Handling**: Multer for file uploads

## 📋 Prerequisites

- Node.js 18.x or higher
- MySQL 8.x
- npm or yarn
- Visual Studio Code (recommended)

## 🤝 Contributing

Want to contribute or set up a fork in Visual Studio Code? Check out our [Contributing Guide](CONTRIBUTING.md) for detailed instructions in both Finnish and English.

## 🛠️ Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/tuning-portal-react.git
cd tuning-portal-react
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

3. Set up environment variables

Create a `.env.local` file in the root directory with the following variables:

```
# Database
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=tuning_portal

# Authentication
JWT_SECRET=your_jwt_secret

# Email
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your_email@example.com
EMAIL_PASSWORD=your_email_password

# Stripe
STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

4. Set up the database

Run the SQL scripts to create the database schema:

```bash
mysql -u your_db_user -p < database_schema.sql
mysql -u your_db_user -p < database_schema_chat.sql
mysql -u your_db_user -p < database_schema_email_verification.sql
mysql -u your_db_user -p < database_schema_notifications.sql
```

5. Start the development server

```bash
npm run dev
# or
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## 🚀 Deployment

The application can be deployed to Vercel or any other hosting platform that supports Next.js:

```bash
npm run build
npm run start
```

## 📁 Project Structure

- `/src/app`: Next.js application routes and API endpoints
- `/src/components`: Reusable React components
- `/src/lib`: Utility functions and services
- `/public`: Static assets
- `/uploads`: Storage for uploaded ECU files

## 🔒 Security Features

- Password hashing with AES256
- JWT-based authentication
- Email verification
- CSRF protection
- Input validation and sanitization

## 🧩 Key Components

- **ECU Upload Form**: Interface for uploading vehicle ECU files
- **Chat System**: Real-time communication with support staff
- **Notification System**: Real-time alerts for users
- **Credit Management**: Purchase and track tuning credits
- **Admin Dashboard**: Manage users and process tuning files

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- Nagy Kristóf, Makkai Balázs Bence, Balázs Benjámin

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Tailwind CSS for the utility-first CSS framework
- All open-source libraries used in this project
