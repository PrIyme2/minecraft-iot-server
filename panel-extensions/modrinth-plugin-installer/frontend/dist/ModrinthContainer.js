// BuiltByBit Luna Plugin Installer for Reviactyl
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
    height: 32px !important;
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

.luna-btn-update {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 4px !important;
    background-color: #23a55a !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    padding: 0 10px !important;
    height: 32px !important;
    font-size: 11px !important;
    font-weight: 600 !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    outline: none !important;
}

.luna-btn-update:hover {
    background-color: #1ca553 !important;
}

.luna-btn-delete {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    background-color: #da373c !important;
    color: #ffffff !important;
    border: none !important;
    border-radius: 8px !important;
    width: 32px !important;
    height: 32px !important;
    font-size: 12px !important;
    cursor: pointer !important;
    transition: all 0.15s ease !important;
    outline: none !important;
}

.luna-btn-delete:hover {
    background-color: #ba2d31 !important;
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

.luna-version-row {
    background-color: #11151e !important;
    border: 1px solid rgba(255, 255, 255, 0.06) !important;
    border-radius: 10px !important;
    padding: 14px 16px !important;
    margin-bottom: 10px !important;
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    transition: all 0.15s ease !important;
}

.luna-version-row:hover {
    border-color: rgba(255, 255, 255, 0.16) !important;
    background-color: #141924 !important;
}

.luna-tag {
    font-size: 10px !important;
    font-weight: 600 !important;
    background-color: rgba(255, 255, 255, 0.06) !important;
    color: #8b949e !important;
    border-radius: 4px !important;
    padding: 2px 6px !important;
    margin-right: 4px !important;
    display: inline-block !important;
}

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


// Universal Sidebar & Navigation Enhancer for Reviactyl
(function() {
    const SERVER_SOFTWARE_ICON = `<svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor" class="rext-sidebar-icon-svg" style="display:inline-block;vertical-align:middle;" aria-hidden="true"><path d="M64 32C28.7 32 0 60.7 0 96v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V96c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0zM64 288c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V352c0-35.3-28.7-64-64-64H64zm280 72a24 24 0 1 1 0 48 24 24 0 1 1 0-48zm48 24a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z"/></svg>`;

    const PLUGINS_ICON = `<svg width="16" height="16" viewBox="0 0 512 512" fill="currentColor" class="rext-sidebar-icon-svg" style="display:inline-block;vertical-align:middle;" aria-hidden="true"><path d="M512 96c0 53-43 96-96 96H384v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V192h-32c-53 0-96-43-96-96s43-96 96-96h32V0c0 17.7 14.3 32 32 32s32-14.3 32-32V0h32c53 0 96 43 96 96zM192 288H96c-53 0-96 43-96 96s43 96 96 96h32v32c0 17.7 14.3 32 32 32s32-14.3 32-32V480h32c53 0 96-43 96-96s-43-96-96-96zm64 64c0 17.7-14.3 32-32 32s-32-14.3-32-32V320c-17.7 0-32-14.3-32-32s14.3-32 32-32h32v-32c0-17.7 14.3-32 32-32s32 14.3 32 32v32h32c17.7 0 32 14.3 32 32s-14.3 32-32 32H256v32z"/></svg>`;

    function enhanceElement(link, iconSvg, label) {
        if (!link) return;

        // 1. Text replacement
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

        // 2. Icon injection
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
            // Enhance MCJars -> Server Software
            const mcLinks = document.querySelectorAll('a[href*="/mcjars"], a[href$="mcjars"], a[data-pyro*="mcjar"]');
            mcLinks.forEach(link => enhanceElement(link, SERVER_SOFTWARE_ICON, 'Server Software'));

            // Enhance Plugins
            const plugLinks = document.querySelectorAll('a[href*="/plugins/modrinth"], a[href*="/modrinth"], a[data-pyro*="modrinth"]');
            plugLinks.forEach(link => enhanceElement(link, PLUGINS_ICON, null));
        } catch(e) {}
    }

    if (typeof window !== 'undefined') {
        window.__reviactylEnhanceSidebar = runEnhancer;
        runEnhancer();
        [50, 150, 300, 600, 1200, 2500, 5000].forEach(ms => setTimeout(runEnhancer, ms));
        
        if (typeof MutationObserver !== 'undefined') {
            const obs = new MutationObserver(runEnhancer);
            if (document.body) {
                obs.observe(document.body, { childList: true, subtree: true });
            } else {
                window.addEventListener('DOMContentLoaded', () => {
                    if (document.body) obs.observe(document.body, { childList: true, subtree: true });
                });
            }
        }
    }
})();

