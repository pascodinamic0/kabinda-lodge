import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, AlertCircle, CreditCard, RefreshCw } from 'lucide-react';
import {
  BookingData,
  CardType,
  CARD_SEQUENCE,
  CARD_TYPE_LABELS,
  CARD_TYPE_DESCRIPTIONS,
  programCardSequenceStepByStep,
  checkBridgeServiceStatus,
  getReaderStatus,
  reconnectReader,
} from '@/services/cardProgrammingService';
import {
  CARD_READER_MESSAGES,
  CARD_INSTRUCTIONS,
  CARD_ICONS,
} from '@/config/cardReaderConfig';
import { useToast } from '@/hooks/use-toast';

interface CardProgrammingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingData: BookingData;
  onSuccess?: (results: any[]) => void;
  onError?: (error: string) => void;
}

type CardStatus = 'pending' | 'waiting' | 'programming' | 'success' | 'error';

interface CardState {
  cardType: CardType;
  status: CardStatus;
  error?: string;
  cardUID?: string;
  timestamp?: string;
}

export const CardProgrammingDialog: React.FC<CardProgrammingDialogProps> = ({
  open,
  onOpenChange,
  bookingData,
  onSuccess,
  onError,
}) => {
  const { toast } = useToast();
  const [isServiceAvailable, setIsServiceAvailable] = useState<boolean | null>(null);
  const [isReaderConnected, setIsReaderConnected] = useState<boolean | null>(null);
  const [isProgramming, setIsProgramming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [cardStates, setCardStates] = useState<CardState[]>(
    CARD_SEQUENCE.map(cardType => ({
      cardType,
      status: 'pending' as CardStatus,
    }))
  );
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [overallProgress, setOverallProgress] = useState(0);

  // Check service status when dialog opens
  useEffect(() => {
    if (open) {
      checkServiceAndReader();
    } else {
      // Reset state when dialog closes
      resetState();
    }
  }, [open]);

  const resetState = () => {
    setIsProgramming(false);
    setIsComplete(false);
    setCurrentCardIndex(0);
    setOverallProgress(0);
    setCardStates(
      CARD_SEQUENCE.map(cardType => ({
        cardType,
        status: 'pending' as CardStatus,
      }))
    );
  };

  const checkServiceAndReader = async () => {
    try {
      // Check if bridge service is running
      const serviceAvailable = await checkBridgeServiceStatus();
      setIsServiceAvailable(serviceAvailable);

      if (serviceAvailable) {
        // Check if card reader is connected
        const readerStatus = await getReaderStatus();
        setIsReaderConnected(readerStatus.connected);
      }
    } catch (error) {
      console.error('Error checking service status:', error);
      setIsServiceAvailable(false);
      setIsReaderConnected(false);
    }
  };

  const handleReconnectReader = async () => {
    toast({
      title: 'Reconnecting...',
      description: 'Attempting to reconnect to card reader',
    });

    const success = await reconnectReader();
    if (success) {
      setIsReaderConnected(true);
      toast({
        title: 'Success',
        description: 'Card reader reconnected successfully',
      });
    } else {
      toast({
        title: 'Error',
        description: 'Failed to reconnect to card reader',
        variant: 'destructive',
      });
    }
  };

  const startProgramming = async () => {
    setIsProgramming(true);
    setIsComplete(false);
    setOverallProgress(0);

    try {
      const results = await programCardSequenceStepByStep(
        bookingData,
        (cardType, status, result) => {
          // Find the index of the card being programmed
          const index = CARD_SEQUENCE.indexOf(cardType);
          setCurrentCardIndex(index);

          // Update the card state
          setCardStates(prev =>
            prev.map((state, i) =>
              i === index
                ? {
                    ...state,
                    status,
                    error: result?.error,
                    cardUID: result?.cardUID,
                    timestamp: result?.timestamp,
                  }
                : state
            )
          );

          // Update overall progress
          const progress = ((index + (status === 'success' || status === 'error' ? 1 : 0.5)) / CARD_SEQUENCE.length) * 100;
          setOverallProgress(progress);
        }
      );

      setIsComplete(true);
      setOverallProgress(100);

      if (results.success) {
        toast({
          title: 'Success!',
          description: CARD_READER_MESSAGES.sequenceComplete,
        });
        onSuccess?.(results.results);
      } else if (results.completedCards > 0) {
        toast({
          title: 'Partially Complete',
          description: CARD_READER_MESSAGES.sequencePartialSuccess,
          variant: 'default',
        });
        onError?.(CARD_READER_MESSAGES.sequencePartialSuccess);
      } else {
        toast({
          title: 'Failed',
          description: CARD_READER_MESSAGES.sequenceFailed,
          variant: 'destructive',
        });
        onError?.(CARD_READER_MESSAGES.sequenceFailed);
      }
    } catch (error: any) {
      console.error('Card programming error:', error);
      toast({
        title: 'Error',
        description: error.message || CARD_READER_MESSAGES.unknownError,
        variant: 'destructive',
      });
      onError?.(error.message || CARD_READER_MESSAGES.unknownError);
    } finally {
      setIsProgramming(false);
    }
  };

  const getStatusIcon = (status: CardStatus) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'programming':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
      case 'waiting':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <CreditCard className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: CardStatus) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-600">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'programming':
        return <Badge className="bg-blue-600">Programming...</Badge>;
      case 'waiting':
        return <Badge className="bg-yellow-600">Place Card</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const canStartProgramming = isServiceAvailable && isReaderConnected && !isProgramming;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Program Key Cards
          </DialogTitle>
          <DialogDescription>
            Program all required key cards for Room {bookingData.roomNumber}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Status */}
          {isServiceAvailable === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{CARD_READER_MESSAGES.serviceUnavailable}</AlertDescription>
            </Alert>
          )}

          {isServiceAvailable && !isReaderConnected && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{CARD_READER_MESSAGES.readerNotConnected}</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReconnectReader}
                  className="ml-2"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reconnect
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Overall Progress */}
          {isProgramming && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          )}

          {/* Card List */}
          <div className="space-y-3">
            {cardStates.map((cardState, index) => (
              <div
                key={cardState.cardType}
                className={`p-4 border rounded-lg transition-all ${
                  currentCardIndex === index && isProgramming
                    ? 'border-blue-500 bg-blue-50'
                    : cardState.status === 'success'
                    ? 'border-green-500 bg-green-50'
                    : cardState.status === 'error'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="text-2xl">{CARD_ICONS[cardState.cardType]}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">
                          {index + 1}. {CARD_TYPE_LABELS[cardState.cardType]}
                        </h4>
                        {getStatusBadge(cardState.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {CARD_TYPE_DESCRIPTIONS[cardState.cardType]}
                      </p>
                      {cardState.status === 'waiting' && (
                        <Alert className="bg-yellow-50 border-yellow-200">
                          <AlertDescription className="text-sm">
                            {CARD_INSTRUCTIONS[cardState.cardType]}
                          </AlertDescription>
                        </Alert>
                      )}
                      {cardState.status === 'error' && cardState.error && (
                        <Alert variant="destructive" className="text-sm">
                          <AlertDescription>{cardState.error}</AlertDescription>
                        </Alert>
                      )}
                      {cardState.status === 'success' && cardState.cardUID && (
                        <p className="text-xs text-green-700 font-mono">
                          UID: {cardState.cardUID}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>{getStatusIcon(cardState.status)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProgramming}
            >
              {isComplete ? 'Close' : 'Cancel'}
            </Button>
            {!isComplete && (
              <Button
                onClick={startProgramming}
                disabled={!canStartProgramming}
              >
                {isProgramming ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Programming...
                  </>
                ) : (
                  'Start Programming'
                )}
              </Button>
            )}
            {isComplete && (
              <Button onClick={resetState} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

