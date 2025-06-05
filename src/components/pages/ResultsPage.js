import React, { useEffect, useState } from 'react';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import LinearProgress from '@mui/material/LinearProgress';
import voteService from '../../services/voteService';

const ResultsPage = () => {
  const [positionsData, setPositionsData] = useState([]); // Array of position objects
  const [isVotingOpen, setIsVotingOpen] = useState(null); // Boolean
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true);
        setError(null);
        const responseData = await voteService.getElectionResults();
        if (responseData && responseData.data) {
          setIsVotingOpen(responseData.data.isVotingOpen);
          setPositionsData(responseData.data.positions || []); 
        } else {
          console.error('Unexpected results data format:', responseData);
          setError('Failed to parse election results from server.');
          setPositionsData([]); // Set to empty to avoid further errors
        } 
      } catch (err) {
        setError(err.message || 'Failed to fetch election results.');
        console.error(err);
      }
      setLoading(false);
    };

    fetchResults();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Election Results...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  if (!positionsData || positionsData.length === 0) {
    return (
      <Container component="main" maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Election Results
          </Typography>
          <Alert severity="info">No election results are currently available.</Alert>
        </Box>
      </Container>
    );
  }

  // isVotingOpen state holds the voting status
  // positionsData state holds an array of position objects:
  // e.g., [{ positionName: "BOD", numberOfWinners: 5, candidates: [...] }, ...]

  return (
    <Container component="main" maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
          Election Results
        </Typography>

        {typeof isVotingOpen === 'boolean' && (
            <Alert severity={isVotingOpen ? "warning" : "info"} sx={{ mb: 3}}>
                Voting is currently {isVotingOpen ? <strong>OPEN</strong> : <strong>CLOSED</strong>}.
            </Alert>
        )}

        {/* Conditional rendering of results based on voting status */}
        {typeof isVotingOpen === 'boolean' && isVotingOpen && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Detailed election results will be shown here once voting is closed.
          </Alert>
        )}

        {typeof isVotingOpen === 'boolean' && !isVotingOpen && positionsData && positionsData.length > 0 && positionsData.map((positionItem) => {
          const totalVotesForPosition = positionItem.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
          const { positionName, candidates, numberOfWinners, positionId } = positionItem;
          const lastWinnerVotes = (numberOfWinners > 0 && candidates.length >= numberOfWinners) ? candidates[numberOfWinners - 1].votes : -1;
          return (
          <Box key={positionId || positionName} sx={{ mb: 4 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              {positionName} (Winners: {numberOfWinners})
            </Typography>
            {candidates.length === 0 ? (
              <Typography>No candidates or votes recorded for this position yet.</Typography>
            ) : (
              <TableContainer component={Paper} elevation={3}>
                <Table sx={{ minWidth: 650 }} aria-label={`results table for ${positionName}`}>
                  <TableHead sx={{ backgroundColor: 'primary.main' }}>
                    <TableRow>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Rank</TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Photo</TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }}>Candidate</TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="right">Votes</TableCell>
                      <TableCell sx={{ color: 'common.white', fontWeight: 'bold' }} align="center">Vote %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {candidates.map((item, index) => {
                      const isWinner = (index + 1) <= numberOfWinners;
                      const votePercentage = totalVotesForPosition > 0 ? (item.votes / totalVotesForPosition) * 100 : 0;
                      const isTiedForLastWinningSpot = !isWinner && numberOfWinners > 0 && item.votes === lastWinnerVotes && lastWinnerVotes > 0;
                      
                      let rowSx = {
                        '&:hover': {
                          backgroundColor: 'action.selected',
                        }
                      };
                      if (isWinner) {
                        rowSx.backgroundColor = 'success.light';
                        rowSx['&:hover'].backgroundColor = 'success.dark';
                      } else if (isTiedForLastWinningSpot) {
                        rowSx.backgroundColor = 'warning.light';
                        rowSx['&:hover'].backgroundColor = 'warning.dark';
                      } else {
                        rowSx.backgroundColor = index % 2 === 0 ? 'action.hover' : 'transparent';
                      }

                      return (
                      <TableRow 
                        key={item._id || index} 
                        sx={rowSx}
                      >
                        <TableCell component="th" scope="row">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Avatar src={`/${item.profilePhoto}`} alt={`${item.firstName} ${item.lastName}`} sx={{ width: 40, height: 40 }} />
                        </TableCell>
                        <TableCell>
                          <Typography variant="subtitle1">{item.firstName} {item.lastName}</Typography>
                        </TableCell>
                        <TableCell align="right">{item.votes}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box sx={{ width: '70%', mr: 1 }}>
                              <LinearProgress variant="determinate" value={votePercentage} 
                                sx={{ height: 10, borderRadius: 5, backgroundColor: 'grey.300', '& .MuiLinearProgress-bar': { backgroundColor: isWinner ? 'primary.main' : 'secondary.main'} }}
                              />
                            </Box>
                            <Box sx={{ minWidth: 35 }}>
                              <Typography variant="body2" color="text.secondary">{`${Math.round(votePercentage)}%`}</Typography>
                            </Box>
                          </Box>
                        </TableCell>
                      </TableRow>
                    )})}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )})}
      </Box>
    </Container>
  );
};

export default ResultsPage;

