import { Box, Container, Typography } from "@mui/material";

export default function About() {
    return (
        <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 3, md: 0 }, mt: { xs: 5, md: 0 }, px: { xs: 0, sm: 0 } }}>
            <Box sx={{ mt: { xs: 3, sm: 0 } }}>
                {/* <Typography variant="h6" sx={{ textAlign: { xs: 'center', md: 'left' }, fontWeight: 300 }}> */}
                Brought to you by Team Winter @ AUT, 2025 (S2)
                {/* </Typography> */}
            </Box>
        </Container>
    );
}