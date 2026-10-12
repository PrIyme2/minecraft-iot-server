// BuiltByBit Luna MCJars Server Switcher & Auto-Core-Updater for Reviactyl & Blueprint
const React = window.React;
if (!React) throw new Error('window.React is required for Reviactyl Extension Modules.');

const { useState, useEffect, useRef, useCallback, useMemo, createElement: h } = React;

const LUNA_CSS = `
.luna-scope {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
    color: #c9d1d9;
    margin: 0 auto;
    padding: 20px 0 48px 0;
    width: 100%;
    max-width: 1280px;
    box-sizing: border-box;
}

/* Tabs Navigation Menu */
.luna-nav-tabs {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    margin-bottom: 24px !important;
    background-color: #11141c !important;
    padding: 6px !important;
    border-radius: 12px !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
}

.luna-nav-tab {
    display: inline-flex !important;
    align-items: center !important;
    gap: 8px !important;
    padding: 9px 18px !important;
    border-radius: 8px !important;
    font-size: 13px !important;
    font-weight: 600 !important;
    color: #8b949e !important;
    background: transparent !important;
    border: none !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    outline: none !important;
}

.luna-nav-tab:hover {
    color: #ffffff !important;
    background-color: rgba(255, 255, 255, 0.05) !important;
}

.luna-nav-tab-active {
    color: #ffffff !important;
    background-color: #5865F2 !important;
    box-shadow: 0 4px 14px rgba(88, 101, 242, 0.35) !important;
}

.luna-nav-tab-badge {
    font-size: 10px !important;
    font-weight: 700 !important;
    padding: 2px 7px !important;
    border-radius: 6px !important;
    background-color: rgba(35, 165, 90, 0.25) !important;
    color: #34d399 !important;
    border: 1px solid rgba(35, 165, 90, 0.4) !important;
    margin-left: 4px !important;
}

/* Controls Grid */
.luna-controls {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 16px !important;
    margin-bottom: 24px !important;
    width: 100% !important;
    overflow: visible !important;
}

@media (max-width: 960px) {
    .luna-controls {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}

@media (max-width: 600px) {
    .luna-controls {
        grid-template-columns: 1fr !important;
    }
}

.luna-control-item {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    position: relative !important;
    overflow: visible !important;
}

.luna-label {
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.06em !important;
    color: #8b949e !important;
    margin-bottom: 8px !important;
}

/* Custom Luna Select Component */
.luna-custom-select-wrap {
    position: relative !important;
    width: 100% !important;
}

.luna-custom-select-btn {
    width: 100% !important;
    background-color: #141822 !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    outline: none !important;
    box-sizing: border-box !important;
    cursor: pointer !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
    text-align: left !important;
    height: 42px !important;
}

.luna-custom-select-btn:hover, .luna-custom-select-btn-open {
    border-color: rgba(88, 101, 242, 0.6) !important;
    box-shadow: 0 0 0 1px rgba(88, 101, 242, 0.2) !important;
}

.luna-custom-select-value {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    padding-right: 8px !important;
    color: #ffffff !important;
    font-size: 13px !important;
    flex: 1 !important;
}

.luna-custom-select-arrow {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    color: #8b949e !important;
    transition: transform 0.2s ease !important;
    flex-shrink: 0 !important;
}

.luna-arrow-rotated {
    transform: rotate(180deg) !important;
    color: #5865F2 !important;
}

.luna-custom-dropdown-menu {
    position: absolute !important;
    top: calc(100% + 6px) !important;
    left: 0 !important;
    right: 0 !important;
    background-color: #141822 !important;
    border: 1px solid rgba(255, 255, 255, 0.12) !important;
    border-radius: 10px !important;
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.75) !important;
    z-index: 999999 !important;
    overflow: hidden !important;
    animation: lunaDropdownFadeIn 0.12s ease !important;
}

@keyframes lunaDropdownFadeIn {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
}

.luna-dropdown-search-box {
    padding: 8px 10px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06) !important;
    background-color: #11141c !important;
}

.luna-dropdown-search-input {
    width: 100% !important;
    background-color: #181d28 !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 6px !important;
    padding: 6px 10px !important;
    font-size: 12px !important;
    outline: none !important;
    box-sizing: border-box !important;
}

.luna-dropdown-search-input:focus {
    border-color: #5865F2 !important;
}

.luna-dropdown-items-list {
    max-height: 240px !important;
    overflow-y: auto !important;
    padding: 4px !important;
}

.luna-dropdown-items-list::-webkit-scrollbar {
    width: 6px !important;
}
.luna-dropdown-items-list::-webkit-scrollbar-track {
    background: transparent !important;
}
.luna-dropdown-items-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.15) !important;
    border-radius: 4px !important;
}
.luna-dropdown-items-list::-webkit-scrollbar-thumb:hover {
    background: #5865F2 !important;
}

.luna-dropdown-item {
    padding: 8px 12px !important;
    border-radius: 6px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    color: #c9d1d9 !important;
    cursor: pointer !important;
    transition: all 0.1s ease !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}

.luna-dropdown-item:hover {
    background-color: #1c2230 !important;
    color: #ffffff !important;
}

.luna-dropdown-item-selected {
    background-color: #5865F2 !important;
    color: #ffffff !important;
    font-weight: 600 !important;
}

.luna-dropdown-item-selected:hover {
    background-color: #4752c4 !important;
}

.luna-dropdown-empty {
    padding: 12px !important;
    text-align: center !important;
    color: #8b949e !important;
    font-size: 12px !important;
}

/* Inputs & Search */
.luna-input-box {
    width: 100% !important;
    position: relative !important;
}

.luna-input {
    width: 100% !important;
    background-color: #141822 !important;
    color: #ffffff !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 10px !important;
    padding: 10px 14px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    outline: none !important;
    box-sizing: border-box !important;
    height: 42px !important;
    transition: border-color 0.15s ease, box-shadow 0.15s ease !important;
}

.luna-input:focus, .luna-input:hover {
    border-color: rgba(88, 101, 242, 0.6) !important;
    box-shadow: 0 0 0 1px rgba(88, 101, 242, 0.2) !important;
}

.luna-grid {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 16px !important;
    width: 100% !important;
}

@media (max-width: 1200px) {
    .luna-grid {
        grid-template-columns: repeat(3, 1fr) !important;
    }
}

@media (max-width: 850px) {
    .luna-grid {
        grid-template-columns: repeat(2, 1fr) !important;
    }
}

@media (max-width: 550px) {
    .luna-grid {
        grid-template-columns: 1fr !important;
    }
}

.luna-card {
    background-color: #161b24 !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 14px !important;
    padding: 18px !important;
    display: flex !important;
    flex-direction: column !important;
    justify-content: space-between !important;
    min-height: 185px !important;
    box-sizing: border-box !important;
    transition: all 0.2s ease !important;
}

.luna-card:hover {
    border-color: rgba(88, 101, 242, 0.4) !important;
    transform: translateY(-2px) !important;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35) !important;
}

.luna-card-header {
    display: flex !important;
    align-items: flex-start !important;
    gap: 12px !important;
    margin-bottom: 12px !important;
}

.luna-card-icon {
    width: 44px !important;
    height: 44px !important;
    border-radius: 10px !important;
    object-fit: cover !important;
    background-color: #0d1117 !important;
    flex-shrink: 0 !important;
    border: 1px solid rgba(255, 255, 255, 0.04) !important;
}

.luna-card-title-wrap {
    flex: 1 !important;
    min-width: 0 !important;
    cursor: pointer !important;
}

.luna-card-title {
    font-size: 14px !important;
    font-weight: 700 !important;
    color: #ffffff !important;
    margin: 0 0 3px 0 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

.luna-card-author {
    font-size: 11px !important;
    color: #8b949e !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
}

.luna-card-desc {
    font-size: 12px !important;
    line-height: 1.45 !important;
    color: #8b949e !important;
    margin: 0 0 16px 0 !important;
    display: -webkit-box !important;
    -webkit-line-clamp: 2 !important;
    -webkit-box-orient: vertical !important;
    overflow: hidden !important;
    height: 35px !important;
}

.luna-card-footer {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding-top: 12px !important;
    border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
    gap: 8px !important;
}

.luna-card-downloads {
    display: flex !important;
    align-items: center !important;
    gap: 5px !important;
    font-size: 11px !important;
    color: #8b949e !important;
    font-weight: 500 !important;
}

.luna-card-actions {
    display: flex !important;
    align-items: center !important;
    gap: 6px !important;
}

.luna-btn-install {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    background-color: #5865F2 !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0 14px !important;
    height: 34px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    outline: none !important;
}

.luna-btn-install:hover:not(:disabled) {
    background-color: #4752c4 !important;
    transform: scale(1.02) !important;
}

.luna-btn-install:disabled {
    opacity: 0.6 !important;
    cursor: not-allowed !important;
}

.luna-btn-secondary {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    background-color: #212631 !important;
    color: #c9d1d9 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 8px !important;
    padding: 0 14px !important;
    height: 34px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    outline: none !important;
}

.luna-btn-secondary:hover:not(:disabled) {
    background-color: #2b3240 !important;
    color: #ffffff !important;
}

.luna-btn-success {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    background-color: #23a55a !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0 14px !important;
    height: 34px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    outline: none !important;
}

.luna-btn-success:hover:not(:disabled) {
    background-color: #1ca553 !important;
    transform: scale(1.02) !important;
}

.luna-btn-link {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: #2b2d31 !important;
    color: #8b949e !important;
    border: none !important;
    border-radius: 8px !important;
    width: 32px !important;
    height: 32px !important;
    text-decoration: none !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
}

.luna-btn-link:hover {
    color: #ffffff !important;
    background-color: #35373c !important;
}

/* Modals */
.luna-modal-overlay {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    background-color: rgba(0, 0, 0, 0.75) !important;
    backdrop-filter: blur(5px) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 99999 !important;
    padding: 20px !important;
}

.luna-modal-card {
    background-color: #161b24 !important;
    border: 1px solid rgba(255, 255, 255, 0.1) !important;
    border-radius: 16px !important;
    width: 100% !important;
    max-width: 640px !important;
    max-height: 85vh !important;
    display: flex !important;
    flex-direction: column !important;
    box-shadow: 0 24px 48px rgba(0, 0, 0, 0.6) !important;
    overflow: hidden !important;
    position: relative !important;
}

.luna-modal-header {
    padding: 18px 22px !important;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}

.luna-modal-title-row {
    display: flex !important;
    align-items: center !important;
    gap: 12px !important;
}

.luna-modal-body {
    padding: 20px 22px !important;
    overflow-y: auto !important;
    flex: 1 !important;
}

/* Alerts */
.luna-alert {
    padding: 12px 16px !important;
    border-radius: 10px !important;
    font-size: 13px !important;
    font-weight: 500 !important;
    margin-bottom: 20px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
}

.luna-alert-success {
    background-color: rgba(16, 185, 129, 0.15) !important;
    border: 1px solid rgba(16, 185, 129, 0.3) !important;
    color: #34d399 !important;
}

.luna-alert-error {
    background-color: rgba(239, 68, 68, 0.15) !important;
    border: 1px solid rgba(239, 68, 68, 0.3) !important;
    color: #f87171 !important;
}

/* Auto-Update View Styles */
.luna-section-card {
    background-color: #161b24 !important;
    border: 1px solid rgba(255, 255, 255, 0.07) !important;
    border-radius: 14px !important;
    padding: 22px !important;
    margin-bottom: 20px !important;
}

.luna-badge-pill {
    display: inline-flex !important;
    align-items: center !important;
    gap: 6px !important;
    padding: 4px 10px !important;
    border-radius: 20px !important;
    font-size: 12px !important;
    font-weight: 600 !important;
}

.luna-badge-success {
    background-color: rgba(35, 165, 90, 0.15) !important;
    border: 1px solid rgba(35, 165, 90, 0.4) !important;
    color: #34d399 !important;
}

.luna-badge-warning {
    background-color: rgba(245, 158, 11, 0.15) !important;
    border: 1px solid rgba(245, 158, 11, 0.4) !important;
    color: #fbbf24 !important;
}

.luna-badge-info {
    background-color: rgba(88, 101, 242, 0.15) !important;
    border: 1px solid rgba(88, 101, 242, 0.4) !important;
    color: #818cf8 !important;
}

.luna-code-box {
    background-color: #0d1117 !important;
    border: 1px solid rgba(255, 255, 255, 0.08) !important;
    border-radius: 10px !important;
    padding: 14px 16px !important;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace !important;
    font-size: 12px !important;
    line-height: 1.5 !important;
    color: #e6edf3 !important;
    overflow-x: auto !important;
    position: relative !important;
}
`;

