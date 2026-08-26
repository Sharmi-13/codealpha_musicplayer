/* ==========================================================================
   MUSICLUB CORE JAVASCRIPT CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ==========================================================================
  // 1. CENTRALIZED MUSIC DATA
  // ==========================================================================
  const songs = [
    {
      id: "1",
      title: "Death Bed",
      artist: "Powfu",
      album: "Some Coffee Beans",
      artwork: "https://samplesongs.netlify.app/album-arts/death-bed.jpg",
      url: "https://samplesongs.netlify.app/Death%20Bed.mp3",
      duration: "2:53",
      durationSeconds: 173
    },
    {
      id: "2",
      title: "Bad Liar",
      artist: "Imagine Dragons",
      album: "Origins",
      artwork: "https://samplesongs.netlify.app/album-arts/bad-liar.jpg",
      url: "https://samplesongs.netlify.app/Bad%20Liar.mp3",
      duration: "4:20",
      durationSeconds: 260
    },
    {
      id: "3",
      title: "Faded",
      artist: "Alan Walker",
      album: "Different World",
      artwork: "https://samplesongs.netlify.app/album-arts/faded.jpg",
      url: "https://samplesongs.netlify.app/Faded.mp3",
      duration: "3:32",
      durationSeconds: 212
    },
    {
      id: "4",
      title: "Hate Me",
      artist: "Ellie Goulding",
      album: "Brightest Blue",
      artwork: "https://samplesongs.netlify.app/album-arts/hate-me.jpg",
      url: "https://samplesongs.netlify.app/Hate%20Me.mp3",
      duration: "3:06",
      durationSeconds: 186
    },
    {
      id: "5",
      title: "Solo",
      artist: "Clean Bandit",
      album: "What Is Love?",
      artwork: "https://samplesongs.netlify.app/album-arts/solo.jpg",
      url: "https://samplesongs.netlify.app/Solo.mp3",
      duration: "3:43",
      durationSeconds: 223
    },
    {
      id: "6",
      title: "Without Me",
      artist: "Halsey",
      album: "Manic",
      artwork: "https://samplesongs.netlify.app/album-arts/without-me.jpg",
      url: "https://samplesongs.netlify.app/Without%20Me.mp3",
      duration: "3:48",
      durationSeconds: 228
    },
    {
      id: "7",
      title: "Broken Symphony (Demo Error)",
      artist: "Glitch Master",
      album: "Hardware Failures",
      artwork: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&q=80",
      url: "https://samplesongs.netlify.app/broken-file-404.mp3", // Broken link to demonstrate error handling
      duration: "1:15",
      durationSeconds: 75
    }
  ];

  // Curated Playlists mapping to song IDs
  const playlists = {
    "Chill Vibes": ["1", "6"],
    "Daily Mix": ["2", "4", "5"],
    "Focus Flow": ["3", "1"],
    "Late Night": ["1", "3", "6"],
    "Weekend Energy": ["2", "4", "5", "7"] // Includes the broken track for demonstration
  };

  // Playlists description and artwork details
  const playlistMetadata = {
    "Chill Vibes": {
      desc: "Relaxing acoustic rhythms, indie vibes, and soft background tones.",
      artwork: "https://samplesongs.netlify.app/album-arts/death-bed.jpg"
    },
    "Daily Mix": {
      desc: "A custom mix of pop and alternative hits curated just for you.",
      artwork: "https://samplesongs.netlify.app/album-arts/bad-liar.jpg"
    },
    "Focus Flow": {
      desc: "Electronic and ambient tunes to keep your concentration locked in.",
      artwork: "https://samplesongs.netlify.app/album-arts/faded.jpg"
    },
    "Late Night": {
      desc: "Deep beats, moody melodies, and synths for the night owl.",
      artwork: "https://samplesongs.netlify.app/album-arts/without-me.jpg"
    },
    "Weekend Energy": {
      desc: "High-tempo tracks and electronic anthems to kick off your weekend.",
      artwork: "https://samplesongs.netlify.app/album-arts/solo.jpg"
    }
  };

  // ==========================================================================
  // 2. PLAYER STATE MANAGEMENT
  // ==========================================================================
  let currentSong = null;
  let activePlaylistId = null; // Name of playlist, or 'all', 'favorites' etc.
  let queue = [...songs];      // Active queue list
  let queueIndex = 0;          // Current position in queue
  let isPlaying = false;
  let isMuted = false;
  let volume = 0.7;
  try {
    const savedVol = localStorage.getItem('musiclub-volume');
    if (savedVol !== null) volume = parseFloat(savedVol);
  } catch (e) {
    console.warn("Failed to read volume from localStorage", e);
  }
  let previousVolume = volume;

  let favorites = [];
  try {
    const savedFavs = localStorage.getItem('musiclub-favorites');
    if (savedFavs) favorites = JSON.parse(savedFavs);
    if (!Array.isArray(favorites)) favorites = [];
  } catch (e) {
    console.warn("Failed to read favorites from localStorage", e);
    favorites = [];
  }

  let recentlyPlayed = [];
  try {
    const savedRecently = localStorage.getItem('musiclub-recently');
    if (savedRecently) recentlyPlayed = JSON.parse(savedRecently);
    if (!Array.isArray(recentlyPlayed)) recentlyPlayed = [];
  } catch (e) {
    console.warn("Failed to read recentlyPlayed from localStorage", e);
    recentlyPlayed = [];
  }

  // HTML5 Audio instance
  const audio = new Audio();
  audio.volume = volume;

  // View state tracking
  let currentView = 'home';
  let activeLibraryTab = 'playlists';
  let isDraggingProgress = false;

  // ==========================================================================
  // 3. DOM ELEMENT SELECTORS
  // ==========================================================================
  // Navigation
  const sidebarPlaylistList = document.getElementById('sidebar-playlist-list');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const viewSections = document.querySelectorAll('.view-section');
  const logoBtn = document.getElementById('logo-btn');
  const searchInput = document.getElementById('search-input');
  const searchClearBtn = document.getElementById('search-clear-btn');
  const searchResultsView = document.getElementById('search-results-view');
  const searchResultsContainer = document.getElementById('search-results-container');

  // Home view containers
  const greetingEl = document.getElementById('dynamic-greeting');
  const recentlyPlayedContainer = document.getElementById('recently-played-container');
  const madeForYouContainer = document.getElementById('made-for-you-container');
  const trendingTableBody = document.getElementById('trending-table-body');
  const heroPlayBtn = document.getElementById('hero-play-btn');

  // Discover view containers
  const discoverRecommendationsContainer = document.getElementById('discover-recommendations-container');
  const genreCards = document.querySelectorAll('.genre-card');

  // Library view containers
  const libraryTabs = document.querySelectorAll('.lib-tab');
  const libraryTabContent = document.getElementById('library-tab-content');

  // Favorites view containers
  const favoritesTableBody = document.getElementById('favorites-table-body');
  const favoritesEmptyState = document.getElementById('favorites-empty-state');
  const favoritesCountLabel = document.getElementById('favorites-count-label');

  // Playlist view containers
  const playlistView = document.getElementById('playlist-view');
  const playlistDetailArtwork = document.getElementById('playlist-detail-artwork');
  const playlistDetailName = document.getElementById('playlist-detail-name');
  const playlistDetailDesc = document.getElementById('playlist-detail-desc');
  const playlistDetailCount = document.getElementById('playlist-detail-count');
  const playlistDetailDuration = document.getElementById('playlist-detail-duration');
  const playlistDetailPlayBtn = document.getElementById('playlist-detail-play-btn');
  const playlistTableBody = document.getElementById('playlist-table-body');

  // Queue Panel components
  const queuePanel = document.getElementById('queue-panel');
  const queueCloseBtn = document.getElementById('queue-close-btn');
  const queueNowPlayingContainer = document.getElementById('queue-now-playing-container');
  const queueUpcomingList = document.getElementById('queue-upcoming-list');
  const queueCountBadge = document.getElementById('queue-count-badge');

  // Floating Player components
  const playerArtwork = document.getElementById('player-artwork');
  const playerTitle = document.getElementById('player-title');
  const playerArtist = document.getElementById('player-artist');
  const playerFavBtn = document.getElementById('player-fav-btn');
  const playerPrevBtn = document.getElementById('player-prev-btn');
  const playerPlayBtn = document.getElementById('player-play-btn');
  const playerNextBtn = document.getElementById('player-next-btn');
  const playerTimeCurrent = document.getElementById('player-time-current');
  const playerTimeTotal = document.getElementById('player-time-total');
  const playerProgressWrap = document.getElementById('player-progress-wrap');
  const playerProgressBar = document.getElementById('player-progress-bar');
  const playerQueueBtn = document.getElementById('player-queue-btn');
  const playerMuteBtn = document.getElementById('player-mute-btn');
  const volumeSlider = document.getElementById('volume-slider');
  const mobileMiniPlayerBtn = document.getElementById('mobile-mini-player-btn');
  const mobileMiniArtwork = document.getElementById('mobile-mini-artwork');
  const toastContainer = document.getElementById('toast-container');

  // SVGs for play/pause toggle
  const PLAY_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
  const PAUSE_SVG = `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

  // ==========================================================================
  // 4. AUDIO ENGINE CONTROLLER & EVENTS
  // ==========================================================================
  
  // Set up initial volume slider position
  volumeSlider.value = volume;

  // Toggle play/pause state
  function playSong(song, playlistContext = null) {
    if (!song) return;
    
    // Check if song has changed
    const isNewSong = !currentSong || currentSong.id !== song.id;
    
    if (isNewSong) {
      currentSong = song;
      audio.src = song.url;
      audio.load();
    }

    // Set context queue
    if (playlistContext) {
      activePlaylistId = playlistContext;
      if (playlistContext === 'favorites') {
        queue = songs.filter(s => favorites.includes(s.id));
      } else if (playlists[playlistContext]) {
        queue = songs.filter(s => playlists[playlistContext].includes(s.id));
      } else {
        queue = [...songs];
      }
    } else if (!activePlaylistId) {
      // Default fallback queue to all tracks
      queue = [...songs];
      activePlaylistId = 'all';
    }

    // Recalculate current queue index
    queueIndex = queue.findIndex(s => s.id === currentSong.id);
    if (queueIndex === -1) {
      // If song not in queue, append to queue
      queue.push(currentSong);
      queueIndex = queue.length - 1;
    }

    // Update Bottom Player view
    playerArtwork.src = currentSong.artwork;
    playerTitle.textContent = currentSong.title;
    playerArtist.textContent = currentSong.artist;
    mobileMiniArtwork.src = currentSong.artwork;
    
    // Update Favorite Heart visual status in player bar
    if (favorites.includes(currentSong.id)) {
      playerFavBtn.classList.add('active');
    } else {
      playerFavBtn.classList.remove('active');
    }

    // Try play
    audio.play()
      .then(() => {
        isPlaying = true;
        updatePlayButtonState();
        addToRecentlyPlayed(currentSong.id);
        syncActiveSongHighlight();
        renderQueue();
      })
      .catch(err => {
        console.error("Audio Play Error: ", err);
        handleAudioError();
      });
  }

  function togglePlay() {
    if (!currentSong) {
      // Play first song in current queue
      if (queue.length > 0) {
        playSong(queue[0]);
      }
      return;
    }

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(() => handleAudioError());
    }
  }

  function nextSong() {
    if (queue.length === 0) return;
    
    queueIndex++;
    if (queueIndex >= queue.length) {
      // Wrap around to start of queue
      queueIndex = 0;
    }
    
    playSong(queue[queueIndex]);
  }

  function prevSong() {
    if (queue.length === 0) return;

    // Restart song if played > 3 seconds
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
    } else {
      queueIndex--;
      if (queueIndex < 0) {
        queueIndex = queue.length - 1; // Wrap around to end
      }
      playSong(queue[queueIndex]);
    }
  }

  function handleAudioError() {
    isPlaying = false;
    updatePlayButtonState();
    
    const failedTitle = currentSong ? currentSong.title : "Unknown Track";
    showToast(`Playback Error: Failed to load "${failedTitle}"`);
    
    // Automatically advance to the next song after 2 seconds
    setTimeout(() => {
      if (queue.length > 1) {
        showToast("Skipping to next available track...");
        nextSong();
      }
    }, 2000);
  }

  // Update play/pause buttons icons across player elements
  function updatePlayButtonState() {
    if (isPlaying) {
      playerPlayBtn.innerHTML = PAUSE_SVG;
      playerPlayBtn.setAttribute('aria-label', 'Pause');
      document.querySelector('.pulse-indicator')?.classList.add('active');
    } else {
      playerPlayBtn.innerHTML = PLAY_SVG;
      playerPlayBtn.setAttribute('aria-label', 'Play');
      document.querySelector('.pulse-indicator')?.classList.remove('active');
    }
  }

  // Audio Event Listeners
  audio.addEventListener('play', () => {
    isPlaying = true;
    updatePlayButtonState();
    syncActiveSongHighlight();
  });

  audio.addEventListener('pause', () => {
    isPlaying = false;
    updatePlayButtonState();
    syncActiveSongHighlight();
  });

  audio.addEventListener('ended', () => {
    nextSong();
  });

  audio.addEventListener('error', () => {
    handleAudioError();
  });

  audio.addEventListener('timeupdate', () => {
    if (isDraggingProgress) return;
    
    const current = audio.currentTime;
    const duration = audio.duration || 0;
    
    // Format timers
    playerTimeCurrent.textContent = formatTime(current);
    if (!isNaN(duration) && duration > 0) {
      playerTimeTotal.textContent = formatTime(duration);
      // Progress percentage
      const percent = (current / duration) * 100;
      playerProgressBar.style.width = `${percent}%`;
      playerProgressWrap.setAttribute('aria-valuenow', Math.round(percent));
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    playerTimeTotal.textContent = formatTime(audio.duration || 0);
  });

  // ==========================================================================
  // 5. SEEK & VOLUME PROGRESS BARS (Click & Drag Support)
  // ==========================================================================
  
  // Progress Bar Seek Interaction
  function handleProgressSeek(e) {
    const rect = playerProgressWrap.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    let percentage = clickX / width;
    percentage = Math.max(0, Math.min(1, percentage)); // Clamp between 0 and 1
    
    playerProgressBar.style.width = `${percentage * 100}%`;
    playerTimeCurrent.textContent = formatTime(percentage * (audio.duration || 0));
    
    return percentage;
  }

  playerProgressWrap.addEventListener('mousedown', (e) => {
    isDraggingProgress = true;
    const percent = handleProgressSeek(e);
    
    function onMouseMove(moveEvent) {
      handleProgressSeek(moveEvent);
    }
    
    function onMouseUp(upEvent) {
      const finalPercent = handleProgressSeek(upEvent);
      if (audio.duration) {
        audio.currentTime = finalPercent * audio.duration;
      }
      isDraggingProgress = false;
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    }
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  });

  // Support click / seek on mobile touch devices
  playerProgressWrap.addEventListener('touchstart', (e) => {
    isDraggingProgress = true;
    const touch = e.touches[0];
    
    function onTouchMove(moveEvent) {
      const touchMove = moveEvent.touches[0];
      handleProgressSeek(touchMove);
    }
    
    function onTouchEnd(endEvent) {
      const rect = playerProgressWrap.getBoundingClientRect();
      const lastTouch = endEvent.changedTouches[0];
      const clickX = lastTouch.clientX - rect.left;
      const width = rect.width;
      let percentage = clickX / width;
      percentage = Math.max(0, Math.min(1, percentage));
      
      if (audio.duration) {
        audio.currentTime = percentage * audio.duration;
      }
      isDraggingProgress = false;
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    }
    
    document.addEventListener('touchmove', onTouchMove);
    document.addEventListener('touchend', onTouchEnd);
  });

  // Keyboard navigation for progress bar
  playerProgressWrap.addEventListener('keydown', (e) => {
    if (!audio.duration) return;
    let newTime = audio.currentTime;
    if (e.key === 'ArrowRight') {
      newTime = Math.min(audio.duration, newTime + 5);
      audio.currentTime = newTime;
    } else if (e.key === 'ArrowLeft') {
      newTime = Math.max(0, newTime - 5);
      audio.currentTime = newTime;
    }
  });

  // Volume Slider Control
  volumeSlider.addEventListener('input', (e) => {
    volume = parseFloat(e.target.value);
    audio.volume = volume;
    isMuted = (volume === 0);
    localStorage.setItem('musiclub-volume', volume);
    updateVolumeIcon();
  });

  playerMuteBtn.addEventListener('click', toggleMute);

  function toggleMute() {
    if (isMuted) {
      volume = previousVolume > 0 ? previousVolume : 0.7;
      isMuted = false;
    } else {
      previousVolume = volume;
      volume = 0;
      isMuted = true;
    }
    audio.volume = volume;
    volumeSlider.value = volume;
    updateVolumeIcon();
  }

  function updateVolumeIcon() {
    const iconSvg = document.getElementById('volume-icon-svg');
    if (!iconSvg) return;

    if (volume === 0 || isMuted) {
      // Mute icon
      iconSvg.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15" stroke="currentColor" stroke-width="2"></line><line x1="17" y1="9" x2="23" y2="15" stroke="currentColor" stroke-width="2"></line>`;
    } else if (volume < 0.3) {
      // Low Volume
      iconSvg.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2"></path>`;
    } else {
      // Full volume
      iconSvg.innerHTML = `<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" stroke="currentColor" stroke-width="2"></path>`;
    }
  }
  updateVolumeIcon(); // Initial sync

  // ==========================================================================
  // 6. VIEW NAVIGATION SYSTEM
  // ==========================================================================
  
  function switchView(viewId, playlistId = null) {
    currentView = viewId;

    // Toggle active link states on desktop and mobile navigators
    navLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    mobileNavLinks.forEach(link => {
      if (link.getAttribute('data-view') === viewId) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });

    // Hide search view overlay unless search is active
    if (viewId !== 'search') {
      searchResultsView.style.display = 'none';
      if (searchInput.value.trim() === '') {
        searchClearBtn.style.display = 'none';
      }
    }

    // Toggle sections in DOM
    viewSections.forEach(section => {
      if (section.id === `${viewId}-view`) {
        section.style.display = 'block';
      } else {
        section.style.display = 'none';
      }
    });

    // Sub-view configurations
    if (viewId === 'playlist' && playlistId) {
      renderPlaylistDetail(playlistId);
    } else if (viewId === 'favorites') {
      renderFavorites();
    } else if (viewId === 'library') {
      renderLibrary();
    } else if (viewId === 'home') {
      renderHome();
    }

    // Scroll back to top of viewport
    document.querySelector('.main-content').scrollTop = 0;
  }

  // Set up listeners for nav buttons
  navLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      switchView(view);
    });
  });

  mobileNavLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.getAttribute('data-view');
      switchView(view);
    });
  });

  logoBtn.addEventListener('click', (e) => {
    e.preventDefault();
    switchView('home');
  });

  // Mobile expansion triggers
  mobileMiniPlayerBtn.addEventListener('click', () => {
    queuePanel.classList.toggle('open');
    playerQueueBtn.classList.toggle('active', queuePanel.classList.contains('open'));
  });

  // ==========================================================================
  // 7. PLAYLIST & TRACK RENDERING MODULES
  // ==========================================================================

  // Populate dynamic playlist list in the Left Sidebar
  function renderSidebarPlaylists() {
    sidebarPlaylistList.innerHTML = '';
    Object.keys(playlists).forEach(pName => {
      const li = document.createElement('li');
      li.className = 'sidebar-playlist-item';
      
      const btn = document.createElement('button');
      btn.textContent = pName;
      btn.addEventListener('click', () => {
        switchView('playlist', pName);
        
        // Highlight active sidebar item
        document.querySelectorAll('.sidebar-playlist-item').forEach(item => item.classList.remove('active'));
        li.classList.add('active');
      });

      li.appendChild(btn);
      sidebarPlaylistList.appendChild(li);
    });
  }

  // Populate home dashboard content
  function renderHome() {
    // Dynamic greeting based on time of day
    const hour = new Date().getHours();
    let greeting = "Good morning";
    if (hour >= 12 && hour < 18) {
      greeting = "Good afternoon";
    } else if (hour >= 18) {
      greeting = "Good evening";
    }
    greetingEl.textContent = greeting;

    // Render recently played
    renderRecentlyPlayed();

    // Made For You Grid
    madeForYouContainer.innerHTML = '';
    Object.keys(playlists).slice(0, 3).forEach(pName => {
      madeForYouContainer.appendChild(createPlaylistCard(pName));
    });

    // Trending Table (First 5 songs)
    renderTrendingList();
  }

  // Helper to build playlist vertical cards
  function createPlaylistCard(name) {
    const meta = playlistMetadata[name];
    const trackCount = playlists[name].length;

    const card = document.createElement('div');
    card.className = 'playlist-card';
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `Playlist ${name}, ${trackCount} tracks`);
    
    card.innerHTML = `
      <div class="playlist-card-artwork-wrap">
        <img class="playlist-card-artwork" src="${meta.artwork}" alt="${name} Cover" onerror="this.src='https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=150'">
        <button class="playlist-card-play" aria-label="Play ${name} now">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </button>
      </div>
      <h4 class="playlist-card-title">${name}</h4>
      <p class="playlist-card-desc">${meta.desc}</p>
    `;

    // Click triggers card details
    card.addEventListener('click', (e) => {
      // If clicking play button, load and play playlist directly
      const playBtn = card.querySelector('.playlist-card-play');
      if (playBtn.contains(e.target) || playBtn === e.target) {
        e.stopPropagation();
        playPlaylistDirectly(name);
      } else {
        switchView('playlist', name);
      }
    });

    return card;
  }

  // Load and play playlist immediately
  function playPlaylistDirectly(playlistName) {
    const playlistSongIds = playlists[playlistName];
    if (!playlistSongIds || playlistSongIds.length === 0) return;
    
    const targetSong = songs.find(s => s.id === playlistSongIds[0]);
    if (targetSong) {
      playSong(targetSong, playlistName);
    }
  }

  // Populate "Recently Played" horizontal cards
  function renderRecentlyPlayed() {
    recentlyPlayedContainer.innerHTML = '';
    
    if (recentlyPlayed.length === 0) {
      // Show placeholder or mock items
      const recentMock = songs.slice(0, 3);
      recentMock.forEach(song => {
        recentlyPlayedContainer.appendChild(createRecentlyPlayedCard(song));
      });
      return;
    }

    const playedSongsObj = recentlyPlayed
      .map(id => songs.find(s => s.id === id))
      .filter(Boolean);

    playedSongsObj.forEach(song => {
      recentlyPlayedContainer.appendChild(createRecentlyPlayedCard(song));
    });
  }

  function createRecentlyPlayedCard(song) {
    const card = document.createElement('div');
    card.className = 'recent-card';
    if (currentSong && currentSong.id === song.id) {
      card.classList.add('active-playing');
    }
    
    card.innerHTML = `
      <img class="recent-artwork" src="${song.artwork}" alt="${song.title}">
      <div class="recent-info">
        <span class="recent-title">${song.title}</span>
        <span class="recent-artist">${song.artist}</span>
      </div>
      <button class="recent-play-hover" aria-label="Play ${song.title}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </button>
    `;

    card.addEventListener('click', () => {
      playSong(song);
    });

    return card;
  }

  // Populate the main trending now song list
  function renderTrendingList() {
    trendingTableBody.innerHTML = '';
    // Show all 6 tracks or standard tracks
    songs.forEach((song, idx) => {
      trendingTableBody.appendChild(createSongRow(song, idx + 1, 'all'));
    });
  }

  // Standard table row builder for song tables
  function createSongRow(song, numIndex, playlistContext) {
    const row = document.createElement('tr');
    row.className = 'song-row';
    row.setAttribute('data-id', song.id);
    if (currentSong && currentSong.id === song.id) {
      row.classList.add('active-playing');
    }

    const isFav = favorites.includes(song.id);

    row.innerHTML = `
      <td class="col-num">
        <div class="num-cell-content">
          <span class="row-index-label">${numIndex}</span>
          <button class="row-play-btn" aria-label="Play ${song.title}">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
        </div>
      </td>
      <td class="col-title">
        <div class="title-cell">
          <img class="title-cell-artwork" src="${song.artwork}" alt="${song.title}" onerror="this.src='https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=80'">
          <div>
            <span class="title-cell-text">${song.title}</span>
            <span class="title-cell-artist">${song.artist}</span>
          </div>
        </div>
      </td>
      <td class="col-album">${song.album}</td>
      <td class="col-action">
        <button class="row-fav-btn ${isFav ? 'active' : ''}" aria-label="Toggle favorite">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </button>
      </td>
      <td class="col-duration">${song.duration}</td>
    `;

    // Row playing actions
    row.addEventListener('click', (e) => {
      const favBtn = row.querySelector('.row-fav-btn');
      if (favBtn.contains(e.target) || favBtn === e.target) {
        e.stopPropagation();
        toggleFavorite(song.id, favBtn);
      } else {
        playSong(song, playlistContext);
      }
    });

    return row;
  }

  // Highlight current active row/playing states
  function syncActiveSongHighlight() {
    // Sync all rows
    document.querySelectorAll('.song-row').forEach(row => {
      const songId = row.getAttribute('data-id');
      if (currentSong && songId === currentSong.id) {
        row.classList.add('active-playing');
        
        // Dynamic playing indicator icon changes
        const playBtn = row.querySelector('.row-play-btn');
        if (playBtn) {
          if (isPlaying) {
            playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
          } else {
            playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
          }
        }
      } else {
        row.classList.remove('active-playing');
        const playBtn = row.querySelector('.row-play-btn');
        if (playBtn) {
          playBtn.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        }
      }
    });

    // Sync recently played highlights
    document.querySelectorAll('.recent-card').forEach(card => {
      const titleEl = card.querySelector('.recent-title');
      if (titleEl && currentSong && titleEl.textContent === currentSong.title) {
        card.classList.add('active-playing');
      } else {
        card.classList.remove('active-playing');
      }
    });

    // Sync queue panel highlight
    document.querySelectorAll('.queue-card').forEach(qc => {
      const songId = qc.getAttribute('data-id');
      if (currentSong && songId === currentSong.id) {
        qc.classList.add('playing');
      } else {
        qc.classList.remove('playing');
      }
    });
  }

  // Populate dynamic Discover suggestions
  function renderDiscover() {
    discoverRecommendationsContainer.innerHTML = '';
    // Show remaining playlists as recommended elements
    Object.keys(playlists).slice(2).forEach(pName => {
      discoverRecommendationsContainer.appendChild(createPlaylistCard(pName));
    });
  }
  
  // Set up listeners for Discover genre bubbles
  genreCards.forEach(card => {
    card.addEventListener('click', () => {
      const pName = card.getAttribute('data-playlist');
      if (playlists[pName]) {
        switchView('playlist', pName);
      }
    });
  });

  // ==========================================================================
  // 8. PLAYLIST DETAIL RENDERING VIEW
  // ==========================================================================
  
  function renderPlaylistDetail(playlistId) {
    const meta = playlistMetadata[playlistId];
    const songIds = playlists[playlistId];
    
    if (!meta || !songIds) return;

    playlistDetailArtwork.src = meta.artwork;
    playlistDetailName.textContent = playlistId;
    playlistDetailDesc.textContent = meta.desc;
    
    const count = songIds.length;
    playlistDetailCount.textContent = `${count} ${count === 1 ? 'song' : 'songs'}`;

    // Compute total duration of playlist
    let totalDurationSeconds = 0;
    songIds.forEach(id => {
      const s = songs.find(track => track.id === id);
      if (s) totalDurationSeconds += s.durationSeconds;
    });
    const totalMinutes = Math.round(totalDurationSeconds / 60);
    playlistDetailDuration.textContent = `${totalMinutes} min`;

    // Clear and build playlist rows
    playlistTableBody.innerHTML = '';
    songIds.forEach((id, index) => {
      const song = songs.find(s => s.id === id);
      if (song) {
        playlistTableBody.appendChild(createSongRow(song, index + 1, playlistId));
      }
    });

    // Configure Header Play Button
    playlistDetailPlayBtn.onclick = () => {
      playPlaylistDirectly(playlistId);
    };
  }

  // ==========================================================================
  // 9. LIBRARY VIEWPORT TABS
  // ==========================================================================
  
  function renderLibrary() {
    libraryTabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === activeLibraryTab) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    libraryTabContent.innerHTML = '';
    
    if (activeLibraryTab === 'playlists') {
      // Build Grid of Playlists
      const grid = document.createElement('div');
      grid.className = 'playlists-grid';
      Object.keys(playlists).forEach(pName => {
        grid.appendChild(createPlaylistCard(pName));
      });
      libraryTabContent.appendChild(grid);
    } else if (activeLibraryTab === 'recent') {
      // Build grid of recently played tracks
      if (recentlyPlayed.length === 0) {
        libraryTabContent.innerHTML = `
          <div class="empty-state">
            <h3>No recently played music</h3>
            <p>Tracks you play will show up here.</p>
          </div>
        `;
      } else {
        const grid = document.createElement('div');
        grid.className = 'recently-played-grid';
        recentlyPlayed.forEach(id => {
          const song = songs.find(s => s.id === id);
          if (song) {
            grid.appendChild(createRecentlyPlayedCard(song));
          }
        });
        libraryTabContent.appendChild(grid);
      }
    }
  }

  libraryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      activeLibraryTab = tab.getAttribute('data-tab');
      renderLibrary();
    });
  });

  // ==========================================================================
  // 10. FAVORITES ENGINE & PAGE
  // ==========================================================================
  
  function toggleFavorite(songId, heartBtn = null) {
    const index = favorites.indexOf(songId);
    let isAdded = false;

    if (index === -1) {
      favorites.push(songId);
      isAdded = true;
      showToast(`Added to Favorites`);
    } else {
      favorites.splice(index, 1);
      showToast(`Removed from Favorites`);
    }

    localStorage.setItem('musiclub-favorites', JSON.stringify(favorites));

    // Update player button heart icon if current song favorited
    if (currentSong && currentSong.id === songId) {
      playerFavBtn.classList.toggle('active', isAdded);
    }

    // Refresh row icon states in active viewport
    document.querySelectorAll(`.song-row[data-id="${songId}"] .row-fav-btn`).forEach(btn => {
      btn.classList.toggle('active', isAdded);
    });

    // If currently looking at Favorites view, re-render
    if (currentView === 'favorites') {
      renderFavorites();
    }
  }

  // Set up player favoriting action
  playerFavBtn.addEventListener('click', () => {
    if (currentSong) {
      toggleFavorite(currentSong.id);
    }
  });

  function renderFavorites() {
    favoritesTableBody.innerHTML = '';
    
    const favSongs = songs.filter(s => favorites.includes(s.id));
    favoritesCountLabel.textContent = `${favSongs.length} ${favSongs.length === 1 ? 'song' : 'songs'}`;

    if (favSongs.length === 0) {
      favoritesEmptyState.style.display = 'flex';
      document.querySelector('#favorites-view .table-container').style.display = 'none';
    } else {
      favoritesEmptyState.style.display = 'none';
      document.querySelector('#favorites-view .table-container').style.display = 'block';

      favSongs.forEach((song, index) => {
        favoritesTableBody.appendChild(createSongRow(song, index + 1, 'favorites'));
      });
    }
  }

  // ==========================================================================
  // 11. RECENTLY PLAYED PERSISTENCE
  // ==========================================================================
  
  function addToRecentlyPlayed(songId) {
    // Avoid duplicate tracks by splicing
    const index = recentlyPlayed.indexOf(songId);
    if (index !== -1) {
      recentlyPlayed.splice(index, 1);
    }
    
    // Unshift to front
    recentlyPlayed.unshift(songId);

    // Keep size under 6 items
    if (recentlyPlayed.length > 6) {
      recentlyPlayed.pop();
    }

    localStorage.setItem('musiclub-recently', JSON.stringify(recentlyPlayed));
    
    // Dynamic refresh in Home
    if (currentView === 'home') {
      renderRecentlyPlayed();
    }
  }

  // ==========================================================================
  // 12. PLAY QUEUE PANEL LOGIC
  // ==========================================================================
  
  // Toggle Queue panel visibility
  playerQueueBtn.addEventListener('click', () => {
    queuePanel.classList.toggle('open');
    playerQueueBtn.classList.toggle('active', queuePanel.classList.contains('open'));
  });

  queueCloseBtn.addEventListener('click', () => {
    queuePanel.classList.remove('open');
    playerQueueBtn.classList.remove('active');
  });

  function renderQueue() {
    // Update count labels
    const upcoming = queue.slice(queueIndex + 1);
    queueCountBadge.textContent = `${upcoming.length} ${upcoming.length === 1 ? 'track' : 'tracks'}`;

    // Render Current song inside Queue
    queueNowPlayingContainer.innerHTML = '';
    if (currentSong) {
      const nowPlayingCard = createQueueCard(currentSong, true);
      queueNowPlayingContainer.appendChild(nowPlayingCard);
    } else {
      queueNowPlayingContainer.innerHTML = `<span class="time-label">No song active</span>`;
    }

    // Render Upcoming list
    queueUpcomingList.innerHTML = '';
    if (upcoming.length === 0) {
      queueUpcomingList.innerHTML = `<div class="empty-state" style="padding: 20px;"><p>End of queue. Add tracks to play next.</p></div>`;
    } else {
      upcoming.forEach((song, relativeIdx) => {
        // Absolute index in the queue
        const absoluteIndex = queueIndex + 1 + relativeIdx;
        const qCard = createQueueCard(song, false, absoluteIndex);
        queueUpcomingList.appendChild(qCard);
      });
    }
  }

  // Queue item card builder
  function createQueueCard(song, isCurrent, absoluteIndex = 0) {
    const card = document.createElement('div');
    card.className = 'queue-card';
    card.setAttribute('data-id', song.id);
    if (isCurrent) {
      card.classList.add('playing');
    }

    card.innerHTML = `
      <img class="queue-card-artwork" src="${song.artwork}" alt="${song.title}">
      <div class="queue-card-info">
        <span class="queue-card-title">${song.title}</span>
        <span class="queue-card-artist">${song.artist}</span>
      </div>
    `;

    card.addEventListener('click', () => {
      if (isCurrent) {
        togglePlay();
      } else {
        // Set queue index to selected absolute index and play
        queueIndex = absoluteIndex;
        playSong(queue[queueIndex]);
      }
    });

    return card;
  }

  // ==========================================================================
  // 13. LIVE SEARCH SYSTEM
  // ==========================================================================
  
  let searchTimeout = null;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim().toLowerCase();
    
    // Show clear button
    searchClearBtn.style.display = query !== '' ? 'block' : 'none';

    // Immediate dynamic updates with short debounce
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      executeSearch(query);
    }, 150);
  });

  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    
    // Restore home view
    switchView('home');
  });

  function executeSearch(query) {
    if (query === '') {
      switchView('home');
      return;
    }

    // Switch view to search viewport overlay
    currentView = 'search';
    navLinks.forEach(link => link.classList.remove('active'));
    mobileNavLinks.forEach(link => link.classList.remove('active'));
    viewSections.forEach(section => {
      section.style.display = section.id === 'search-results-view' ? 'block' : 'none';
    });

    // Filter centralized tracks database
    const matches = songs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album.toLowerCase().includes(query)
    );

    searchResultsContainer.innerHTML = '';

    if (matches.length === 0) {
      // Empty search state
      searchResultsContainer.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="empty-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <h3>No music found</h3>
          <p>Try another song, artist, or album.</p>
        </div>
      `;
    } else {
      // Build playable table structure inside search viewport
      const table = document.createElement('table');
      table.className = 'song-table';
      
      table.innerHTML = `
        <thead>
          <tr>
            <th class="col-num">#</th>
            <th class="col-title">Title</th>
            <th class="col-album">Album</th>
            <th class="col-action"></th>
            <th class="col-duration">Duration</th>
          </tr>
        </thead>
        <tbody id="search-table-body"></tbody>
      `;

      searchResultsContainer.appendChild(table);
      const searchTableBody = document.getElementById('search-table-body');
      
      matches.forEach((song, idx) => {
        searchTableBody.appendChild(createSongRow(song, idx + 1, 'all'));
      });
    }
  }

  // ==========================================================================
  // 14. EVENT HANDLERS & INITIALIZATION
  // ==========================================================================
  
  // Floating Player Buttons Listeners
  playerPlayBtn.addEventListener('click', togglePlay);
  playerNextBtn.addEventListener('click', nextSong);
  playerPrevBtn.addEventListener('click', prevSong);

  // Hero Play Now Button
  if (heroPlayBtn) {
    heroPlayBtn.addEventListener('click', () => {
      playPlaylistDirectly("Chill Vibes");
    });
  }

  // Keyboard controls (Spacebar toggles play/pause when typing input is not focused)
  window.addEventListener('keydown', (e) => {
    if (e.key === ' ' && document.activeElement !== searchInput) {
      e.preventDefault(); // Prevent page scroll
      togglePlay();
    }
  });

  // Dynamic notification action alert
  document.querySelector('.notification-btn').addEventListener('click', () => {
    showToast("Notifications: You're all caught up with Musiclub!");
  });

  // UI Toast alert creator
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
      <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    // Auto-remove toast
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s forwards';
      setTimeout(() => {
        toast.remove();
      }, 300);
    }, 3000);
  }

  // Math helper to format audio durations
  function formatTime(secs) {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  // Launch initial render cycles
  renderSidebarPlaylists();
  renderHome();
  renderDiscover();

  // Set default active playlist view state
  activePlaylistId = 'all';
  queue = [...songs];
  
  // Pre-load player information with first track
  if (songs.length > 0) {
    const firstSong = songs[0];
    playerArtwork.src = firstSong.artwork;
    playerTitle.textContent = firstSong.title;
    playerArtist.textContent = firstSong.artist;
    mobileMiniArtwork.src = firstSong.artwork;
    playerTimeTotal.textContent = firstSong.duration;
  }

  // Listen to mobile layout actions
  window.addEventListener('resize', () => {
    // Auto-close queue panel if window transitions back to narrow layouts
    if (window.innerWidth <= 768 && queuePanel.classList.contains('open')) {
      // Allow user choice but prevent overlapping
    }
  });

});
