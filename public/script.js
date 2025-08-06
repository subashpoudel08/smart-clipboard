// Smart Clipboard - Enhanced JavaScript

// Global variables
let currentClipboard = null;
let originalContent = '';
let currentSaveType = null;

// DOM elements
const contentEditor = document.getElementById('contentEditor');
const accessForm = document.getElementById('accessForm');
const clipboardDisplay = document.getElementById('clipboardDisplay');
const loadingSpinner = document.getElementById('loadingSpinner');
const messageArea = document.getElementById('messageArea');
const saveOptionsModal = new bootstrap.Modal(document.getElementById('saveOptionsModal'));

// API base URL
const API_BASE = window.location.origin + '/api/clipboard';

// Utility functions
function showLoading() {
    loadingSpinner.style.display = 'flex';
}

function hideLoading() {
    loadingSpinner.style.display = 'none';
}

function showMessage(message, type = 'info') {
    const iconMap = {
        'success': 'fas fa-check-circle',
        'danger': 'fas fa-exclamation-circle',
        'warning': 'fas fa-exclamation-triangle',
        'info': 'fas fa-info-circle'
    };
    
    const icon = iconMap[type] || iconMap.info;
    
    messageArea.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            <i class="${icon}"></i>
            <span class="alert-message">${message}</span>
            <button type="button" class="btn-close" data-bs-dismiss="alert">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        const alert = messageArea.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

function clearMessage() {
    messageArea.innerHTML = '';
}

function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    const text = element.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        showMessage('Code copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Code copied to clipboard!', 'success');
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

function formatExpiryTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = date - now;
    
    if (diff <= 0) {
        return 'Expired';
    }
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m remaining`;
    } else {
        return `${minutes}m remaining`;
    }
}

function validateCode(code) {
    // Check if it's a share code (4 digits + 1 special char)
    const shareCodePattern = /^\d{4}[!@#$%^&*?]$/;
    // Check if it's a view code (5 digits)
    const viewCodePattern = /^\d{5}$/;
    
    if (shareCodePattern.test(code)) {
        return 'share';
    } else if (viewCodePattern.test(code)) {
        return 'view';
    }
    return false;
}

// Save options handlers
document.getElementById('saveAndShareEdit').addEventListener('click', (e) => {
    e.preventDefault();
    currentSaveType = 'edit';
    showSaveOptionsModal();
});

document.getElementById('shareOnly').addEventListener('click', (e) => {
    e.preventDefault();
    currentSaveType = 'view';
    showSaveOptionsModal();
});

document.getElementById('saveOnly').addEventListener('click', (e) => {
    e.preventDefault();
    currentSaveType = 'private';
    showSaveOptionsModal();
});

function showSaveOptionsModal() {
    const content = contentEditor.value.trim();
    if (!content) {
        showMessage('Please enter some content first', 'danger');
        return;
    }
    
    // Set default expiry based on save type
    const expiryInput = document.getElementById('expiryHours');
    if (currentSaveType === 'edit') {
        expiryInput.value = '0.5'; // 30 minutes default
    } else {
        expiryInput.value = '0'; // No expiry for view/private
    }
    
    saveOptionsModal.show();
}

// Confirm save button
document.getElementById('confirmSaveBtn').addEventListener('click', async () => {
    const content = contentEditor.value.trim();
    const expiryHours = parseFloat(document.getElementById('expiryHours').value) || 0;
    
    if (!content) {
        showMessage('Please enter some content', 'danger');
        return;
    }
    
    showLoading();
    clearMessage();
    saveOptionsModal.hide();
    
    try {
        const response = await fetch(`${API_BASE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content, 
                accessType: currentSaveType,
                expiryHours: expiryHours > 0 ? expiryHours : null
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            let message = 'Clipboard saved successfully!';
            
            if (data.shareCode) {
                message += ` Share code: ${data.shareCode}`;
            }
            if (data.viewCode) {
                message += ` View code: ${data.viewCode}`;
            }
            
            showMessage(message, 'success');
            
            // Display the created clipboard
            displayClipboard({
                id: data.id,
                content: content,
                shareCode: data.shareCode,
                viewCode: data.viewCode,
                accessType: data.accessType,
                expiryAt: data.expiryAt,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isEditable: data.accessType === 'edit'
            });
            
            // Clear editor for new content
            contentEditor.value = '';
        } else {
            let errorMessage = data.error || 'Failed to save clipboard';
            if (errorMessage.includes('Database error')) {
                errorMessage = 'Server error. Please try again.';
            }
            showMessage(errorMessage, 'danger');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'danger');
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
});

