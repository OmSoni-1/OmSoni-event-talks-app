// Application State
let appState = {
    updates: [],
    filteredUpdates: [],
    selectedUpdateId: null,
    searchQuery: '',
    selectedCategory: 'all',
    lastUpdatedTime: null
};

// UI Elements
const els = {
    btnRefresh: document.getElementById('btn-refresh'),
    refreshIcon: document.getElementById('refresh-icon'),
    lastUpdated: document.getElementById('last-updated'),
    searchInput: document.getElementById('search-input'),
    clearSearch: document.getElementById('clear-search'),
    categoryFilters: document.getElementById('category-filters'),
    loadingState: document.getElementById('loading-state'),
    errorState: document.getElementById('error-state'),
    errorMessage: document.getElementById('error-message'),
    btnRetry: document.getElementById('btn-retry'),
    emptyState: document.getElementById('empty-state'),
    btnResetSearch: document.getElementById('btn-reset-search'),
    releasesTimeline: document.getElementById('releases-timeline'),
    composerEmpty: document.getElementById('composer-empty-state'),
    composerActive: document.getElementById('composer-active-state'),
    composerCategoryBadge: document.getElementById('composer-category-badge'),
    composerDate: document.getElementById('composer-date'),
    tweetTextarea: document.getElementById('tweet-textarea'),
    tweetLinkPreview: document.getElementById('tweet-link-preview'),
    tweetUrlText: document.getElementById('tweet-url-text'),
    charCount: document.getElementById('char-count'),
    charWarningText: document.getElementById('char-warning-text'),
    progressCircle: document.getElementById('progress-circle'),
    btnCopyTweet: document.getElementById('btn-copy-tweet'),
    btnPostTweet: document.getElementById('btn-post-tweet'),
    btnDeselect: document.getElementById('btn-deselect'),
    toast: document.getElementById('toast'),
    toastMessage: document.getElementById('toast-message')
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    fetchReleaseNotes();
});

// Event Listeners Setup
function initEventListeners() {
    // Refresh & Retry
    els.btnRefresh.addEventListener('click', fetchReleaseNotes);
    els.btnRetry.addEventListener('click', fetchReleaseNotes);
    
    // Search
    els.searchInput.addEventListener('input', handleSearch);
    els.clearSearch.addEventListener('click', clearSearchInput);
    els.btnResetSearch.addEventListener('click', resetFiltersAndSearch);
    
    // Category Filters
    els.categoryFilters.addEventListener('click', handleCategoryFilter);
    
    // Composer Actions
    els.tweetTextarea.addEventListener('input', updateCharCount);
    els.btnDeselect.addEventListener('click', deselectUpdate);
    els.btnCopyTweet.addEventListener('click', copyTweetToClipboard);
    els.btnPostTweet.addEventListener('click', postTweetToTwitter);
}

// ==========================================
// API Operations
// ==========================================
async function fetchReleaseNotes() {
    showLoading(true);
    showError(false);
    deselectUpdate();

    // Start spinner animation
    els.btnRefresh.classList.add('spinning');
    
    try {
        const response = await fetch('/api/releases');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        if (result.status === 'success') {
            appState.updates = result.data;
            appState.filteredUpdates = [...appState.updates];
            
            // Update time
            const now = new Date();
            appState.lastUpdatedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            els.lastUpdated.textContent = `Updated at ${appState.lastUpdatedTime}`;
            
            // Render
            applyFiltersAndSearch();
            showToast('Release notes loaded successfully.');
        } else {
            throw new Error(result.message || 'Unknown backend error');
        }
    } catch (error) {
        console.error('Error fetching releases:', error);
        showError(true, error.message);
        els.lastUpdated.textContent = 'Failed to update';
    } finally {
        showLoading(false);
        // Stop spinner animation
        els.btnRefresh.classList.remove('spinning');
    }
}

// ==========================================
// Search & Filter Operations
// ==========================================
function handleSearch(e) {
    appState.searchQuery = e.target.value.trim().toLowerCase();
    els.clearSearch.style.display = appState.searchQuery ? 'block' : 'none';
    applyFiltersAndSearch();
}

function clearSearchInput() {
    els.searchInput.value = '';
    appState.searchQuery = '';
    els.clearSearch.style.display = 'none';
    applyFiltersAndSearch();
}

function handleCategoryFilter(e) {
    const button = e.target.closest('.filter-pill');
    if (!button) return;
    
    // Toggle active classes
    const pills = els.categoryFilters.querySelectorAll('.filter-pill');
    pills.forEach(pill => pill.classList.remove('active'));
    button.classList.add('active');
    
    appState.selectedCategory = button.dataset.category;
    applyFiltersAndSearch();
}