function useSidebarEnhancer() {
    useEffect(() => {
        if (typeof window !== 'undefined' && window.__reviactylEnhanceSidebar) {
            window.__reviactylEnhanceSidebar();
            const id = setInterval(window.__reviactylEnhanceSidebar, 2000);
            return () => clearInterval(id);
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

export default function ModrinthContainer() {
    useSidebarEnhancer();
    const [platform, setPlatform] = useState('modrinth');
    const [gameVersion, setGameVersion] = useState('all');
    const [availableVersions, setAvailableVersions] = useState(DEFAULT_MC_VERSIONS);
    const [loader, setLoader] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const [plugins, setPlugins] = useState([]);
    const [installedFiles, setInstalledFiles] = useState([]);
    const [detectedServerVersion, setDetectedServerVersion] = useState(null);
    const [loading, setLoading] = useState(false);
    const [statusMsg, setStatusMsg] = useState(null);
    const [installingId, setInstallingId] = useState(null);

    const [versionModalProject, setVersionModalProject] = useState(null);
    const [projectVersions, setProjectVersions] = useState([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [versionSearch, setVersionSearch] = useState('');

    const cacheRef = useRef(new Map());
    const debounceTimerRef = useRef(null);
    const abortControllerRef = useRef(null);

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
        if (plain) {
            headers['X-CSRF-TOKEN'] = plain;
        }
        if (xsrfCookie && !plain) {
            headers['X-XSRF-TOKEN'] = xsrfCookie;
        }

        if (window.axios?.defaults?.headers?.common) {
            const ax = window.axios.defaults.headers.common;
            if (ax['X-CSRF-TOKEN']) headers['X-CSRF-TOKEN'] = ax['X-CSRF-TOKEN'];
            if (ax['X-XSRF-TOKEN']) headers['X-XSRF-TOKEN'] = ax['X-XSRF-TOKEN'];
            if (ax['Authorization']) headers['Authorization'] = ax['Authorization'];
        }

        return headers;
    }, []);

    const ensurePluginsDir = useCallback(async (sId) => {
        if (!sId) return;
        try {
            await fetch(`/api/client/servers/${sId}/files/create-folder`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ root: '/', name: 'plugins' })
            });
        } catch(e) {}
    }, [getAuthHeaders]);

    // A. Detect server Minecraft version
    useEffect(() => {
        if (!serverId) return;
        fetch(`/api/client/servers/${serverId}`, { credentials: 'include', headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' } })
            .then(res => res.json())
            .then(data => {
                const vars = data?.attributes?.relationships?.variables?.data || [];
                for (const v of vars) {
                    const name = (v?.attributes?.env_variable || '').toUpperCase();
                    const val = v?.attributes?.server_value || v?.attributes?.default_value;
                    if ((name === 'MINECRAFT_VERSION' || name === 'SERVER_VERSION' || name === 'VERSION' || name === 'MC_VERSION') && val) {
                        const cleanVal = val.trim();
                        if (/^1\.\d+(\.\d+)?$/.test(cleanVal) || /^2\d+(\.\d+)?$/.test(cleanVal)) {
                            setDetectedServerVersion(cleanVal);
                            break;
                        }
                    }
                }
            })
            .catch(() => {});
    }, [serverId]);

    // B. Fetch real versions from Modrinth API
    useEffect(() => {
        fetch('https://api.modrinth.com/v2/tag/game_version')
            .then(res => res.json())
            .then(tags => {
                if (Array.isArray(tags)) {
                    const releases = tags
                        .filter(t => t.version_type === 'release')
                        .map(t => t.version);
                    if (releases.length > 0) {
                        setAvailableVersions(releases);
                    }
                }
            })
            .catch(() => {});
    }, []);

    // C. Fetch Installed Plugins in /plugins
    const fetchInstalled = useCallback(() => {
        if (!serverId) return;
        fetch(`/api/client/servers/${serverId}/files/list?directory=%2Fplugins`, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            credentials: 'include'
        })
            .then(res => res.json())
            .then(data => {
                if (data && Array.isArray(data.data)) {
                    const files = data.data
                        .map(f => f.attributes)
                        .filter(a => a && !a.is_directory && a.name.endsWith('.jar'));
                    setInstalledFiles(files);
                }
            })
            .catch(() => setInstalledFiles([]));
    }, [serverId]);

    useEffect(() => {
        fetchInstalled();
    }, [fetchInstalled]);

    const isPluginInstalled = useCallback((plugin) => {
        if (!installedFiles.length) return { installed: false };
        const pSlug = (plugin.slug || plugin.id || '').toLowerCase();
        const pTitle = (plugin.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');

        for (const file of installedFiles) {
            const fName = file.name.toLowerCase().replace('.jar', '');
            const cleanFName = fName.replace(/[^a-z0-9]/g, '');
            if (cleanFName.includes(pSlug) || (pTitle.length >= 4 && cleanFName.includes(pTitle))) {
                return { installed: true, filename: file.name };
            }
        }
        return { installed: false };
    }, [installedFiles]);

    // D. Search with Debounce and AbortController
    const executeSearch = useCallback((pPlatform, pQuery, pLoader, pVersion) => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        const controller = new AbortController();
        abortControllerRef.current = controller;

        const cacheKey = `${pPlatform}:${pQuery}:${pLoader}:${pVersion}`;
        if (cacheRef.current.has(cacheKey)) {
            setPlugins(cacheRef.current.get(cacheKey));
            setLoading(false);
            return;
        }

        setLoading(true);

        if (pPlatform === 'modrinth') {
            const facets = [["project_type:plugin"]];
            if (pVersion && pVersion !== 'all') {
                facets.push([`versions:${pVersion}`]);
            }
            if (pLoader && pLoader !== 'all') {
                facets.push([`categories:${pLoader}`]);
            }

            const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(pQuery)}&facets=${encodeURIComponent(JSON.stringify(facets))}&limit=32&index=downloads`;

            fetch(url, { signal: controller.signal })
                .then(res => res.json())
                .then(data => {
                    const hits = (data.hits || []).map(h => ({
                        id: h.project_id,
                        slug: h.slug,
                        title: h.title,
                        author: h.author,
                        description: h.description,
                        icon_url: h.icon_url,
                        downloads: h.downloads,
                        external_url: `https://modrinth.com/plugin/${h.slug}`,
                        platform: 'modrinth'
                    }));
                    cacheRef.current.set(cacheKey, hits);
                    setPlugins(hits);
                })
                .catch(err => {
                    if (err.name !== 'AbortError') setPlugins([]);
                })
                .finally(() => setLoading(false));
        } else if (pPlatform === 'spigot') {
            const spigotUrl = pQuery 
                ? `https://api.spiget.org/v2/search/resources/${encodeURIComponent(pQuery)}?size=32&sort=-downloads`
                : `https://api.spiget.org/v2/resources/free?size=32&sort=-downloads`;

            fetch(spigotUrl, { signal: controller.signal })
                .then(res => res.json())
                .then(data => {
                    const items = (Array.isArray(data) ? data : []).map(item => ({
                        id: String(item.id),
                        slug: String(item.id),
                        title: item.name,
                        author: item.author ? ('Spigot #' + item.author.id) : 'Spigot Author',
                        description: item.tag || 'Spigot Plugin',
                        icon_url: item.icon?.url ? ('https://www.spigotmc.org/' + item.icon.url) : null,
                        downloads: item.downloads || 0,
                        external_url: `https://www.spigotmc.org/resources/${item.id}/`,
                        platform: 'spigot'
                    }));
                    cacheRef.current.set(cacheKey, items);
                    setPlugins(items);
                })
                .catch(err => {
                    if (err.name !== 'AbortError') setPlugins([]);
                })
                .finally(() => setLoading(false));
        } else if (pPlatform === 'hangar') {
            const hangarUrl = `https://hangar.papermc.io/api/v1/projects?limit=32&q=${encodeURIComponent(pQuery)}`;
            fetch(hangarUrl, { signal: controller.signal })
                .then(res => res.json())
                .then(data => {
                    const items = (data.result || []).map(item => ({
                        id: item.namespace?.slug || item.name,
                        slug: item.namespace?.slug || item.name,
                        title: item.name,
                        author: item.namespace?.owner || 'PaperMC',
                        description: item.description || 'PaperMC Hangar Plugin',
                        icon_url: item.avatarUrl || null,
                        downloads: item.stats?.downloads || 0,
                        external_url: `https://hangar.papermc.io/${item.namespace?.owner}/${item.namespace?.slug}`,
                        platform: 'hangar'
                    }));
                    cacheRef.current.set(cacheKey, items);
                    setPlugins(items);
                })
                .catch(err => {
                    if (err.name !== 'AbortError') setPlugins([]);
                })
                .finally(() => setLoading(false));
        } else if (pPlatform === 'curseforge') {
            setPlugins([]);
            setLoading(false);
            setStatusMsg({ type: 'error', text: 'CurseForge API erfordert Drittanbieter-Schlüssel. Bitte Modrinth oder Spigot nutzen.' });
        }
    }, []);

    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            executeSearch(platform, searchQuery, loader, gameVersion);
        }, 200);

        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [platform, searchQuery, loader, gameVersion, executeSearch]);

    const handleInstallDirect = async (plugin, specificVersion = null, e = null) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!serverId) {
            setStatusMsg({ type: 'error', text: 'Server-ID konnte nicht erkannt werden.' });
            return;
        }

        setInstallingId(plugin.id);
        setStatusMsg(null);

        try {
            await ensurePluginsDir(serverId);

            let downloadUrl = '';
            let filename = '';

            if (plugin.platform === 'spigot') {
                downloadUrl = `https://api.spiget.org/v2/resources/${plugin.id}/download`;
                filename = `${plugin.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.jar`;
            } else if (plugin.platform === 'hangar') {
                const vRes = await fetch(`https://hangar.papermc.io/api/v1/projects/${plugin.slug}/versions?limit=1`);
                const vData = await vRes.json();
                const ver = vData.result?.[0];
                if (!ver) throw new Error('Kein Release auf Hangar gefunden.');
                downloadUrl = `https://hangar.papermc.io/api/v1/projects/${plugin.slug}/versions/${ver.name}/PAPER/download`;
                filename = `${plugin.title.replace(/[^a-zA-Z0-9_-]/g, '_')}-${ver.name}.jar`;
            } else {
                let targetVer = specificVersion;
                if (!targetVer) {
                    const vRes = await fetch(`https://api.modrinth.com/v2/project/${plugin.id}/version`);
                    let vList = await vRes.json();
                    if (!Array.isArray(vList) || vList.length === 0) {
                        throw new Error('Kein kompatibler Build auf Modrinth gefunden.');
                    }
                    const matched = vList.find(v => 
                        (!gameVersion || gameVersion === 'all' || (v.game_versions || []).includes(gameVersion)) &&
                        (!loader || loader === 'all' || (v.loaders || []).includes(loader))
                    );
                    targetVer = matched || vList[0];
                }

                const targetFile = (targetVer.files || []).find(f => f.primary) || (targetVer.files || [])[0];
                if (!targetFile?.url) throw new Error('Download URL im Release nicht vorhanden.');
                downloadUrl = targetFile.url;
                filename = targetFile.filename;
            }

            if (downloadUrl.startsWith('http://')) {
                downloadUrl = 'https://' + downloadUrl.slice(7);
            }

            const payload = {
                url: downloadUrl,
                directory: '/plugins',
                filename: filename
            };

            const res = await fetch(`/api/client/servers/${serverId}/files/pull`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setStatusMsg({ type: 'success', text: `✓ ${filename} wird im Hintergrund nach /plugins geladen!` });
                setTimeout(fetchInstalled, 1500);
                if (versionModalProject) setVersionModalProject(null);
            } else {
                const text = await res.text();
                let errDetail = '';
                try {
                    const j = JSON.parse(text);
                    errDetail = j?.errors?.[0]?.detail || j?.error || j?.message || '';
                } catch(e) {}
                setStatusMsg({ type: 'error', text: `Fehler beim Installieren: ${errDetail || ('HTTP ' + res.status)}` });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        } finally {
            setInstallingId(null);
        }
    };

    const handleUninstall = async (filename, e = null) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (!serverId) return;
        if (!confirm(`Möchtest du "${filename}" wirklich aus /plugins entfernen?`)) return;

        try {
            const res = await fetch(`/api/client/servers/${serverId}/files/delete`, {
                method: 'POST',
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ root: '/plugins', files: [filename] })
            });

            if (res.ok) {
                setStatusMsg({ type: 'success', text: `✓ ${filename} wurde erfolgreich gelöscht.` });
                setInstalledFiles(prev => prev.filter(f => f.name !== filename));
            } else {
                const text = await res.text();
                let errDetail = '';
                try {
                    const j = JSON.parse(text);
                    errDetail = j?.errors?.[0]?.detail || j?.error || '';
                } catch(e) {}
                setStatusMsg({ type: 'error', text: `Löschen fehlgeschlagen: ${errDetail || ('HTTP ' + res.status)}` });
            }
        } catch (err) {
            setStatusMsg({ type: 'error', text: err.message });
        }
    };

    const openVersionModal = (plugin, e = null) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        setVersionModalProject(plugin);
        setLoadingVersions(true);
        setProjectVersions([]);
        setVersionSearch('');

        if (plugin.platform === 'modrinth') {
            fetch(`https://api.modrinth.com/v2/project/${plugin.id}/version`)
                .then(res => res.json())
                .then(data => {
                    setProjectVersions(Array.isArray(data) ? data : []);
                })
                .catch(() => setProjectVersions([]))
                .finally(() => setLoadingVersions(false));
        } else {
            setLoadingVersions(false);
        }
    };

    const formatDownloads = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toLocaleString();
    };

    const filteredVersions = useMemo(() => {
        if (!versionSearch) return projectVersions;
        const q = versionSearch.toLowerCase();
        return projectVersions.filter(v => 
            (v.version_number || '').toLowerCase().includes(q) ||
            (v.name || '').toLowerCase().includes(q) ||
            (v.game_versions || []).some(gv => gv.toLowerCase().includes(q))
        );
    }, [projectVersions, versionSearch]);

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
        h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' } },
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '14px' } },
                h('div', { style: { width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', flexShrink: 0 } },
                    h('svg', { width: '22', height: '22', viewBox: '0 0 512 512', fill: 'currentColor' },
                        h('path', { d: 'M512 96c0 53-43 96-96 96H384v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V192h-32c-53 0-96-43-96-96s43-96 96-96h32V0c0 17.7 14.3 32 32 32s32-14.3 32-32V0h32c53 0 96 43 96 96zM192 288H96c-53 0-96 43-96 96s43 96 96 96h32v32c0 17.7 14.3 32 32 32s32-14.3 32-32V480h32c53 0 96-43 96-96s-43-96-96-96zm64 64c0 17.7-14.3 32-32 32s-32-14.3-32-32V320c-17.7 0-32-14.3-32-32s14.3-32 32-32h32v-32c0-17.7 14.3-32 32-32s32 14.3 32 32v32h32c17.7 0 32 14.3 32 32s-14.3 32-32 32H256v32z' })
                    )
                ),
                h('div', null,
                    h('h1', { style: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#ffffff', letterSpacing: '-0.01em' } }, 'Plugins'),
                    h('p', { style: { margin: '3px 0 0 0', fontSize: '13px', color: '#8b949e' } }, 'Discover and install plugins directly to your server (Modrinth, Spigot, Hangar)')
                )
            ),
            h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '6px 14px', borderRadius: '8px', fontSize: '12px', color: '#34d399', fontWeight: 600 } },
                h('span', null, `${installedFiles ? installedFiles.length : 0} Installed`)
            )
        ),

        // TOP CONTROLS (Custom Luna Dropdowns)
        h('div', { className: 'luna-controls' },
            h(LunaSelect, {
                label: 'Platform',
                value: platform,
                options: [
                    { value: 'modrinth', label: 'Modrinth' },
                    { value: 'spigot', label: 'Spigot' },
                    { value: 'hangar', label: 'Hangar' },
                    { value: 'curseforge', label: 'CurseForge' }
                ],
                onChange: val => setPlatform(val)
            }),

            h(LunaSelect, {
                label: 'Minecraft Version',
                value: gameVersion,
                options: [
                    { value: 'all', label: 'All Versions' },
                    ...availableVersions.map(v => ({
                        value: v,
                        label: v === detectedServerVersion ? `${v} (Server)` : v
                    }))
                ],
                onChange: val => setGameVersion(val)
            }),

            h(LunaSelect, {
                label: 'Loader',
                value: loader,
                options: [
                    { value: 'all', label: 'All Loaders' },
                    { value: 'paper', label: 'Paper' },
                    { value: 'purpur', label: 'Purpur' },
                    { value: 'spigot', label: 'Spigot' },
                    { value: 'fabric', label: 'Fabric' },
                    { value: 'velocity', label: 'Velocity' },
                    { value: 'bungeecord', label: 'BungeeCord' },
                    { value: 'neoforge', label: 'NeoForge' },
                    { value: 'forge', label: 'Forge' }
                ],
                onChange: val => setLoader(val)
            }),

            h('div', { className: 'luna-control-item' },
                h('label', { className: 'luna-label' }, 'Search'),
                h('div', { className: 'luna-input-box' },
                    h('input', {
                        type: 'text',
                        value: searchQuery,
                        onChange: e => setSearchQuery(e.target.value),
                        placeholder: 'Search plugins...',
                        className: 'luna-input'
                    })
                )
            )
        ),

        // CARD GRID
        loading ? h('div', { style: { textAlign: 'center', padding: '60px 0', color: '#8b949e' } },
            h('div', { style: { display: 'inline-block', width: '32px', height: '32px', border: '3px solid #5865F2', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', marginBottom: '12px' } }),
            h('div', { style: { fontSize: '13px' } }, 'Loading plugins...')
        ) : plugins.length === 0 ? h('div', { style: { textAlign: 'center', padding: '60px 0', color: '#8b949e', backgroundColor: '#161b24', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' } },
            'No plugins found for current filters.'
        ) : h('div', { className: 'luna-grid' },
            plugins.map(plugin => {
                const { installed, filename } = isPluginInstalled(plugin);
                const isInstalling = installingId === plugin.id;

                return h('div', { key: plugin.id, className: 'luna-card' },
                    h('div', null,
                        h('div', { className: 'luna-card-header' },
                            h('img', {
                                src: plugin.icon_url || 'https://assets.modrinth.com/placeholder.svg',
                                alt: plugin.title,
                                className: 'luna-card-icon',
                                onError: (e) => { e.target.src = 'https://assets.modrinth.com/placeholder.svg'; }
                            }),
                            h('div', {
                                className: 'luna-card-title-wrap',
                                onClick: (e) => openVersionModal(plugin, e)
                            },
                                h('h3', { className: 'luna-card-title', title: plugin.title }, plugin.title),
                                h('div', { className: 'luna-card-author' }, `by ${plugin.author}`)
                            )
                        ),
                        h('p', { className: 'luna-card-desc', title: plugin.description },
                            plugin.description || 'No description provided.'
                        )
                    ),

                    h('div', { className: 'luna-card-footer' },
                        h('div', { className: 'luna-card-downloads' },
                            h('svg', { width: '13', height: '13', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                                h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }),
                                h('polyline', { points: '7 10 12 15 17 10' }),
                                h('line', { x1: '12', y1: '15', x2: '12', y2: '3' })
                            ),
                            h('span', null, formatDownloads(plugin.downloads))
                        ),

                        h('div', { className: 'luna-card-actions' },
                            h('a', {
                                href: plugin.external_url,
                                target: '_blank',
                                rel: 'noreferrer',
                                title: 'Open on ' + plugin.platform,
                                className: 'luna-btn-link',
                                onClick: (e) => e.stopPropagation()
                            },
                                h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                                    h('path', { d: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6' }),
                                    h('polyline', { points: '15 3 21 3 21 9' }),
                                    h('line', { x1: '10', y1: '14', x2: '21', y2: '3' })
                                )
                            ),

                            installed ? h(React.Fragment, null,
                                h('button', {
                                    type: 'button',
                                    onClick: (e) => openVersionModal(plugin, e),
                                    className: 'luna-btn-update'
                                },
                                    h('svg', { width: '13', height: '13', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2.5' },
                                        h('line', { x1: '12', y1: '19', x2: '12', y2: '5' }),
                                        h('polyline', { points: '5 12 12 5 19 12' })
                                    ),
                                    'Update'
                                ),
                                h('button', {
                                    type: 'button',
                                    onClick: (e) => handleUninstall(filename, e),
                                    title: `Delete ${filename}`,
                                    className: 'luna-btn-delete'
                                },
                                    h('svg', { width: '14', height: '14', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
                                        h('polyline', { points: '3 6 5 6 21 6' }),
                                        h('path', { d: 'M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2' })
                                    )
                                )
                            ) : h('button', {
                                type: 'button',
                                onClick: (e) => handleInstallDirect(plugin, null, e),
                                disabled: isInstalling,
                                className: 'luna-btn-install'
                            }, isInstalling ? 'Installing...' : 'Install')
                        )
                    )
                );
            })
        ),

        // VERSION MODAL
        versionModalProject && h('div', {
            className: 'luna-modal-overlay',
            onClick: (e) => { if (e.target === e.currentTarget) setVersionModalProject(null); }
        },
            h('div', {
                className: 'luna-modal-card',
                onClick: (e) => e.stopPropagation()
            },
                h('div', { className: 'luna-modal-header' },
                    h('div', { className: 'luna-modal-title-row' },
                        h('img', {
                            src: versionModalProject.icon_url || 'https://assets.modrinth.com/placeholder.svg',
                            style: { width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }
                        }),
                        h('div', null,
                            h('h3', { style: { margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' } }, versionModalProject.title),
                            h('div', { style: { fontSize: '12px', color: '#8b949e' } }, 'Select a version to install')
                        )
                    ),
                    h('button', {
                        type: 'button',
                        onClick: () => setVersionModalProject(null),
                        style: { background: 'none', border: 'none', color: '#8b949e', fontSize: '20px', cursor: 'pointer', padding: '4px' }
                    }, '✕')
                ),

                h('div', { style: { padding: '14px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)' } },
                    h('input', {
                        type: 'text',
                        value: versionSearch,
                        onChange: e => setVersionSearch(e.target.value),
                        placeholder: 'Search versions...',
                        className: 'luna-input'
                    })
                ),

                h('div', { className: 'luna-modal-body' },
                    loadingVersions ? h('div', { style: { textAlign: 'center', padding: '40px 0', color: '#8b949e' } }, 'Loading release versions...') :
                    filteredVersions.length === 0 ? h('div', { style: { textAlign: 'center', padding: '40px 0', color: '#8b949e' } },
                        versionModalProject.platform === 'spigot' 
                            ? h('div', null,
                                h('p', null, 'Spigot Direct Download ist bereit.'),
                                h('button', {
                                    type: 'button',
                                    onClick: (e) => handleInstallDirect(versionModalProject, null, e),
                                    className: 'luna-btn-install',
                                    style: { marginTop: '12px' }
                                }, 'Latest Version Installieren')
                            )
                            : 'No matching versions found.'
                    ) :
                    filteredVersions.slice(0, 25).map(ver => {
                        const dateStr = ver.date_published ? new Date(ver.date_published).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                        const isInstalling = installingId === versionModalProject.id;

                        return h('div', { key: ver.id, className: 'luna-version-row' },
                            h('div', { style: { flex: 1, minWidth: 0, marginRight: '16px' } },
                                h('div', { style: { fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' } }, ver.version_number || ver.name),
                                h('div', { style: { fontSize: '11px', color: '#8b949e', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' } },
                                    dateStr && h('span', null, '📅 ' + dateStr),
                                    ver.downloads > 0 && h('span', null, '⬇ ' + formatDownloads(ver.downloads)),
                                    (ver.game_versions || []).slice(0, 4).map(gv => h('span', { key: gv, className: 'luna-tag' }, gv)),
                                    (ver.game_versions || []).length > 4 && h('span', { className: 'luna-tag' }, `+${ver.game_versions.length - 4}`)
                                )
                            ),
                            h('button', {
                                type: 'button',
                                onClick: (e) => handleInstallDirect(versionModalProject, ver, e),
                                disabled: isInstalling,
                                className: 'luna-btn-install'
                            }, isInstalling ? 'Installing...' : 'Install')
                        );
                    })
                )
            )
        )
    );
}

if (typeof window !== 'undefined') {
    window.ModrinthContainer = ModrinthContainer;
}