// Access existing clipboard
accessForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const code = document.getElementById('accessCode').value.trim();
    
    if (!code) {
        showMessage('Please enter a code', 'danger');
        return;
    }
    
    const codeType = validateCode(code);
    if (!codeType) {
        showMessage('Invalid code format. Use 4 digits + 1 special character for share code or 5 digits for view code.', 'danger');
        return;
    }
    
    showLoading();
    clearMessage();
    
    try {
        const endpoint = codeType === 'share' ? 'share' : 'view';
        const response = await fetch(`${API_BASE}/${endpoint}/${code}`);
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Clipboard accessed successfully!', 'success');
            displayClipboard(data);
        } else {
            showMessage(data.error || 'Clipboard not found', 'danger');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'danger');
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
});

// Display clipboard content
function displayClipboard(clipboard) {
    currentClipboard = clipboard;
    originalContent = clipboard.content;
    
    // Update display elements
    document.getElementById('displayContent').value = clipboard.content;
    document.getElementById('createdAt').textContent = formatDate(clipboard.createdAt);
    document.getElementById('updatedAt').textContent = formatDate(clipboard.updatedAt);
    
    // Show last edit time if available
    if (clipboard.lastEditAt) {
        document.getElementById('lastEditAt').textContent = formatDate(clipboard.lastEditAt);
        document.getElementById('lastEditAt').parentElement.style.display = 'block';
    } else {
        document.getElementById('lastEditAt').parentElement.style.display = 'none';
    }
    
    // Update title and controls based on access type
    const title = document.getElementById('clipboardTitle');
    const deleteBtn = document.getElementById('deleteClipboardBtn');
    const displayContent = document.getElementById('displayContent');
    const codeSection = document.getElementById('codeSection');
    const expiryInfo = document.getElementById('expiryInfo');
    
    if (clipboard.isEditable) {
        title.innerHTML = '<i class="fas fa-edit"></i> Clipboard Content (Edit Mode)';
        deleteBtn.style.display = 'inline-block';
        displayContent.readOnly = false;
        displayContent.style.backgroundColor = 'var(--bg-secondary)';
        
        // Show edit controls for edit mode
        document.getElementById('editControls').style.display = 'flex';
        
        // Show share code for edit mode
        if (clipboard.shareCode) {
            document.getElementById('accessCodeDisplay').textContent = clipboard.shareCode;
            codeSection.style.display = 'block';
        }
    } else {
        title.innerHTML = '<i class="fas fa-eye"></i> Clipboard Content (View Mode)';
        deleteBtn.style.display = 'none';
        displayContent.readOnly = true;
        displayContent.style.backgroundColor = 'var(--bg-tertiary)';
        
        // Hide edit controls for view mode
        document.getElementById('editControls').style.display = 'none';
        
        // Show view code for view mode
        if (clipboard.viewCode) {
            document.getElementById('accessCodeDisplay').textContent = clipboard.viewCode;
            codeSection.style.display = 'block';
        }
    }
    
    // Show expiry info if available
    if (clipboard.expiryAt) {
        document.getElementById('expiryTime').textContent = formatExpiryTime(clipboard.expiryAt);
        expiryInfo.style.display = 'block';
        
        // Update expiry countdown
        updateExpiryCountdown(clipboard.expiryAt);
    } else {
        expiryInfo.style.display = 'none';
    }
    
    // Show the display area
    clipboardDisplay.style.display = 'block';
    
    // Scroll to display area
    clipboardDisplay.scrollIntoView({ behavior: 'smooth' });
    
    // Add editing indicator for edit mode
    if (clipboard.isEditable) {
        const title = document.getElementById('clipboardTitle');
        title.innerHTML += ' <span class="badge bg-warning text-dark"><i class="fas fa-edit"></i> Editing Enabled</span>';
    }
}

