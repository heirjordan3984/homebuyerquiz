export interface BatchDataAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  formattedAddress?: string;
  latitude?: number;
  longitude?: number;
  houseNumber?: string;
  countyFipsCode?: string;
}

export interface BatchDataOwner {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  names?: { full?: string; first?: string; last?: string }[];
  mailingAddress?: BatchDataAddress;
  ownershipLength?: number;
  isAbsenteeOwner?: boolean;
  isCorporateOwner?: boolean;
}

export interface BatchDataBuilding {
  bedroomCount?: number;
  bathroomCount?: number;
  totalBuildingAreaSquareFeet?: number;
  lotSizeSquareFeet?: number;
  yearBuilt?: number;
  stories?: number;
  garageParkingSpaceCount?: number;
  pool?: boolean;
  fireplace?: boolean;
  propertyType?: string;
}

export interface BatchDataValuation {
  estimatedValue?: number;
  priceRangeMin?: number;
  priceRangeMax?: number;
  confidenceScore?: number;
  equityCurrentEstimatedBalance?: number;
  equityPercent?: number;
  ltv?: number;
  asOfDate?: string;
}

export interface BatchDataAssessment {
  assessedValue?: number;
  marketValue?: number;
  taxAmount?: number;
  taxYear?: number;
}

export interface BatchDataSaleTransaction {
  saleDate?: string;
  salePrice?: number;
  documentDate?: string;
  recordingDate?: string;
  documentType?: string;
  transactionType?: string;
  buyers?: string[];
  sellers?: string[];
  mortgages?: BatchDataMortgage[];
  foreclosure?: boolean;
  interFamily?: boolean;
}

export interface BatchDataMortgage {
  loanAmount?: number;
  loanDate?: string;
  recordingDate?: string;
  lenderName?: string;
  loanType?: string;
  interestRate?: number;
  termYears?: number;
  loanTermMonths?: number;
  estimatedPayment?: number;
  dueDate?: string;
  documentNumber?: string;
  currentEstimatedBalance?: number;
  currentEstimatedInterestRate?: number;
  equityCreditLine?: boolean;
  constructionLoan?: boolean;
  lenderType?: string;
  financingType?: string;
  purposeOfLoan?: string;
  assignedLenderName?: string;
}

export interface BatchDataQuickLists {
  absenteeOwner?: boolean;
  absenteeOwnerInState?: boolean;
  absenteeOwnerOutOfState?: boolean;
  ownerOccupied?: boolean;
  corporateOwned?: boolean;
  vacant?: boolean;
  vacantLot?: boolean;
  highEquity?: boolean;
  lowEquity?: boolean;
  unknownEquity?: boolean;
  freeAndClear?: boolean;
  preforeclosure?: boolean;
  activeAuction?: boolean;
  noticeOfSale?: boolean;
  noticeOfDefault?: boolean;
  noticeOfLisPendens?: boolean;
  reo?: boolean;
  taxDefault?: boolean;
  recentlySold?: boolean;
  tiredLandlord?: boolean;
  inherited?: boolean;
  trustOwned?: boolean;
  listedForSale?: boolean;
  activeListing?: boolean;
  pendingListing?: boolean;
  failedListing?: boolean;
  expiredListing?: boolean;
  canceledListing?: boolean;
  forSaleByOwner?: boolean;
  onMarket?: boolean;
  cashBuyer?: boolean;
  fixAndFlip?: boolean;
  hasHoa?: boolean;
  involuntaryLien?: boolean;
  seniorOwner?: boolean;
  outOfStateOwner?: boolean;
  mailingAddressVacant?: boolean;
  listedBelowMarketPrice?: boolean;
}

export interface BatchDataDemographics {
  medianHouseholdIncome?: number;
  medianHomeValue?: number;
  householdSize?: number;
  populationDensity?: number;
  religious?: boolean;
}

export interface BatchDataPermit {
  tags?: Record<string, boolean>;
  allTags?: string[];
  latestDate?: string;
  earliestDate?: string;
  permitCount?: number;
  totalJobValue?: number;
}

export interface BatchDataForeclosure {
  status?: string;
  filingDate?: string;
  defaultDate?: string;
  statusCode?: string;
  documentType?: string;
  recordingDate?: string;
  documentNumber?: string;
  borrowerName?: string;
  currentLenderName?: string;
}

export interface BatchDataDeedHistory {
  saleDate?: string;
  salePrice?: number;
  documentDate?: string;
  recordingDate?: string;
  documentType?: string;
  transactionType?: string;
  transactionId?: string;
  documentNumber?: string;
  buyers?: string[];
  sellers?: string[];
  foreclosure?: boolean;
  interFamily?: boolean;
  resale?: boolean;
  mailingAddress?: BatchDataAddress;
}

export interface BatchDataInvoluntaryLien {
  liens?: {
    lienType?: string;
    documentType?: string;
    lienTypeCode?: string;
    recordingDate?: string;
    documentNumber?: string;
    documentTypeCode?: string;
  }[];
}

export interface BatchDataOwnerProfile {
  mortgagesCount?: number;
  propertiesCount?: number;
  averageYearBuilt?: number;
  totalPurchasePrice?: number;
  averageAssessedValue?: number;
  averagePurchasePrice?: number;
  mortgagesTotalBalance?: number;
  propertiesTotalEquity?: number;
  mortgagesAverageBalance?: number;
  propertiesTotalEstimatedValue?: number;
}

export interface BatchDataProperty {
  _id?: string;
  address?: BatchDataAddress;
  owner?: BatchDataOwner;
  building?: BatchDataBuilding;
  valuation?: BatchDataValuation;
  assessment?: BatchDataAssessment;
  sale?: {
    lastSale?: BatchDataSaleTransaction;
    priorSale?: BatchDataSaleTransaction;
    lastSaleDate?: string;
    lastSalePrice?: number;
    priorSaleDate?: string;
    priorSalePrice?: number;
  };
  openLien?: {
    mortgages?: BatchDataMortgage[];
    totalOpenLienBalance?: number;
    totalOpenLienCount?: number;
    allLoanTypes?: string[];
    juniorLoanTypes?: string[];
    lastLoanRecordingDate?: string;
    firstLoanRecordingDate?: string;
  };
  quickLists?: BatchDataQuickLists;
  demographics?: BatchDataDemographics;
  intel?: {
    lastSoldPrice?: number;
    lastSoldDate?: string;
    ownerOccupied?: boolean;
    salePropensityStatus?: string;
  };
  ids?: {
    apn?: string;
    fips?: string;
  };
  legal?: {
    apn?: string;
    subdivision?: string;
    legalDescription?: string;
  };
  permit?: BatchDataPermit;
  foreclosure?: BatchDataForeclosure;
  deedHistory?: BatchDataDeedHistory[];
  mortgageHistory?: BatchDataMortgage[];
  involuntaryLien?: BatchDataInvoluntaryLien;
  propertyOwnerProfile?: BatchDataOwnerProfile;
  listing?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface BatchDataResponse {
  property: BatchDataProperty | null;
  resultCount: number;
  _cached?: boolean;
}
