# SweetTooth – Full Stack MERN Dessert Shop

SweetTooth is a full-stack MERN (MongoDB, Express, React, Node.js) application that allows users to explore, search, and purchase sweets, while administrators can securely manage inventory.  
The project demonstrates real-world full-stack development practices such as authentication, authorization, protected APIs, role-based access, and a modern, interactive UI.

---

## Live Demo

Frontend & Backend deployed on Vercel  
https://sweet-site.vercel.app/

---

## Features

### User Features
- User registration and login with JWT authentication
- Browse all available sweets
- Search sweets by name or description
- Filter sweets by category
- Purchase sweets (real-time stock update)
- Sold-out product handling with UI indicators
- Guided product tour using React Joyride

###  Admin Features
- Role-based access control (User / Admin)
- Add new sweets
- Edit existing sweets
- Delete sweets
- Restock inventory
- Admin-only protected routes and UI controls

###  UI / UX Features
- Modern, responsive UI using React and Tailwind CSS
- Toast notifications for success and error states
- Modal-based authentication and admin forms
- Loading indicators and empty-state handling
- Interactive guided tour for first-time users

---

## 🛠 Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Lucide Icons
- React Joyride

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcrypt.js

### Deployment
- Render (Frontend & Backend)
- MongoDB Atlas (Database)

---

## Project Structure

SweetTooth/
├── frontend/
│ ├── src/
│ │ └── App.jsx
│ └── package.json
│
├── backend/
│ ├── server.js
│ ├── models/
│ ├── middleware/
│ └── routes/
│
└── README.md

---
<img width="1903" height="909" alt="image" src="https://github.com/user-attachments/assets/eb200426-5ba4-4447-b2c6-9734b6ec1b43" />

## Local Setup Instructions

### Clone the Repository
```bash
git clone https://github.com/Jaspreet-2209/Sweet-site.git
cd sweettooth
cd backend
npm install

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
npm start
http://localhost:5000

cd frontend
npm install
npm start

http://localhost:3000
---
My AI Usage
AI Tools Used

ChatGPT (OpenAI)

How I Used AI

> I used ChatGPT as a development support tool throughout this project. Specifically:

> To debug and fix authentication issues where user login and registration were not working correctly.

> To identify mismatches between frontend and backend API requests, including request payloads, endpoint paths, and response handling.

> To help structure and validate Express.js API routes, including secure admin-only endpoints using JWT authentication and role-based authorization.

> To get guidance on error handling, validation, and best practices for Node.js, Express, and MongoDB integration.

> To assist in writing clear and professional Git commit messages, including proper attribution when AI assistance was used.

Impact on My Workflow

Using AI significantly improved my development efficiency and problem-solving process.
It helped me quickly identify bugs, understand root causes, and apply correct fixes without unnecessary trial and error.

Rather than replacing my work, AI acted as a pair-programming assistant, allowing me to focus more on application logic, integration, and learning best practices.
This resulted in cleaner code, faster debugging, and improved overall code quality.
