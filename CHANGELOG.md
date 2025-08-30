# 📑 Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),  
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] – 2025-08-30

### Added

-   New template variables for clean image paths: `{{posterPath}}`, `{{coverPath}}`, `{{logoPath}}`
-   Updated [documentation](https://github.com/2PleXXX/obsidian-kinopoisk-search-plus-plugin?tab=readme-ov-file#%EF%B8%8F-images) with new image variables

### Changed

-   **BREAKING:** Renamed markdown image variables to better reflect their purpose:
    -   `{{posterImageLink}}` → `{{posterMarkdown}}`
    -   `{{coverImageLink}}` → `{{coverMarkdown}}`
    -   `{{logoImageLink}}` → `{{logoMarkdown}}`

### Notes

If you're using custom templates, please update your image variable names to the new format.

## [1.0.0] – 2025-08-08

### Added

-   Minor improvements that do not affect the plugin's functionality.

### Notes

This is the first **stable** release of the plugin, fully ready for everyday use!

## [0.1.0] – 2025-08-08

### Added

-   First public test release of the plugin.
-   Fully functional integration with Kinopoisk API.
-   Core template system for inserting movie data into Obsidian.
-   Support for saving images directly into the vault.
-   Basic UI and UX optimizations.

### Notes

This is the first **stable test release**. It is safe to use, but still under **active development**.  
Some features may change or be added in future updates.

[2.0.0]: https://github.com/2PleXXX/obsidian-kinopoisk-search-plus-plugin/releases/tag/2.0.0
[1.0.0]: https://github.com/2PleXXX/obsidian-kinopoisk-search-plus-plugin/releases/tag/1.0.0
[0.1.0]: https://github.com/2PleXXX/obsidian-kinopoisk-search-plus-plugin/releases/tag/0.1.0