function resetFiltersAndSearch() {
    clearSearchInput();
    
    const pills = els.categoryFilters.querySelectorAll('.filter-pill');
    pills.forEach(pill => pill.classList.remove('active'));
    pills[0].classList.add('active'); // Set 'All' active
    appState.selectedCategory = 'all';
    
    applyFiltersAndSearch();
}

function applyFiltersAndSearch() {
    appState.filteredUpdates = appState.updates.filter(update => {
        // Filter by category
        const matchesCategory = appState.selectedCategory === 'all' || 
                                update.category.toLowerCase() === appState.selectedCategory.toLowerCase();
        
        // Filter by search query
        const matchesSearch = !appState.searchQuery || 
                              update.text_content.toLowerCase().includes(appState.searchQuery) ||
                              update.date.toLowerCase().includes(appState.searchQuery) ||
                              update.category.toLowerCase().includes(appState.searchQuery);
                              
        return matchesCategory && matchesSearch;
    });

    renderReleases();
}

// ==========================================
// Rendering Releases
// ==========================================
function renderReleases() {
    if (appState.filteredUpdates.length === 0) {
        els.releasesTimeline.style.display = 'none';
        els.emptyState.style.display = 'flex';
        return;
    }
    
    els.emptyState.style.display = 'none';
    els.releasesTimeline.innerHTML = '';
    
    // Group updates by date
    const groups = {};
    appState.filteredUpdates.forEach(update => {
        if (!groups[update.date]) {
            groups[update.date] = [];
        }
        groups[update.date].push(update);
    });
    
    // Render groups
    Object.keys(groups).forEach(date => {
        const dayGroup = document.createElement('div');
        dayGroup.className = 'day-group';
        
        const dayHeader = document.createElement('div');
        dayHeader.className = 'day-header';
        
        const dayTitle = document.createElement('span');
        dayTitle.className = 'day-title';
        dayTitle.textContent = date;
        
        const dayLine = document.createElement('div');
        dayLine.className = 'day-line';
        
        dayHeader.appendChild(dayTitle);
        dayHeader.appendChild(dayLine);
        dayGroup.appendChild(dayHeader);
        
        const dayUpdates = document.createElement('div');
        dayUpdates.className = 'day-updates';
        
        groups[date].forEach(update => {
            const card = document.createElement('div');
            card.className = `update-card ${appState.selectedUpdateId === update.id ? 'selected' : ''}`;
            card.dataset.id = update.id;
            card.dataset.category = update.category;
            
            card.innerHTML = `
                <div class="card-header">
                    <span class="badge">${update.category}</span>
                    <div class="card-date-meta">
                        <i class="fa-regular fa-clock"></i>
                        <span>${update.date}</span>
                    </div>
                </div>
                <div class="card-body">
                    ${update.html_content}
                </div>
                <div class="card-footer-action">
                    <span>Draft Tweet</span>
                    <i class="fa-solid fa-arrow-right"></i>
                </div>
            `;
            
            card.addEventListener('click', () => selectUpdate(update));
            dayUpdates.appendChild(card);
        });
        
        dayGroup.appendChild(dayUpdates);
        els.releasesTimeline.appendChild(dayGroup);
    });
    
    els.releasesTimeline.style.display = 'flex';
}

