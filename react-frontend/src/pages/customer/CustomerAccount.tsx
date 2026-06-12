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
  HelpOutline as SupportIcon,
  ReportProblem as ComplaintIcon,
  Logout as LogoutIcon,
  CardGiftcard as ReferralIcon,
  Emergency as EmergencyIcon,
  SupportAgent as SupportTicketIcon
} from '@mui/icons-material';

import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../../app/hooks';
import { logout } from '../../features/auth/authSlice';

export default function CustomerAccount() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        My Account
      </Typography>

      <List>
        <ListItemButton onClick={() => navigate('/customer/profile')}>
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/customer/wallet')}>
          <ListItemIcon><WalletIcon /></ListItemIcon>
          <ListItemText primary="Wallet" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/customer/support')}>
          <ListItemIcon><SupportIcon /></ListItemIcon>
          <ListItemText primary="Support" />
        </ListItemButton>

        <ListItemButton onClick={() => navigate('/customer/complaints')}>
          <ListItemIcon><ComplaintIcon /></ListItemIcon>
          <ListItemText primary="Complaints" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/customer/sos')}>
             <ListItemIcon><EmergencyIcon/></ListItemIcon>
             <ListItemText primary="Emerygency SOS" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/customer/referrals')}>
             <ListItemIcon><ReferralIcon/></ListItemIcon>
             <ListItemText primary="Referrals" />
        </ListItemButton>
        <ListItemButton onClick={() => navigate('/customer/support-tickets')}>
             <ListItemIcon><SupportTicketIcon/></ListItemIcon>
             <ListItemText primary="Support Ticket" />
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
