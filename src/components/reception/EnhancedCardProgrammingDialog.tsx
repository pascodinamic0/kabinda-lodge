/**
 * Enhanced Card Programming Dialog
 * Integrates with cloud API for tracking card issues
 */
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
} from '@/services/cardProgrammingService';
import {
  CARD_READER_MESSAGES,
  CARD_INSTRUCTIONS,
  CARD_ICONS,
} from '@/config/cardReaderConfig';
import { useToast } from '@/hooks/use-toast';
import {
  createCardIssue,
  updateCardIssueStatus,
  encodeCardViaAgent,
  getLocalAgentStatus,
} from '@/services/hotelLockService';
import type { CardIssue } from '@/types/hotelLock';

interface EnhancedCardProgrammingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingData: BookingData;
  hotelId: string;
  roomId?: string;
  onSuccess?: (cardIssues: CardIssue[]) => void;
  onError?: (error: string) => void;
}

type CardStatus = 'pending' | 'waiting' | 'programming' | 'success' | 'error';

interface CardState {
  cardType: CardType;
  status: CardStatus;
  error?: string;
  cardUID?: string;
  timestamp?: string;
  cardIssueId?: string;
}

export const EnhancedCardProgrammingDialog: React.FC<EnhancedCardProgrammingDialogProps> = ({
  open,
  onOpenChange,
  bookingData,
  hotelId,
  roomId,
  onSuccess,
  onError,
}) => {
  const { toast } = useToast();
  const [isAgentAvailable, setIsAgentAvailable] = useState<boolean | null>(null);
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

  useEffect(() => {
    if (open) {
      checkAgentStatus();
    } else {
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

  const checkAgentStatus = async () => {
    try {
      const status = await getLocalAgentStatus();
      setIsAgentAvailable(status.connected || false);
    } catch (error) {
      setIsAgentAvailable(false);
    }
  };

  const startProgramming = async () => {
    setIsProgramming(true);
    setIsComplete(false);
    setOverallProgress(0);

    const createdCardIssues: CardIssue[] = [];

    try {
      for (let i = 0; i < CARD_SEQUENCE.length; i++) {
        const cardType = CARD_SEQUENCE[i];
        setCurrentCardIndex(i);

        // Update state to waiting
        setCardStates(prev =>
          prev.map((state, idx) =>
            idx === i ? { ...state, status: 'waiting' } : state
          )
        );

        // Wait a moment
        await new Promise(resolve => setTimeout(resolve, 500));

        // Update state to programming
        setCardStates(prev =>
          prev.map((state, idx) =>
            idx === i ? { ...state, status: 'programming' } : state
          )
        );

        try {
          // 1. Create card issue in cloud
          const cardPayload = {
            cardType,
            bookingData,
            roomNumber: bookingData.roomNumber,
            checkInDate: bookingData.checkInDate,
            checkOutDate: bookingData.checkOutDate,
          };

          const cardIssue = await createCardIssue({
            hotelId,
            roomId,
            bookingId: String(bookingData.bookingId),
            cardType,
            payload: cardPayload,
          });

          createdCardIssues.push(cardIssue);

          // Update state with card issue ID
          setCardStates(prev =>
            prev.map((state, idx) =>
              idx === i ? { ...state, cardIssueId: cardIssue.id, status: 'programming' } : state
            )
          );

          // 2. Update status to in_progress
          await updateCardIssueStatus(cardIssue.id, {
            status: 'in_progress',
          });

          // 3. Call local agent to encode card
          const agentResult = await encodeCardViaAgent(
            cardIssue.id,
            cardPayload,
            hotelId,
            roomId
          );

          if (agentResult.ok && agentResult.result) {
            // 4. Update card issue as done
            await updateCardIssueStatus(cardIssue.id, {
              status: 'done',
              result: agentResult.result,
            });

            setCardStates(prev =>
              prev.map((state, idx) =>
                idx === i
                  ? {
                      ...state,
                      status: 'success',
                      cardUID: agentResult.result?.cardUID,
                      timestamp: agentResult.result?.timestamp,
                    }
                  : state
              )
            );
          } else {
            // Mark as failed
            await updateCardIssueStatus(cardIssue.id, {
              status: 'failed',
              error_message: agentResult.error || 'Programming failed',
            });

            setCardStates(prev =>
              prev.map((state, idx) =>
                idx === i
                  ? {
                      ...state,
                      status: 'error',
                      error: agentResult.error || 'Programming failed',
                    }
                  : state
              )
            );
          }
        } catch (error: any) {
          console.error(`Error programming ${cardType} card:`, error);

          // Find the card issue if it was created
          const cardIssue = createdCardIssues.find(ci => 
            cardStates[i]?.cardIssueId === ci.id
          );

          if (cardIssue) {
            await updateCardIssueStatus(cardIssue.id, {
              status: 'failed',
              error_message: error.message || 'Unknown error',
            });
          }

          setCardStates(prev =>
            prev.map((state, idx) =>
              idx === i
                ? {
                    ...state,
                    status: 'error',
                    error: error.message || 'Programming failed',
                  }
                : state
            )
          );
        }

        // Update progress
        const progress = ((i + 1) / CARD_SEQUENCE.length) * 100;
        setOverallProgress(progress);

        // Wait before next card
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setIsComplete(true);
      setOverallProgress(100);

      const successfulCards = cardStates.filter(s => s.status === 'success').length;
      if (successfulCards === CARD_SEQUENCE.length) {
        toast({
          title: 'Success!',
          description: CARD_READER_MESSAGES.sequenceComplete,
        });
        onSuccess?.(createdCardIssues);
      } else if (successfulCards > 0) {
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

  const canStartProgramming = isAgentAvailable && !isProgramming;

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
          {/* Agent Status */}
          {isAgentAvailable === false && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>Local agent is not available. Please ensure the agent is running.</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={checkAgentStatus}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Check Again
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




