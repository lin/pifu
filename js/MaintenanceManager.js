/**
 * Maintenance Manager
 * Handles maintenance mode functionality for the hospital shift analysis dashboard
 */
class MaintenanceManager {
    constructor() {
        this.maintenanceConfig = null;
        this.maintenanceOverlay = null;
        this.isMaintenanceMode = false;
        this.isPasswordBypass = false;
        this.init();
    }

    /**
     * Initialize the maintenance manager
     */
    async init() {
        try {
            await this.loadMaintenanceConfig();
            this.createMaintenanceOverlay();
            this.checkMaintenanceMode();
        } catch (error) {
            console.error('Failed to initialize maintenance manager:', error);
        }
    }

    /**
     * Load maintenance configuration from JSON file
     */
    async loadMaintenanceConfig() {
        try {
            const response = await fetch('maintenance.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.maintenanceConfig = await response.json();
        } catch (error) {
            console.error('Failed to load maintenance config:', error);
            // Fallback configuration
            this.maintenanceConfig = {
                enabled: false,
                message: "网站正在维护中，请稍后再试。",
                estimatedReturnTime: "预计恢复时间：待定",
                contactInfo: "如有紧急事务，请联系管理员。",
                lastUpdated: new Date().toISOString()
            };
        }
    }

    /**
     * Create the maintenance overlay element
     */
    createMaintenanceOverlay() {
        // Create overlay container
        this.maintenanceOverlay = document.createElement('div');
        this.maintenanceOverlay.id = 'maintenance-overlay';
        this.maintenanceOverlay.className = 'maintenance-overlay';
        
        // Create maintenance content
        const maintenanceContent = document.createElement('div');
        maintenanceContent.className = 'maintenance-content';
        
        // Create maintenance icon
        const icon = document.createElement('div');
        icon.className = 'maintenance-icon';
        icon.innerHTML = '<i class="fas fa-tools"></i>';
        
        // Create maintenance title
        const title = document.createElement('h1');
        title.className = 'maintenance-title';
        title.textContent = '系统维护中';
        
        // Create maintenance message
        const message = document.createElement('p');
        message.className = 'maintenance-message';
        message.textContent = this.maintenanceConfig?.message || '网站正在维护中，请稍后再试。';
        
        // Create estimated return time
        const returnTime = document.createElement('p');
        returnTime.className = 'maintenance-time';
        returnTime.textContent = this.maintenanceConfig?.estimatedReturnTime || '预计恢复时间：待定';
        
        // Create contact info
        const contactInfo = document.createElement('p');
        contactInfo.className = 'maintenance-contact';
        contactInfo.textContent = this.maintenanceConfig?.contactInfo || '如有紧急事务，请联系管理员。';
        
        // Create password bypass section
        const passwordSection = document.createElement('div');
        passwordSection.className = 'maintenance-password-section';
        
        const passwordTitle = document.createElement('h3');
        passwordTitle.className = 'maintenance-password-title';
        passwordTitle.innerHTML = '<i class="fas fa-key"></i> 管理员访问';
        
        const passwordHint = document.createElement('p');
        passwordHint.className = 'maintenance-password-hint';
        passwordHint.textContent = this.maintenanceConfig?.passwordHint || '联系管理员获取访问密码';
        
        const passwordForm = document.createElement('form');
        passwordForm.className = 'maintenance-password-form';
        passwordForm.onsubmit = (e) => {
            e.preventDefault();
            this.validatePassword();
        };
        
        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.className = 'maintenance-password-input';
        passwordInput.placeholder = '请输入访问密码';
        passwordInput.id = 'maintenance-password-input';
        
        const passwordSubmitBtn = document.createElement('button');
        passwordSubmitBtn.type = 'submit';
        passwordSubmitBtn.className = 'maintenance-password-submit';
        passwordSubmitBtn.innerHTML = '<i class="fas fa-unlock"></i> 验证密码';
        
        const passwordError = document.createElement('div');
        passwordError.className = 'maintenance-password-error';
        passwordError.id = 'maintenance-password-error';
        passwordError.style.display = 'none';
        
        passwordForm.appendChild(passwordInput);
        passwordForm.appendChild(passwordSubmitBtn);
        passwordForm.appendChild(passwordError);
        
        passwordSection.appendChild(passwordTitle);
        passwordSection.appendChild(passwordHint);
        passwordSection.appendChild(passwordForm);
        
        // Create refresh button
        const refreshButton = document.createElement('button');
        refreshButton.className = 'maintenance-refresh-btn';
        refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> 刷新页面';
        refreshButton.onclick = () => window.location.reload();
        
        // Create last updated info
        const lastUpdated = document.createElement('p');
        lastUpdated.className = 'maintenance-last-updated';
        const lastUpdatedDate = this.maintenanceConfig?.lastUpdated ? 
            new Date(this.maintenanceConfig.lastUpdated).toLocaleString('zh-CN') : 
            new Date().toLocaleString('zh-CN');
        lastUpdated.textContent = `最后更新：${lastUpdatedDate}`;
        
        // Assemble the content
        maintenanceContent.appendChild(icon);
        maintenanceContent.appendChild(title);
        maintenanceContent.appendChild(message);
        maintenanceContent.appendChild(returnTime);
        maintenanceContent.appendChild(contactInfo);
        maintenanceContent.appendChild(passwordSection);
        // maintenanceContent.appendChild(refreshButton);
        maintenanceContent.appendChild(lastUpdated);
        
        this.maintenanceOverlay.appendChild(maintenanceContent);
        
        // Add to document body
        document.body.appendChild(this.maintenanceOverlay);
    }

    /**
     * Check if maintenance mode is enabled
     */
    checkMaintenanceMode() {
        if (this.maintenanceConfig && this.maintenanceConfig.enabled && !this.isPasswordBypass) {
            this.enableMaintenanceMode();
        } else {
            this.disableMaintenanceMode();
        }
    }

    /**
     * Validate password for bypass
     */
    validatePassword() {
        const passwordInput = document.getElementById('maintenance-password-input');
        const errorDiv = document.getElementById('maintenance-password-error');
        const enteredPassword = passwordInput.value.trim();
        const correctPassword = this.maintenanceConfig?.password;

        if (!enteredPassword) {
            this.showPasswordError('请输入密码');
            return;
        }

        if (enteredPassword === correctPassword) {
            this.isPasswordBypass = true;
            this.disableMaintenanceMode();
            this.showPasswordSuccess();
        } else {
            this.showPasswordError('密码错误，请重试');
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    /**
     * Show password error message
     */
    showPasswordError(message) {
        const errorDiv = document.getElementById('maintenance-password-error');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.className = 'maintenance-password-error error';
        
        // Hide error after 3 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }

    /**
     * Show password success message
     */
    showPasswordSuccess() {
        const errorDiv = document.getElementById('maintenance-password-error');
        errorDiv.textContent = '密码验证成功，正在进入系统...';
        errorDiv.style.display = 'block';
        errorDiv.className = 'maintenance-password-error success';
        
        // Hide success message after 2 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 2000);
    }

    /**
     * Enable maintenance mode
     */
    enableMaintenanceMode() {
        if (this.maintenanceOverlay) {
            this.maintenanceOverlay.style.display = 'flex';
            this.isMaintenanceMode = true;
            
            // Hide the main content
            const container = document.querySelector('.container');
            if (container) {
                container.style.display = 'none';
            }
            
            // Hide loading indicator
            const loading = document.getElementById('loading');
            if (loading) {
                loading.style.display = 'none';
            }
        }
    }

    /**
     * Disable maintenance mode
     */
    disableMaintenanceMode() {
        if (this.maintenanceOverlay) {
            this.maintenanceOverlay.style.display = 'none';
            this.isMaintenanceMode = false;
            
            // Show the main content
            const container = document.querySelector('.container');
            if (container) {
                container.style.display = 'block';
            }
        }
    }

    /**
     * Toggle maintenance mode (for admin use)
     */
    async toggleMaintenanceMode() {
        try {
            // This would typically make an API call to update the maintenance.json file
            // For now, we'll just reload the config and check again
            await this.loadMaintenanceConfig();
            this.checkMaintenanceMode();
        } catch (error) {
            console.error('Failed to toggle maintenance mode:', error);
        }
    }

    /**
     * Get current maintenance status
     */
    getMaintenanceStatus() {
        return {
            isEnabled: this.isMaintenanceMode,
            config: this.maintenanceConfig
        };
    }
}

// Initialize maintenance manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.maintenanceManager = new MaintenanceManager();
});