import React, { useEffect, useState, useMemo } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useTheme } from '@mui/material/styles';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import candidateService from '../../services/candidateService';
import voteService from '../../services/voteService';
import electionService from '../../services/electionService'; // For public election status
import positionService from '../../services/positionService'; // Import positionService

// Hardcoded constants will be replaced by dynamic data

const VotingPage = () => {
  console.log('[VotingPage Render] Component rendering...');
  const theme = useTheme();
  const [candidates, setCandidates] = useState([]);
  const [groupedCandidates, setGroupedCandidates] = useState({});
  const [selectedCandidates, setSelectedCandidates] = useState({}); // E.g., { 'candidateId1': true, 'candidateId2': false }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [isVotingOpen, setIsVotingOpen] = useState(false);
  const [hasVoted, setHasVoted] = useState(false);
  const [pageLoading, setPageLoading] = useState(true); // Combined loading state for initial data
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  const [positionsData, setPositionsData] = useState([]);
  const [positionsLoading, setPositionsLoading] = useState(true);
  const [positionsError, setPositionsError] = useState('');
  console.log('[VotingPage State Init] positionsData:', positionsData, 'positionsLoading:', positionsLoading, 'positionsError:', positionsError, 'candidates:', candidates);

  // Dynamically generate voting stages and position order from fetched positions
  const VOTING_STAGES = useMemo(() => {
    if (positionsLoading || positionsError) return ['Loading Stages...', 'Review'];
    const stages = positionsData.map(p => p.name);
    stages.push('Review'); // Add Review stage at the end
    return stages;
  }, [positionsData, positionsLoading, positionsError]);

  // The order of positions is determined by positionsData array (fetched sorted by 'order')
  // POSITION_ORDER equivalent is positionsData itself or positionsData.map(p => p.name)

  console.log('[VotingPage State] Initial currentStageIndex:', currentStageIndex);

  const currentStage = VOTING_STAGES[currentStageIndex];
  const isReviewStage = currentStage === 'Review'; // Moved up

  // currentPositionToVote will be the actual position object from positionsData
  const currentPositionToVote = useMemo(() => {
    if (positionsLoading || positionsError || currentStageIndex >= positionsData.length) {
      // If it's the review stage, currentPositionToVote should be null or handled differently
      // This seems fine as isReviewStage is now available for more direct checks if needed elsewhere
      return null;
    }
    return positionsData[currentStageIndex];
  }, [positionsData, currentStageIndex, positionsLoading, positionsError]);
  // This console log is specific to currentPositionToVote, keep it here.
  console.log('[VotingPage Derived State] currentPositionToVote after useMemo:', currentPositionToVote);

  // stageTitle must be after isReviewStage and currentPositionToVote are defined.
  const stageTitle = isReviewStage ? 'Review Your Selections' : (currentPositionToVote ? `Vote for: ${currentPositionToVote.name}` : 'Loading Position...');

  // Consolidated log for derived states, ensuring all logged variables are defined.
  console.log('[VotingPage Derived State Summary] currentStage:', currentStage, 'isReviewStage:', isReviewStage, 'currentPositionToVote:', currentPositionToVote ? currentPositionToVote.name : 'N/A', 'currentStageIndex:', currentStageIndex, 'stageTitle:', stageTitle);

  // Calculate selected count for the current position being voted on
  const selectedCountForCurrentPosition = useMemo(() => {
    if (!currentPositionToVote || !currentPositionToVote._id || candidates.length === 0) return 0;

    return Object.keys(selectedCandidates).filter(candidateId => {
      if (!selectedCandidates[candidateId]) return false; // Only count if true (selected)

      const candidate = candidates.find(c => c && c._id === candidateId);
      // Ensure candidate exists and its position matches currentPositionToVote
      if (!candidate || !candidate.position || candidate.position._id !== currentPositionToVote._id) {
        return false;
      }
      return true;
    }).length;
  }, [selectedCandidates, currentPositionToVote, candidates]);

  useEffect(() => {
    (async () => {
      try {
        setPageLoading(true);
      setError(null);

      // Fetch election status
      // Fetch public election status (is voting period open?)
        const electionStatusData = await electionService.getPublicElectionStatus();
        if (electionStatusData && typeof electionStatusData.isVotingOpen === 'boolean') {
          setIsVotingOpen(electionStatusData.isVotingOpen);
        } else {
          console.error('[VotingPage] Unexpected electionStatusData format. `isVotingOpen` property is missing or not a boolean. Received:', electionStatusData);
          setIsVotingOpen(false); // Default to closed if status is unclear
          const errorMessage = electionStatusData && typeof electionStatusData.message === 'string' 
            ? electionStatusData.message 
            : 'Could not determine if voting is open due to unexpected data format from server (expected isVotingOpen).';
          throw new Error(errorMessage);
        }

        if (!electionStatusData.isVotingOpen) {
          setError(electionStatusData.message || 'Voting is currently closed.');
          setPositionsLoading(false);
          setPageLoading(false);
          return;
        }

        // Fetch current user's voting status (have they already voted?)
        const userVoteStatusData = await voteService.getUserVoteStatus();
        if (userVoteStatusData && typeof userVoteStatusData.hasVoted !== 'undefined') {
          setHasVoted(userVoteStatusData.hasVoted);
        } else {
          // If status is unclear, err on the side of caution or throw
          throw new Error('Could not determine your voting status.');
        }

        if (userVoteStatusData.hasVoted) {
          // No need to set an error here, the main component render handles the 'hasVoted' message
          // setError('You have already submitted your vote for this election.');
          setPositionsLoading(false); // No need to load positions if already voted
          setPageLoading(false);
          return;
        }

      // Fetch active positions first
      try {
        const activePositions = await positionService.getAllPositions({ status: 'active', sortBy: 'order' });
        setPositionsData(activePositions || []);
        setPositionsError('');
      } catch (posError) {
        console.error("[VotingPage FetchPositions Error]", posError);
        console.error("[VotingPage FetchPositions Error Raw]", posError); // Log raw
        let posDisplayError = 'Failed to load position data.';
        if (posError instanceof Error) {
            posDisplayError = posError.message;
        } else if (typeof posError === 'string') {
            posDisplayError = posError;
        } else if (posError && typeof posError.message === 'string') {
            posDisplayError = posError.message;
        } else if (typeof posError === 'object' && posError !== null && Object.keys(posError).length > 0) {
            try { posDisplayError = JSON.stringify(posError); } catch (_) { /* ignore stringify error */ }
        } else if (typeof posError === 'object' && posError !== null && Object.keys(posError).length === 0) {
            posDisplayError = 'Received empty error object fetching positions.';
        }
        setPositionsError(posDisplayError);
        // Optionally, stop further loading if positions are critical
        // setError('Failed to load essential voting information (positions).');
        // setPageLoading(false);
        // setPositionsLoading(false);
        // return; 
      }
      setPositionsLoading(false);

      // Fetch candidates (assuming positionsData is now available or loading handled)
      const candidateData = await candidateService.getAllCandidates();
      const fetchedCandidates = (candidateData && candidateData.data && candidateData.data.candidates) ? candidateData.data.candidates : [];
      setCandidates(fetchedCandidates);

      // Grouping candidates will be handled dynamically in the render logic or a useMemo hook based on currentPositionToVote._id
      // For now, setGroupedCandidates can be an empty object or removed if not used in this new structure directly
      setGroupedCandidates({}); // Or adapt if still needed for some overview

      // Initialize selectedCandidates state based on fetched candidates
      const initialSelections = {};
      fetchedCandidates.forEach(c => {
        initialSelections[c._id] = false; // Initially no candidate is selected
      });
      setSelectedCandidates(initialSelections);

    } catch (err) {
      console.error("[VotingPage FetchData Error Raw]", err); // Log the raw error
      let displayErrorMessage = 'Failed to load voting page data. Please try again later.';
      
      if (err instanceof Error) {
        displayErrorMessage = err.message;
      } else if (typeof err === 'string') {
        displayErrorMessage = err;
      } else if (err && typeof err.message === 'string') { // For error-like objects
        displayErrorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && Object.keys(err).length > 0) {
        // Attempt to get a message from a common structure or stringify
        try { displayErrorMessage = JSON.stringify(err); } catch (_) { /* ignore stringify error */ }
      } else if (typeof err === 'object' && err !== null && Object.keys(err).length === 0) {
        displayErrorMessage = 'An empty error object was received. Check service responses.';
      }

      if (!positionsError) { // positionsError is already a string message
        setError(displayErrorMessage);
      } else {
        // If positionsError already exists, append or prioritize
        setError(`Positions Error: ${positionsError}. Page Load Error: ${displayErrorMessage}`);
      }
    } finally {
      setPageLoading(false);
      // positionsLoading is set within its own try/catch or after its fetch
    }
    })(); // IIFE call
  }, []);

  const handleSelectionChange = (candidateId) => {
    const candidateBeingClicked = candidates.find(c => c._id === candidateId);
    if (!candidateBeingClicked) return;

    // Ensure candidate, its position, and current voting position are defined.
    if (!candidateBeingClicked.position || !candidateBeingClicked.position._id || !currentPositionToVote || !currentPositionToVote._id) {
      console.warn('Selection change on candidate with missing/invalid position data or no current voting position defined.');
      return;
    }

    // Ensure the candidate belongs to the current voting stage's position.
    // This is a safeguard; UI should already filter candidates for the current stage.
    if (candidateBeingClicked.position._id !== currentPositionToVote._id) {
      alert(`You are trying to select a candidate from a different position. Please only select candidates for ${currentPositionToVote.name}.`);
      return;
    }

    const isCurrentlySelected = !!selectedCandidates[candidateId];
    const limit = currentPositionToVote.maxSelectable;

    // Count current selections specifically for the currentPositionToVote
    let selectionsForCurrentPosition = 0;
    for (const id in selectedCandidates) {
      if (selectedCandidates[id]) { // If this candidate is marked as selected
        const selectedCandidateInLoop = candidates.find(c => c._id === id);
        // Check if this selected candidate belongs to the current voting position
        if (selectedCandidateInLoop && selectedCandidateInLoop.position && selectedCandidateInLoop.position._id === currentPositionToVote._id) {
          selectionsForCurrentPosition++;
        }
      }
    }

    if (!isCurrentlySelected && selectionsForCurrentPosition >= limit) {
      alert(`You can select a maximum of ${limit} candidate(s) for ${currentPositionToVote.name}.`);
      return;
    }

    // If the candidate belongs to the current position, proceed with selection logic
    setSelectedCandidates(prev => ({
      ...prev,
      [candidateId]: !isCurrentlySelected,
    }));
  };

  const handleNextStage = () => {
    console.log('[handleNextStage] Called. currentStageIndex BEFORE:', currentStageIndex);
    console.log('[handleNextStage] VOTING_STAGES:', JSON.stringify(VOTING_STAGES));
    console.log('[handleNextStage] positionsLoading:', positionsLoading);
    console.log('[handleNextStage] currentPositionToVote Name:', currentPositionToVote ? currentPositionToVote.name : 'null', 'ID:', currentPositionToVote ? currentPositionToVote._id : 'null');

    // Check against dynamically generated VOTING_STAGES length. The last stage is 'Review'.
    if (positionsLoading || !VOTING_STAGES || VOTING_STAGES.length === 0 || currentStageIndex >= VOTING_STAGES.length - 1) {
      console.log('[handleNextStage] Aborting: Condition met to prevent stage advance.');
      console.log(`[handleNextStage] Details: positionsLoading=${positionsLoading}, VOTING_STAGES.length=${VOTING_STAGES ? VOTING_STAGES.length : 'N/A'}, currentStageIndex=${currentStageIndex}, ReviewStageIndex=${VOTING_STAGES ? VOTING_STAGES.length -1 : 'N/A'}`);
      return;
    }

    // If current stage is for a position (not review stage yet)
    // Ensure currentPositionToVote and its minSelectable property are valid
    if (currentPositionToVote && typeof currentPositionToVote.minSelectable === 'number' && currentPositionToVote.minSelectable > 0) {
      let selectionsForCurrentPosition = 0;
      for (const id in selectedCandidates) {
        if (selectedCandidates[id]) {
          const selectedCandidateInLoop = candidates.find(c => c._id === id);
          if (selectedCandidateInLoop && selectedCandidateInLoop.position && selectedCandidateInLoop.position._id === currentPositionToVote._id) {
            selectionsForCurrentPosition++;
          }
        }
      }

      if (selectionsForCurrentPosition < currentPositionToVote.minSelectable) {
        alert(`Please select at least ${currentPositionToVote.minSelectable} candidate(s) for ${currentPositionToVote.name} to proceed.`);
        console.log('[handleNextStage] Aborting: Minimum selectable not met.');
        return;
      }
    } else if (currentPositionToVote) {
      // This case handles if minSelectable is 0, not a number, or currentPositionToVote is null but somehow passed the first check
      console.log(`[handleNextStage] No minimum selection check needed or issue with minSelectable. Position: ${currentPositionToVote.name}, minSelectable: ${currentPositionToVote.minSelectable}`);
    } else {
      console.error('[handleNextStage] Critical error: currentPositionToVote is null at selection check point.');
      return; // Should not proceed if currentPositionToVote is null here
    }

    console.log('[handleNextStage] All checks passed. Proceeding to set next stage. Current currentStageIndex:', currentStageIndex);
    setCurrentStageIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      console.log('[handleNextStage inside setCurrentStageIndex] prevIndex:', prevIndex, '=> nextIndex:', nextIndex);
      return nextIndex;
    });
  };

  const handlePreviousStage = () => {
    if (currentStageIndex > 0) {
      setCurrentStageIndex(currentStageIndex - 1);
      setSubmitError(null); // Clear previous submission messages
      setSubmitSuccess(null);
    }
  };