function LunaSelect({ label, value, options, onChange, placeholder }) {
    placeholder = placeholder || 'Select...';
    const [isOpen, setIsOpen] = useState(false);
    const [searchFilter, setSearchFilter] = useState('');
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleOutsideClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setSearchFilter('');
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('touchstart', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('touchstart', handleOutsideClick);
        };
    }, [isOpen]);

    const selectedOption = options.find(o => String(o.value) === String(value));
    const displayLabel = selectedOption ? selectedOption.label : (value || placeholder);

    const showFilter = options.length > 7;
    const filteredOptions = useMemo(() => {
        if (!searchFilter.trim()) return options;
        const q = searchFilter.toLowerCase().trim();
        return options.filter(o => 
            (o.label || '').toLowerCase().includes(q) || 
            String(o.value || '').toLowerCase().includes(q)
        );
    }, [options, searchFilter]);

    return h('div', { className: 'luna-control-item', ref: dropdownRef },
        label && h('label', { className: 'luna-label' }, label),
        h('div', { className: 'luna-custom-select-wrap' },
            h('button', {
                type: 'button',
                className: `luna-custom-select-btn ${isOpen ? 'luna-custom-select-btn-open' : ''}`,
                onClick: (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(prev => !prev);
                }
            },
                h('span', { className: 'luna-custom-select-value' }, displayLabel),
                h('div', { className: `luna-custom-select-arrow ${isOpen ? 'luna-arrow-rotated' : ''}` },
                    h('svg', { width: '12', height: '12', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5' },
                        h('polyline', { points: '6 9 12 15 18 9' })
                    )
                )
            ),

            isOpen && h('div', {
                className: 'luna-custom-dropdown-menu',
                onClick: (e) => e.stopPropagation()
            },
                showFilter && h('div', { className: 'luna-dropdown-search-box' },
                    h('input', {
                        type: 'text',
                        value: searchFilter,
                        onChange: (e) => setSearchFilter(e.target.value),
                        placeholder: 'Search...',
                        className: 'luna-dropdown-search-input',
                        autoFocus: true,
                        onClick: (e) => e.stopPropagation()
                    })
                ),
                h('div', { className: 'luna-dropdown-items-list' },
                    filteredOptions.length === 0 ? h('div', { className: 'luna-dropdown-empty' }, 'No matches') :
                    filteredOptions.map((opt) => {
                        const isSelected = String(opt.value) === String(value);
                        return h('div', {
                            key: String(opt.value),
                            className: `luna-dropdown-item ${isSelected ? 'luna-dropdown-item-selected' : ''}`,
                            onClick: (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onChange(opt.value);
                                setIsOpen(false);
                                setSearchFilter('');
                            }
                        }, 
                            h('span', null, opt.label),
                            isSelected && h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5' },
                                h('polyline', { points: '20 6 9 17 4 12' })
                            )
                        );
                    })
                )
            )
        )
    );
}


(function() {
    const SERVER_SOFTWARE_ICON = `<svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor" class="rext-sidebar-icon-svg" style="display:inline-block;vertical-align:middle;" aria-hidden="true"><path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V352c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/></svg>`;

    function enhanceElement(link, iconSvg, label) {
        if (!link) return;
        if (label) {
            const spans = link.querySelectorAll('span:not(.rext-sidebar-icon)');
            if (spans.length > 0) {
                spans.forEach(s => {
                    if (s.textContent && /mcjar/i.test(s.textContent)) {
                        s.textContent = label;
                    }
                });
            }
            Array.from(link.childNodes).forEach(node => {
                if (node.nodeType === Node.TEXT_NODE && /mcjar/i.test(node.textContent)) {
                    node.textContent = label;
                }
            });
        }
        if (!link.querySelector('.rext-sidebar-icon')) {
            const wrap = document.createElement('span');
            wrap.className = 'rext-sidebar-icon';
            wrap.style.cssText = 'display:inline-flex;align-items:center;justify-content:center;width:18px;min-width:18px;height:18px;margin-right:12px;color:inherit;opacity:0.9;flex-shrink:0;vertical-align:middle;';
            wrap.innerHTML = iconSvg;
            link.insertBefore(wrap, link.firstChild);
            link.style.display = 'flex';
            link.style.alignItems = 'center';
        }
    }

    function runEnhancer() {
        try {
            const mcLinks = document.querySelectorAll('a[href*="/mcjars"], a[href$="mcjars"], a[data-pyro*="mcjar"]');
            mcLinks.forEach(link => enhanceElement(link, SERVER_SOFTWARE_ICON, 'Server Software'));
        } catch(e) {}
    }

    if (typeof window !== 'undefined') {
        window.__reviactylEnhanceSidebar = runEnhancer;
        runEnhancer();
        [50, 150, 300, 600, 1200, 2500].forEach(ms => setTimeout(runEnhancer, ms));
    }
})();

function useSidebarEnhancer() {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.__reviactylEnhanceSidebar) {
            window.__reviactylEnhanceSidebar();
        }
    }, []);
}


const DEFAULT_MC_VERSIONS = [
    '26.2', '26.1.2', '26.1.1', '1.21.11', '1.21.10', '1.21.9', '1.21.8', '1.21.7', '1.21.6', '1.21.5',
    '1.21.4', '1.21.3', '1.21.2', '1.21.1', '1.21',
    '1.20.6', '1.20.5', '1.20.4', '1.20.3', '1.20.2', '1.20.1', '1.20',
    '1.19.4', '1.19.3', '1.19.2', '1.19.1', '1.19',
    '1.18.2', '1.18.1', '1.17.1', '1.16.5', '1.12.2', '1.8.9'
];