// ==========================================
// Selection & Tweet Composer
// ==========================================
function selectUpdate(update) {
    appState.selectedUpdateId = update.id;
    
    // Update active visual card state
    const cards = els.releasesTimeline.querySelectorAll('.update-card');
    cards.forEach(card => {
        if (card.dataset.id === update.id) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    // Show Composer State
    els.composerEmpty.style.display = 'none';
    els.composerActive.style.display = 'flex';
    
    // Populate Metadata
    els.composerCategoryBadge.textContent = update.category;
    // Set custom visual badge background
    els.composerCategoryBadge.className = 'badge';
    els.composerCategoryBadge.classList.add(`cat-${update.category.toLowerCase()}`);
    els.composerDate.textContent = update.date;
    
    // Draft tweet text
    // Format text nicely. Make sure it stays within limits.
    const hashtag = '#BigQuery';
    const tag2 = '#GoogleCloud';
    
    // We clean text further to fit. We take first 160 characters of description as a snippet.
    let cleanText = update.text_content;
    
    // Make a neat preview text.
    // If the text is too long, we truncate it with '...'
    const introText = `${update.category} (${update.date}): `;
    const linkText = `\n\nRead more: `; // We will append link at the end
    
    // Twitter link counts as 23 characters.
    // Standard limit is 280.
    // Available for text: 280 - (introText.length) - (linkText.length) - 23 - (hashtag.length + tag2.length + 2)
    const maxTextLength = 280 - introText.length - linkText.length - 23 - (hashtag.length + tag2.length + 2);
    
    let textSnippet = cleanText;
    if (textSnippet.length > maxTextLength) {
        textSnippet = textSnippet.substring(0, maxTextLength - 3) + '...';
    }
    
    const draftText = `${introText}${textSnippet}${linkText}${update.link}\n\n${hashtag} ${tag2}`;
    
    els.tweetTextarea.value = draftText;
    els.tweetUrlText.textContent = update.link;
    
    updateCharCount();
}

function deselectUpdate() {
    appState.selectedUpdateId = null;
    
    // Remove active class
    if (els.releasesTimeline) {
        const cards = els.releasesTimeline.querySelectorAll('.update-card');
        cards.forEach(card => card.classList.remove('selected'));
    }
    
    els.composerActive.style.display = 'none';
    els.composerEmpty.style.display = 'flex';
}

// Character Count calculation with Twitter URL Rules (URLs = 23 chars)
function getTwitterCharCount(text) {
    // Regex for matching URLs
    const urlRegex = /https?:\/\/[^\s]+/g;
    let urlMatches = text.match(urlRegex) || [];
    
    // Remove URLs from text to count other characters
    let textWithoutUrls = text.replace(urlRegex, '');
    
    // Total count = non-URL character length + (23 * number of URLs)
    let charCount = textWithoutUrls.length + (urlMatches.length * 23);
    return charCount;
}

function updateCharCount() {
    const text = els.tweetTextarea.value;
    const count = getTwitterCharCount(text);
    const limit = 280;
    const remaining = limit - count;
    
    els.charCount.textContent = remaining >= 0 ? remaining : Math.abs(remaining);
    
    // Circular Progress Bar animation
    const circle = els.progressCircle;
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    
    let percent = Math.min(count / limit, 1);
    const offset = circumference - (percent * circumference);
    circle.style.strokeDashoffset = offset;
    
    // Colors & Warnings
    if (remaining < 0) {
        circle.style.stroke = '#f43f5e'; // Rose
        els.charCount.style.color = '#f43f5e';
        els.charWarningText.textContent = 'Too long for a tweet!';
        els.charWarningText.className = 'warning-text danger';
        els.btnPostTweet.disabled = true;
        els.btnPostTweet.style.opacity = 0.5;
        els.btnPostTweet.style.cursor = 'not-allowed';
    } else if (remaining <= 20) {
        circle.style.stroke = '#eab308'; // Amber
        els.charCount.style.color = '#eab308';
        els.charWarningText.textContent = 'Nearing limit';
        els.charWarningText.className = 'warning-text';
        els.charWarningText.style.color = '#eab308';
        els.btnPostTweet.disabled = false;
        els.btnPostTweet.style.opacity = 1;
        els.btnPostTweet.style.cursor = 'pointer';
    } else {
        circle.style.stroke = '#1d9bf0'; // Twitter Blue
        els.charCount.style.color = 'var(--text-secondary)';
        els.charWarningText.textContent = '';
        els.btnPostTweet.disabled = false;
        els.btnPostTweet.style.opacity = 1;
        els.btnPostTweet.style.cursor = 'pointer';
    }
}

// Copy Tweet Text
function copyTweetToClipboard() {
    const text = els.tweetTextarea.value;
    navigator.clipboard.writeText(text).then(() => {
        showToast('Tweet copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showToast('Failed to copy to clipboard.');
    });
}

// Post Tweet to Twitter (Opens Web Intent)
function postTweetToTwitter() {
    const text = els.tweetTextarea.value;
    
    // Check limit
    if (getTwitterCharCount(text) > 280) {
        showToast('Tweet is too long to post!');
        return;
    }
    
    const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
}

// ==========================================
// UX Helpers
// ==========================================
function showLoading(isLoading) {
    els.loadingState.style.display = isLoading ? 'flex' : 'none';
}

function showError(isError, msg = '') {
    if (isError) {
        els.errorMessage.textContent = msg;
        els.errorState.style.display = 'flex';
        els.releasesTimeline.style.display = 'none';
    } else {
        els.errorState.style.display = 'none';
    }
}

function showToast(message) {
    els.toastMessage.textContent = message;
    els.toast.classList.add('show');
    
    setTimeout(() => {
        els.toast.classList.remove('show');
    }, 3000);
}
