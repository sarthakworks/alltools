import { useMemo, useState, useEffect, useRef } from 'react';
import Fuse from 'fuse.js';
import type { ToolMetadata } from './data/tools';

/**
 * Fuse.js configuration for fuzzy search across tools
 */
export const getFuseConfig = () => ({
  keys: [
    { name: 'name', weight: 0.5 },         // High weight for name matches
    { name: 'search_keys', weight: 0.35 }, // Custom search keywords
    { name: 'desc', weight: 0.15 }         // Lower weight for description matches
  ],
  threshold: 0.6,                          // 0.0 = perfect match, 1.0 = match anything
  includeScore: true,                      // Include match score for debugging
  minMatchCharLength: 1,                   // Minimum characters to match
  ignoreLocation: true,                    // Search anywhere in the string
  distance: 100,                           // Maximum distance for match location
  useExtendedSearch: false,                // Extended search for special patterns
  isCaseSensitive: false                   // Case insensitive matching
});

/**
 * Custom hook for tool search functionality
 * @param tools - Array of tools to search through
 * @returns Search state and handlers
 */
export const useToolSearch = (tools: ToolMetadata[]) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => new Fuse(tools, getFuseConfig()), [tools]);

  // Filter tools using fuzzy search with Fuse.js
  const filteredTools = useMemo(() => {
    return searchQuery.trim()
      ? fuse.search(searchQuery).map(result => result.item)
      : [];
  }, [searchQuery, fuse]);

  // Handle clicks outside the search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowDropdown(value.trim().length > 0);
  };

  // Handle tool selection/click
  const handleToolClick = (href: string) => {
    window.location.href = href;
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setShowDropdown(false);
  };

  return {
    searchQuery,
    setSearchQuery,
    showDropdown,
    setShowDropdown,
    filteredTools,
    searchRef,
    handleSearchChange,
    handleToolClick,
    clearSearch
  };
};
