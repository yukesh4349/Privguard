// Redirect to login if session doesn't exist
        const activeUserData = localStorage.getItem('privguard_user');
        if (!activeUserData) {
            window.location.href = '/';
        }

        const user = JSON.parse(activeUserData);

        // Map credentials user profile to frontend UI
        document.getElementById('profileName').textContent = user.name;
        document.getElementById('profileDept').textContent = user.department;
        document.getElementById('avatarLetter').textContent = user.name[0];
        document.getElementById('badgeRole').textContent = user.role === 'admin' ? 'Security Admin' : 'Standard User';
        
        // Define JIT/MFA storage for action flow
        let currentActionName = '';
        let currentActionBody = null;

        // Custom action templates mapping
        const ActionTemplates = {
            'read_wiki': {
                event_type: 'file_access',
                target_system: 'confluence-wiki',
                target_object: 'engineering_documentation_wiki',
                bytes_transferred: 450,
                command_text: null,
                result_status: 'success'
            },
            'jira_query': {
                event_type: 'query',
                target_system: 'jira-prod',
                target_object: 'project_tasks_backlog',
                bytes_transferred: 820,
                command_text: 'SELECT * FROM tickets WHERE assignee = CURRENT_USER',
                result_status: 'success'
            },
            'financial_ledger': {
                event_type: 'query',
                target_system: 'financial-ledger',
                target_object: 'quarterly_financial_report',
                bytes_transferred: 3200,
                command_text: 'SELECT revenue, expenses FROM ledger_records WHERE year=2026',
                result_status: 'success'
            },
            'customer_export_medium': {
                event_type: 'export',
                target_system: 'pii-data-warehouse',
                target_object: 'customer_emails_table',
                bytes_transferred: 12500,
                command_text: 'SELECT email, name FROM customer_table',
                result_status: 'success'
            },
            'secrets_vault': {
                event_type: 'file_access',
                target_system: 'secrets-vault',
                target_object: 'db_encryption_keys.pem',
                bytes_transferred: 1024,
                command_text: 'GET /vault/keys/db_encryption_keys',
                result_status: 'success'
            },
            'privilege_escalation': {
                event_type: 'privilege_grant',
                target_system: 'tier0-dc-master',
                target_object: 'admin_credentials',
                bytes_transferred: 128,
                command_text: 'net user administrator /active:yes',
                result_status: 'success'
            },
            'cc_exfil': {
                event_type: 'export',
                target_system: 'secrets-vault',
                target_object: 'credit_card_vault',
                bytes_transferred: 520000,
                command_text: 'SELECT credit_card_num, cvv, cardholder FROM vault_table',
                result_status: 'success'
            },
            'shell_shadow': {
                event_type: 'command',
                target_system: 'tier0-dc-master',
                target_object: 'shadow_config',
                bytes_transferred: 4096,
                command_text: 'chmod 777 /etc/shadow',
                result_status: 'success'
            }
        };

        // UI Console utility
        function writeToConsole(message, type = '') {
            const body = document.getElementById('consoleBody');
            const line = document.createElement('div');
            line.className = 'console-line';
            if (type) line.classList.add(`console-${type}`);
            
            const now = new Date();
            const timeStr = now.toTimeString().split(' ')[0];
            
            line.innerHTML = `<span class="console-input-indicator">[${timeStr}] $</span>${message}`;
            body.appendChild(line);
            body.scrollTop = body.scrollHeight;
        }

        // Trigger request to backend
        async function triggerAction(actionName) {
            currentActionName = actionName;
            const template = ActionTemplates[actionName];
            
            // Build base event model payload
            const eventPayload = {
                event_id: uuidv4(),
                session_id: user.token,
                username: user.username,
                timestamp: new Date().toISOString(),
                event_type: template.event_type,
                target_system: template.target_system,
                target_object: template.target_object,
                bytes_transferred: template.bytes_transferred,
                command_text: template.command_text,
                result_status: template.result_status
            };

            currentActionBody = eventPayload;
            writeToConsole(`Initiating operation: ${actionName.toUpperCase()} ...`, 'info');
            
            // Submit to ingest pipeline
            await submitIngest(eventPayload);
        }

        async function submitIngest(payload) {
            try {
                const userObj = JSON.parse(localStorage.getItem('privguard_user'));
                const token = userObj ? userObj.access_token : '';
                const response = await fetch('/api/v1/events/ingest', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.detail || 'Access validation failed');
                }

                writeToConsole(`Security evaluation complete. Risk score: ${data.composite_risk_score.toFixed(1)}/100`, 'info');

                // Evaluate action routing returned by the engine
                if (data.action_required === 'allow') {
                    writeToConsole(`ACCESS GRANTED: Policy authorization complete.`, 'success');
                } 
                else if (data.action_required === 'step-up-mfa') {
                    writeToConsole(`CHALLENGE: Step-up MFA verification required!`, 'warning');
                    openModal('mfaOverlay');
                } 
                else if (data.action_required === 'jit-approval-required') {
                    writeToConsole(`APPROVAL REQUIRED: Just-In-Time (JIT) justification needed.`, 'warning');
                    openModal('jitOverlay');
                } 
                else if (data.action_required === 'auto-block-session') {
                    writeToConsole(`ALERT: Security exception threshold exceeded!`, 'alert');
                    triggerLockScreen();
                }

            } catch (err) {
                writeToConsole(`ERR: ${err.message}`, 'alert');
            }
        }

        // MFA submission handler
        function submitMfa() {
            const codeInput = document.getElementById('mfaCode');
            if (codeInput.value.length < 6) {
                alert('Please enter a valid 6-digit verification code.');
                return;
            }
            // Only accept '123456' as the valid MFA code
            if (codeInput.value !== '123456') {
                writeToConsole('MFA VERIFICATION FAILED: Invalid code entered.', 'alert');
                closeModalSilent('mfaOverlay');
                codeInput.value = '';
                // This counts as anomalous behavior — re-submit with failure
                if (currentActionBody) {
                    currentActionBody.result_status = 'mfa_failed';
                    submitIngest(currentActionBody);
                }
                return;
            }
            closeModalSilent('mfaOverlay');
            writeToConsole('MFA Validation Successful. Re-authorizing token...', 'info');
            writeToConsole('ACCESS GRANTED: Operation completed successfully.', 'success');
            codeInput.value = '';
        }

        // JIT justification submission
        function submitJit() {
            const justText = document.getElementById('jitJustification');
            if (justText.value.trim().length === 0) {
                alert('Please provide a business justification reason.');
                return;
            }
            closeModal('jitOverlay');
            writeToConsole(`JIT Escalation justification submitted: "${justText.value}"`, 'info');
            writeToConsole(`JIT Escalation Approved. Token authorized for 15 minutes.`, 'success');
            justText.value = '';
        }

        // Emergency screen lock
        function triggerLockScreen() {
            const overlay = document.getElementById('lockOverlay');
            overlay.classList.add('active');
            // Log out user in background
            localStorage.removeItem('privguard_user');
        }

        function logoutLock() {
            window.location.href = '/';
        }

        // Modal Utility
        function openModal(id) {
            document.getElementById(id).classList.add('active');
        }

        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
            writeToConsole('Operation cancelled by user.', 'warning');
        }

        function closeModalSilent(id) {
            document.getElementById(id).classList.remove('active');
        }

        // Logout
        function handleLogout() {
            localStorage.removeItem('privguard_user');
            window.location.href = '/';
        }

        // Helper function to generate UUID v4
        function uuidv4() {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        }