const handleSubmitVote = async () => {
  setSubmitError(null);
  setSubmitSuccess(null);
  setLoading(true); // Start loading early

  const votesToSubmitPayload = { votesByPosition: {} };

  let totalSelectedCandidates = 0;
  Object.entries(selectedCandidates)
    .filter(([_, isSelected]) => isSelected)
    .forEach(([candidateId, _]) => {
      totalSelectedCandidates++;
      const candidate = candidates.find(c => c._id === candidateId);
      if (candidate && candidate.position && candidate.position._id) {
        const positionId = candidate.position._id;
        if (!votesToSubmitPayload.votesByPosition[positionId]) {
          votesToSubmitPayload.votesByPosition[positionId] = [];
        }
        votesToSubmitPayload.votesByPosition[positionId].push(candidateId);
      } else {
        console.warn(`Selected candidate ${candidateId} not found in local candidates list or is missing position information.`);
      }
    });

  if (totalSelectedCandidates === 0) {
    setSubmitError('Please select at least one candidate to vote.');
    setLoading(false);
    return;
  }

  // Validate against position limits (maxSelectable)
  for (const positionId in votesToSubmitPayload.votesByPosition) {
    const selectedForThisPositionCount = votesToSubmitPayload.votesByPosition[positionId].length;
    const position = positionsData.find(p => p._id === positionId);

    if (position) { // Ensure position is found in positionsData
      if (selectedForThisPositionCount > position.maxSelectable) {
        setSubmitError(`For ${position.name}, you can select a maximum of ${position.maxSelectable} candidates. You selected ${selectedForThisPositionCount}.`);
        setLoading(false);
        return;
      }
      // Optional: Add minSelectable check if needed, e.g.:
      // if (position.minSelectable !== undefined && selectedForThisPositionCount < position.minSelectable) {
      //   setSubmitError(`For ${position.name}, you must select at least ${position.minSelectable} candidates. You selected ${selectedForThisPositionCount}.`);
      //   setLoading(false);
      //   return;
      // }
    } else {
      // This case should ideally not happen if candidates are correctly associated with positions loaded from positionsData
      console.warn(`Position with ID ${positionId} not found in positionsData during validation. This might indicate an inconsistency.`);
      // Potentially set an error and return if this is critical
      // setSubmitError(`An internal error occurred: Could not validate selections for an unknown position (ID: ${positionId}).`);
      // setLoading(false);
      // return;
    }
  }

  console.log('Submitting votes payload:', votesToSubmitPayload);

  try {
    const response = await voteService.castVote(votesToSubmitPayload);
    setSubmitSuccess(response.message || 'Your vote has been successfully submitted!');
    setHasVoted(true);
    setSelectedCandidates({}); // Clear selections
  } catch (err) {
    setSubmitError(err.message || 'Failed to submit your vote. Please try again.');
    console.error('Vote submission error:', err);
  } finally {
    setLoading(false);
  }
};