// Update expiry countdown
function updateExpiryCountdown(expiryAt) {
    const updateCountdown = () => {
        const timeLeft = formatExpiryTime(expiryAt);
        document.getElementById('expiryTime').textContent = timeLeft;
        
        if (timeLeft === 'Expired') {
            showMessage('This clipboard has expired', 'warning');
            return;
        }
        
        setTimeout(updateCountdown, 60000); // Update every minute
    };
    
    updateCountdown();
}

// Copy content button
document.getElementById('copyContentBtn').addEventListener('click', () => {
    const content = document.getElementById('displayContent').value;
    
    navigator.clipboard.writeText(content).then(() => {
        showMessage('Content copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Content copied to clipboard!', 'success');
    });
});

// Copy editor content button
document.getElementById('copyBtn').addEventListener('click', () => {
    const content = contentEditor.value;
    
    navigator.clipboard.writeText(content).then(() => {
        showMessage('Content copied to clipboard!', 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showMessage('Content copied to clipboard!', 'success');
    });
});

// Clear editor button
document.getElementById('clearBtn').addEventListener('click', () => {
    if (contentEditor.value.trim()) {
        if (confirm('Are you sure you want to clear the editor?')) {
            contentEditor.value = '';
            showMessage('Editor cleared', 'info');
        }
    }
});

// Delete clipboard button
document.getElementById('deleteClipboardBtn').addEventListener('click', async () => {
    if (!currentClipboard || !currentClipboard.isEditable) {
        return;
    }
    
    if (!confirm('Are you sure you want to delete this clipboard? This action cannot be undone.')) {
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/${currentClipboard.id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ shareCode: currentClipboard.shareCode })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Clipboard deleted successfully!', 'success');
            clipboardDisplay.style.display = 'none';
            currentClipboard = null;
        } else {
            showMessage(data.error || 'Failed to delete clipboard', 'danger');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'danger');
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
});

// Save changes button
document.getElementById('saveChangesBtn').addEventListener('click', async () => {
    if (!currentClipboard || !currentClipboard.isEditable) {
        return;
    }
    
    const newContent = document.getElementById('displayContent').value.trim();
    
    if (!newContent) {
        showMessage('Content cannot be empty', 'danger');
        return;
    }
    
    if (newContent === originalContent) {
        showMessage('No changes to save', 'info');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch(`${API_BASE}/${currentClipboard.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                content: newContent, 
                shareCode: currentClipboard.shareCode 
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('Changes saved successfully! Your updates are now visible to others.', 'success');
            currentClipboard.content = newContent;
            currentClipboard.updatedAt = new Date().toISOString();
            originalContent = newContent;
            document.getElementById('updatedAt').textContent = formatDate(currentClipboard.updatedAt);
            
            // Update the display content to reflect the saved changes
            document.getElementById('displayContent').value = newContent;
        } else {
            showMessage(data.error || 'Failed to save changes', 'danger');
        }
    } catch (error) {
        showMessage('Network error. Please try again.', 'danger');
        console.error('Error:', error);
    } finally {
        hideLoading();
    }
});

// Cancel changes button
document.getElementById('cancelChangesBtn').addEventListener('click', () => {
    if (currentClipboard) {
        document.getElementById('displayContent').value = originalContent;
        showMessage('Changes cancelled', 'info');
    }
});

// Manual save only - no auto-save functionality

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+S to save (when in edit mode)
    if (e.ctrlKey && e.key === 's' && currentClipboard && currentClipboard.isEditable) {
        e.preventDefault();
        document.getElementById('saveChangesBtn').click();
    }
    
    // Ctrl+C to copy (when content is selected)
    if (e.ctrlKey && e.key === 'c' && document.getElementById('displayContent').selectionStart !== document.getElementById('displayContent').selectionEnd) {
        // Let the default copy behavior work
        return;
    }
    
    // Ctrl+C to copy all content (when no selection)
    if (e.ctrlKey && e.key === 'c' && document.getElementById('displayContent').selectionStart === document.getElementById('displayContent').selectionEnd) {
        e.preventDefault();
        document.getElementById('copyContentBtn').click();
    }
});

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Check if there's a code in the URL (for direct sharing)
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (code) {
        document.getElementById('accessCode').value = code;
        document.getElementById('accessForm').dispatchEvent(new Event('submit'));
    }
    
    // Focus on content editor for better UX
    contentEditor.focus();
}); 