const PRELOADED_SOFTWARE = [
  {
    "id": "vanilla",
    "name": "Vanilla",
    "creator": "MCJars",
    "category": "recommended",
    "desc": "The official Minecraft server software.",
    "icon": "https://s3.mcjars.app/icons/vanilla.png"
  },
  {
    "id": "paper",
    "name": "Paper",
    "creator": "paper",
    "category": "recommended",
    "desc": "Paper is a Minecraft game server based on Spigot, designed to greatly improve performance and offer more advanced features and API.",
    "icon": "https://s3.mcjars.app/icons/paper.png"
  },
  {
    "id": "fabric",
    "name": "Fabric",
    "creator": "fabric",
    "category": "recommended",
    "desc": "A lightweight and modular Minecraft server software.",
    "icon": "https://s3.mcjars.app/icons/fabric.png"
  },
  {
    "id": "forge",
    "name": "Forge",
    "creator": "forge",
    "category": "recommended",
    "desc": "The original Minecraft modding platform.",
    "icon": "https://s3.mcjars.app/icons/forge.png"
  },
  {
    "id": "neoforge",
    "name": "NeoForge",
    "creator": "forge",
    "category": "recommended",
    "desc": "NeoForge is a free, open-source, community-oriented modding API for Minecraft.",
    "icon": "https://s3.mcjars.app/icons/neoforge.png"
  },
  {
    "id": "velocity",
    "name": "Velocity",
    "creator": "velocity",
    "category": "recommended",
    "desc": "A modern, high performance, extensible proxy server alternative for Waterfall.",
    "icon": "https://s3.mcjars.app/icons/velocity.png"
  },
  {
    "id": "purpur",
    "name": "Purpur",
    "creator": "paper",
    "category": "established",
    "desc": "Purpur is a drop-in replacement for Paper servers designed for configurability, new fun and exciting gameplay features.",
    "icon": "https://s3.mcjars.app/icons/purpur.png"
  },
  {
    "id": "pufferfish",
    "name": "Pufferfish",
    "creator": "paper",
    "category": "established",
    "desc": "A fork of Paper that aims to be even more performant.",
    "icon": "https://s3.mcjars.app/icons/pufferfish.png"
  },
  {
    "id": "folia",
    "name": "Folia",
    "creator": "folia",
    "category": "established",
    "desc": "Folia is a fork of Paper that adds regionized multithreading to the server.",
    "icon": "https://s3.mcjars.app/icons/folia.png"
  },
  {
    "id": "sponge",
    "name": "Sponge",
    "creator": "sponge",
    "category": "established",
    "desc": "A modding platform for Minecraft.",
    "icon": "https://s3.mcjars.app/icons/sponge.png"
  },
  {
    "id": "spigot",
    "name": "Spigot",
    "creator": "spigot",
    "category": "established",
    "desc": "A high performance fork of the Bukkit Minecraft Server.",
    "icon": "https://s3.mcjars.app/icons/spigot.png"
  },
  {
    "id": "bungeecord",
    "name": "BungeeCord",
    "creator": "bungeecord",
    "category": "established",
    "desc": "A proxy server software for Minecraft.",
    "icon": "https://s3.mcjars.app/icons/bungeecord.png"
  },
  {
    "id": "waterfall",
    "name": "Waterfall",
    "creator": "bungeecord",
    "category": "established",
    "desc": "Waterfall is the BungeeCord fork that aims to improve performance and stability.",
    "icon": "https://s3.mcjars.app/icons/waterfall.png"
  },
  {
    "id": "quilt",
    "name": "Quilt",
    "creator": "fabric",
    "category": "experimental",
    "desc": "The Quilt project is an open-source, community-driven modding toolchain designed for Minecraft.",
    "icon": "https://s3.mcjars.app/icons/quilt.png"
  },
  {
    "id": "velocity_ctd",
    "name": "Velocity-CTD",
    "creator": "velocity",
    "category": "miscellaneous",
    "desc": "A fork of Velocity with various optimizations, commands, and more!",
    "icon": "https://s3.mcjars.app/icons/velocity_ctd.png"
  },
  {
    "id": "canvas",
    "name": "Canvas",
    "creator": "folia",
    "category": "miscellaneous",
    "desc": "A fork of Folia that aims to be more performant and have better APIs.",
    "icon": "https://s3.mcjars.app/icons/canvas.png"
  },
  {
    "id": "arclight",
    "name": "Arclight",
    "creator": "fabric",
    "category": "miscellaneous",
    "desc": "A Bukkit server implementation utilizing Mixins for modding support.",
    "icon": "https://s3.mcjars.app/icons/arclight.png"
  },
  {
    "id": "mohist",
    "name": "Mohist",
    "creator": "forge",
    "category": "miscellaneous",
    "desc": "A variation of Forge/NeoForge that allows loading Spigot plugins next to mods.",
    "icon": "https://s3.mcjars.app/icons/mohist.png"
  },
  {
    "id": "youer",
    "name": "Youer",
    "creator": "neoforge",
    "category": "miscellaneous",
    "desc": "A variation of NeoForge that allows loading Spigot plugins next to mods.",
    "icon": "https://s3.mcjars.app/icons/youer.png"
  },
  {
    "id": "magma",
    "name": "Magma",
    "creator": "spigot",
    "category": "miscellaneous",
    "desc": "Magma is the ultimate Minecraft server software that combines the power of NeoForge mods and Bukkit plugins in one experience.",
    "icon": "https://s3.mcjars.app/icons/magma.png"
  },
  {
    "id": "divinemc",
    "name": "DivineMC",
    "creator": "paper",
    "category": "miscellaneous",
    "desc": "DivineMC is a multi-functional fork of Purpur, which focuses on the flexibility of your server and its optimization.",
    "icon": "https://s3.mcjars.app/icons/divinemc.png"
  },
  {
    "id": "leaf",
    "name": "Leaf",
    "creator": "paper",
    "category": "miscellaneous",
    "desc": "A Paper fork aimed to find balance between performance, vanilla and stability.",
    "icon": "https://s3.mcjars.app/icons/leaf.png"
  },
  {
    "id": "leaves",
    "name": "Leaves",
    "creator": "paper",
    "category": "miscellaneous",
    "desc": "Leaves is a Minecraft game server based on Paper, aimed at repairing broken vanilla properties.",
    "icon": "https://s3.mcjars.app/icons/leaves.png"
  },
  {
    "id": "aspaper",
    "name": "ASPaper",
    "creator": "paper",
    "category": "miscellaneous",
    "desc": "Advanced Slime Paper is a fork of Paper implementing the Slime Region Format developed by Hypixel.",
    "icon": "https://s3.mcjars.app/icons/aspaper.png"
  },
  {
    "id": "legacyfabric",
    "name": "Legacy Fabric",
    "creator": "fabric",
    "category": "miscellaneous",
    "desc": "Legacy Fabric is a project based on the Fabric Project, with the main priority to keep parity with upstream for older versions.",
    "icon": "https://s3.mcjars.app/icons/legacy_fabric.png"
  },
  {
    "id": "pluto",
    "name": "Pluto",
    "creator": "paper",
    "category": "miscellaneous",
    "desc": "Fork of Pufferfish/Paper with some optimisation and feature patches.",
    "icon": "https://s3.mcjars.app/icons/pluto.png"
  },
  {
    "id": "loohplimbo",
    "name": "LooHP Limbo",
    "creator": "MCJars",
    "category": "limbos",
    "desc": "Standalone Limbo Minecraft Server.",
    "icon": "https://s3.mcjars.app/icons/loohp_limbo.png"
  },
  {
    "id": "nanolimbo",
    "name": "NanoLimbo",
    "creator": "MCJars",
    "category": "limbos",
    "desc": "A lightweight Limbo Minecraft Server, written in Java with Netty. Maximum simplicity with a minimum number of sent and processed packets.",
    "icon": "https://s3.mcjars.app/icons/nanolimbo.png"
  }
];
const EMBEDDED_AUTOUPDATE_SCRIPT = "#!/usr/bin/env bash\n# ==============================================================================\n# Auto-Core-Update Script for Minecraft Servers (Pterodactyl & Reviactyl)\n# Version: 1.2.0\n# Description: Queries the official API of the active server software (PaperMC Fill v3,\n#              Purpur API v2, or Universal MCJars API for all 28 engines) and updates\n#              server.jar automatically to the latest stable build before server boot.\n# ==============================================================================\n\nset -u\n\nSCRIPT_VERSION=\"1.2.0\"\nCONFIG_FILE=\".server_core.json\"\nSTATE_FILE=\".current_build\"\nUSER_AGENT=\"AutoCoreUpdater/${SCRIPT_VERSION} (pterodactyl-server)\"\n\n# --- Color Output Helpers ---\nGREEN='\\033[0;32m'\nBLUE='\\033[0;34m'\nYELLOW='\\033[1;33m'\nRED='\\033[0;31m'\nNC='\\033[0m' # No Color\n\nlog_info()  { echo -e \"${BLUE}[Auto-Core-Update]${NC} $1\"; }\nlog_ok()    { echo -e \"${GREEN}[Auto-Core-Update]${NC} $1\"; }\nlog_warn()  { echo -e \"${YELLOW}[Auto-Core-Update] WARNUNG:${NC} $1\"; }\nlog_error() { echo -e \"${RED}[Auto-Core-Update] FEHLER:${NC} $1\"; }\n\n# --- Portable JSON Extraction Helpers (No jq dependency required) ---\nget_json_value() {\n    local key=\"$1\"\n    local json=\"$2\"\n    if command -v jq >/dev/null 2>&1; then\n        echo \"$json\" | jq -r \".$key // empty\" 2>/dev/null\n    else\n        echo \"$json\" | grep -o \"\\\"$key\\\"[ ]*:[ ]*\\\"[^\\\"]*\\\"\" | head -n 1 | sed -e \"s/\\\"$key\\\"[ ]*:[ ]*\\\"//\" -e 's/\"$//'\n    fi\n}\n\n# --- 1. Load Configuration & Defaults ---\nSOFTWARE=\"${SERVER_SOFTWARE:-}\"\nMC_VERSION=\"${MINECRAFT_VERSION:-${SERVER_VERSION:-${MC_VERSION:-}}}\"\nTARGET_JAR=\"${SERVER_JARFILE:-server.jar}\"\nBACKUP=\"true\"\nCURRENT_BUILD=\"\"\n\nif [ -f \"$CONFIG_FILE\" ]; then\n    CONFIG_CONTENT=$(cat \"$CONFIG_FILE\" 2>/dev/null || true)\n    CFG_SW=$(get_json_value \"software\" \"$CONFIG_CONTENT\")\n    CFG_VER=$(get_json_value \"version\" \"$CONFIG_CONTENT\")\n    CFG_JAR=$(get_json_value \"target_jar\" \"$CONFIG_CONTENT\")\n    CFG_BAK=$(get_json_value \"backup\" \"$CONFIG_CONTENT\")\n    CFG_BUILD=$(get_json_value \"installed_build\" \"$CONFIG_CONTENT\")\n    \n    [ -n \"$CFG_SW\" ] && SOFTWARE=\"$CFG_SW\"\n    [ -n \"$CFG_VER\" ] && MC_VERSION=\"$CFG_VER\"\n    [ -n \"$CFG_JAR\" ] && TARGET_JAR=\"$CFG_JAR\"\n    [ -n \"$CFG_BAK\" ] && BACKUP=\"$CFG_BAK\"\n    [ -n \"$CFG_BUILD\" ] && CURRENT_BUILD=\"$CFG_BUILD\"\nfi\n\n# Fallback: check state file for current build\nif [ -z \"$CURRENT_BUILD\" ] && [ -f \"$STATE_FILE\" ]; then\n    CURRENT_BUILD=$(head -n 1 \"$STATE_FILE\" 2>/dev/null | tr -d ' \\r\\n')\nfi\n\n# Fallback auto-detection if software is not specified\nif [ -z \"$SOFTWARE\" ]; then\n    if [ -f \"purpur.yml\" ]; then\n        SOFTWARE=\"purpur\"\n    elif [ -f \"paper.yml\" ] || [ -f \"config/paper-global.yml\" ]; then\n        SOFTWARE=\"paper\"\n    elif [ -f \"velocity.toml\" ]; then\n        SOFTWARE=\"velocity\"\n    elif [ -f \"waterfall.yml\" ]; then\n        SOFTWARE=\"waterfall\"\n    else\n        SOFTWARE=\"paper\"\n    fi\nfi\n\n# Normalize software name to lowercase\nSOFTWARE=$(echo \"$SOFTWARE\" | tr '[:upper:]' '[:lower:]' | tr -d ' ')\n\n# Fallback Minecraft version if empty\nif [ -z \"$MC_VERSION\" ]; then\n    MC_VERSION=\"1.21.4\"\nfi\n\nlog_info \"==================================================\"\nlog_info \"Minecraft Server Auto-Core-Updater v${SCRIPT_VERSION}\"\nlog_info \"Software: ${SOFTWARE} | Version: ${MC_VERSION} | Target: ${TARGET_JAR}\"\nlog_info \"Aktuell installierter Build: #${CURRENT_BUILD:-unbekannt}\"\nlog_info \"==================================================\"\n\n# --- 2. Query API based on Software ---\nLATEST_BUILD=\"\"\nDOWNLOAD_URL=\"\"\nAPI_NAME=\"\"\n\nfetch_url() {\n    local url=\"$1\"\n    if command -v curl >/dev/null 2>&1; then\n        curl -sSL --connect-timeout 8 --max-time 15 -H \"User-Agent: $USER_AGENT\" \"$url\"\n    elif command -v wget >/dev/null 2>&1; then\n        wget -qO- --timeout=15 --user-agent=\"$USER_AGENT\" \"$url\"\n    else\n        return 1\n    fi\n}\n\ncase \"$SOFTWARE\" in\n    paper|folia|velocity|waterfall)\n        API_NAME=\"PaperMC API (Fill v3)\"\n        log_info \"Frage ${API_NAME} fuer ${SOFTWARE} ${MC_VERSION} ab...\"\n        \n        API_RES=$(fetch_url \"https://fill.papermc.io/v3/projects/${SOFTWARE}/versions/${MC_VERSION}\")\n        if [ -n \"$API_RES\" ]; then\n            if command -v jq >/dev/null 2>&1; then\n                LATEST_BUILD=$(echo \"$API_RES\" | jq -r '.builds[0] // empty' 2>/dev/null)\n            else\n                LATEST_BUILD=$(echo \"$API_RES\" | grep -o '\"builds\"[ ]*:[ ]*\\[[0-9, ]*\\]' | grep -o '[0-9]\\+' | head -n 1)\n            fi\n            \n            if [ -n \"$LATEST_BUILD\" ]; then\n                BUILD_RES=$(fetch_url \"https://fill.papermc.io/v3/projects/${SOFTWARE}/versions/${MC_VERSION}/builds/${LATEST_BUILD}\")\n                if command -v jq >/dev/null 2>&1; then\n                    DOWNLOAD_URL=$(echo \"$BUILD_RES\" | jq -r '.downloads[\"server:default\"].url // empty' 2>/dev/null)\n                else\n                    DOWNLOAD_URL=$(echo \"$BUILD_RES\" | grep -o '\"url\"[ ]*:[ ]*\"https://[^\"]*\"' | head -n 1 | cut -d'\"' -f4)\n                fi\n            fi\n        fi\n        ;;\n        \n    purpur)\n        API_NAME=\"Purpur API (v2)\"\n        log_info \"Frage ${API_NAME} fuer Purpur ${MC_VERSION} ab...\"\n        \n        API_RES=$(fetch_url \"https://api.purpurmc.org/v2/purpur/${MC_VERSION}\")\n        if [ -n \"$API_RES\" ]; then\n            if command -v jq >/dev/null 2>&1; then\n                LATEST_BUILD=$(echo \"$API_RES\" | jq -r '.builds.latest // empty' 2>/dev/null)\n            else\n                LATEST_BUILD=$(echo \"$API_RES\" | grep -o '\"latest\"[ ]*:[ ]*\"[^\"]*\"' | head -n 1 | cut -d'\"' -f4)\n            fi\n            \n            if [ -n \"$LATEST_BUILD\" ]; then\n                DOWNLOAD_URL=\"https://api.purpurmc.org/v2/purpur/${MC_VERSION}/${LATEST_BUILD}/download\"\n            fi\n        fi\n        ;;\nesac\n\n# Fallback: Query Universal MCJars API if native API failed or for any other server software (Leaf, Fabric, NeoForge, etc.)\nif [ -z \"$DOWNLOAD_URL\" ] || [ -z \"$LATEST_BUILD\" ]; then\n    API_NAME=\"MCJars Universal API (v3)\"\n    log_info \"Frage ${API_NAME} fuer ${SOFTWARE} ${MC_VERSION} ab...\"\n    \n    API_RES=$(fetch_url \"https://mcjars.app/api/v3/builds/types/${SOFTWARE}/versions/${MC_VERSION}/latest\")\n    if [ -n \"$API_RES\" ]; then\n        if command -v jq >/dev/null 2>&1; then\n            LATEST_BUILD=$(echo \"$API_RES\" | jq -r '.build.name // .build.uuid // empty' 2>/dev/null | tr -d '#')\n            DOWNLOAD_URL=$(echo \"$API_RES\" | jq -r '.build.installation[0][0].url // .build.download_url // empty' 2>/dev/null)\n        else\n            LATEST_BUILD=$(echo \"$API_RES\" | grep -o '\"name\"[ ]*:[ ]*\"[^\"]*\"' | head -n 1 | cut -d'\"' -f4 | tr -d '#')\n            DOWNLOAD_URL=$(echo \"$API_RES\" | grep -o '\"url\"[ ]*:[ ]*\"https://[^\"]*\"' | head -n 1 | cut -d'\"' -f4)\n        fi\n    fi\nfi\n\n# --- 3. Validate API Response ---\nif [ -z \"$DOWNLOAD_URL\" ] || [ -z \"$LATEST_BUILD\" ]; then\n    log_warn \"Konnte neuesten Build nicht ueber API ermitteln oder Verbindung fehlgeschlagen.\"\n    if [ -f \"$TARGET_JAR\" ]; then\n        log_info \"Bestehende ${TARGET_JAR} vorhanden. Serverstart wird fortgesetzt...\"\n        exit 0\n    else\n        log_error \"Keine ${TARGET_JAR} vorhanden und API nicht erreichbar!\"\n        exit 1\n    fi\nfi\n\nlog_ok \"Neuester stabiler Build laut API (${API_NAME}): #${LATEST_BUILD}\"\n\n# --- 4. Check if Update is Needed ---\nif [ -f \"$TARGET_JAR\" ] && [ -n \"$CURRENT_BUILD\" ] && [ \"$CURRENT_BUILD\" = \"$LATEST_BUILD\" ]; then\n    log_ok \"${TARGET_JAR} ist bereits auf dem neuesten Stand (Build #${LATEST_BUILD}). Kein Update noetig.\"\n    exit 0\nfi\n\n# --- 5. Perform Update ---\nlog_info \"Update verfuegbar: #${CURRENT_BUILD:-keiner} -> #${LATEST_BUILD}\"\n\n# Backup existing JAR\nif [ -f \"$TARGET_JAR\" ] && [ \"$BACKUP\" = \"true\" ]; then\n    log_info \"Erstelle Backup: ${TARGET_JAR} -> ${TARGET_JAR}.bak...\"\n    cp -f \"$TARGET_JAR\" \"${TARGET_JAR}.bak\" 2>/dev/null || true\nfi\n\n# Atomic Download to Temporary File\nTMP_JAR=\"${TARGET_JAR}.tmp.$$\"\nlog_info \"Lade Build #${LATEST_BUILD} herunter...\"\n\nDOWNLOAD_SUCCESS=false\nif command -v curl >/dev/null 2>&1; then\n    if curl -sSL --connect-timeout 10 -H \"User-Agent: $USER_AGENT\" \"$DOWNLOAD_URL\" -o \"$TMP_JAR\"; then\n        DOWNLOAD_SUCCESS=true\n    fi\nelif command -v wget >/dev/null 2>&1; then\n    if wget -qO \"$TMP_JAR\" --timeout=30 --user-agent=\"$USER_AGENT\" \"$DOWNLOAD_URL\"; then\n        DOWNLOAD_SUCCESS=true\n    fi\nfi\n\n# Validate download size (> 1MB)\nFILE_SIZE=0\nif [ -f \"$TMP_JAR\" ]; then\n    FILE_SIZE=$(wc -c < \"$TMP_JAR\" 2>/dev/null || echo 0)\nfi\n\nif [ \"$DOWNLOAD_SUCCESS\" = \"true\" ] && [ \"$FILE_SIZE\" -gt 1048576 ]; then\n    mv -f \"$TMP_JAR\" \"$TARGET_JAR\"\n    chmod +x \"$TARGET_JAR\" 2>/dev/null || true\n    \n    echo \"$LATEST_BUILD\" > \"$STATE_FILE\"\n    \n    # Update config file\n    NOW=$(date -u +\"%Y-%m-%dT%H:%M:%SZ\" 2>/dev/null || date)\n    cat <<EOF > \"$CONFIG_FILE\"\n{\n  \"software\": \"${SOFTWARE}\",\n  \"version\": \"${MC_VERSION}\",\n  \"target_jar\": \"${TARGET_JAR}\",\n  \"installed_build\": \"${LATEST_BUILD}\",\n  \"backup\": ${BACKUP},\n  \"last_updated\": \"${NOW}\"\n}\nEOF\n\n    SIZE_MB=$(( FILE_SIZE / 1048576 ))\n    log_ok \"Update erfolgreich abgeschlossen! ${TARGET_JAR} (${SIZE_MB} MB) ist nun auf Build #${LATEST_BUILD}.\"\nelse\n    log_error \"Download fehlgeschlagen oder unvollstaendig (Groesse: ${FILE_SIZE} Bytes).\"\n    rm -f \"$TMP_JAR\" 2>/dev/null || true\n    if [ -f \"$TARGET_JAR\" ]; then\n        log_warn \"Behalte vorhandene ${TARGET_JAR} bei. Serverstart wird fortgesetzt...\"\n    fi\nfi\n\nlog_info \"Serverstart wird jetzt fortgesetzt...\"\nexit 0\n";

