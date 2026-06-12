import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from '@mui/material';
import {
  Person as PersonIcon,
  AccountBalanceWallet as WalletIcon,
  VerifiedUser as KycIcon,
  DirectionsCar as VehiclesIcon,
  SupportAgent as SupportTicketIcon,
  ReportProblem as ComplaintIcon,
  CardGiftcard as ReferralIcon,
  Emergency as EmergencyIcon,

  Logout as LogoutIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';

export default function DriverAccount() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        My Account
      </Typography>

      <List>
        <ListItemButton onClick={() => navigate('/driver/profile')}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/driver/wallet')}>
          <ListItemIcon><WalletIcon /></ListItemIcon>
          <ListItemText primary="Wallet" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/driver/kyc')}>
          <ListItemIcon><KycIcon /></ListItemIcon>
          <ListItemText primary="KYC Verification" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/driver/vehicles')}>
          <ListItemIcon><VehiclesIcon /></ListItemIcon>
          <ListItemText primary="Vehicles" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/driver/support-tickets')}>
          <ListItemIcon><SupportTicketIcon /></ListItemIcon>
          <ListItemText primary="Support Tickets" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/driver/complaints')}>
          <ListItemIcon><ComplaintIcon /></ListItemIcon>
          <ListItemText primary="Complaints" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/driver/referrals')}>
          <ListItemIcon><ReferralIcon /></ListItemIcon>
          <ListItemText primary="Referrals" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/driver/sos')}>
          <ListItemIcon><EmergencyIcon/></ListItemIcon>
          <ListItemText primary="Emerygency SOS" />
        </ListItemButton>

        <Divider sx={{ my: 1 }} />

        <ListItemButton
          onClick={async () => {
            await dispatch(logout());
            navigate('/login');
          }}
        >
          <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItemButton>
      </List>
    </Box>
  );
}
