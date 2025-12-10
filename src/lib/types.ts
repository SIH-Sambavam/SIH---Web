export type Post = {
    id: string;
    author: string;
    avatarId: string;
    time: string;
    content: string;
    comments: number;
    likes: number;
};

export type MarineSpecies = {
    _id: string;
    id?: string;
    institutionCode?: string;
    collectionCode?: string;
    basisOfRecord?: string;
    occurrenceID?: string;
    catalogNumber?: string;
    individualCount?: number;
    sex?: string;
    lifeStage?: string;
    occurrenceStatus?: string;
    eventDate?: string;
    eventTime?: string;
    habitat?: string;
    samplingProtocol?: string;
    waterBody?: string;
    country?: string;
    locality?: string;
    minimumDepthInMeters?: number;
    maximumDepthInMeters?: number;
    decimalLatitude?: number;
    decimalLongitude?: number;
    identificationQualifier?: string;
    typeStatus?: string;
    identifiedBy?: string;
    dateIdentified?: string;
    identificationReferences?: string;
    scientificNameID?: string;
    scientificName?: string;
};

export type FishSpeciesCard = {
    id: string;
    name: string;
    scientificName: string;
    description: string;
    habitat: string;
    population: number;
    stockTrend: 'increasing' | 'decreasing' | 'stable';
    imageId: string;
    image_links?: string;
    occurrenceCount: number;
    locations: string[];
    depthRange: string;
    lastSeen: string;
};