export default function MCJarsContainer() {
    useSidebarEnhancer();

    // Navigation Tab state ('switcher' | 'autoupdate')
    const [activeTab, setActiveTab] = useState('switcher');

    // --- Switcher State ---
    const [softwareList, setSoftwareList] = useState(PRELOADED_SOFTWARE);
    const [selectedType, setSelectedType] = useState('leaf');
    const [selectedVersion, setSelectedVersion] = useState('26.2');
    const [availableVersions, setAvailableVersions] = useState(DEFAULT_MC_VERSIONS);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [detectedServerVersion, setDetectedServerVersion] = useState(null);
    const [modalSoftware, setModalSoftware] = useState(null);
    const [modalSoftwareVersions, setModalSoftwareVersions] = useState([]);
    const [modalSelectedVersion, setModalSelectedVersion] = useState('');
    const [buildInfo, setBuildInfo] = useState(null);
    const [loadingBuild, setLoadingBuild] = useState(false);
    const [targetFilename, setTargetFilename] = useState('server.jar');
    const [backupExisting, setBackupExisting] = useState(true);
    const [installing, setInstalling] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);

    // --- Auto-Core-Update State ---
    const [coreStatus, setCoreStatus] = useState({
        autoupdate_installed: false,
        software: 'paper',
        version: '1.21.4',
        installed_build: null,
        latest_build: null,
        latest_url: null,
        is_up_to_date: null,
        target_jar: 'server.jar',
        backup: true
    });
    const [checkingUpdates, setCheckingUpdates] = useState(false);
    const [updatingNow, setUpdatingNow] = useState(false);
    const [installingScript, setInstallingScript] = useState(false);
    const [autoUpdateSoftware, setAutoUpdateSoftware] = useState('paper');
    const [autoUpdateVersion, setAutoUpdateVersion] = useState('1.21.4');
    const [autoUpdateJar, setAutoUpdateJar] = useState('server.jar');
    const [autoUpdateBackup, setAutoUpdateBackup] = useState(true);
    const [copiedSnippet, setCopiedSnippet] = useState(false);
    const [copiedScript, setCopiedScript] = useState(false);
    const [showScriptCode, setShowScriptCode] = useState(false);

    const cacheRef = useRef(new Map());

    const getServerId = useCallback(() => {
        const full = (window.location.pathname || '') + (window.location.hash || '');
        const m = full.match(/\/server\/([a-zA-Z0-9_-]+)/);
        if (m) return m[1];
        if (window.PterodactylServer?.uuid) return window.PterodactylServer.uuid;
        if (window.PterodactylServer?.id) return String(window.PterodactylServer.id);
        return '';
    }, []);

    const serverId = getServerId();

    const getAuthHeaders = useCallback(() => {
        const meta = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        const domToken = document.querySelector('input[name="_token"]')?.value;
        const xsrfMatch = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
        const xsrfCookie = xsrfMatch ? decodeURIComponent(xsrfMatch[1]) : '';

        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        const plain = (meta && meta.length > 5) ? meta : ((domToken && domToken.length > 5) ? domToken : null);
        if (plain) headers['X-CSRF-TOKEN'] = plain;
        if (xsrfCookie && !plain) headers['X-XSRF-TOKEN'] = xsrfCookie;

        if (window.axios?.defaults?.headers?.common) {
            const ax = window.axios.defaults.headers.common;
            if (ax['X-CSRF-TOKEN']) headers['X-CSRF-TOKEN'] = ax['X-CSRF-TOKEN'];
            if (ax['X-XSRF-TOKEN']) headers['X-XSRF-TOKEN'] = ax['X-XSRF-TOKEN'];
            if (ax['Authorization']) headers['Authorization'] = ax['Authorization'];
        }

        return headers;
    }, []);

    // Load server variables & detect version
    useEffect(() => {
        if (!serverId) return;
        fetch(`/api/client/servers/${serverId}`, { credentials: 'include', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then(res => res.json())
            .then(data => {
                const vars = data?.attributes?.relationships?.variables?.data || [];
                let detectedVer = null;
                let detectedJar = 'server.jar';
                for (const v of vars) {
                    const name = (v?.attributes?.env_variable || '').toUpperCase();
                    const val = v?.attributes?.server_value || v?.attributes?.default_value;
                    if ((name === 'MINECRAFT_VERSION' || name === 'SERVER_VERSION' || name === 'VERSION' || name === 'MC_VERSION') && val) {
                        const cleanVal = val.trim();
                        if (/^1\.\d+(\.\d+)?$/.test(cleanVal) || /^2\d+(\.\d+)?$/.test(cleanVal)) {
                            detectedVer = cleanVal;
                            setDetectedServerVersion(cleanVal);
                            setSelectedVersion(cleanVal);
                            setAutoUpdateVersion(cleanVal);
                        }
                    }
                    if (name === 'SERVER_JARFILE' && val && val.trim().endsWith('.jar')) {
                        detectedJar = val.trim();
                        setTargetFilename(detectedJar);
                        setAutoUpdateJar(detectedJar);
                    }
                }

                // Check server files for core status
                fetch(`/api/client/servers/${serverId}/files/list-directory?directory=/`, { credentials: 'include', headers: getAuthHeaders() })
                    .then(res => res.json())
                    .then(fileList => {
                        const files = (fileList?.data || []).map(f => f?.attributes?.name || f?.name || '');
                        const hasScript = files.includes('autoupdate.sh');
                        const hasConfig = files.includes('.server_core.json');
                        const hasBuild = files.includes('.current_build');

                        let detectedSoftware = 'paper';
                        if (files.includes('purpur.yml')) detectedSoftware = 'purpur';
                        else if (files.includes('velocity.toml')) detectedSoftware = 'velocity';
                        else if (files.includes('leaf.yml')) detectedSoftware = 'leaf';

                        setAutoUpdateSoftware(detectedSoftware);

                        setCoreStatus(prev => ({
                            ...prev,
                            autoupdate_installed: hasScript,
                            software: detectedSoftware,
                            version: detectedVer || '1.21.4',
                            target_jar: detectedJar
                        }));

                        // If .server_core.json exists, load it
                        if (hasConfig) {
                            fetch(`/api/client/servers/${serverId}/files/contents?file=.server_core.json`, { credentials: 'include', headers: getAuthHeaders() })
                                .then(res => res.json())
                                .then(cfg => {
                                    if (cfg && cfg.software) {
                                        setCoreStatus(prev => ({
                                            ...prev,
                                            software: cfg.software,
                                            version: cfg.version || prev.version,
                                            installed_build: cfg.installed_build,
                                            target_jar: cfg.target_jar || prev.target_jar,
                                            backup: cfg.backup ?? true
                                        }));
                                        setAutoUpdateSoftware(cfg.software);
                                        if (cfg.version) setAutoUpdateVersion(cfg.version);
                                        if (cfg.target_jar) setAutoUpdateJar(cfg.target_jar);
                                    }
                                })
                                .catch(() => {});
                        }
                    })
                    .catch(() => {});
            })
            .catch(() => {});
    }, [serverId, getAuthHeaders]);

    // Live-sync software types
    useEffect(() => {
        fetch('https://mcjars.app/api/v2/types')
            .then(res => res.json())
            .then(data => {
                if (data && data.types) {
                    const loaded = [];
                    for (const cat of Object.keys(data.types)) {
                        for (const tid of Object.keys(data.types[cat])) {
                            const info = data.types[cat][tid];
                            loaded.push({
                                id: tid.toLowerCase(),
                                name: info.name || tid,
                                creator: (info.compatibility && info.compatibility[0]) || 'MCJars',
                                category: cat,
                                desc: info.description || '',
                                icon: `https://s3.mcjars.app/icons/${tid.toLowerCase()}.png`
                            });
                        }
                    }
                    if (loaded.length > 0) {
                        setSoftwareList(prev => {
                            const map = new Map();
                            prev.forEach(x => map.set(x.id, x));
                            loaded.forEach(x => map.set(x.id, { ...map.get(x.id), ...x }));
                            return Array.from(map.values());
                        });
                    }
                }
            })
            .catch(() => {});
    }, []);

    // Live-sync Minecraft versions
    useEffect(() => {
        fetch('https://api.modrinth.com/v2/tag/game_version')
            .then(res => res.json())
            .then(tags => {
                if (Array.isArray(tags)) {
                    const releases = tags.filter(t => t.version_type === 'release').map(t => t.version);
                    if (releases.length > 0) {
                        setAvailableVersions(prev => Array.from(new Set([...releases, ...prev])));
                    }
                }
            })
            .catch(() => {});
    }, []);

    const fetchBuildDetails = useCallback(async (typeId, versionId) => {
        const cacheKey = `${typeId}:${versionId}`;
        if (cacheRef.current.has(cacheKey)) {
            const cached = cacheRef.current.get(cacheKey);
            setBuildInfo(cached);
            setTargetFilename(cached.target_filename || 'server.jar');
            setLoadingBuild(false);
            return;
        }

        setLoadingBuild(true);
        try {
            const res = await fetch(`https://mcjars.app/api/v3/builds/types/${typeId}/versions/${versionId}/latest`);
            const data = await res.json();
            const build = data?.build;
            if (build) {
                let downloadUrl = '';
                let fileSize = 0;
                let targetFile = 'server.jar';

                if (build.installation && Array.isArray(build.installation)) {
                    for (const step of build.installation) {
                        if (Array.isArray(step)) {
                            for (const sub of step) {
                                if (sub && sub.url) {
                                    downloadUrl = sub.url;
                                    fileSize = sub.size || fileSize;
                                    targetFile = sub.file || targetFile;
                                    break;
                                }
                            }
                        } else if (step && step.url) {
                            downloadUrl = step.url;
                            fileSize = step.size || fileSize;
                            targetFile = step.file || targetFile;
                            break;
                        }
                        if (downloadUrl) break;
                    }
                }

                if (!downloadUrl) {
                    downloadUrl = build.download_url || build.jar_url || build.url || '';
                }
                if (build.file_size || build.size) {
                    fileSize = build.file_size || build.size;
                }

                if (downloadUrl.startsWith('http://')) {
                    downloadUrl = 'https://' + downloadUrl.slice(7);
                }

                const info = {
                    name: String(build.name || build.id || 'Latest'),
                    version: build.version_id || versionId,
                    type: typeId,
                    download_url: downloadUrl,
                    size: fileSize,
                    sha256: build.sha256,
                    target_filename: targetFile
                };

                cacheRef.current.set(cacheKey, info);
                setBuildInfo(info);
                setTargetFilename(targetFile);
            } else {
                setBuildInfo(null);
            }
        } catch (err) {
            setBuildInfo(null);
        } finally {
            setLoadingBuild(false);
        }
    }, []);

    const openInstallModal = async (software, e = null) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        setModalSoftware(software);
        setBuildInfo(null);
        setLoadingBuild(true);
        setStatusMsg(null);

        try {
            const vRes = await fetch(`https://mcjars.app/api/v3/builds/types/${software.id}/versions`);
            const vData = await vRes.json();
            const verList = (vData?.versions?.data || []).map(v => v.id);

            let targetVer = verList[0] || selectedVersion;
            if (verList.includes(selectedVersion)) {
                targetVer = selectedVersion;
            } else if (detectedServerVersion && verList.includes(detectedServerVersion)) {
                targetVer = detectedServerVersion;
            }

            setModalSoftwareVersions(verList);
            setModalSelectedVersion(targetVer);
            await fetchBuildDetails(software.id, targetVer);
        } catch (err) {
            setBuildInfo(null);
            setLoadingBuild(false);
        }
    };

    const handleInstallJar = async (e = null) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!serverId) {
            setStatusMsg({ type: 'error', text: 'Server-ID konnte nicht erkannt werden.' });
            return;
        }

        if (!buildInfo || !buildInfo.download_url) {
            setStatusMsg({ type: 'error', text: 'Download-URL konnte nicht ermittelt werden.' });
            return;
        }

        setInstalling(true);
        setStatusMsg(null);

        try {
            let safeDownloadUrl = buildInfo.download_url;
            if (safeDownloadUrl.startsWith('http://')) {
                safeDownloadUrl = 'https://' + safeDownloadUrl.slice(7);
            }

            if (backupExisting && targetFilename) {
                try {
                    await fetch(`/api/client/servers/${serverId}/files/rename`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        credentials: 'include',
                        body: JSON.stringify({
                            root: '/',
                            files: [{ from: targetFilename, to: `${targetFilename}.bak` }]
                        })
                    });
                } catch(e) {}
            }

            const payload = {
                url: safeDownloadUrl,
                directory: '/',
                filename: targetFilename
            };

            const res = await fetch(`/api/client/servers/${serverId}/files/pull`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Record core config
                try {
                    await fetch(`/api/client/servers/${serverId}/files/write?file=.server_core.json`, {
                        method: 'POST',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' },
                        credentials: 'include',
                        body: JSON.stringify({
                            software: modalSoftware.id,
                            version: modalSelectedVersion,
                            target_jar: targetFilename,
                            installed_build: buildInfo.name,
                            backup: backupExisting,
                            installed_at: new Date().toISOString()
                        }, null, 2)
                    });
                } catch(e) {}

                setCoreStatus(prev => ({
                    ...prev,
                    software: modalSoftware.id,
                    version: modalSelectedVersion,
                    installed_build: buildInfo.name,
                    target_jar: targetFilename
                }));

                setStatusMsg({ 
                    type: 'success', 
                    text: `✓ ${targetFilename} (${modalSoftware.name} ${modalSelectedVersion}) wird im Hintergrund geladen!` 
                });
                setModalSoftware(null);
            } else {
                const text = await res.text();
                let errDetail = '';
                try {
                    const j = JSON.parse(text);
                    errDetail = j?.errors?.[0]?.detail || j?.error || j?.message || '';
                } catch(e) {}
                setStatusMsg({ type: 'error', text: `Fehler beim Herunterladen: ${errDetail || ('HTTP ' + res.status)}` });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: `Fehler: ${err.message}` });
        } finally {
            setInstalling(false);
        }
    };

    // --- AUTO-CORE-UPDATE ACTIONS ---
    const handleCheckUpdates = async () => {
        setCheckingUpdates(true);
        setStatusMsg(null);
        const sw = (coreStatus.software || autoUpdateSoftware || 'paper').toLowerCase();
        const ver = coreStatus.version || autoUpdateVersion || '1.21.4';

        try {
            let latest = null;
            let dUrl = null;
            let apiSource = 'MCJars Universal API';

            if (['paper', 'folia', 'velocity', 'waterfall'].includes(sw)) {
                apiSource = 'PaperMC Fill v3 API';
                const res = await fetch(`https://fill.papermc.io/v3/projects/${sw}/versions/${ver}`, {
                    headers: { 'User-Agent': 'AutoCoreUpdater/1.2.0' }
                });
                if (res.ok) {
                    const j = await res.json();
                    if (j.builds && j.builds.length > 0) {
                        latest = String(j.builds[0]);
                        const bRes = await fetch(`https://fill.papermc.io/v3/projects/${sw}/versions/${ver}/builds/${latest}`, {
                            headers: { 'User-Agent': 'AutoCoreUpdater/1.2.0' }
                        });
                        if (bRes.ok) {
                            const bJson = await bRes.json();
                            dUrl = bJson?.downloads?.['server:default']?.url;
                        }
                    }
                }
            } else if (sw === 'purpur') {
                apiSource = 'Purpur API v2';
                const res = await fetch(`https://api.purpurmc.org/v2/purpur/${ver}`);
                if (res.ok) {
                    const j = await res.json();
                    latest = String(j?.builds?.latest || '');
                    if (latest) {
                        dUrl = `https://api.purpurmc.org/v2/purpur/${ver}/${latest}/download`;
                    }
                }
            }

            // Universal fallback
            if (!latest || !dUrl) {
                apiSource = 'MCJars Universal API v3';
                const res = await fetch(`https://mcjars.app/api/v3/builds/types/${sw}/versions/${ver}/latest`);
                if (res.ok) {
                    const j = await res.json();
                    latest = String(j?.build?.name || j?.build?.id || '').replace(/^#/, '');
                    dUrl = j?.build?.installation?.[0]?.[0]?.url || j?.build?.download_url;
                }
            }

            if (latest) {
                const currentClean = String(coreStatus.installed_build || '').replace(/^#/, '');
                const isUpToDate = currentClean ? (currentClean === latest) : null;

                setCoreStatus(prev => ({
                    ...prev,
                    latest_build: latest,
                    latest_url: dUrl,
                    is_up_to_date: isUpToDate
                }));

                if (isUpToDate) {
                    setStatusMsg({ 
                        type: 'success', 
                        text: `✓ ${sw.toUpperCase()} ${ver} ist auf dem neuesten Stand (Build #${latest}) laut ${apiSource}.` 
                    });
                } else {
                    setStatusMsg({ 
                        type: 'success', 
                        text: `Neuer stabiler Build verfügbar: #${latest} (Installiert: #${coreStatus.installed_build || 'unbekannt'}) via ${apiSource}!` 
                    });
                }
            } else {
                setStatusMsg({ type: 'error', text: `Kein Build für ${sw.toUpperCase()} ${ver} auf der API gefunden.` });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: `Update-Prüfung fehlgeschlagen: ${err.message}` });
        } finally {
            setCheckingUpdates(false);
        }
    };

    const handleUpdateCoreNow = async () => {
        if (!coreStatus.latest_url) {
            await handleCheckUpdates();
        }
        if (!coreStatus.latest_url) return;

        setUpdatingNow(true);
        setStatusMsg(null);

        try {
            const sw = coreStatus.software || autoUpdateSoftware || 'paper';
            const ver = coreStatus.version || autoUpdateVersion || '1.21.4';
            const target = coreStatus.target_jar || autoUpdateJar || 'server.jar';

            if (coreStatus.backup) {
                try {
                    await fetch(`/api/client/servers/${serverId}/files/rename`, {
                        method: 'PUT',
                        headers: getAuthHeaders(),
                        credentials: 'include',
                        body: JSON.stringify({
                            root: '/',
                            files: [{ from: target, to: `${target}.bak` }]
                        })
                    });
                } catch(e) {}
            }

            const res = await fetch(`/api/client/servers/${serverId}/files/pull`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({
                    url: coreStatus.latest_url,
                    directory: '/',
                    filename: target
                })
            });

            if (res.ok) {
                try {
                    await fetch(`/api/client/servers/${serverId}/files/write?file=.current_build`, {
                        method: 'POST',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' },
                        credentials: 'include',
                        body: coreStatus.latest_build
                    });
                    await fetch(`/api/client/servers/${serverId}/files/write?file=.server_core.json`, {
                        method: 'POST',
                        headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' },
                        credentials: 'include',
                        body: JSON.stringify({
                            software: sw,
                            version: ver,
                            target_jar: target,
                            installed_build: coreStatus.latest_build,
                            backup: coreStatus.backup,
                            updated_at: new Date().toISOString()
                        }, null, 2)
                    });
                } catch(e) {}

                setCoreStatus(prev => ({
                    ...prev,
                    installed_build: prev.latest_build,
                    is_up_to_date: true
                }));
                setStatusMsg({ type: 'success', text: `✓ ${target} wurde auf den neuesten Build (#${coreStatus.latest_build}) aktualisiert!` });
            } else {
                setStatusMsg({ type: 'error', text: 'Fehler beim Downloaden des Updates.' });
            }
        } catch(err) {
            setStatusMsg({ type: 'error', text: 'Update fehlgeschlagen: ' + err.message });
        } finally {
            setUpdatingNow(false);
        }
    };

    const handleInstallScript = async () => {
        setInstallingScript(true);
        setStatusMsg(null);

        const payload = {
            software: autoUpdateSoftware || 'paper',
            version: autoUpdateVersion || '1.21.4',
            target_jar: autoUpdateJar || 'server.jar',
            backup: autoUpdateBackup,
        };

        try {
            // First attempt: Backend route
            let res = await fetch(`/api/client/servers/${serverId}/mcjars/autoupdate/install`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                // Direct fallback via Pterodactyl client file write
                await fetch(`/api/client/servers/${serverId}/files/write?file=autoupdate.sh`, {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' },
                    credentials: 'include',
                    body: EMBEDDED_AUTOUPDATE_SCRIPT
                });

                await fetch(`/api/client/servers/${serverId}/files/write?file=.server_core.json`, {
                    method: 'POST',
                    headers: { ...getAuthHeaders(), 'Content-Type': 'text/plain' },
                    credentials: 'include',
                    body: JSON.stringify({
                        software: payload.software,
                        version: payload.version,
                        target_jar: payload.target_jar,
                        installed_build: coreStatus.installed_build || 'latest',
                        backup: payload.backup,
                        installed_at: new Date().toISOString()
                    }, null, 2)
                });

                try {
                    await fetch(`/api/client/servers/${serverId}/files/chmod`, {
                        method: 'POST',
                        headers: getAuthHeaders(),
                        credentials: 'include',
                        body: JSON.stringify({ root: '/', files: [{ file: 'autoupdate.sh', mode: '0755' }] })
                    });
                } catch(e) {}
            }

            setCoreStatus(prev => ({
                ...prev,
                autoupdate_installed: true,
                software: payload.software,
                version: payload.version,
                target_jar: payload.target_jar,
                backup: payload.backup
            }));

            setStatusMsg({ 
                type: 'success', 
                text: '✓ Auto-Core-Update-Skript (autoupdate.sh) und Konfiguration erfolgreich auf dem Server installiert!' 
            });
        } catch(err) {
            setStatusMsg({ type: 'error', text: 'Fehler beim Installieren des Skripts: ' + err.message });
        } finally {
            setInstallingScript(false);
        }
    };

    const copyToClipboard = (text, type = 'snippet') => {
        navigator.clipboard.writeText(text);
        if (type === 'snippet') {
            setCopiedSnippet(true);
            setTimeout(() => setCopiedSnippet(false), 2000);
        } else {
            setCopiedScript(true);
            setTimeout(() => setCopiedScript(false), 2000);
        }
    };

    const filteredSoftware = useMemo(() => {
        const q = (searchQuery || '').toLowerCase().trim();
        return softwareList.filter(item => {
            const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
            if (!matchesCategory) return false;
            if (!q) return true;
            return item.name.toLowerCase().includes(q) || 
                item.id.toLowerCase().includes(q) ||
                item.desc.toLowerCase().includes(q) ||
                item.creator.toLowerCase().includes(q);
        });
    }, [softwareList, categoryFilter, searchQuery]);

    const activeSoftwareObj = useMemo(() => {
        const sw = (coreStatus.software || autoUpdateSoftware || 'paper').toLowerCase();
        return softwareList.find(s => s.id === sw) || {
            id: sw,
            name: sw.charAt(0).toUpperCase() + sw.slice(1),
            icon: `https://s3.mcjars.app/icons/${sw}.png`
        };
    }, [softwareList, coreStatus.software, autoUpdateSoftware]);

    const startupCommandSnippet = `bash autoupdate.sh && java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar ${coreStatus.target_jar || '{{SERVER_JARFILE}}'}`;

    return h('div', { className: 'luna-scope' },
        h('style', null, LUNA_CSS),

        statusMsg && h('div', {
            className: `luna-alert ${statusMsg.type === 'success' ? 'luna-alert-success' : 'luna-alert-error'}`
        },
            h('span', null, statusMsg.text),
            h('button', {
                type: 'button',
                onClick: () => setStatusMsg(null),
                style: { background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '18px', fontWeight: 700 }
            }, '×')
        ),

        // PAGE HEADER
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
                h('div', { style: { width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(88, 101, 242, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5865F2', flexShrink: 0 } },
                    h('svg', { width: '24', height: '24', viewBox: '0 0 512 512', fill: 'currentColor' },
                        h('path', { d: 'M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V352c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z' })
                    )
                ),
                h('div', null,
                    h('h1', { style: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' } }, 'Server Software & Core Updater'),
                    h('p', { style: { margin: '3px 0 0 0', fontSize: '13px', color: '#8b949e' } }, 'Switch between 28 server softwares & manage automatic pre-boot core updates')
                )
            ),
            detectedServerVersion && h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(88, 101, 242, 0.1)', border: '1px solid rgba(88, 101, 242, 0.25)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', color: '#818cf8', fontWeight: 600 } },
                h('span', null, `Minecraft: ${detectedServerVersion}`)
            )
        ),

        // TOP NAVIGATION TABS (Switcher vs Auto-Core-Update)
        h('div', { className: 'luna-nav-tabs' },
            h('button', {
                type: 'button',
                className: `luna-nav-tab ${activeTab === 'switcher' ? 'luna-nav-tab-active' : ''}`,
                onClick: () => setActiveTab('switcher')
            },
                h('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                    h('rect', { x: '2', y: '2', width: '20', height: '8', rx: '2', ry: '2' }),
                    h('rect', { x: '2', y: '14', width: '20', height: '8', rx: '2', ry: '2' }),
                    h('line', { x1: '6', y1: '6', x2: '6.01', y2: '6' }),
                    h('line', { x1: '6', y1: '18', x2: '6.01', y2: '18' })
                ),
                'Software Switcher (28 Softwares)'
            ),
            h('button', {
                type: 'button',
                className: `luna-nav-tab ${activeTab === 'autoupdate' ? 'luna-nav-tab-active' : ''}`,
                onClick: () => {
                    setActiveTab('autoupdate');
                    if (!coreStatus.latest_build) {
                        handleCheckUpdates();
                    }
                }
            },
                h('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                    h('polyline', { points: '23 4 23 10 17 10' }),
                    h('polyline', { points: '1 20 1 14 7 14' }),
                    h('path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' })
                ),
                'Auto-Core-Update',
                h('span', { className: 'luna-nav-tab-badge' }, 'Pre-Boot')
            )
        ),

        // =====================================================================
        // TAB 1: SOFTWARE SWITCHER
        // =====================================================================
        activeTab === 'switcher' && h('div', null,
            // TOP CONTROLS (Custom Luna Dropdowns)
            h('div', { className: 'luna-controls' },
                h(LunaSelect, {
                    label: 'Server Software',
                    value: selectedType,
                    options: softwareList.map(s => ({
                        value: s.id,
                        label: s.name
                    })),
                    onChange: val => setSelectedType(val)
                }),

                h(LunaSelect, {
                    label: 'Minecraft Version',
                    value: selectedVersion,
                    options: availableVersions.map(v => ({
                        value: v,
                        label: v === detectedServerVersion ? `${v} (Server)` : v
                    })),
                    onChange: val => setSelectedVersion(val)
                }),

                h(LunaSelect, {
                    label: 'Category',
                    value: categoryFilter,
                    options: [
                        { value: 'all', label: 'All Categories (28)' },
                        { value: 'recommended', label: 'Recommended (Paper, Fabric...)' },
                        { value: 'established', label: 'Established (Purpur, Folia, Spigot...)' },
                        { value: 'miscellaneous', label: 'Miscellaneous (Leaf, Velocity-CTD...)' },
                        { value: 'experimental', label: 'Experimental (Quilt)' },
                        { value: 'limbos', label: 'Limbos (NanoLimbo, LooHP)' }
                    ],
                    onChange: val => setCategoryFilter(val)
                }),

                h('div', { className: 'luna-control-item' },
                    h('label', { className: 'luna-label' }, 'Search'),
                    h('div', { className: 'luna-input-box' },
                        h('input', {
                            type: 'text',
                            value: searchQuery,
                            onChange: e => setSearchQuery(e.target.value),
                            placeholder: 'Search software (Leaf, Purpur, Paper)...',
                            className: 'luna-input'
                        })
                    )
                )
            ),

            // CARD GRID
            h('div', { className: 'luna-grid' },
                filteredSoftware.map(software => {
                    return h('div', { key: software.id, className: 'luna-card' },
                        h('div', null,
                            h('div', { className: 'luna-card-header' },
                                h('img', {
                                    src: software.icon,
                                    alt: software.name,
                                    className: 'luna-card-icon',
                                    onError: (e) => { e.target.src = 'https://s3.mcjars.app/icons/vanilla.png'; }
                                }),
                                h('div', {
                                    className: 'luna-card-title-wrap',
                                    onClick: (e) => openInstallModal(software, e)
                                },
                                    h('h3', { className: 'luna-card-title' }, software.name),
                                    h('div', { className: 'luna-card-author' }, `by ${software.creator} • ${software.category}`)
                                )
                            ),
                            h('p', { className: 'luna-card-desc', title: software.desc },
                                software.desc
                            )
                        ),

                        h('div', { className: 'luna-card-footer' },
                            h('div', { className: 'luna-card-downloads' },
                                h('span', { style: { color: '#5865F2', fontWeight: 600 } }, selectedVersion),
                                h('span', { style: { color: '#484f58' } }, '•'),
                                h('span', null, 'MCJars v3')
                            ),

                            h('div', { className: 'luna-card-actions' },
                                h('a', {
                                    href: `https://mcjars.app/${software.id}/versions`,
                                    target: '_blank',
                                    rel: 'noreferrer',
                                    title: 'Open on MCJars.app',
                                    className: 'luna-btn-link',
                                    onClick: (e) => e.stopPropagation()
                                },
                                    h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                                        h('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
                                        h('polyline', { points: '15 3 21 3 21 9' }),
                                        h('line', { x1: '10', y1: '14', x2: '21', y2: '3' })
                                    )
                                ),

                                h('button', {
                                    type: 'button',
                                    onClick: (e) => openInstallModal(software, e),
                                    className: 'luna-btn-install'
                                }, 'Install')
                            )
                        )
                    );
                })
            )
        ),

        // =====================================================================
        // TAB 2: AUTO-CORE-UPDATE MANAGER
        // =====================================================================
        activeTab === 'autoupdate' && h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
            // STATUS OVERVIEW CARD
            h('div', { className: 'luna-section-card' },
                h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' } },
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px' } },
                        h('img', {
                            src: activeSoftwareObj.icon,
                            style: { width: '38px', height: '38px', borderRadius: '10px', objectFit: 'cover' },
                            onError: (e) => { e.target.src = 'https://s3.mcjars.app/icons/vanilla.png'; }
                        }),
                        h('div', null,
                            h('h2', { style: { margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' } },
                                `Aktiver Core: ${activeSoftwareObj.name} ${coreStatus.version || '1.21.4'}`
                            ),
                            h('div', { style: { fontSize: '12px', color: '#8b949e', marginTop: '2px' } },
                                `Ziel-Datei: ${coreStatus.target_jar || 'server.jar'} • Pre-Boot Updater`
                            )
                        )
                    ),

                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px' } },
                        h('button', {
                            type: 'button',
                            onClick: handleCheckUpdates,
                            disabled: checkingUpdates,
                            className: 'luna-btn-secondary'
                        },
                            h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5' },
                                h('polyline', { points: '23 4 23 10 17 10' }),
                                h('polyline', { points: '1 20 1 14 7 14' }),
                                h('path', { d: 'M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15' })
                            ),
                            checkingUpdates ? 'Prüfe API...' : 'Auf Updates prüfen'
                        ),

                        h('button', {
                            type: 'button',
                            onClick: handleUpdateCoreNow,
                            disabled: updatingNow || (!coreStatus.latest_url && !coreStatus.latest_build),
                            className: 'luna-btn-install'
                        },
                            h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5' },
                                h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
                                h('polyline', { points: '7 10 12 15 17 10' }),
                                h('line', { x1: '12', y1: '15', x2: '12', y2: '3' })
                            ),
                            updatingNow ? 'Wird aktualisiert...' : 'Core jetzt aktualisieren'
                        )
                    )
                ),

                // TILES ROW
                h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' } },
                    h('div', { style: { background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' } },
                        h('div', { style: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 } }, 'Installierter Build'),
                        h('div', { style: { fontSize: '18px', fontWeight: 700, color: '#fff', marginTop: '6px' } },
                            coreStatus.installed_build ? `#${coreStatus.installed_build}` : 'Nicht erfasst'
                        ),
                        h('div', { style: { fontSize: '11px', color: '#8b949e', marginTop: '4px' } }, 'Auf Server-Festplatte')
                    ),

                    h('div', { style: { background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' } },
                        h('div', { style: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 } }, 'Neuester API-Build'),
                        h('div', { style: { fontSize: '18px', fontWeight: 700, color: '#34d399', marginTop: '6px' } },
                            coreStatus.latest_build ? `#${coreStatus.latest_build}` : 'Wird geprüft...'
                        ),
                        h('div', { style: { fontSize: '11px', color: '#8b949e', marginTop: '4px' } },
                            coreStatus.software === 'purpur' ? 'Purpur API v2' : 
                            ['paper', 'folia', 'velocity'].includes(coreStatus.software) ? 'PaperMC Fill v3' : 'MCJars Universal v3'
                        )
                    ),

                    h('div', { style: { background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' } },
                        h('div', { style: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 } }, 'Update-Status'),
                        h('div', { style: { marginTop: '6px' } },
                            coreStatus.is_up_to_date === true ? (
                                h('span', { className: 'luna-badge-pill luna-badge-success' }, '✓ Auf neuestem Stand')
                            ) : coreStatus.is_up_to_date === false ? (
                                h('span', { className: 'luna-badge-pill luna-badge-warning' }, `⚠️ Update verfügbar (#${coreStatus.latest_build})`)
                            ) : (
                                h('span', { className: 'luna-badge-pill luna-badge-info' }, 'Prüfung bereit')
                            )
                        ),
                        h('div', { style: { fontSize: '11px', color: '#8b949e', marginTop: '4px' } }, 'Automatischer Versionsvergleich')
                    ),

                    h('div', { style: { background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '14px' } },
                        h('div', { style: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 } }, 'Pre-Boot Skript'),
                        h('div', { style: { marginTop: '6px' } },
                            coreStatus.autoupdate_installed ? (
                                h('span', { className: 'luna-badge-pill luna-badge-success' }, '✓ autoupdate.sh aktiv')
                            ) : (
                                h('span', { className: 'luna-badge-pill luna-badge-warning' }, '❌ Nicht installiert')
                            )
                        ),
                        h('div', { style: { fontSize: '11px', color: '#8b949e', marginTop: '4px' } }, 'Ausführung vor Serverstart')
                    )
                )
            ),

            // SCRIPT INSTALLER & CONFIGURATION CARD
            h('div', { className: 'luna-section-card' },
                h('div', { style: { marginBottom: '18px' } },
                    h('h3', { style: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' } }, '⚡ Auto-Core-Update-Skript auf Server installieren'),
                    h('p', { style: { margin: '4px 0 0 0', fontSize: '13px', color: '#8b949e' } },
                        'Generiert und platziert autoupdate.sh und .server_core.json im Hauptverzeichnis deines Servers. Das Skript fragt vor jedem Serverstart die API deiner aktuellen Server-Software ab (PaperMC Fill v3, Purpur v2 oder MCJars Universal für 28 Engines) und lädt die server.jar atomar auf den neuesten Build.'
                    )
                ),

                h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' } },
                    h(LunaSelect, {
                        label: 'Server Software',
                        value: autoUpdateSoftware,
                        options: softwareList.map(s => ({ value: s.id, label: s.name })),
                        onChange: val => setAutoUpdateSoftware(val)
                    }),

                    h(LunaSelect, {
                        label: 'Minecraft Version',
                        value: autoUpdateVersion,
                        options: availableVersions.map(v => ({ value: v, label: v })),
                        onChange: val => setAutoUpdateVersion(val)
                    }),

                    h('div', { className: 'luna-control-item' },
                        h('label', { className: 'luna-label' }, 'Ziel-Dateiname'),
                        h('input', {
                            type: 'text',
                            value: autoUpdateJar,
                            onChange: e => setAutoUpdateJar(e.target.value),
                            placeholder: 'server.jar',
                            className: 'luna-input'
                        })
                    )
                ),

                h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', marginBottom: '20px' } },
                    h('div', null,
                        h('div', { style: { fontSize: '13px', fontWeight: 600, color: '#fff' } }, 'Alte JAR vor jedem Update als .bak sichern'),
                        h('div', { style: { fontSize: '11px', color: '#8b949e', marginTop: '2px' } },
                            'Schützt vor Datenverlust oder inkompatiblen Builds durch automatische Sicherung nach server.jar.bak'
                        )
                    ),
                    h('input', {
                        type: 'checkbox',
                        checked: autoUpdateBackup,
                        onChange: e => setAutoUpdateBackup(e.target.checked),
                        style: { width: '18px', height: '18px', cursor: 'pointer', accentColor: '#5865F2' }
                    })
                ),

                h('button', {
                    type: 'button',
                    onClick: handleInstallScript,
                    disabled: installingScript,
                    className: 'luna-btn-success',
                    style: { width: '100%', height: '42px', fontSize: '13px' }
                },
                    h('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5' },
                        h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
                        h('polyline', { points: '7 10 12 15 17 10' }),
                        h('line', { x1: '12', y1: '15', x2: '12', y2: '3' })
                    ),
                    installingScript ? 'Installiere auf Server...' : `Auto-Update-Skript auf Server installieren (${autoUpdateSoftware.toUpperCase()} ${autoUpdateVersion})`
                )
            ),

            // STARTUP INTEGRATION GUIDE
            h('div', { className: 'luna-section-card' },
                h('div', { style: { marginBottom: '14px' } },
                    h('h3', { style: { margin: 0, fontSize: '16px', fontWeight: 700, color: '#fff' } }, '🚀 Vor dem Serverstart ausführen'),
                    h('p', { style: { margin: '4px 0 0 0', fontSize: '13px', color: '#8b949e' } },
                        'Damit der Server vor dem Hochfahren automatisch nach neuen Builds sucht, setze einfach den Startup-Befehl in den Server-Einstellungen oder deinem Startskript:'
                    )
                ),

                h('div', { className: 'luna-code-box', style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' } },
                    h('code', { style: { color: '#818cf8', fontWeight: 600, wordBreak: 'break-all' } }, startupCommandSnippet),
                    h('button', {
                        type: 'button',
                        onClick: () => copyToClipboard(startupCommandSnippet, 'snippet'),
                        className: 'luna-btn-secondary',
                        style: { height: '30px', padding: '0 10px', fontSize: '11px', flexShrink: 0 }
                    }, copiedSnippet ? '✓ Kopiert' : 'Kopieren')
                ),

                h('div', { style: { marginTop: '12px', fontSize: '12px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px' } },
                    h('span', { style: { color: '#34d399', fontWeight: 700 } }, '💡 Ausfallsicher:'),
                    'Falls keine Internetverbindung besteht oder die API down ist, startet das Skript ohne Unterbrechung sofort die vorhandene server.jar.'
                )
            ),

            // BASH SOURCE CODE VIEWER
            h('div', { className: 'luna-section-card' },
                h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showScriptCode ? '14px' : '0' } },
                    h('div', null,
                        h('h3', { style: { margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' } }, '📄 Quellcode von autoupdate.sh'),
                        h('div', { style: { fontSize: '12px', color: '#8b949e', marginTop: '2px' } }, 'POSIX/Bash-kompatibel ohne externe Abhängigkeiten (kein jq nötig)')
                    ),
                    h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } },
                        h('button', {
                            type: 'button',
                            onClick: () => copyToClipboard(EMBEDDED_AUTOUPDATE_SCRIPT, 'script'),
                            className: 'luna-btn-secondary',
                            style: { height: '30px', padding: '0 10px', fontSize: '11px' }
                        }, copiedScript ? '✓ Skript kopiert' : 'Skript kopieren'),
                        h('button', {
                            type: 'button',
                            onClick: () => setShowScriptCode(!showScriptCode),
                            className: 'luna-btn-secondary',
                            style: { height: '30px', padding: '0 10px', fontSize: '11px' }
                        }, showScriptCode ? 'Verbergen' : 'Anzeigen')
                    )
                ),

                showScriptCode && h('div', { className: 'luna-code-box', style: { maxHeight: '350px', overflowY: 'auto' } },
                    h('pre', { style: { margin: 0, whiteSpace: 'pre-wrap', fontSize: '11px' } }, EMBEDDED_AUTOUPDATE_SCRIPT)
                )
            )
        ),

        // LUNA INSTALL MODAL
        modalSoftware && h('div', {
            className: 'luna-modal-overlay',
            onClick: (e) => { if (e.target === e.currentTarget) setModalSoftware(null); }
        },
            h('div', {
                className: 'luna-modal-card',
                onClick: (e) => e.stopPropagation()
            },
                h('div', { className: 'luna-modal-header' },
                    h('div', { className: 'luna-modal-title-row' },
                        h('img', {
                            src: modalSoftware.icon,
                            style: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }
                        }),
                        h('div', null,
                            h('h3', { style: { margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' } }, `Install ${modalSoftware.name}`),
                            h('div', { style: { fontSize: '12px', color: '#8b949e' } }, `Selected: ${modalSelectedVersion}`)
                        )
                    ),
                    h('button', {
                        type: 'button',
                        onClick: () => setModalSoftware(null),
                        style: { background: 'none', border: 'none', color: '#8b949e', fontSize: '20px', cursor: 'pointer', padding: '4px' }
                    }, '✕')
                ),

                h('div', { className: 'luna-modal-body' },
                    modalSoftwareVersions.length > 1 && h('div', { style: { marginBottom: '16px' } },
                        h(LunaSelect, {
                            label: 'Version wählen',
                            value: modalSelectedVersion,
                            options: modalSoftwareVersions.map(v => ({ value: v, label: v })),
                            onChange: val => {
                                setModalSelectedVersion(val);
                                fetchBuildDetails(modalSoftware.id, val);
                            }
                        })
                    ),

                    loadingBuild ? h('div', { style: { textAlign: 'center', padding: '30px 0', color: '#8b949e' } },
                        h('div', { style: { display: 'inline-block', width: '28px', height: '28px', border: '3px solid #5865F2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '8px' } }),
                        h('div', null, 'Lade Build-Details...')
                    ) :
                    !buildInfo ? h('div', { style: { textAlign: 'center', padding: '30px 0', color: '#f87171' } },
                        `Kein Build für ${modalSoftware.name} ${modalSelectedVersion} gefunden.`
                    ) : h('div', null,
                        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' } },
                            h('div', { style: { background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' } },
                                h('div', { style: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 } }, 'Build'),
                                h('div', { style: { fontSize: '15px', fontWeight: 700, color: '#34d399', marginTop: '4px' } }, buildInfo.name)
                            ),
                            h('div', { style: { background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' } },
                                h('div', { style: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 } }, 'File Size'),
                                h('div', { style: { fontSize: '15px', fontWeight: 700, color: '#fff', marginTop: '4px' } }, 
                                    buildInfo.size ? `${(buildInfo.size / (1024 * 1024)).toFixed(1)} MB` : 'Auto'
                                )
                            ),
                            h('div', { style: { background: '#11151e', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', padding: '12px' } },
                                h('div', { style: { fontSize: '11px', color: '#8b949e', textTransform: 'uppercase', fontWeight: 600 } }, 'Target File'),
                                h('div', { style: { fontSize: '15px', fontWeight: 700, color: '#5865F2', marginTop: '4px' } }, targetFilename)
                            )
                        ),

                        h('div', { style: { marginBottom: '16px' } },
                            h('label', { className: 'luna-label' }, 'Target Filename in Server Root'),
                            h('input', {
                                type: 'text',
                                value: targetFilename,
                                onChange: e => setTargetFilename(e.target.value),
                                className: 'luna-input'
                            })
                        ),

                        h('div', { style: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' } },
                            h('input', {
                                type: 'checkbox',
                                id: 'backup_check',
                                checked: backupExisting,
                                onChange: e => setBackupExisting(e.target.checked),
                                style: { width: '16px', height: '16px', cursor: 'pointer', accentColor: '#5865F2' }
                            }),
                            h('label', { htmlFor: 'backup_check', style: { fontSize: '13px', color: '#c9d1d9', cursor: 'pointer' } },
                                'Alte JAR vorher sichern (z. B. server.jar.bak)'
                            )
                        ),

                        h('button', {
                            type: 'button',
                            onClick: (e) => handleInstallJar(e),
                            disabled: installing,
                            className: 'luna-btn-install',
                            style: { width: '100%', height: '42px', fontSize: '13px' }
                        }, installing ? 'Wird auf Server installiert...' : `Server JAR installieren (${modalSoftware.name} ${modalSelectedVersion})`)
                    )
                )
            )
        )
    );
}

if (typeof window !== 'undefined') {
    window.MCJarsContainer = MCJarsContainer;
}
