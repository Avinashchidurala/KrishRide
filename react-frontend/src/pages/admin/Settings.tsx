import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  FormControlLabel,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';
import { adminApi } from '../../services/adminApi';
import PageContainer from '../../components/common/PageContainer';
import StandardCard from '../../components/common/StandardCard';
import LocationAutocomplete from '../../components/inputs/LocationAutocomplete';

export default function AdminSettings() {
  const [cityPricing, setCityPricing] = useState<{
  city: string;
  multiplier: number;
  basePricePerKm: number;
}[]>(() => {
  const stored = localStorage.getItem("cityPricing");
  return stored ? JSON.parse(stored) : [];
});
useEffect(() => {
  localStorage.setItem("cityPricing", JSON.stringify(cityPricing));
}, [cityPricing]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState({
    enabled: true,
    multiplier: 1.25,
    basePricePerKm: 7,
    scope: 'global' as 'global' | 'city',
    city: '',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminApi.getSurgePricingSettings();
      if (data.settings) {
        setSettings({
          enabled: data.settings.enabled !== false,
          multiplier: data.settings.multiplier || 1.25,
          basePricePerKm: data.settings.basePricePerKm || 7,
          scope: data.scope || 'global',
          city: data.settings.city || '',
        });
      }
      if (data.cityPricing) {
        setCityPricing(data.cityPricing);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load surge pricing settings');
    } finally {
      setLoading(false);
    }
  };

  // const handleSave = async () => {
  //   try {
  //     setSaving(true);
  //     setError('');
  //     setSuccess('');

  //     const settingsToSave: any = {
  //       enabled: settings.enabled,
  //       multiplier: settings.multiplier,
  //       basePricePerKm: settings.basePricePerKm,
  //       scope: settings.scope,
  //     };

  //     if (settings.scope === 'city' && settings.city) {
  //       settingsToSave.city = settings.city;
  //     }

  //     await adminApi.updateSurgePricingSettings(settingsToSave);
  //     setSuccess('Surge pricing settings saved successfully');
  //   } catch (err: any) {
  //     setError(err.message || 'Failed to save settings');
  //   } finally {
  //     setSaving(false);
  //   }
  // };
  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      if (settings.scope === 'city' && !settings.city) {
        setError('Please select a city');
        return;
      }
      await adminApi.updateSurgePricingSettings({
        enabled: settings.enabled,
        multiplier: settings.multiplier,
        basePricePerKm: settings.basePricePerKm,
        scope: settings.scope,
        city: settings.scope === 'city' ? settings.city : undefined,
      });

      if (settings.scope === 'city') {
        setCityPricing((prev) => {
          const exists = prev.find((exist) => exist.city === settings.city);
          if (exists) {
            return prev.map((exist) =>
              exist.city === settings.city? {...exist,multiplier: settings.multiplier,basePricePerKm: settings.basePricePerKm,}: exist
            );
          }
          return [
            ...prev,
            {
              city: settings.city,
              multiplier: settings.multiplier,
              basePricePerKm: settings.basePricePerKm,
            },
          ];
        });
      }
      setSuccess('Settings saved successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="lg" title="Surge Pricing Settings">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="lg" title="Surge Pricing Settings">
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <StandardCard>
        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Enable Surge Pricing</TableCell>
                <TableCell>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enabled}
                        onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                      />
                    }
                    label={settings.enabled ? 'Enabled' : 'Disabled'}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Scope</TableCell>
                <TableCell>
                  <FormControl fullWidth size="small" sx={{ maxWidth: 200 }}>
                    <Select
                      value={settings.scope}
                      onChange={(e) => setSettings({ ...settings, scope: e.target.value as 'global' | 'city' })}
                      renderValue={(selected) => {
                        if (selected === 'global') return 'Global';
                        if (selected === 'city') return 'Per City';
                        return selected;
                      }}
                      sx={{ borderRadius: 2 }}
                    >
                      <MenuItem value="global">Global</MenuItem>
                      <MenuItem value="city">Per City</MenuItem>
                    </Select>
                  </FormControl>
                </TableCell>
              </TableRow>
              {settings.scope === 'city' && (
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>City</TableCell>
                  <TableCell>
                    {/* <TextField
                      size="small"
                      value={settings.city}
                      onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                      sx={{ maxWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    /> */}
                    <LocationAutocomplete
                      value={settings.city}
                      onSelect={(location) =>setSettings({...settings,city:location.city !== 'Unknown'? location.city: ''})}
                    />
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Base Price per KM (₹)</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={settings.basePricePerKm}
                    onChange={(e) => setSettings({ ...settings, basePricePerKm: parseFloat(e.target.value) || 7 })}
                    inputProps={{ min: 0, step: 0.1 }}
                    sx={{ maxWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Surge Multiplier</TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    value={settings.multiplier}
                    onChange={(e) => setSettings({ ...settings, multiplier: parseFloat(e.target.value) || 1.25 })}
                    inputProps={{ min: 0, step: 0.1 }}
                    sx={{ maxWidth: 130, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSave}
            disabled={saving}
            size="large"
            sx={{ textTransform: 'none', borderRadius: 2 }}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </Box>
          {cityPricing.length > 0 && (
            <Box sx={{ mt: 5 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                City-wise Surge Pricing
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>City</TableCell>
                      <TableCell>Base Price / KM (₹)</TableCell>
                      <TableCell>Multiplier</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {cityPricing.map((rule) => (
                      <TableRow key={rule.city}>
                        <TableCell>{rule.city}</TableCell>
                        <TableCell>{rule.basePricePerKm}</TableCell>
                        <TableCell>{rule.multiplier}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() =>setSettings({...settings,scope: 'city',city: rule.city,basePricePerKm: rule.basePricePerKm,multiplier: rule.multiplier,})}
                           >
                            Edit
                          </Button>

                          <Button
                            size="small"
                            color="error"
                            onClick={async () => {
                              await adminApi.deleteCitySurgePricingSettings(rule.city);
                              setCityPricing((prev) =>prev.filter((c) => c.city !== rule.city));}}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
      </StandardCard>
    </PageContainer>
  );
}