if (pageLoading) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
      <CircularProgress />
      <Typography sx={{ ml: 2 }}>Loading Voting Information...</Typography>
    </Box>
  );
}

if (error) {
  return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
}

if (!isVotingOpen) {
  return (
    <Container component="main" maxWidth="sm" sx={{ textAlign: 'center', my: 4 }}>
      <Alert severity="info">Voting is currently closed. Please check back later.</Alert>
    </Container>
  );
}

// Debug log for button disabled states
console.log('[VotingPage Render Debug] States for Next Button:', {
  loading,
  isSubmitSuccess: !!submitSuccess,
  isVotingOpen,
  hasVoted,
  positionsLoading,
  isCurrentPositionToVoteNull: !currentPositionToVote,
  // currentPositionToVoteObj: currentPositionToVote ? JSON.stringify(currentPositionToVote) : null, // Can be verbose
  currentPositionName: currentPositionToVote ? currentPositionToVote.name : 'N/A',
  currentStageIndex,
  isReviewStage,
  VOTING_STAGES_length: VOTING_STAGES ? VOTING_STAGES.length : 'N/A',
  nextButtonDisabledLogic: loading || !!submitSuccess || !isVotingOpen || hasVoted || positionsLoading || !currentPositionToVote
});

if (hasVoted) {
  return (
    <Container component="main" maxWidth="sm" sx={{ textAlign: 'center', my: 4 }}>
      <Alert severity="success">You have already submitted your vote. Thank you for participating!</Alert>
    </Container>
  );
}

