// Auth check before page loads
        const activeUserData = localStorage.getItem('privguard_user');
        if (!activeUserData) {
            window.location.href = '/';
        } else {
            const user = JSON.parse(activeUserData);
            if (user.role !== 'admin') {
                window.location.href = '/static/user.html';
            }
        }