import api from './api';

export interface ReferralCodeResponse {
  referralCode: string;
}

export interface ReferralStats {
  totalReferrals: number;
  successfulReferrals: number;
  totalEarnings: number;
}

export const referralsApi = {
  getReferralCode: async (): Promise<ReferralCodeResponse> => {
    const response = await api.get<ReferralCodeResponse>('/referrals/code');
    return response.data;
  },

  getReferralStats: async (): Promise<ReferralStats> => {
    const response = await api.get<ReferralStats>('/referrals/stats');
    return response.data;
  },
};

