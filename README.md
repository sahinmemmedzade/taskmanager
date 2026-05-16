
```markdown
# TaskMaster - Full-Stack Task Management System

A robust, full-stack Task Management application built with **Next.js** and **Node.js**. This application allows users to manage their daily tasks efficiently with secure authentication and real-time data handling.

## 🚀 Features

### User Authentication
- **Secure Signup & Login**: Users can create accounts and log in securely.
- **JWT Authentication**: Secure session management using JSON Web Tokens.
- **Password Hashing**: User passwords are encrypted using `bcrypt` before being stored in the database.

### Task Management
- **Personalized Dashboard**: Users can only see and manage their own tasks.
- **Full CRUD Operations**: Users can **Create, Read, Update, and Delete** tasks.
- **Status Management**: Toggle task status between `Pending` and `Completed`.
- **Priority Levels**: Set importance for each task.

### Advanced Filtering & Search
- **Search System**: Find specific tasks using a real-time search bar.
- **Filtering**: Filter tasks by `Status` (Pending/Completed) and `Priority`.

### Technical Features
- **RESTful API**: Communication between frontend and backend via Next.js API routes.
- **Database**: Data persistence using **MongoDB**.
- **Validation**: Robust server-side validation and error handling.
- **Health Check**: Dedicated `/api/health` endpoint to monitor system status.
- **App Versioning**: Current application version visible within the UI.
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop views.

## 🛠️ Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: MongoDB (Mongoose)
- **Security**: JWT (JSON Web Tokens), Bcrypt.js
- **State Management**: React Hooks (useState, useEffect)

## ⚙️ Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/your-username/taskmaster.git](https://github.com/your-username/taskmaster.git)
   cd taskmaster

```

2. **Install dependencies:**
```bash
npm install

```


3. **Set up Environment Variables:**
Create a `.env.local` file in the root directory and add:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key

```


4. **Run the development server:**
```bash
npm run dev

```


Open [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000) to see the result.

## 📡 API Endpoints

* `POST /api/auth/signup` - Register a new user
* `POST /api/auth/login` - User login
* `GET /api/tasks` - Fetch user-specific tasks
* `POST /api/tasks` - Create a new task
* `PUT /api/tasks/[id]` - Update an existing task
* `DELETE /api/tasks/[id]` - Delete a task
* `GET /api/health` - Check API status

## 📝 License

This project is licensed under the MIT License.

