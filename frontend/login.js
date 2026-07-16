// Track failed attempts client-side for UI feedback
        let failedAttempts = parseInt(localStorage.getItem('privguard_failed_attempts') || '0');

        // Check if already logged in and redirect
        const activeUser = localStorage.getItem('privguard_user');
        if (activeUser) {
            try {
                const user = JSON.parse(activeUser);
                if (user.role === 'admin') {
                    window.location.href = '/static/index.html';
                } else {
                    window.location.href = '/static/user.html';
                }
            } catch (e) {
                localStorage.removeItem('privguard_user');
            }
        }

        // Show warning if previous failed attempts exist
        if (failedAttempts >= 2) {
            document.getElementById('flaggedWarning').style.display = 'block';
        }

        async function handleLogin(e) {
            e.preventDefault();
            const usernameInput = document.getElementById('username');
            const passwordInput = document.getElementById('password');
            const errorDiv = document.getElementById('loginError');
            const btn = document.getElementById('btnLogin');

            errorDiv.style.display = 'none';
            btn.disabled = true;
            btn.textContent = 'Authenticating...';

            try {
                const formData = new URLSearchParams();
                formData.append('username', usernameInput.value);
                formData.append('password', passwordInput.value);

                const response = await fetch('/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: formData.toString()
                });

                const data = await response.json();

                if (!response.ok) {
                    // Track failed attempt
                    failedAttempts++;
                    localStorage.setItem('privguard_failed_attempts', failedAttempts.toString());

                    if (failedAttempts >= 2) {
                        document.getElementById('flaggedWarning').style.display = 'block';
                    }

                    throw new Error(data.detail || 'Login failed');
                }

                // Success — clear failed attempt counter
                localStorage.setItem('privguard_failed_attempts', '0');

                // Store session info
                localStorage.setItem('privguard_user', JSON.stringify(data));

                // Redirect based on role
                if (data.role === 'admin') {
                    window.location.href = '/static/index.html';
                } else {
                    window.location.href = '/static/user.html';
                }

            } catch (err) {
                errorDiv.textContent = `⛔ ${err.message}` + (failedAttempts >= 2 ? ' — Your account may be flagged as DANGEROUS.' : '');
                errorDiv.style.display = 'block';
                // Trigger shake animation
                errorDiv.style.animation = 'none';
                errorDiv.offsetHeight; /* trigger reflow */
                errorDiv.style.animation = null; 
            } finally {
                btn.disabled = false;
                btn.textContent = 'Sign In';
            }
        }