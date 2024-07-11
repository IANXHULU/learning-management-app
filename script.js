document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const logoutButton = document.getElementById('logout-button');

    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    if (window.location.pathname === '/course-content') {
        fetchCourseContent();
    } else if (window.location.pathname === '/leaderboard') {
        fetchLeaderboardData();
    } else if (window.location.pathname === '/dashboard') {
        fetchDashboardData();
    }
});

async function handleRegister(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            alert('Registration successful');
        } else {
            alert('Registration failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            window.location.href = '/dashboard';
        } else {
            const errorData = await response.json();
            alert(errorData.message || 'Login failed');
        }
    } catch (error) {
        console.error('Error during login:', error);
    }
}

async function handleLogout(e) {
    e.preventDefault();

    try {
        const response = await fetch('/logout', { method: 'POST' });

        if (response.ok) {
            window.location.href = '/';
        } else {
            alert('Logout failed');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchDashboardData() {
    try {
        const response = await fetch('/dashboard-data');
        if (!response.ok) throw new Error('Failed to fetch dashboard data');

        const data = await response.json();
        displayFullName(data.fullName);
        displayCourses(data.courses);
    } catch (error) {
        console.error('Error:', error);
    }
}

async function fetchCourseContent() {
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    try {
        const response = await fetch(`/course/${courseId}`);
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        displayCourseContent(data);
    } catch (error) {
        console.error('Error fetching course content:', error);
    }
}

async function fetchLeaderboardData() {
    try {
        const response = await fetch('/leaderboard');
        if (!response.ok) throw new Error('Network response was not ok');

        const data = await response.json();
        displayLeaderboardData(data);
    } catch (error) {
        console.error('Error fetching leaderboard data:', error);
    }
}

function displayFullName(fullName) {
    const fullNameElement = document.getElementById('user-fullname');
    fullNameElement.textContent = fullName;
}

function displayCourses(courses) {
    const coursesListElement = document.getElementById('courses-list');
    coursesListElement.innerHTML = '';

    courses.forEach(course => {
        const listItem = document.createElement('li');
        listItem.textContent = course.name;
        coursesListElement.appendChild(listItem);
    });
}

function displayCourseContent(courseContent) {
    const courseNameElement = document.getElementById('course-name');
    const courseContentElement = document.getElementById('course-content');

    courseNameElement.textContent = courseContent.name;
    courseContentElement.innerHTML = '';

    courseContent.modules.forEach(module => {
        const moduleSection = document.createElement('section');
        moduleSection.innerHTML = `
            <h2>${module.title}</h2>
            <p>${module.description}</p>
        `;
        courseContentElement.appendChild(moduleSection);
    });
}

function displayLeaderboardData(leaderboardData) {
    const leaderboardElement = document.getElementById('leaderboard');
    leaderboardElement.innerHTML = '';

    const table = document.createElement('table');
    table.innerHTML = `
        <tr>
            <th>Rank</th>
            <th>Name</th>
            <th>Score</th>
        </tr>
    `;

    leaderboardData.forEach((entry, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${entry.name}</td>
            <td>${entry.score}</td>
        `;
        table.appendChild(row);
    });

    leaderboardElement.appendChild(table);
}
