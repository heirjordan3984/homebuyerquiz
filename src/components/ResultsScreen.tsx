import { Slide1MarketOpportunity, Slide2BudgetMortgage, Slide3ChecklistLender } from './ResultsSlides';
import ResultsFullAnalysis from './ResultsFullAnalysis';
import type { QuizResult } from '../utils/quizLogic';
import type { PlaceDetails } from './AddressAutocomplete';
import type { RentcastData } from '../types/rentcast';

export type ResultsView = 'slide1' | 'slide2' | 'slide3' | 'full';

interface ResultsScreenProps {
  result: QuizResult;
  placeDetails?: PlaceDetails | null;
  addressText?: string | null;
  rentcastData?: RentcastData | null;
  rentcastLoading?: boolean;
  onRetake: () => void;
  leadName?: string;
  leadEmail?: string;
  leadPhone?: string;
  downPaymentAnswer?: number | null;
  budgetAnswer?: number | null;
  view: ResultsView;
  onViewChange: (v: ResultsView) => void;
}

export default function ResultsScreen({
  result,
  placeDetails,
  addressText,
  rentcastData,
  rentcastLoading,
  onRetake: _onRetake,
  leadName,
  leadEmail,
  leadPhone,
  downPaymentAnswer,
  budgetAnswer,
  view,
  onViewChange,
}: ResultsScreenProps) {
  const commonProps = {
    result,
    placeDetails,
    addressText,
    rentcastData,
    leadName,
    leadEmail,
    leadPhone,
    downPaymentAnswer,
    budgetAnswer,
    isLoading: rentcastLoading,
    onNext: () => {},
    onRetake: _onRetake,
  };

  if (view === 'full') {
    return (
      <ResultsFullAnalysis
        result={result}
        placeDetails={placeDetails}
        addressText={addressText}
        rentcastData={rentcastData}
        rentcastLoading={rentcastLoading}
        budgetAnswer={budgetAnswer}
        onNext={() => onViewChange('slide1')}
        onRetake={_onRetake}
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

  if (view === 'slide2') {
    return (
      <Slide2BudgetMortgage
        {...commonProps}
        onNext={() => onViewChange('slide3')}
      />
    );
  }

  return (
    <Slide3ChecklistLender
      {...commonProps}
      onNext={() => {}}
    />
  );
}
