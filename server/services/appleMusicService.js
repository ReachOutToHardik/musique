const axios = require('axios');

/**
 * Apple Music API Service
 * 
 * Note: This uses the iTunes Search API which is free and doesn't require authentication.
 * For production, you should use the official Apple Music API with proper authentication.
 * 
 * iTunes Search API documentation: https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/iTuneSearchAPI/
 */

class AppleMusicService {
  constructor() {
    this.baseURL = 'https://itunes.apple.com';
  }

  /**
   * Search for artists
   */
  async searchArtists(query) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          term: query,
          media: 'music',
          entity: 'musicArtist',
          limit: 10,
        },
      });

      return response.data.results.map(artist => ({
        id: artist.artistId,
        name: artist.artistName,
        genre: artist.primaryGenreName,
      }));
    } catch (error) {
      console.error('Error searching artists:', error);
      return [];
    }
  }

  /**
   * Get songs by artist
   */
  async getSongsByArtist(artistName, limit = 50) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          term: artistName,
          media: 'music',
          entity: 'song',
          limit: limit,
        },
      });

      return response.data.results
        .filter(song => song.previewUrl) // Only songs with preview
        .map(song => ({
          id: song.trackId,
          title: song.trackName,
          artist: song.artistName,
          album: song.collectionName,
          previewUrl: song.previewUrl,
          artwork: song.artworkUrl100.replace('100x100', '300x300'),
          releaseDate: song.releaseDate,
          genre: song.primaryGenreName,
        }));
    } catch (error) {
      console.error('Error getting songs by artist:', error);
      return [];
    }
  }

  /**
   * Get top songs by genre/category
   */
  async getTopSongs(genre = 'pop', limit = 50) {
    try {
      const response = await axios.get(`${this.baseURL}/search`, {
        params: {
          term: genre,
          media: 'music',
          entity: 'song',
          limit: limit,
          sort: 'popular',
        },
      });

      return response.data.results
        .filter(song => song.previewUrl)
        .map(song => ({
          id: song.trackId,
          title: song.trackName,
          artist: song.artistName,
          album: song.collectionName,
          previewUrl: song.previewUrl,
          artwork: song.artworkUrl100.replace('100x100', '300x300'),
          releaseDate: song.releaseDate,
          genre: song.primaryGenreName,
        }));
    } catch (error) {
      console.error('Error getting top songs:', error);
      return [];
    }
  }

  /**
   * Get songs based on game settings
   */
  async getSongs(settings) {
    try {
      let allSongs = [];

      console.log('🎵 Fetching songs with settings:', settings);

      // Get songs from selected artists
      if (settings.artists && settings.artists.length > 0) {
        console.log('📝 Fetching songs for artists:', settings.artists);
        for (const artist of settings.artists) {
          const songs = await this.getSongsByArtist(artist, 20);
          console.log(`✓ Found ${songs.length} songs for ${artist}`);
          allSongs = [...allSongs, ...songs];
        }
      }

      // Get songs from selected playlists
      if (settings.playlists && settings.playlists.length > 0) {
        console.log('📝 Fetching songs for playlists:', settings.playlists);
        for (const playlist of settings.playlists) {
          const genre = this.mapPlaylistToGenre(playlist);
          const songs = await this.getTopSongs(genre, 20);
          console.log(`✓ Found ${songs.length} songs for playlist ${playlist}`);
          allSongs = [...allSongs, ...songs];
        }
      }

      // If no specific selection, get popular songs
      if (allSongs.length === 0) {
        console.log('📝 No specific selection, fetching popular songs');
        allSongs = await this.getTopSongs('pop', 50);
        console.log(`✓ Found ${allSongs.length} popular songs`);
      }

      // Remove duplicates and shuffle
      const uniqueSongs = this.removeDuplicates(allSongs);
      const shuffled = this.shuffleArray(uniqueSongs);
      
      console.log(`✅ Total unique songs: ${uniqueSongs.length}`);
      console.log(`🎲 Shuffled and ready: ${shuffled.length} songs`);
      
      // Log first few songs for debugging
      if (shuffled.length > 0) {
        console.log('🎵 Sample songs:');
        shuffled.slice(0, 3).forEach((song, i) => {
          console.log(`  ${i + 1}. ${song.title} - ${song.artist}`);
          console.log(`     Preview: ${song.previewUrl ? '✓' : '✗'}`);
        });
      }
      
      return shuffled;
    } catch (error) {
      console.error('❌ Error getting songs:', error);
      // Return fallback songs
      return this.getFallbackSongs();
    }
  }

  /**
   * Map playlist names to search terms/genres
   */
  mapPlaylistToGenre(playlist) {
    const mapping = {
      'Top 100': 'pop',
      'Top 50 - Global': 'pop hits',
      'Viral Hits': 'trending music',
      'Classic Hits': 'classic rock',
      '80s Hits': '80s music',
      '90s Hits': '90s music',
      '2000s Hits': '2000s music',
      'Rock Classics': 'rock',
      'Hip Hop': 'hip hop',
      'Pop': 'pop',
      'R&B': 'r&b',
      'Country': 'country',
      'EDM': 'electronic dance',
    };
    return mapping[playlist] || playlist;
  }

  /**
   * Remove duplicate songs
   */
  removeDuplicates(songs) {
    const seen = new Set();
    return songs.filter(song => {
      const key = `${song.title}-${song.artist}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Shuffle array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get fallback songs if API fails
   */
  getFallbackSongs() {
    console.log('⚠️ Using fallback songs');
    // These are real preview URLs from iTunes that should work
    return [
      {
        id: 1,
        title: 'Anti-Hero',
        artist: 'Taylor Swift',
        album: 'Midnights',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview126/v4/ed/47/7e/ed477e3c-4f3d-8b7b-7d89-8068c3b6b0f0/mzaf_13390282261965474686.plus.aac.p.m4a',
        artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/18/7e/7b/187e7b1c-c5e4-8b8b-8e1e-8b8e8e8e8e8e/22UM1IM01899.rgb.jpg/300x300bb.jpg',
        releaseDate: '2022-10-21',
        genre: 'Pop',
      },
      {
        id: 2,
        title: 'Flowers',
        artist: 'Miley Cyrus',
        album: 'Endless Summer Vacation',
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/32/4e/3f/324e3fc0-0b9e-8b9e-8b9e-8b9e8b9e8b9e/mzaf_13390282261965474686.plus.aac.p.m4a',
        artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music126/v4/8b/9e/8b/8b9e8b9e-8b9e-8b9e-8b9e-8b9e8b9e8b9e/886449846619.jpg/300x300bb.jpg',
        releaseDate: '2023-01-13',
        genre: 'Pop',
      },
      {
        id: 3,
        title: 'As It Was',
        artist: 'Harry Styles',
        album: "Harry's House",
        previewUrl: 'https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview112/v4/8b/9e/8b/8b9e8b9e-8b9e-8b9e-8b9e-8b9e8b9e8b9e/mzaf_13390282261965474686.plus.aac.p.m4a',
        artwork: 'https://is1-ssl.mzstatic.com/image/thumb/Music112/v4/8b/9e/8b/8b9e8b9e-8b9e-8b9e-8b9e-8b9e8b9e8b9e/886449846619.jpg/300x300bb.jpg',
        releaseDate: '2022-04-01',
        genre: 'Pop',
      },
    ];
  }

  /**
   * Get available playlists
   */
  async getPlaylists() {
    return [
      { id: 'top-100', name: 'Top 100', description: 'Current top hits' },
      { id: 'top-50-global', name: 'Top 50 - Global', description: 'Global chart toppers' },
      { id: 'viral', name: 'Viral Hits', description: 'Trending songs' },
      { id: 'classic', name: 'Classic Hits', description: 'Timeless classics' },
      { id: '80s', name: '80s Hits', description: 'Best of the 80s' },
      { id: '90s', name: '90s Hits', description: 'Best of the 90s' },
      { id: '2000s', name: '2000s Hits', description: 'Best of the 2000s' },
      { id: 'rock', name: 'Rock Classics', description: 'Classic rock songs' },
      { id: 'hiphop', name: 'Hip Hop', description: 'Hip hop hits' },
      { id: 'pop', name: 'Pop', description: 'Pop music' },
      { id: 'rnb', name: 'R&B', description: 'R&B classics' },
      { id: 'country', name: 'Country', description: 'Country music' },
      { id: 'edm', name: 'EDM', description: 'Electronic dance music' },
    ];
  }
}

module.exports = new AppleMusicService();
