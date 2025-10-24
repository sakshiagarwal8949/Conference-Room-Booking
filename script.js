document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const calendarDaysGrid = document.getElementById('calendar-days');
    const currentMonthYear = document.getElementById('current-month-year');
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    const bookingModal = document.getElementById('booking-modal');
    const loginModal = document.getElementById('login-modal');
    const closeBookingBtn = document.getElementById('close-booking-modal');
    const closeLoginBtn = document.getElementById('close-login-modal');
    const bookingForm = document.getElementById('booking-form');
    const loginForm = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const userStatus = document.getElementById('user-status');
    const roomSelect = document.getElementById('room-select');
    const roomSlotsContainer = document.getElementById('room-slots-container');
    const bookingsTableBody = document.querySelector('#bookings-table tbody');

    // --- State Variables ---
    let currentDate = new Date();
    let loggedInUser = null;
    let selectedDate = null;
    let selectedTimeSlot = null;
    const timeSlots = [
        '9:00 AM - 10:00 AM',
        '10:15 AM - 11:15 AM',
        '11:30 AM - 12:30 PM',
        '1:30 PM - 2:30 PM',
        '2:45 PM - 3:45 PM',
        '4:00 PM - 5:00 PM',
        '5:15 PM - 6:15 PM',
        '6:30 PM - 7:30 PM',
        '7:45 PM - 8:45 PM'
    ];

    // --- LocalStorage Authentication ---
    const loadAuthState = () => {
        const storedUser = localStorage.getItem('workspaceUser');
        if (storedUser) {
            loggedInUser = JSON.parse(storedUser);
        }
    };

    const saveAuthState = () => {
        if (loggedInUser) {
            localStorage.setItem('workspaceUser', JSON.stringify(loggedInUser));
        } else {
            localStorage.removeItem('workspaceUser');
        }
    };

    const updateAuthUI = () => {
        if (loggedInUser) {
            userStatus.textContent = `Logged in as: ${loggedInUser.username} (${loggedInUser.role})`;
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';
        } else {
            userStatus.textContent = 'You are not logged in.';
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
        }
    };

    // --- Login Handler ---
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value.toLowerCase();
        const password = document.getElementById('password').value;

        if (username === 'member' && password === 'memberpass') {
            loggedInUser = { username: 'Member User', role: 'Member' };
        } else if (username === 'admin' && password === 'adminpass') {
            loggedInUser = { username: 'Admin User', role: 'Admin' };
        } else {
            alert('Invalid username or password.');
            return;
        }

        saveAuthState();
        updateAuthUI();
        alert(`Logged in successfully as ${loggedInUser.role}.`);
        loginModal.style.display = 'none';
        renderBookingsTable();
    });

    // --- Logout Handler ---
    logoutBtn.addEventListener('click', () => {
        loggedInUser = null;
        saveAuthState();
        updateAuthUI();
        renderBookingsTable();
        alert('Logged out successfully.');
    });

    loginBtn.addEventListener('click', () => loginModal.style.display = 'flex');
    closeLoginBtn.addEventListener('click', () => loginModal.style.display = 'none');

    // --- LocalStorage Bookings ---
    const getBookings = () => JSON.parse(localStorage.getItem('workspaceBookings') || '[]');
    const saveBookings = (bookings) => localStorage.setItem('workspaceBookings', JSON.stringify(bookings));

    // --- Calendar ---
    const renderCalendar = () => {
        calendarDaysGrid.innerHTML = '';
        const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const startDayIndex = firstDayOfMonth.getDay();
        currentMonthYear.textContent = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const bookings = getBookings();

        for (let i = 0; i < 42; i++) {
            const dayCell = document.createElement('div');
            dayCell.classList.add('day-cell');
            const dayNumber = i - startDayIndex + 1;
            const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), dayNumber);

            if (i >= startDayIndex && dayNumber <= lastDayOfMonth) {
                dayCell.classList.add('current-month');
                const dayNumberSpan = document.createElement('span');
                dayNumberSpan.classList.add('day-number');
                dayNumberSpan.textContent = dayNumber;
                dayCell.appendChild(dayNumberSpan);

                const cellDateString = cellDate.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').join('-');
                const bookingsForThisDate = bookings.filter(b => b.date === cellDateString);
                const bookedRooms = new Set(bookingsForThisDate.map(b => b.room));

                bookedRooms.forEach(room => {
                    const roomBookingDiv = document.createElement('div');
                    roomBookingDiv.classList.add('booking-slot', 'booked');
                    roomBookingDiv.textContent = `${room} booked`;
                    dayCell.appendChild(roomBookingDiv);
                });

                dayCell.addEventListener('click', () => {
                    if (loggedInUser) openBookingModal(cellDateString);
                    else { alert('Please log in to book a room.'); loginModal.style.display = 'flex'; }
                });
            } else dayCell.style.visibility = 'hidden';
            calendarDaysGrid.appendChild(dayCell);
        }
    };

    const openBookingModal = (date) => {
        selectedDate = date;
        document.getElementById('selected-date').value = date;
        document.getElementById('display-date').textContent = new Date(date).toLocaleDateString('en-IN');
        roomSelect.value = "";
        roomSlotsContainer.innerHTML = '';
        bookingModal.style.display = 'flex';
    };

    closeBookingBtn.addEventListener('click', () => {
        bookingModal.style.display = 'none';
        bookingForm.reset();
        selectedTimeSlot = null;
    });

    roomSelect.addEventListener('change', () => {
        const selectedRoom = roomSelect.value;
        roomSlotsContainer.innerHTML = '';
        selectedTimeSlot = null;
        if (!selectedRoom) return;

        const bookings = getBookings();
        const bookedSlots = bookings.filter(b => b.date === selectedDate && b.room === selectedRoom).map(b => b.timeSlot);

        timeSlots.forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.classList.add('room-slot-item');
            slotDiv.textContent = slot;

            if (bookedSlots.includes(slot)) slotDiv.classList.add('booked-slot');
            else slotDiv.addEventListener('click', () => {
                document.querySelectorAll('.room-slot-item').forEach(el => el.classList.remove('selected-slot'));
                slotDiv.classList.add('selected-slot');
                selectedTimeSlot = slot;
            });

            roomSlotsContainer.appendChild(slotDiv);
        });
    });

  bookingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selectedTimeSlot) { 
        alert('Please select a time slot.'); 
        return; 
    }

    // 🔹 Confirmation Box
    const isConfirmed = confirm("Are you sure you want to confirm this booking?");
    if (!isConfirmed) return; // agar cancel kare to aage ka code na chale

    const bookings = getBookings();
    const newBooking = {
        id: Date.now(),
        date: selectedDate,
        timeSlot: selectedTimeSlot,
        room: roomSelect.value,
        title: document.getElementById('meeting-title').value,
        description: document.getElementById('meeting-description').value,
        user: loggedInUser.username,
        role: loggedInUser.role
    };
    bookings.push(newBooking);
    saveBookings(bookings);
    bookingModal.style.display = 'none';
    bookingForm.reset();
    selectedTimeSlot = null;
    renderCalendar();
    renderBookingsTable();
    alert('Booking confirmed!');
});


    prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
    nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });

    // --- Admin Manage Bookings ---
    const renderBookingsTable = () => {
        bookingsTableBody.innerHTML = '';
        if (loggedInUser?.role !== 'Admin') return;
        const bookings = getBookings();
        bookings.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${new Date(b.date).toLocaleDateString('en-IN')}</td>
                <td>${b.timeSlot}</td>
                <td>${b.room}</td>
                <td>${b.title}</td>
                <td>${b.user}</td>
                <td>${b.role}</td>
                <td><button data-id="${b.id}">Delete</button></td>
            `;
            bookingsTableBody.appendChild(tr);
        });
    };

    bookingsTableBody.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const id = Number(e.target.dataset.id);
            let bookings = getBookings();
            bookings = bookings.filter(b => b.id !== id);
            saveBookings(bookings);
            renderBookingsTable();
            renderCalendar();
            alert('Booking deleted successfully!');
        }
    });

    // --- Initialize ---
    loadAuthState();
    updateAuthUI();
    renderCalendar();
    renderBookingsTable();
});

