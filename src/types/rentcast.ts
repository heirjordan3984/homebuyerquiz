export interface RentcastAvm {
  price: number;
  priceRangeLow: number;
  priceRangeHigh: number;
  latitude?: number;
  longitude?: number;
}

export interface RentcastComparable {
  id: string;
  formattedAddress: string;
  price: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  yearBuilt?: number;
  lastSoldDate?: string;
  distance?: number;
  correlation?: number;
}

export interface RentcastListing {
  id: string;
  formattedAddress: string;
  price: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  listedDate?: string;
  daysOnMarket?: number;
}

export interface RentcastMarketHistoryEntry {
  key: string;
  date: string;
  newListings: number | null;
  totalListings: number | null;
  averageDaysOnMarket: number | null;
  medianDaysOnMarket: number | null;
  medianPrice: number | null;
  averagePrice: number | null;
}

export interface RentcastMarket {
  averageSalePrice?: number | null;
  medianSalePrice?: number | null;
  averageDaysOnMarket?: number | null;
  medianDaysOnMarket?: number | null;
  averagePricePerSquareFoot?: number | null;
  newListings?: number | null;
  totalListings?: number | null;
  lastUpdatedDate?: string | null;
  history?: RentcastMarketHistoryEntry[];
  saleToListRatio?: number;
}

export interface RentcastData {
  avm: RentcastAvm | null;
  comparables: RentcastComparable[] | null;
  nearbyListings: RentcastListing[] | null;
  market: RentcastMarket | null;
}
