import { Slide1MarketOpportunity, Slide2ProfitPotential } from './ResultsSlides';
import ResultsFullAnalysis from './ResultsFullAnalysis';
import BookingScreen from './BookingScreen';
import type { QuizResult } from '../utils/quizLogic';
import type { PlaceDetails } from './AddressAutocomplete';
import type { RentcastData } from '../types/rentcast';
import type { BatchDataResponse } from '../types/batchdata';

export type ResultsView = 'slide1' | 'slide2' | 'slide3' | 'full' | 'booking';

interface ResultsScreenProps {
  result: QuizResult;
  placeDetails?: PlaceDetails | null;
  addressText?: string | null;
  rentcastData?: RentcastData | null;
  rentcastLoading?: boolean;
  batchData?: BatchDataResponse | null;
  batchLoading?: boolean;
  onRetake: () => void;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  downPaymentAnswer?: number | null;
  view: ResultsView;
  onViewChange: (v: ResultsView) => void;
}

export default function ResultsScreen({
  result,
  placeDetails,
  addressText,
  rentcastData,
  rentcastLoading,
  batchData,
  batchLoading,
  onRetake: _onRetake,
  leadName,
  leadEmail,
  leadPhone,
  downPaymentAnswer,
  view,
  onViewChange,
}: ResultsScreenProps) {
  const commonProps = {
    result,
    placeDetails,
    addressText,
    rentcastData,
    batchData,
    leadName,
    leadEmail,
    leadPhone,
    downPaymentAnswer,
    isLoading: rentcastLoading || batchLoading,
    onNext: () => {},
    onBook: () => onViewChange('booking'),
  };

  if (view === 'booking') {
    const propertyAddress = placeDetails?.address ?? addressText ?? null;
    return (
      <BookingScreen
        onBack={() => onViewChange('slide2')}
        leadName={leadName}
        leadEmail={leadEmail}
        leadPhone={leadPhone}
        propertyAddress={propertyAddress}
      />
    );
  }

  if (view === 'full') {
    return (
      <ResultsFullAnalysis
        result={result}
        placeDetails={placeDetails}
        addressText={addressText}
        rentcastData={rentcastData}
        rentcastLoading={rentcastLoading}
        batchData={batchData}
        batchLoading={batchLoading}
        onNext={() => onViewChange('slide1')}
      />
    );
  }

  if (view === 'slide1') {
    return (
      <Slide1MarketOpportunity
        {...commonProps}
        onNext={() => onViewChange('slide2')}
      />
    );
  }

  return (
    <Slide2ProfitPotential
      {...commonProps}
      onNext={() => {}}
    />
  );
}
