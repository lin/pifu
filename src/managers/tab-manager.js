/**
 * 标签页管理器 - 负责处理标签页切换和URL管理
 */
class TabManager {
    constructor() {
        this.currentTab = 'monthly';
    }

    /**
     * 设置标签页事件监听器
     */
    setupTabEventListeners() {
        document.querySelectorAll('.tab-button').forEach(tabButton => {
            tabButton.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab || e.target.closest('[data-tab]').dataset.tab;
                if (tabName) {
                    this.switchTab(tabName);
                }
            });
        });
    }

    /**
     * 切换标签页
     */
    switchTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Set active tab
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(tabName);
        
        if (tabButton && tabContent) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
            this.currentTab = tabName;
            this.updateURL();
        }
    }

    /**
     * 设置活动标签页
     */
    setActiveTab(tabName) {
        // Remove active class from all tabs
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Hide all tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Set active tab
        const tabButton = document.querySelector(`[data-tab="${tabName}"]`);
        const tabContent = document.getElementById(tabName);
        
        if (tabButton && tabContent) {
            tabButton.classList.add('active');
            tabContent.classList.add('active');
            this.currentTab = tabName;
        }
    }

    /**
     * 从URL参数加载状态
     * @returns {boolean} 是否成功从URL参数加载
     */
    loadFromURLParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tab = urlParams.get('tab');
        
        if (!tab) return false;
        
        // Set active tab
        this.setActiveTab(tab);
        
        return tab;
    }

    /**
     * 更新URL参数
     */
    updateURL() {
        const urlParams = new URLSearchParams();
        
        // Get current active tab
        const activeTab = document.querySelector('.tab-button.active');
        if (!activeTab) return;
        
        const tabName = activeTab.dataset.tab;
        urlParams.set('tab', tabName);
        
        // Update URL without page reload
        const newURL = window.location.pathname + '?' + urlParams.toString();
        window.history.pushState({}, '', newURL);
    }

    /**
     * 获取当前活动标签页
     */
    getCurrentTab() {
        return this.currentTab;
    }
}