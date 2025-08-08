/**
 * MovieShow.model.ts
 *
 * Movie/series data model for Obsidian templates
 * Defines unified data structure for template substitution
 *
 * Note: Most fields are string arrays for YAML compatibility
 * URLs remain unquoted, numeric fields keep primitive types
 */

export interface MovieShow {
	// Basic information
	id: number;
	name: string[];
	alternativeName: string[];
	year: number;
	description: string[];
	shortDescription: string[];

	// Images - URLs without quotes (web links or local paths)
	posterUrl: string[];
	coverUrl: string[];
	logoUrl: string[];

	// Obsidian-formatted image links - auto-formatted as ![[path]] or ![](path)
	posterImageLink: string[];
	coverImageLink: string[];
	logoImageLink: string[];

	// Classification
	genres: string[];
	genresLinks: string[]; // Formatted as [[Genre]] Obsidian links
	countries: string[];
	countriesLinks: string[]; // Formatted as [[Country]] Obsidian links
	type: string[];
	subType: string[];

	// People
	director: string[];
	directorsLinks: string[]; // Formatted as [[Director]] Obsidian links
	actors: string[];
	actorsLinks: string[]; // Formatted as [[Actor]] Obsidian links
	writers: string[];
	writersLinks: string[]; // Formatted as [[Writer]] Obsidian links
	producers: string[];
	producersLinks: string[]; // Formatted as [[Producer]] Obsidian links

	// Technical specs
	movieLength: number; // Duration in minutes
	isSeries: boolean;
	seriesLength: number; // Episode duration
	totalSeriesLength: number; // Total duration of all episodes
	isComplete: boolean; // Series completion status
	seasonsCount: number;
	seriesInSeasonCount: number; // Average episodes per season

	// Ratings and votes
	ratingKp: number;
	ratingImdb: number;
	ratingFilmCritics: number;
	ratingRussianFilmCritics: number;
	votesKp: number;
	votesImdb: number;
	votesFilmCritics: number;
	votesRussianFilmCritics: number;

	// External IDs and links
	kinopoiskUrl: string[]; // URLs without quotes
	imdbId: string[];
	tmdbId: number;
	kpHDId: string[];

	// Additional info
	slogan: string[];
	ageRating: number;
	ratingMpaa: string[];

	// Finance
	budgetValue: number;
	budgetCurrency: string[];
	feesWorldValue: number;
	feesWorldCurrency: string[];
	feesRussiaValue: number;
	feesRussiaCurrency: string[];
	feesUsaValue: number;
	feesUsaCurrency: string[];

	// Premiere dates
	premiereWorld: string[];
	premiereRussia: string[];
	premiereDigital: string[];
	premiereCinema: string[];

	// Release periods
	releaseYearsStart: number;
	releaseYearsEnd: number;

	// Top ratings
	top10: number;
	top250: number;

	// Facts - limited to 5 items, HTML cleaned
	facts: string[];

	// Alternative names
	allNamesString: string[]; // All known names
	enName: string[];

	// Networks and companies
	networks: string[]; // TV networks/channels
	networksLinks: string[]; // Formatted as Obsidian links
	productionCompanies: string[];
	productionCompaniesLinks: string[]; // Formatted as Obsidian links

	// Distributors
	distributor: string[];
	distributorRelease: string[];

	// Related movies/series
	sequelsAndPrequels: string[];
	sequelsAndPrequelsLinks: string[]; // Formatted as Obsidian links

	// File naming properties - cleaned of special characters, unquoted
	nameForFile: string;
	alternativeNameForFile: string;
	enNameForFile: string;
}