return (
  <Container component="main" maxWidth="lg">
    <Box sx={{ my: 4 }}>
      {/* Sticky Stage Title */}
      <Box sx={{
        position: 'sticky',
        top: 0,
        backgroundColor: theme?.palette?.background?.paper || 'white',
        zIndex: theme?.zIndex?.appBar ? theme.zIndex.appBar - 1 : 1099,
        py: 2,
        mb: 2, // Margin bottom to push content down
        textAlign: 'center',
        borderBottom: `1px solid ${theme?.palette?.divider || '#e0e0e0'}`,
      }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 0 }}>
          {isReviewStage ? 'Review Your Selections' : 
            (currentPositionToVote ? `Vote for: ${currentPositionToVote.name}` : 'Loading Position...')}
        </Typography>
        {!isReviewStage && currentPositionToVote && (
          <Typography variant="body1" color="text.secondary">
            Select between {currentPositionToVote.minSelectable} and {currentPositionToVote.maxSelectable} candidate(s). Selected: {Object.keys(selectedCandidates).filter(id => selectedCandidates[id] && candidates.find(c => c._id === id).position._id === currentPositionToVote._id).length}
          </Typography>
        )}
      </Box>

      {/* Main Content Area */}
      <Box sx={{ opacity: loading ? 0.5 : 1, pointerEvents: loading ? 'none' : 'auto' }}>
        {/* Conditional rendering for no candidates - might need adjustment based on stages */}
        {/* For now, let's assume candidates are fetched and grouped, and stage logic handles display */}
        {/* Candidate Cards - Render only if not review stage and candidates exist for current position */} 
        {console.log('[VotingPage Render Check - Instructions Box] currentPositionToVote:', currentPositionToVote, 'isReviewStage:', isReviewStage, 'condition:', !isReviewStage && currentPositionToVote && candidates.filter(c => c && c.position && c.position._id === currentPositionToVote._id).length > 0 && (!pageLoading && isVotingOpen && !hasVoted))}
        {!isReviewStage && currentPositionToVote && candidates.filter(c => c && c.position && c.position._id === currentPositionToVote._id).length > 0 && (!pageLoading && isVotingOpen && !hasVoted && (
          <Box sx={{ mb: 2, p: 2, backgroundColor: 'grey.100', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>{currentPositionToVote.name || 'Position'} - Instructions</Typography>
            <Typography variant="body1" gutterBottom>
              {currentPositionToVote.description || 'Select your preferred candidates for this position.'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can select {
                (typeof currentPositionToVote.minSelectable === 'number' && typeof currentPositionToVote.maxSelectable === 'number') ?
                  (currentPositionToVote.minSelectable === currentPositionToVote.maxSelectable ?
                  `exactly ${currentPositionToVote.minSelectable} candidate(s).` :
                  `between ${currentPositionToVote.minSelectable} and ${currentPositionToVote.maxSelectable} candidate(s).`)
                : 'the allowed number of candidate(s).' // Fallback message
              }
            </Typography>
            <Typography variant="caption" display="block" sx={{ mt: 1, fontStyle: 'italic' }}>
              Selected: {Object.keys(selectedCandidates).filter(id => selectedCandidates[id] && candidates.find(c => c._id === id).position._id === currentPositionToVote._id).length} / {
                (typeof currentPositionToVote.minSelectable === 'number' && typeof currentPositionToVote.maxSelectable === 'number') ?
                (currentPositionToVote.minSelectable === currentPositionToVote.maxSelectable ?
                  currentPositionToVote.maxSelectable : `${currentPositionToVote.minSelectable}-${currentPositionToVote.maxSelectable}`)
                : 'N/A' // Fallback
              }
            </Typography>
          </Box>
        ))}

        {/* Candidate Cards - Render only if not review stage and candidates exist for current position */}
        {/* The line above is the correct start for candidate cards, the duplicated one was removed by replacing the larger TargetContent */}
        {!isReviewStage && currentPositionToVote && candidates.filter(c => c && c.position && c.position._id === currentPositionToVote._id).length > 0 && (!pageLoading && isVotingOpen && !hasVoted && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 3 }}>
              {isReviewStage 
                ? 'Please review your choices for each position before submitting.' 
                : currentPositionToVote 
                  ? `Select ${currentPositionToVote.minSelectable === currentPositionToVote.maxSelectable 
                      ? currentPositionToVote.maxSelectable 
                      : `between ${currentPositionToVote.minSelectable} and ${currentPositionToVote.maxSelectable}`} candidates for ${currentPositionToVote.name}.`
                  : 'Loading selection limits...'}
            </Typography>
            {console.log('[VotingPage Render Check - Candidate Grid] currentPositionToVote:', currentPositionToVote, 'candidates for position:', currentPositionToVote ? candidates.filter(c => c && c.position && c.position._id === currentPositionToVote._id) : 'N/A')}
            <Grid container spacing={2}>
              {candidates.filter(c => c && c.position && c.position._id === currentPositionToVote._id).map((candidate) => (
                <Grid item xs={12} sm={6} md={4} key={candidate._id}>
                  <Card
                    onClick={() => handleSelectionChange(candidate._id)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      height: '100%',
                      cursor: 'pointer',
                      border: selectedCandidates[candidate._id]
                        ? `2px solid ${theme.palette.primary.main}`
                        : `1px solid #ddd`,
                      backgroundColor: selectedCandidates[candidate._id]
                        ? theme.palette.primary.light // Theme blue for selected
                        : theme.palette.background.paper,
                      color: selectedCandidates[candidate._id] 
                        ? theme.palette.primary.contrastText // Text color for selected card
                        : 'inherit',
                      transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out',
                      '&:hover': {
                        backgroundColor: selectedCandidates[candidate._id]
                          ? theme.palette.primary.main // Darker blue on hover if selected
                          : theme.palette.grey[100],
                        borderColor: selectedCandidates[candidate._id]
                          ? theme.palette.primary.dark
                          : theme.palette.primary.light,
                        // Ensure text color remains contrastText on hover if selected
                        color: selectedCandidates[candidate._id] ? theme.palette.primary.contrastText : 'inherit',
                      }
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="200"
                      image={candidate.profilePhoto ? `/${candidate.profilePhoto.replace(/\\/g, '/')}` : '/default-profile.png'}
                      alt={candidate.firstName ? `${candidate.firstName} ${candidate.lastName}` : candidate.fullName}
                      sx={{ objectFit: 'cover', borderBottom: '1px solid #eee' }}
                    />
                    <CardContent sx={{ textAlign: 'center', flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                        {selectedCandidates[candidate._id] && 
                          <CheckCircleOutlineIcon sx={{ fontSize: '1.2rem' }} />
                        }
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 0 /* Adjust margin if needed due to icon */ }}>
                          {candidate.firstName ? `${candidate.firstName} ${candidate.lastName}` : candidate.fullName}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}

        {/* Review Stage UI */} 
        {isReviewStage && !positionsLoading && positionsData.length > 0 && (
          <Box sx={{ my: 4 }}>
            {/* <Typography variant="h5" gutterBottom>Review Your Selections</Typography> -- Title is already set above */} 
            {positionsData.map(position => {
              const selectionsForPosition = candidates.filter(c => c.position && c.position._id === position._id && selectedCandidates[c._id]);
              if (selectionsForPosition.length === 0) return null; // Don't show section if no selections for this position

              return (
                <Box key={position._id} sx={{ mb: 3 }}>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {position.name} ({selectionsForPosition.length} selected)
                  </Typography>
                  <Grid container spacing={2}>
                    {selectionsForPosition.map(candidate => (
                      <Grid item xs={12} sm={6} md={4} key={candidate._id}>
                        <Card sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p:1 }}>
                          <CardMedia
                            component="img"
                            sx={{ height: 100, width: 100, objectFit: 'cover', borderRadius: '50%', mb: 1 }}
                            image={candidate.profilePhoto ? `/${candidate.profilePhoto}` : '/default-profile.png'}
                            alt={`${candidate.firstName} ${candidate.lastName}`}
                          />
                          <Typography variant="subtitle1" textAlign="center">
                            {candidate.firstName} {candidate.lastName}
                          </Typography>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              );
            })}
            {Object.values(selectedCandidates).every(v => !v) && (
              <Typography sx={{mt: 2, fontStyle: 'italic'}}>You haven't selected any candidates yet.</Typography>
            )}
          </Box>
        )}
      </Box> {/* This closes the main content Box that starts after the sticky title */}

        {/* Navigation and Submit Buttons */}
        {(positionsData.length > 0 || isReviewStage) && !pageLoading && isVotingOpen && !hasVoted && (
            <Box sx={{
              mt: 4, 
              textAlign: 'center',
              position: 'sticky',
              bottom: 0,
              backgroundColor: theme?.palette?.background?.paper || 'white',
              zIndex: 1050, // This was already hardcoded, kept as is
              py: 2,
              borderTop: `1px solid ${theme?.palette?.divider || '#e0e0e0'}`,
            }}>
                {submitError && <Alert severity="error" sx={{ mb: 2 }}>{submitError}</Alert>}
                {submitSuccess && <Alert severity="success" sx={{ mb: 2 }}>{submitSuccess}</Alert>}
                {currentStageIndex > 0 && (
                  <Button 
                    variant="outlined" 
                    color="primary" 
                    size="large" 
                    onClick={handlePreviousStage}
                    sx={{ mr: 2 }}
                    disabled={loading || !!submitSuccess}
                  >
                    Back
                  </Button>
                )}
                {!isReviewStage && (
                  <Button 
                      variant="contained" 
                      color="primary" 
                      size="large" 
                      onClick={handleNextStage}
                      disabled={loading || !!submitSuccess || !isVotingOpen || hasVoted || positionsLoading || !currentPositionToVote}
                  >
                      {currentStageIndex === positionsData.length - 1 ? 'Proceed to Review' : 'Next'}
                  </Button>
                )}
                {isReviewStage && (
                  <Button 
                      variant="contained" 
                      color="success" 
                      size="large" 
                      onClick={handleSubmitVote} // This will be the final submission
                      disabled={loading || Object.values(selectedCandidates).every(v => !v) || !!submitSuccess || !isVotingOpen || hasVoted}
                  >
                      Submit All My Votes
                  </Button>
                )}
            </Box>
        )}
      </Box>
    </Container>
  );
};
// Export the component
export default VotingPage;
