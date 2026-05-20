import {useState} from 'react'
import './App.css'
import {
    Box, Button, CircularProgress,
    Container,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
    Paper
} from "@mui/material";
import axios from "axios";

function App() {
    const [emailContent, setEmailContent] = useState('');
    const [tone, setTone] = useState('');
    const [generatedReply, setGeneratedReply] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setLoading(true);
        setError('')
        try {
            const response = await axios.post("http://localhost:8080/api/email/generate", {emailContent, tone});
            setGeneratedReply(typeof response.data === 'string' ? response.data : JSON.stringify(response));
        } catch (err) {
            setError('Failed to generate email reply. Please try again');
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <Container maxWidth="sm" sx={{py: 4}}>
            <Paper elevation={3} sx={{
                p: 3,
                bgcolor: '#f0f8ff', // soft pastel blue
                borderRadius: 3
            }}>
                <Box sx={{
                    background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                    p: 2,
                    borderRadius: 2,
                    mb: 3,
                    textAlign: 'center'
                }}>
                    <Typography
                        variant="h5"
                        component="h1"
                        sx={{color: 'white', fontWeight: 'bold'}}
                    >
                        Email Reply Generator
                    </Typography>
                </Box>

                <Box sx={{my: 2}}>
                    <TextField
                        fullWidth
                        multiline
                        rows={5}
                        variant="outlined"
                        label="Original Email Content"
                        value={emailContent}
                        onChange={e => setEmailContent(e.target.value)}
                        sx={{
                            mb: 2,
                            '& .MuiOutlinedInput-root': {
                                '& fieldset': { borderColor: '#6a11cb' },
                                '&:hover fieldset': { borderColor: '#2575fc' }
                            }
                        }}
                    />

                    <FormControl fullWidth sx={{mb: 2}}>
                        <InputLabel>Tone (Optional)</InputLabel>
                        <Select
                            value={tone}
                            onChange={e => setTone(e.target.value)}
                            label="Tone (Optional)"
                            sx={{
                                '& .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#6a11cb'
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#2575fc'
                                }
                            }}
                        >
                            <MenuItem value="">None</MenuItem>
                            <MenuItem value="professional">Professional</MenuItem>
                            <MenuItem value="casual">Casual</MenuItem>
                            <MenuItem value="friendly">Friendly</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={!emailContent || loading}
                        fullWidth
                        sx={{
                            background: 'linear-gradient(90deg, #6a11cb 0%, #2575fc 100%)',
                            textTransform: 'none',
                            fontWeight: 'bold',
                            '&:hover': {
                                background: 'linear-gradient(90deg, #2575fc 0%, #6a11cb 100%)'
                            }
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{color: 'white'}}/> : "Generate Reply"}
                    </Button>
                </Box>

                {error && <Typography color="error" sx={{mt: 2}}>{error}</Typography>}

                {generatedReply && (
                    <Box sx={{mt: 3}}>
                        <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'bold', color: '#6a11cb'}}>
                            Generated Reply:
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={6}
                            variant="outlined"
                            value={generatedReply}
                            InputProps={{readOnly: true}}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': { borderColor: '#2575fc' }
                                }
                            }}
                        />
                        <Button
                            variant="outlined"
                            sx={{
                                mt: 2,
                                textTransform: 'none',
                                color: '#2575fc',
                                borderColor: '#2575fc',
                                '&:hover': {
                                    borderColor: '#6a11cb',
                                    color: '#6a11cb'
                                }
                            }}
                            onClick={() => navigator.clipboard.writeText(generatedReply)}
                        >
                            Copy to Clipboard
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
}

export default App;